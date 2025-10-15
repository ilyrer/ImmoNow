"""
Quick script to switch from free to paid DeepSeek model
Dies ändert automatisch die .env Datei
"""
import os

def switch_model():
    """Switch from free to paid model in .env file"""
    
    env_files = ['.env', 'env.local']
    found = False
    
    for env_file in env_files:
        if not os.path.exists(env_file):
            continue
        
        found = True
        print(f"\n📝 Bearbeite {env_file}...")
        
        # Read file
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check current model
        if 'OPENROUTER_MODEL=' in content:
            # Replace model
            if 'deepseek/deepseek-chat-v3.1:free' in content:
                new_content = content.replace(
                    'OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free',
                    'OPENROUTER_MODEL=deepseek/deepseek-chat'
                )
                
                # Write back
                with open(env_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f"✅ Modell geändert zu: deepseek/deepseek-chat")
                print(f"\n💰 Kosten:")
                print(f"   - Input:  $0.14 per 1M tokens")
                print(f"   - Output: $0.28 per 1M tokens")
                print(f"   - Eine Konversation kostet ca. $0.0001 (0.01 Cent)")
                print(f"\n⚠️  Stelle sicher, dass du Credits in deinem OpenRouter Account hast:")
                print(f"   https://openrouter.ai/credits")
                
            elif 'deepseek/deepseek-chat' in content and ':free' not in content:
                print(f"✅ Modell ist bereits auf bezahlte Version gesetzt!")
                
            else:
                print(f"ℹ️  Aktuelles Modell: (siehe Datei)")
                print(f"   Du kannst es manuell auf 'deepseek/deepseek-chat' ändern")
        else:
            print(f"⚠️  OPENROUTER_MODEL nicht gefunden in {env_file}")
            print(f"   Füge diese Zeile hinzu:")
            print(f"   OPENROUTER_MODEL=deepseek/deepseek-chat")
    
    if not found:
        print("\n❌ Keine .env oder env.local Datei gefunden!")
        print("\nErstelle eine .env Datei:")
        print("  1. Kopiere env.example zu .env")
        print("  2. Füge deinen API-Key hinzu")
        print("  3. Setze OPENROUTER_MODEL=deepseek/deepseek-chat")
        return False
    
    print("\n" + "="*60)
    print("✅ Fertig!")
    print("="*60)
    print("\nNächste Schritte:")
    print("  1. Starte den Server neu (Strg+C und dann: python main.py)")
    print("  2. Teste die Integration: python test_llm_api.py")
    print("\n")
    
    return True

if __name__ == "__main__":
    print("="*60)
    print("OpenRouter Modell-Wechsel")
    print("="*60)
    print("\nDieser Script wechselt vom kostenlosen zum bezahlten Modell.")
    print("Das bezahlte Modell benötigt KEINE Privacy-Einstellung.")
    print()
    
    input("Drücke Enter um fortzufahren...")
    
    switch_model()

