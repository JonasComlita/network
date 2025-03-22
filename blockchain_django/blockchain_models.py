# blockchain_models.py
from django.db import models
import jsonfield

class Block(models.Model):
    """Store block headers for quick reference"""
    block_hash = models.CharField(max_length=64, primary_key=True)
    index = models.IntegerField()
    previous_hash = models.CharField(max_length=64)
    merkle_root = models.CharField(max_length=64)
    timestamp = models.DateTimeField()
    nonce = models.IntegerField()
    difficulty = models.IntegerField()
    miner_address = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['-index']

class Transaction(models.Model):
    """Store transaction data"""
    tx_id = models.CharField(max_length=64, primary_key=True)
    sender = models.CharField(max_length=100)
    recipient = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    fee = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    timestamp = models.DateTimeField()
    block = models.ForeignKey(Block, on_delete=models.CASCADE, null=True, related_name='transactions')
    tx_type = models.CharField(max_length=20)
    
    class Meta:
        ordering = ['-timestamp']