from django.apps import AppConfig


class GamingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gaming'

    def ready(self):
        """Import signals when app is ready"""
        import gaming.signals