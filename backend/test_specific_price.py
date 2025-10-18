#!/usr/bin/env python3
"""
Teste spezifische Stripe Price ID
"""

import os
import sys
from dotenv import load_dotenv

# ENV-Datei laden
load_dotenv("env.local")
load_dotenv("../env.local")
load_dotenv("../../env.local")

def test_specific_price_id():
    """Teste die spezifische Price ID"""
    try:
        import stripe
        
        stripe_secret = os.getenv('STRIPE_SECRET_KEY')
        if not stripe_secret:
            print("ERROR: STRIPE_SECRET_KEY nicht gesetzt")
            return
            
        stripe.api_key = stripe_secret
        
        # Teste die spezifische Price ID
        price_id = "price_1SJFgpRj0i9nfUDYhFhj3PVM"
        
        print(f"Teste Price ID: {price_id}")
        
        try:
            price = stripe.Price.retrieve(price_id)
            print(f"SUCCESS: Price gefunden!")
            print(f"ID: {price.id}")
            print(f"Amount: {price.unit_amount/100:.2f} {price.currency.upper()}")
            print(f"Product: {price.product}")
            print(f"Active: {price.active}")
            
            # Hole auch das Produkt
            product = stripe.Product.retrieve(price.product)
            print(f"Product Name: {product.name}")
            print(f"Product Description: {product.description}")
            
        except Exception as e:
            print(f"ERROR: {e}")
            
    except ImportError:
        print("ERROR: Stripe module nicht installiert")
        print("Bitte installieren Sie: pip install stripe")

if __name__ == "__main__":
    test_specific_price_id()

