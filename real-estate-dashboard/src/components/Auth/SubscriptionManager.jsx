import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SubscriptionManager = ({ currentUser, onPlanChange }) => {
  const [selectedPlan, setSelectedPlan] = useState(currentUser?.plan || 'starter');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 19.95,
      yearlyPrice: 199.5,
      description: 'Perfekt für kleine Teams',
      features: [
        'Bis zu 5 Teammitglieder',
        'Basis KI-Features',
        'Standard Support',
        '100 Immobilien-Listings',
        'Grundlegende Analytics',
        'E-Mail Support'
      ],
      limitations: [
        'Begrenzte KI-Anfragen (100/Monat)',
        'Basis-Templates',
        'Standard-Integrationen'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      monthlyPrice: 29.95,
      yearlyPrice: 299.5,
      description: 'Ideal für wachsende Unternehmen',
      popular: true,
      features: [
        'Bis zu 25 Teammitglieder',
        'Erweiterte KI-Features',
        'Priority Support',
        'Unbegrenzte Listings',
        'Advanced Analytics',
        'Custom Branding',
        'API-Zugang',
        'Automatisierte Workflows',
        'Video-Calls Integration'
      ],
      limitations: [
        'Erweiterte KI-Anfragen (1000/Monat)',
        'Premium-Templates'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 49.95,
      yearlyPrice: 499.5,
      description: 'Für große Organisationen',
      features: [
        'Unbegrenzte Teammitglieder',
        'Alle KI-Features',
        '24/7 Premium Support',
        'White-Label Option',
        'Custom Integrations',
        'Dedicated Account Manager',
        'Advanced Security',
        'Custom Workflows',
        'Onboarding Support',
        'Training Sessions',
        'SLA Garantie'
      ],
      limitations: []
    }
  ];

  const getCurrentPlan = () => {
    return plans.find(plan => plan.id === currentUser?.plan) || plans[0];
  };

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const yearlyCost = plan.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  const handleUpgrade = (planId) => {
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = () => {
    onPlanChange(selectedPlan, billingCycle);
    setShowUpgradeModal(false);
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-glass">
            <i className="ri-vip-crown-line text-4xl text-white"></i>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-4">
            Abonnement verwalten
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Wählen Sie den perfekten Plan für Ihr Unternehmen und skalieren Sie Ihr Geschäft
          </p>
        </motion.div>
        <p>Demo Subscription Component - See full version in documentation</p>
      </div>
    </div>
  );
};

export default SubscriptionManager;
