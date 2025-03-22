# blockchain/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Block, BlockchainTransaction, Notification

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'is_admin', 'is_miner', 'wallet_address']
    fieldsets = UserAdmin.fieldsets + (
        ('Blockchain Info', {'fields': ('wallet_address', 'wallet_balance', 'is_wallet_active')}),
        ('User Settings', {'fields': ('is_admin', 'is_miner', 'notify_price_changes', 'notify_transaction_updates')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Block)
admin.site.register(BlockchainTransaction)
admin.site.register(Notification)