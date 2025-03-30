from django.core.management.base import BaseCommand
from django.db import transaction
from gaming.models import GameCategory, Game
import logging
import os
import json
import uuid

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Set up initial game categories and games'

    def handle(self, *args, **options):
        self.stdout.write('Setting up game categories and games...')
        
        try:
            with transaction.atomic():
                # Create game categories
                self.setup_categories()
                
                # Create games
                self.setup_games()
                
            self.stdout.write(self.style.SUCCESS('Successfully set up game categories and games'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error setting up games: {str(e)}'))
            logger.error(f"Error in setup_games: {str(e)}", exc_info=True)
    
    def setup_categories(self):
        """Set up game categories"""
        categories = [
            {'name': 'Arcade', 'description': 'Classic arcade-style games with simple mechanics and addictive gameplay.'},
            {'name': 'Platformer', 'description': 'Games focused on jumping between platforms and overcoming obstacles.'},
            {'name': 'Card Games', 'description': 'Games played with cards, including trading card games and poker.'},
            {'name': 'Casino', 'description': 'Casino-style games like roulette, slots, and blackjack.'},
            {'name': 'Puzzle', 'description': 'Brain-teasing puzzle games that test your problem-solving skills.'},
            {'name': 'Board Games', 'description': 'Digital adaptations of traditional board games and new board game concepts.'},
            {'name': 'Racing', 'description': 'Games focused on racing vehicles against opponents or the clock.'},
            {'name': 'Strategy', 'description': 'Games requiring strategic thinking and careful planning.'},
            {'name': 'Simulation', 'description': 'Games that simulate real-world activities or environments.'},
            {'name': 'RPG', 'description': 'Role-playing games with character progression and narrative focus.'},
        ]
        
        for cat_data in categories:
            GameCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
        
        self.stdout.write(f'Created {len(categories)} game categories')
    
    def setup_games(self):
        """Set up initial games"""
        # Game data from the GameCatalog.js file
        games_data = [
            {
                'id': 'pygame-zero',
                'title': 'Pygame Zero',
                'description': 'A simple Pygame Zero game running in your browser. Click to interact with the bouncing ball.',
                'category': 'arcade',
                'image': 'pygame-zero.jpg',
                'players': 2450,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True,
                'filename': 'Untitled-1.html'
            },
            {
                'id': 'vertical-platformer',
                'title': 'Vertical Platformer',
                'description': 'A vertical platformer game with dynamic wave platforms. Use arrow keys or WASD to move, and space to jump.',
                'category': 'platformer',
                'image': 'platformer.jpg',
                'players': 3210,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True,
                'filename': 'Untitled-2.html'
            },
            {
                'id': 'poker-game',
                'title': 'Blockchain Poker',
                'description': 'Play poker with blockchain-verified hands and transactions. Each hand is recorded on the blockchain for fairness.',
                'category': 'card',
                'image': 'poker.jpg',
                'players': 5780,
                'tokens': 'NET',
                'blockchain': 'NetWork & Ethereum',
                'play_to_earn': True,
                'filename': 'Untitled-3.html',
                'dependencies': ['Untitled-3.js']
            },
            {
                'id': 'roulette',
                'title': 'Crypto Roulette',
                'description': 'A blockchain-powered roulette game. Place bets on red, black, or green and watch the wheel spin. All bets are recorded on the blockchain.',
                'category': 'casino',
                'image': 'roulette.jpg',
                'players': 4290,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True,
                'filename': 'Untitled-4.html'
            },
            {
                'id': 'pixel-game',
                'title': 'Crypto Pixel Hunt',
                'description': 'Find the winning pixel! Click around to discover the single hidden winning pixel. All attempts are recorded on the blockchain.',
                'category': 'puzzle',
                'image': 'pixel-hunt.jpg',
                'players': 1830,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True,
                'filename': 'Untitled-5.html'
            },
            {
                'id': 'checkers',
                'title': 'Blockchain Checkers',
                'description': 'Play a game of checkers with moves verified on the blockchain. Each move is recorded as a transaction for complete transparency.',
                'category': 'board',
                'image': 'checkers.jpg',
                'players': 2140,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True,
                'filename': 'Untitled-6.html'
            },
            {
                'id': 'racing-game',
                'title': 'Crypto Racing',
                'description': 'A racing game with blockchain rewards. Complete laps and earn cryptocurrency tokens. Your best times are recorded on the blockchain.',
                'category': 'racing',
                'image': 'racing.jpg',
                'players': 3580,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True,
                'filename': 'Untitled-7.html',
                'dependencies': ['Untitled-7.js']
            },
            {
                'id': 'nft-battle',
                'title': 'NFT Battle Arena',
                'description': 'Battle with your NFT characters in this strategic combat game. Each character has unique abilities based on its blockchain attributes.',
                'category': 'strategy',
                'image': 'nft-battle.jpg',
                'players': 4120,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True
            },
            {
                'id': 'crypto-farm',
                'title': 'Crypto Farm',
                'description': 'Build and manage your own virtual farm. Plant crops, raise animals, and earn tokens based on your farm\'s production.',
                'category': 'simulation',
                'image': 'farm.jpg',
                'players': 5240,
                'tokens': 'NET',
                'blockchain': 'NetWork',
                'play_to_earn': True
            },
            {
                'id': 'blockchain-rpg',
                'title': 'Blockchain RPG',
                'description': 'Explore a vast fantasy world where all your items, weapons, and achievements are stored as NFTs on the blockchain.',
                'category': 'rpg',
                'image': 'rpg.jpg',
                'players': 6820,
                'tokens': 'NET',
                'blockchain': 'NetWork & Polygon',
                'play_to_earn': True
            }
        ]
        
        for game_data in games_data:
            # Get or create category
            try:
                category = GameCategory.objects.get(
                    name__iexact=game_data['category'].replace('_', ' ')
                )
            except GameCategory.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"Category '{game_data['category']}' not found, creating it"))
                category = GameCategory.objects.create(
                    name=game_data['category'].replace('_', ' ').capitalize()
                )
            
            # Prepare dependencies as JSON if they exist
            dependencies = json.dumps(game_data.get('dependencies', [])) if game_data.get('dependencies') else None
            
            # Create or update the game
            game, created = Game.objects.update_or_create(
                id=game_data['id'],
                defaults={
                    'title': game_data['title'],
                    'description': game_data['description'],
                    'long_description': game_data.get('description', '') + '\n\nMore details coming soon!',
                    'category': category,
                    'players': game_data.get('players', 0),
                    'rating': 4.0 + (uuid.uuid4().int % 10) / 10,  # Random rating between 4.0 and 4.9
                    'token_name': game_data.get('tokens', 'NET'),
                    'blockchain_name': game_data.get('blockchain', 'NetWork'),
                    'play_to_earn': game_data.get('play_to_earn', True),
                    'nft_enabled': True,
                    'file_name': game_data.get('filename', None),
                    'dependencies': dependencies
                }
            )
            
            if created:
                self.stdout.write(f"Created game: {game.title}")
            else:
                self.stdout.write(f"Updated game: {game.title}")
        
        self.stdout.write(f'Processed {len(games_data)} games')
        
        # After creating games, prepare game files
        from gaming.game_file_handler import GameFileHandler
        handler = GameFileHandler()
        
        for game in Game.objects.filter(file_name__isnull=False):
            success = handler.prepare_game_files(game)
            if success:
                self.stdout.write(f"Prepared files for game: {game.title}")
            else:
                self.stdout.write(self.style.WARNING(f"Failed to prepare files for game: {game.title}"))