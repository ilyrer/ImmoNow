import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, CreditCard } from 'lucide-react';
import AuroraBackgroundClean from './AuroraBackgroundClean';
import { registrationService } from '../../services/registration';

const PlanSelectionPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lade verfügbare Pläne
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const availablePlans = await registrationService.getPlans();
        setPlans(availablePlans);
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Pläne');
        console.error('Failed to load plans:', err);
        setLoading(false);
      }
    };
    
    loadPlans();
  }, []);

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
  };

  const handleContinue = () => {
    // Weiter zu Email-Eingabe mit ausgewähltem Plan
    navigate('/register/details', { 
      state: { 
        selectedPlan,
        planData: plans[selectedPlan]
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Lade Pläne...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackgroundClean />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Choose your Plan
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-purple-200"
            >
              Select the perfect plan
            </motion.p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(plans).map(([key, plan], index) => {
              const isSelected = selectedPlan === key;
              const isPopular = key === 'pro';
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                  onClick={() => handlePlanSelect(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </h3>
                      <div className="text-3xl font-bold text-white mb-2">
                        {key === 'starter' && '€29'}
                        {key === 'pro' && '€99'}
                        {key === 'enterprise' && '€299'}
                        <span className="text-sm font-normal text-purple-200">/Monat</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-3 text-sm text-white">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>{plan.users === -1 ? 'Unbegrenzte' : plan.users} Benutzer</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>{plan.properties === -1 ? 'Unbegrenzte' : plan.properties} Immobilien</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>{plan.storage_gb === -1 ? 'Unbegrenzter' : plan.storage_gb} GB Speicher</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-white">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>{plan.analytics} Analytics</span>
                      </li>
                      {plan.integrations && (
                        <li className="flex items-center gap-3 text-sm text-white">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span>Integrationen</span>
                        </li>
                      )}
                      {plan.reporting && (
                        <li className="flex items-center gap-3 text-sm text-white">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span>Reporting</span>
                        </li>
                      )}
                    </ul>
                    
                    <div className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-center ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}>
                      {isSelected ? 'Ausgewählt' : 'Auswählen'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center"
          >
            <button
              onClick={handleContinue}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-medium text-lg flex items-center gap-2 mx-auto transition-all duration-300"
            >
              <CreditCard className="h-5 w-5" />
              Jetzt bezahlen und registrieren
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8 text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2 text-purple-200 text-sm">
              <Shield className="h-4 w-4" />
              <span>Secure payment powered by Stripe</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-purple-200 text-sm">
              <Check className="h-4 w-4" />
              <span>Cancel anytime, no commitment</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlanSelectionPage;
