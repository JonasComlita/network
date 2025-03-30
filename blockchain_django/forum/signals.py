from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import Thread, Reply

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Thread)
def notify_thread_created(sender, instance, created, **kwargs):
    """Send WebSocket notification when a thread is created or updated"""
    try:
        channel_layer = get_channel_layer()
        
        # Send different messages for creation vs update
        message_type = 'created' if created else 'updated'
        
        # Broadcast to forum channel
        async_to_sync(channel_layer.group_send)(
            "forum_updates",
            {
                "type": "forum_update",
                "update_type": f"thread_{message_type}",
                "thread": {
                    "id": instance.id,
                    "title": instance.title,
                    "slug": instance.slug,
                    "author": instance.author.username,
                    "category": instance.category.name,
                    "created_at": instance.created_at.isoformat() if instance.created_at else None,
                    "pinned": instance.pinned,
                    "blockchain_verified": instance.blockchain_verified
                }
            }
        )
    except Exception as e:
        logger.error(f"Error sending thread notification: {e}")


@receiver(post_save, sender=Reply)
def notify_reply_created(sender, instance, created, **kwargs):
    """Send WebSocket notification when a reply is created"""
    if created:  # Only notify on creation, not updates
        try:
            channel_layer = get_channel_layer()
            
            # Broadcast to thread-specific channel
            async_to_sync(channel_layer.group_send)(
                f"thread_{instance.thread.id}",
                {
                    "type": "thread_update",
                    "update_type": "new_reply",
                    "reply": {
                        "id": instance.id,
                        "author": instance.author.username,
                        "created_at": instance.created_at.isoformat() if instance.created_at else None,
                        "blockchain_verified": instance.blockchain_verified
                    }
                }
            )
            
            # Also broadcast to forum channel
            async_to_sync(channel_layer.group_send)(
                "forum_updates",
                {
                    "type": "forum_update",
                    "update_type": "new_reply",
                    "thread_id": instance.thread.id,
                    "thread_title": instance.thread.title,
                    "reply": {
                        "id": instance.id,
                        "author": instance.author.username,
                        "created_at": instance.created_at.isoformat() if instance.created_at else None
                    }
                }
            )
            
            # Notify thread author if they're not the one replying
            if instance.thread.author != instance.author:
                async_to_sync(channel_layer.group_send)(
                    f"user_{instance.thread.author.id}_notifications",
                    {
                        "type": "send_notification",
                        "notification": {
                            "type": "forum_reply",
                            "message": f"{instance.author.username} replied to your thread: {instance.thread.title}",
                            "thread_id": instance.thread.id,
                            "thread_slug": instance.thread.slug,
                            "created_at": instance.created_at.isoformat() if instance.created_at else None
                        }
                    }
                )
        except Exception as e:
            logger.error(f"Error sending reply notification: {e}")