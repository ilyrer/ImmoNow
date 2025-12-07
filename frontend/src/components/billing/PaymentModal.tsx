import React, { useState } from 'react';
import { useBilling } from '../../hooks/useBilling';
import { Loader2, X, CreditCard, Users, Home, HardDrive, BarChart3, Settings, Shield, Check } from 'lucide-react';

const PLANS = {
  starter: {
    name: 'Starter',
    price: '€29',
    period: '/Monat',
    description: 'Ideal für kleine Teams',
    features: [
      '5 Benutzer',
      '25 Immobilien',
      '10 GB Speicher',
      'Erweiterte Analytics',
    ],
    buttonText: 'Starter wählen',
    popular: false,
  },
  pro: {
    name: 'Pro',
    price: '€99',
    period: '/Monat',
    description: 'Für wachsende Unternehmen',
    features: [
      '20 Benutzer',
      '100 Immobilien',
      '50 GB Speicher',
      'Premium Analytics',
      'Integrationen',
      'Reporting',
    ],
    buttonText: 'Pro wählen',
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: '€299',
    period: '/Monat',
    description: 'Für große Unternehmen',
    features: [
      'Unbegrenzte Benutzer',
      'Unbegrenzte Immobilien',
      '500 GB Speicher',
      'Premium Analytics',
      'Integrationen',
      'Reporting',
      'White Label',
    ],
    buttonText: 'Enterprise wählen',
    popular: false,
  },
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isTrialExpired?: boolean;
  daysRemaining?: number;
  isNewRegistration?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  isTrialExpired, 
  daysRemaining,
  isNewRegistration = false
}) => {
  const { upgradePlan } = useBilling();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Modal kann NICHT geschlossen werden wenn Trial abgelaufen
  const canClose = !isTrialExpired && onClose;

  const handleUpgrade = async (plan: string) => {
    try {
      setUpgrading(plan);
      await upgradePlan(plan);
    } catch (err) {
      console.error('Upgrade failed:', err);
    } finally {
      setUpgrading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              {isTrialExpired ? (
                <>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">
                    Ihre Testphase ist abgelaufen
                  </h2>
                  <p className="text-gray-600">
                    Wählen Sie ein Abo, um weiterhin Zugriff zu haben
                  </p>
                </>
              ) : isNewRegistration ? (
                <>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Willkommen bei ImmoNow!
                  </h2>
                  <p className="text-gray-600">
                    Ihre 14-tägige Testphase beginnt jetzt. Wählen Sie ein Abo oder nutzen Sie die Testphase.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Wählen Sie Ihr Abo
                  </h2>
                  <p className="text-gray-600">
                    Noch {daysRemaining} Tage in Ihrer Testphase
                  </p>
                </>
              )}
            </div>
            
            {canClose && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(PLANS).map(([key, plan]) => {
              const isUpgrading = upgrading === key;
              
              return (
                <div
                  key={key}
                  className={`relative bg-white rounded-lg shadow-sm border-2 ${
                    plan.popular 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Beliebt
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {plan.price}
                        <span className="text-sm font-normal text-gray-500">{plan.period}</span>
                      </div>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={isUpgrading}
                      onClick={() => handleUpgrade(key)}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          Wird verarbeitet...
                        </>
                      ) : (
                        plan.buttonText
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Feature-Vergleich
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Feature</th>
                    <th className="text-center py-2 font-medium">Starter</th>
                    <th className="text-center py-2 font-medium">Pro</th>
                    <th className="text-center py-2 font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Benutzer</td>
                    <td className="text-center py-2">5</td>
                    <td className="text-center py-2">20</td>
                    <td className="text-center py-2">Unbegrenzt</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Immobilien</td>
                    <td className="text-center py-2">25</td>
                    <td className="text-center py-2">100</td>
                    <td className="text-center py-2">Unbegrenzt</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Speicher</td>
                    <td className="text-center py-2">10 GB</td>
                    <td className="text-center py-2">50 GB</td>
                    <td className="text-center py-2">500 GB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Analytics</td>
                    <td className="text-center py-2">Erweitert</td>
                    <td className="text-center py-2">Premium</td>
                    <td className="text-center py-2">Premium</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Integrationen</td>
                    <td className="text-center py-2">❌</td>
                    <td className="text-center py-2">✅</td>
                    <td className="text-center py-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Reporting</td>
                    <td className="text-center py-2">❌</td>
                    <td className="text-center py-2">✅</td>
                    <td className="text-center py-2">✅</td>
                  </tr>
                  <tr>
                    <td className="py-2">White Label</td>
                    <td className="text-center py-2">❌</td>
                    <td className="text-center py-2">❌</td>
                    <td className="text-center py-2">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trial Info */}
          {!isTrialExpired && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sie können Ihre Testphase jederzeit beenden und ein Abo wählen.
                <br />
                Nach Ablauf der 14 Tage wird der Zugriff automatisch eingeschränkt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
