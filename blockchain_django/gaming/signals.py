from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import NFT, GameTransaction, GamePlay, UserAchievement

logger = logging.getLogger(__name__)

@receiver(post_save, sender=NFT)
def notify_nft_acquired(sender, instance, created, **kwargs):
    """Send websocket notification when an NFT is acquired or updated"""
    if created:
        try:
            channel_layer = get_channel_layer()
            
            # Send to user's NFT notifications channel
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.owner.id}_nfts",
                {
                    "type": "nft_update",
                    "action": "acquired",
                    "nft": {
                        "id": str(instance.id),
                        "name": instance.name,
                        "game": instance.game.title if instance.game else "Unknown Game",
                        "rarity": instance.rarity,
                        "type": instance.type,
                        "acquired_at": instance.acquired_at.isoformat() if instance.acquired_at else None
                    }
                }
            )
            
            # Also send as regular notification
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.owner.id}_notifications",
                {
                    "type": "send_notification",
                    "notification": {
                        "type": "nft_acquired",
                        "message": f"You acquired a new NFT: {instance.name} ({instance.rarity})",
                        "nft_id": str(instance.id),
                        "game": instance.game.title if instance.game else "Unknown Game",
                        "created_at": instance.acquired_at.isoformat() if instance.acquired_at else None
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error sending NFT notification: {e}")


@receiver(post_save, sender=GameTransaction)
def notify_game_transaction(sender, instance, created, **kwargs):
    """Send websocket notification when a game transaction is created"""
    if created:
        try:
            channel_layer = get_channel_layer()
            
            # Send to user's game wallet notifications channel
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.user.id}_game_wallet",
                {
                    "type": "transaction_update",
                    "transaction": {
                        "id": str(instance.id),
                        "type": instance.type,
                        "token": instance.token,
                        "amount": float(instance.amount),
                        "game": instance.game.title if instance.game else "Multiple Games",
                        "timestamp": instance.timestamp.isoformat() if instance.timestamp else None,
                        "blockchain_verified": instance.blockchain_verified
                    }
                }
            )
            
            # If it's an earning transaction, also send as notification
            if instance.type == 'earning':
                async_to_sync(channel_layer.group_send)(
                    f"user_{instance.user.id}_notifications",
                    {
                        "type": "send_notification",
                        "notification": {
                            "type": "game_earning",
                            "message": f"You earned {instance.amount} {instance.token} from {instance.game.title if instance.game else 'gaming'}",
                            "amount": float(instance.amount),
                            "token": instance.token,
                            "game": instance.game.title if instance.game else "Multiple Games",
                            "created_at": instance.timestamp.isoformat() if instance.timestamp else None
                        }
                    }
                )
        except Exception as e:
            logger.error(f"Error sending game transaction notification: {e}")


@receiver(post_save, sender=GamePlay)
def update_game_stats(sender, instance, **kwargs):
    """Update game statistics when a game is played"""
    if instance.end_time and instance.duration:
        try:
            # We could update aggregate game stats here, like average score
            # or total play time, but let's keep it simple for now
            
            # If this was a high score, we might want to update leaderboards
            if instance.score > 0:
                from .models import Leaderboard, LeaderboardEntry
                
                # Check if this score beats the user's previous best
                try:
                    leaderboard = Leaderboard.objects.get(
                        game=instance.game,
                        period='all_time'
                    )
                    
                    # See if user already has an entry
                    try:
                        entry = LeaderboardEntry.objects.get(
                            leaderboard=leaderboard,
                            user=instance.user
                        )
                        
                        # Update if this score is higher
                        if instance.score > entry.score:
                            entry.score = instance.score
                            entry.earnings = max(entry.earnings, instance.earned_tokens or 0)
                            entry.save()
                    except LeaderboardEntry.DoesNotExist:
                        # Create a new entry with rank at the end
                        rank = LeaderboardEntry.objects.filter(
                            leaderboard=leaderboard
                        ).count() + 1
                        
                        LeaderboardEntry.objects.create(
                            leaderboard=leaderboard,
                            user=instance.user,
                            rank=rank,
                            score=instance.score,
                            earnings=instance.earned_tokens or 0,
                            wallet_address=instance.user.wallet_address
                        )
                except Leaderboard.DoesNotExist:
                    # Leaderboard doesn't exist yet
                    pass
        except Exception as e:
            logger.error(f"Error updating game stats: {e}")


@receiver(post_save, sender=UserAchievement)
def notify_achievement_unlocked(sender, instance, created, **kwargs):
    """Send websocket notification when an achievement is unlocked"""
    if created:
        try:
            channel_layer = get_channel_layer()
            
            # Send to user's achievements channel
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.user.id}_achievements",
                {
                    "type": "achievement_update",
                    "achievement": {
                        "id": str(instance.achievement.id),
                        "name": instance.achievement.name,
                        "description": instance.achievement.description,
                        "game": instance.achievement.game.title,
                        "points": instance.achievement.points,
                        "unlocked_at": instance.unlocked_at.isoformat() if instance.unlocked_at else None
                    }
                }
            )
            
            # Also send as regular notification
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.user.id}_notifications",
                {
                    "type": "send_notification",
                    "notification": {
                        "type": "achievement_unlocked",
                        "message": f"Achievement Unlocked: {instance.achievement.name}",
                        "achievement_id": str(instance.achievement.id),
                        "game": instance.achievement.game.title,
                        "points": instance.achievement.points,
                        "created_at": instance.unlocked_at.isoformat() if instance.unlocked_at else None
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error sending achievement notification: {e}")