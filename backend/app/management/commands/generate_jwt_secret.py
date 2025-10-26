"""
Management command to generate secure JWT secret key
"""
import secrets
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Generate a secure JWT secret key (64+ characters)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--length',
            type=int,
            default=64,
            help='Length of the secret key (default: 64)'
        )
        parser.add_argument(
            '--output',
            action='store_true',
            help='Output the key to stdout for easy copying'
        )

    def handle(self, *args, **options):
        length = options['length']
        
        if length < 64:
            self.stdout.write(
                self.style.WARNING(
                    f'Warning: Length {length} is less than recommended minimum of 64 characters'
                )
            )
        
        # Generate cryptographically secure random key
        secret_key = secrets.token_urlsafe(length)
        
        self.stdout.write(
            self.style.SUCCESS(f'Generated JWT secret key ({len(secret_key)} characters):')
        )
        
        if options['output']:
            self.stdout.write(secret_key)
        else:
            self.stdout.write(f'JWT_SECRET_KEY={secret_key}')
            self.stdout.write('')
            self.stdout.write('Add this to your .env file:')
            self.stdout.write(f'JWT_SECRET_KEY={secret_key}')
            self.stdout.write('')
            self.stdout.write(
                self.style.WARNING(
                    'IMPORTANT: Keep this secret key secure and never commit it to version control!'
                )
            )
