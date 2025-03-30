from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Category(models.Model):
    """Forum categories"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Thread(models.Model):
    """Forum threads"""
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='threads')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='threads')
    body = models.TextField()
    pinned = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Blockchain verification fields
    blockchain_verified = models.BooleanField(default=False)
    transaction_hash = models.CharField(max_length=66, blank=True, null=True)
    
    class Meta:
        ordering = ['-pinned', '-created_at']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    @property
    def replies_count(self):
        return self.replies.count()
    
    @property
    def last_reply(self):
        return self.replies.order_by('-created_at').first()


class Reply(models.Model):
    """Thread replies"""
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='forum_replies')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Blockchain verification fields
    blockchain_verified = models.BooleanField(default=False)
    transaction_hash = models.CharField(max_length=66, blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "Replies"
        ordering = ['created_at']
    
    def __str__(self):
        return f"Reply by {self.author.username} on {self.thread.title}"