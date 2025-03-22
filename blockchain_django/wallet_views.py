from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import logging
import asyncio
from channels.db import database_sync_to_async
from blockchain_django.blockchain_service import get_blockchain
from blockchain_django.wallet_service import wallet_service
from blockchain_django.models import BlockchainTransaction

logger = logging.getLogger(__name__)

class WalletInfoView(APIView):
    permission_classes = [IsAuthenticated]

    async def get(self, request):
        # Get user data in a way that's safe for async context
        user = await self.get_user(request)
        wallet_passphrase = request.query_params.get('wallet_passphrase')
        blockchain = get_blockchain()

        if not user.wallet_address:
            return Response({"status": "not_created"}, status=status.HTTP_404_NOT_FOUND)

        if not wallet_passphrase:
            return Response({"error": "Wallet passphrase is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wallet = await blockchain.get_wallet(user.wallet_address, wallet_passphrase)
            if not wallet:
                return Response({"error": "Incorrect wallet passphrase"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get additional user data safely for async context
            wallet_created_at = await self.get_wallet_created_at(user)
            is_wallet_active = await self.get_is_wallet_active(user)
            
            wallet_info = {
                "address": user.wallet_address,
                "status": "active" if is_wallet_active else "inactive",
                "created_at": wallet_created_at.isoformat() if wallet_created_at else None,
                "public_key": wallet["public_key"]
            }
            return Response(wallet_info)
        except Exception as e:
            logger.error(f"Error fetching wallet details: {e}")
            return Response({"error": f"Failed to fetch wallet details: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @database_sync_to_async
    def get_user(self, request):
        return request.user
    
    @database_sync_to_async
    def get_wallet_created_at(self, user):
        return user.wallet_created_at
    
    @database_sync_to_async
    def get_is_wallet_active(self, user):
        return user.is_wallet_active

# blockchain_django/views/wallet_views.py
class CreateWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"Creating wallet for user {user.username}")

        if user.wallet_address:
            if user.wallet_address.startswith('temp_'):
                logger.info(f"User {user.username} has temporary wallet {user.wallet_address}, replacing it")
                blockchain = get_blockchain()
                try:
                    wallet_address = asyncio.run(blockchain.create_wallet(user_id=str(user.id)))
                    user.wallet_address = wallet_address
                    user.is_wallet_active = True
                    user.save()
                    return Response({
                        "message": "Temporary wallet replaced with real wallet",
                        "wallet_address": wallet_address
                    }, status=status.HTTP_201_CREATED)
                except Exception as e:
                    logger.error(f"Failed to replace temp wallet: {str(e)}")
                    return Response({"message": f"Failed to create wallet: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                logger.info(f"User {user.username} already has wallet {user.wallet_address}")
                return Response({
                    "message": "User already has an active wallet",
                    "wallet_address": user.wallet_address
                }, status=status.HTTP_400_BAD_REQUEST)

        try:
            wallet_address = asyncio.run(get_blockchain().create_wallet(user_id=str(user.id)))
            user.wallet_address = wallet_address
            user.is_wallet_active = True
            user.wallet_balance = 0.0
            user.save()
            return Response({
                "message": "Wallet created successfully",
                "wallet_address": wallet_address
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Failed to create wallet: {str(e)}")
            return Response({"message": "Failed to create wallet"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.wallet_address:
            return Response({"message": "No wallet found"}, status=status.HTTP_404_NOT_FOUND)

        recipient = request.data.get('recipient')
        amount = request.data.get('amount')
        if not recipient or not amount:
            return Response({"message": "Recipient and amount required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = float(amount)
            if amount <= 0:
                return Response({"message": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)

            blockchain = get_blockchain()
            wallet = blockchain.wallets.get(user.wallet_address)
            if not wallet:
                return Response({"message": "Wallet keys not found"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Create and add transaction
            tx = asyncio.run(blockchain.create_transaction(
                wallet['private_key'], user.wallet_address, recipient, amount, fee=0.001
            ))
            success = asyncio.run(blockchain.add_transaction_to_mempool(tx))
            if success:
                return Response({"message": "Transaction sent", "tx_id": tx.tx_id}, status=status.HTTP_201_CREATED)
            else:
                return Response({"message": "Transaction rejected"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"message": f"Transaction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TransactionHistoryView(APIView):
    """Get transaction history for user's wallet"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Check if the user has a wallet
        if not user.wallet_address:
            return Response({
                "message": "No wallet found for this user"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get transactions where user is sender or recipient
        wallet_address = user.wallet_address
        transactions = BlockchainTransaction.objects.filter(
            sender=wallet_address
        ).order_by('-created_at')
        
        incoming_transactions = BlockchainTransaction.objects.filter(
            recipient=wallet_address
        ).exclude(sender=wallet_address).order_by('-created_at')
        
        # Format outgoing transactions
        outgoing_data = [{
            "tx_id": str(tx.id),
            "amount": float(tx.amount),
            "sender": tx.sender,
            "recipient": tx.recipient,
            "timestamp": tx.created_at.isoformat(),
            "is_outgoing": True,
            "memo": getattr(tx, 'memo', '')
        } for tx in transactions]
        
        # Format incoming transactions
        incoming_data = [{
            "tx_id": str(tx.id),
            "amount": float(tx.amount),
            "sender": tx.sender,
            "recipient": tx.recipient,
            "timestamp": tx.created_at.isoformat(),
            "is_outgoing": False,
            "memo": getattr(tx, 'memo', '')
        } for tx in incoming_transactions]
        
        # Combine and sort by timestamp (newest first)
        all_transactions = sorted(
            outgoing_data + incoming_data,
            key=lambda x: x['timestamp'],
            reverse=True
        )
        
        return Response(all_transactions)

class UpdateBalanceView(APIView):
    """Update wallet balance for the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if not user.wallet_address:
            return Response({
                "message": "No wallet found for this user"
            }, status=status.HTTP_404_NOT_FOUND)
            
        try:
            # Get balance using wallet service
            balance = wallet_service.get_balance(user.wallet_address)
            
            # Update user balance
            user.wallet_balance = balance
            user.save()
            
            return Response({
                "balance": balance,
                "wallet_address": user.wallet_address
            })
                
        except Exception as e:
            logger.error(f"Failed to update balance: {str(e)}")
            return Response({
                "message": "Failed to update balance. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class WalletHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    async def get(self, request):
        user = request.user
        blockchain = get_blockchain()
        if not user.wallet_address:
            return Response({"error": "No wallet found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            # Placeholder: Implement transaction history retrieval
            transactions = []  # await blockchain.get_transactions_for_address(user.wallet_address)
            return Response(transactions)
        except Exception as e:
            logger.error(f"Error fetching wallet history: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)