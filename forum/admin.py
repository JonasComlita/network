from django.contrib import admin
from .models import Category, Thread, Reply

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')
    date_hierarchy = 'created_at'


class ReplyInline(admin.TabularInline):
    model = Reply
    extra = 0
    readonly_fields = ('created_at', 'updated_at', 'blockchain_verified', 'transaction_hash')


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'created_at', 'pinned', 'views', 'blockchain_verified')
    list_filter = ('category', 'pinned', 'blockchain_verified', 'created_at')
    search_fields = ('title', 'body', 'author__username')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    readonly_fields = ('views', 'blockchain_verified', 'transaction_hash')
    inlines = [ReplyInline]
    actions = ['make_pinned', 'remove_pinned']

    def make_pinned(self, request, queryset):
        updated = queryset.update(pinned=True)
        self.message_user(request, f"Pinned {updated} threads.")
    make_pinned.short_description = "Pin selected threads"

    def remove_pinned(self, request, queryset):
        updated = queryset.update(pinned=False)
        self.message_user(request, f"Unpinned {updated} threads.")
    remove_pinned.short_description = "Unpin selected threads"


@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ('id', 'thread', 'author', 'created_at', 'blockchain_verified')
    list_filter = ('blockchain_verified', 'created_at')
    search_fields = ('body', 'author__username', 'thread__title')
    date_hierarchy = 'created_at'
    readonly_fields = ('blockchain_verified', 'transaction_hash')