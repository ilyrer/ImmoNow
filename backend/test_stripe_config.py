#!/usr/bin/env python3
"""
Test Stripe Configuration für Registration
"""

import os
import sys
from dotenv import load_dotenv

# ENV-Datei laden
load_dotenv("env.local")
load_dotenv("../env.local")
load_dotenv("../../env.local")

def test_stripe_config():
    """Teste Stripe-Konfiguration"""
    print("Testing Stripe Configuration...")
    
    # Test ENV-Variablen
    stripe_secret = os.getenv('STRIPE_SECRET_KEY')
    stripe_publishable = os.getenv('STRIPE_PUBLISHABLE_KEY')
    stripe_webhook = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    print(f"STRIPE_SECRET_KEY: {'Set' if stripe_secret else 'Missing'}")
    print(f"STRIPE_PUBLISHABLE_KEY: {'Set' if stripe_publishable else 'Missing'}")
    print(f"STRIPE_WEBHOOK_SECRET: {'Set' if stripe_webhook else 'Missing'}")
    
    # Test Price IDs
    price_starter = os.getenv('STRIPE_PRICE_STARTER')
    price_pro = os.getenv('STRIPE_PRICE_PRO')
    price_enterprise = os.getenv('STRIPE_PRICE_ENTERPRISE')
    
    print(f"\nPrice IDs:")
    print(f"STRIPE_PRICE_STARTER: {price_starter or 'Missing'}")
    print(f"STRIPE_PRICE_PRO: {price_pro or 'Missing'}")
    print(f"STRIPE_PRICE_ENTERPRISE: {price_enterprise or 'Missing'}")
    
    # Test Stripe API Connection
    if stripe_secret:
        try:
            import stripe
            stripe.api_key = stripe_secret
            
            # Test API connection
            account = stripe.Account.retrieve()
            print(f"\nStripe API Connection: Success")
            print(f"Account ID: {account.id}")
            print(f"Country: {account.country}")
            
            # Test Price IDs
            if price_starter:
                try:
                    price = stripe.Price.retrieve(price_starter)
                    print(f"Starter Price: {price.unit_amount/100:.2f} {price.currency.upper()}")
                except Exception as e:
                    print(f"Starter Price Error: {e}")
            
            if price_pro:
                try:
                    price = stripe.Price.retrieve(price_pro)
                    print(f"Pro Price: {price.unit_amount/100:.2f} {price.currency.upper()}")
                except Exception as e:
                    print(f"Pro Price Error: {e}")
                    
            if price_enterprise:
                try:
                    price = stripe.Price.retrieve(price_enterprise)
                    print(f"Enterprise Price: {price.unit_amount/100:.2f} {price.currency.upper()}")
                except Exception as e:
                    print(f"Enterprise Price Error: {e}")
                    
        except Exception as e:
            print(f"Stripe API Error: {e}")
    else:
        print("Cannot test Stripe API - no secret key")

if __name__ == "__main__":
    test_stripe_config()
