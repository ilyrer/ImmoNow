import React from 'react';
import { motion } from 'framer-motion';

const PremiumPlanSelector = ({ value, onChange }) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '€0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 2 users',
        'Up to 5 properties',
        '1 GB storage',
        'Basic analytics',
        'Email support'
      ],
      popular: false,
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '€29',
      period: 'per month',
      description: 'Essential tools for growing businesses',
      features: [
        'Up to 5 users',
        'Up to 25 properties',
        '10 GB storage',
        'Advanced analytics',
        'Priority email support',
        'Custom branding'
      ],
      popular: true,
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '€99',
      period: 'per month',
      description: 'Comprehensive suite for established agencies',
      features: [
        'Up to 20 users',
        'Up to 100 properties',
        '50 GB storage',
        'Premium analytics',
        'Priority support',
        'Custom integrations',
        'Advanced reporting'
      ],
      popular: false,
      gradient: 'from-blue-600 to-purple-600'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '€299',
      period: 'per month',
      description: 'Tailored solutions for large organizations',
      features: [
        'Unlimited users',
        'Unlimited properties',
        '500 GB storage',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom integrations',
        'White-label solution'
      ],
      popular: false,
      gradient: 'from-indigo-600 to-blue-600'
    }
  ];

  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <motion.div
          key={plan.id}
          className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${
            value === plan.id
              ? 'border-purple-400 bg-purple-500/10'
              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
          }`}
          onClick={() => onChange(plan.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Popular Badge */}
          {plan.popular && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
            </div>
          )}

          <div className="p-4">
            {/* Plan Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  value === plan.id ? 'border-purple-400 bg-purple-400' : 'border-white/40'
                }`}>
                  {value === plan.id && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{plan.name}</h3>
                  <p className="text-xs text-purple-200/70">{plan.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{plan.price}</div>
                <div className="text-xs text-purple-200/70">{plan.period}</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-purple-200/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Payment Info */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center space-x-2 text-xs text-purple-200/70">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-purple-200/70 mt-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Cancel anytime, no commitment</span>
        </div>
      </div>
    </div>
  );
};

export default PremiumPlanSelector;
