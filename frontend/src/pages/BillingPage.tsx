import React, { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { Loader2, CreditCard, Users, Home, HardDrive, BarChart3, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const PLANS = {
  free: {
    name: 'Free',
    price: '€0',
    period: '/Monat',
    description: 'Perfekt für den Einstieg',
    features: [
      '2 Benutzer',
      '5 Immobilien',
      '1 GB Speicher',
      'Basis-Analytics',
    ],
    buttonText: 'Aktueller Plan',
    disabled: true,
  },
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
    buttonText: 'Upgrade zu Starter',
    disabled: false,
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
    buttonText: 'Upgrade zu Pro',
    disabled: false,
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
    buttonText: 'Upgrade zu Enterprise',
    disabled: false,
  },
};

export const BillingPage: React.FC = () => {
  const { billingInfo, loading, error, upgradePlan, openCustomerPortal } = useBilling();
  const [upgrading, setUpgrading] = useState<string | null>(null);

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

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unbegrenzt
    return Math.min((current / limit) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'trialing': return 'Testphase';
      case 'past_due': return 'Überfällig';
      case 'canceled': return 'Gekündigt';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Keine Billing-Informationen verfügbar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Abo & Billing</h1>
        <p className="text-gray-600">Verwalte dein Abonnement und upgrade deinen Plan</p>
      </div>

      {/* Aktueller Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Aktueller Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{PLANS[billingInfo.plan_key as keyof typeof PLANS]?.name}</h3>
              <Badge className={cn("mt-2", getStatusColor(billingInfo.status))}>
                {getStatusText(billingInfo.status)}
              </Badge>
            </div>
            <Button
              onClick={openCustomerPortal}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Abo verwalten
            </Button>
          </div>

          {billingInfo.current_period_end && (
            <p className="text-sm text-gray-600">
              Nächste Abrechnung: {new Date(billingInfo.current_period_end).toLocaleDateString('de-DE')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Aktuelle Nutzung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Benutzer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Benutzer</span>
              </div>
              <div className="text-2xl font-bold">
                {billingInfo.usage.users}
                {billingInfo.limits.users !== -1 && (
                  <span className="text-sm text-gray-500"> / {billingInfo.limits.users}</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${getUsagePercentage(billingInfo.usage.users, billingInfo.limits.users)}%`,
                  }}
                />
              </div>
            </div>

            {/* Immobilien */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Immobilien</span>
              </div>
              <div className="text-2xl font-bold">
                {billingInfo.usage.properties}
                {billingInfo.limits.properties !== -1 && (
                  <span className="text-sm text-gray-500"> / {billingInfo.limits.properties}</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${getUsagePercentage(billingInfo.usage.properties, billingInfo.limits.properties)}%`,
                  }}
                />
              </div>
            </div>

            {/* Speicher */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Speicher</span>
              </div>
              <div className="text-2xl font-bold">
                {(billingInfo.usage.storage_mb / 1024).toFixed(1)} GB
                {billingInfo.limits.storage_gb !== -1 && (
                  <span className="text-sm text-gray-500"> / {billingInfo.limits.storage_gb} GB</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${getUsagePercentage(billingInfo.usage.storage_mb / 1024, billingInfo.limits.storage_gb)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Upgrades */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Verfügbare Pläne</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrentPlan = key === billingInfo.plan_key;
            const isUpgrading = upgrading === key;
            
            return (
              <div
                key={key}
                className={`relative bg-white rounded-lg shadow-sm border ${
                  isCurrentPlan ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Aktueller Plan
                    </span>
                  </div>
                )}
                
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                
                <div className="p-6 pt-0">
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      isCurrentPlan || plan.disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={plan.disabled || isCurrentPlan || isUpgrading}
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
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Feature-Vergleich
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Feature</th>
                  <th className="text-center py-2">Free</th>
                  <th className="text-center py-2">Starter</th>
                  <th className="text-center py-2">Pro</th>
                  <th className="text-center py-2">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Benutzer</td>
                  <td className="text-center py-2">2</td>
                  <td className="text-center py-2">5</td>
                  <td className="text-center py-2">20</td>
                  <td className="text-center py-2">Unbegrenzt</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Immobilien</td>
                  <td className="text-center py-2">5</td>
                  <td className="text-center py-2">25</td>
                  <td className="text-center py-2">100</td>
                  <td className="text-center py-2">Unbegrenzt</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Speicher</td>
                  <td className="text-center py-2">1 GB</td>
                  <td className="text-center py-2">10 GB</td>
                  <td className="text-center py-2">50 GB</td>
                  <td className="text-center py-2">500 GB</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Analytics</td>
                  <td className="text-center py-2">Basis</td>
                  <td className="text-center py-2">Erweitert</td>
                  <td className="text-center py-2">Premium</td>
                  <td className="text-center py-2">Premium</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Integrationen</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Reporting</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr>
                  <td className="py-2">White Label</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">❌</td>
                  <td className="text-center py-2">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
