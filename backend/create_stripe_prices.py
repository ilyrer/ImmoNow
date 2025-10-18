#!/usr/bin/env python3
"""
Erstelle neue Stripe Price IDs für die Registrierung
"""

import os
import sys
from dotenv import load_dotenv

# ENV-Datei laden
load_dotenv("env.local")
load_dotenv("../env.local")
load_dotenv("../../env.local")

def create_stripe_prices():
    """Erstelle neue Stripe Price IDs"""
    try:
        import stripe
        
        stripe_secret = os.getenv('STRIPE_SECRET_KEY')
        if not stripe_secret:
            print("ERROR: STRIPE_SECRET_KEY nicht gesetzt")
            return
            
        stripe.api_key = stripe_secret
        
        print("Erstelle Stripe Produkte und Preise...")
        
        # Erstelle Produkte
        products = {}
        
        # Starter Produkt
        starter_product = stripe.Product.create(
            name="ImmoNow Starter Plan",
            description="Starter Plan für ImmoNow - 5 Benutzer, 25 Immobilien, 10GB Speicher",
            metadata={"plan": "starter"}
        )
        products['starter'] = starter_product
        
        # Pro Produkt
        pro_product = stripe.Product.create(
            name="ImmoNow Pro Plan", 
            description="Pro Plan für ImmoNow - 20 Benutzer, 100 Immobilien, 50GB Speicher",
            metadata={"plan": "pro"}
        )
        products['pro'] = pro_product
        
        # Enterprise Produkt
        enterprise_product = stripe.Product.create(
            name="ImmoNow Enterprise Plan",
            description="Enterprise Plan für ImmoNow - Unbegrenzte Benutzer und Immobilien, 500GB Speicher",
            metadata={"plan": "enterprise"}
        )
        products['enterprise'] = enterprise_product
        
        print("\nProdukte erstellt:")
        for plan, product in products.items():
            print(f"{plan.title()}: {product.id}")
        
        # Erstelle Preise
        prices = {}
        
        # Starter Preis (€19.99)
        starter_price = stripe.Price.create(
            unit_amount=1999,  # €19.99 in Cent
            currency='eur',
            product=products['starter'].id,
            metadata={"plan": "starter"}
        )
        prices['starter'] = starter_price
        
        # Pro Preis (€49.99)
        pro_price = stripe.Price.create(
            unit_amount=4999,  # €49.99 in Cent
            currency='eur',
            product=products['pro'].id,
            metadata={"plan": "pro"}
        )
        prices['pro'] = pro_price
        
        # Enterprise Preis (€99.99)
        enterprise_price = stripe.Price.create(
            unit_amount=9999,  # €99.99 in Cent
            currency='eur',
            product=products['enterprise'].id,
            metadata={"plan": "enterprise"}
        )
        prices['enterprise'] = enterprise_price
        
        print("\nPreise erstellt:")
        for plan, price in prices.items():
            print(f"{plan.title()}: {price.id} (€{price.unit_amount/100:.2f})")
        
        # Aktualisiere env.local
        env_path = "env.local"
        if not os.path.exists(env_path):
            env_path = "../env.local"
        if not os.path.exists(env_path):
            env_path = "../../env.local"
            
        print(f"\nAktualisiere {env_path}...")
        
        # Lese aktuelle env.local
        with open(env_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ersetze Price IDs
        content = content.replace(
            f"STRIPE_PRICE_STARTER={os.getenv('STRIPE_PRICE_STARTER', '')}",
            f"STRIPE_PRICE_STARTER={prices['starter'].id}"
        )
        content = content.replace(
            f"STRIPE_PRICE_PRO={os.getenv('STRIPE_PRICE_PRO', '')}",
            f"STRIPE_PRICE_PRO={prices['pro'].id}"
        )
        content = content.replace(
            f"STRIPE_PRICE_ENTERPRISE={os.getenv('STRIPE_PRICE_ENTERPRISE', '')}",
            f"STRIPE_PRICE_ENTERPRISE={prices['enterprise'].id}"
        )
        
        # Schreibe aktualisierte env.local
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("env.local erfolgreich aktualisiert!")
        
        print("\nNeue Price IDs:")
        print(f"STRIPE_PRICE_STARTER={prices['starter'].id}")
        print(f"STRIPE_PRICE_PRO={prices['pro'].id}")
        print(f"STRIPE_PRICE_ENTERPRISE={prices['enterprise'].id}")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    create_stripe_prices()

