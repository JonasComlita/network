from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for viewsets
router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)

# URL patterns for forum app
urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Thread URLs
    path('threads/', views.ThreadListView.as_view(), name='thread_list'),
    path('threads/<slug:slug>/', views.ThreadDetailView.as_view(), name='thread_detail'),
    path('threads/create/', views.ThreadCreateView.as_view(), name='thread_create'),
    
    # Reply URLs
    path('replies/create/', views.ReplyCreateView.as_view(), name='reply_create'),
    
    # Popular threads
    path('popular-threads/', views.PopularThreadsView.as_view(), name='popular_threads'),
    
    # Search
    path('search/', views.ForumSearchView.as_view(), name='forum_search'),
    
    # User-specific views
    path('my-threads/', views.UserThreadsView.as_view(), name='user_threads'),
    path('my-replies/', views.UserRepliesView.as_view(), name='user_replies'),
]