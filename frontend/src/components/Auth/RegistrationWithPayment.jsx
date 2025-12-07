import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Mail, User, Phone } from 'lucide-react';
import AuroraBackgroundClean from './AuroraBackgroundClean';
import { registrationService } from '../../services/registration';
import { toast } from 'react-hot-toast';

const RegistrationWithPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPlan, planData } = location.state || {};
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    plan: selectedPlan || 'starter',
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      // Validiere Email und Namen
      if (!formData.email || !formData.first_name || !formData.last_name) {
        toast.error('Bitte füllen Sie alle Pflichtfelder aus');
        return;
      }
      
      // Validiere Email Format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/register');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Erstelle Stripe Checkout Session
      const checkout = await registrationService.createCheckout(formData);
      
      // Redirect zu Stripe Checkout
      window.location.href = checkout.checkout_url;
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Fehler beim Erstellen der Zahlungssession');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Ihre Kontaktdaten</h2>
              <p className="text-purple-200">Plan: {formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1)}</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                <input
                  type="email"
                  placeholder="E-Mail-Adresse"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <input
                    type="text"
                    placeholder="Vorname"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <input
                    type="text"
                    placeholder="Nachname"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                <input
                  type="tel"
                  placeholder="Telefon (optional)"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </button>
              
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                Weiter
              </button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Zahlung</h2>
              <p className="text-purple-200">Sichere Zahlung über Stripe</p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white">Plan:</span>
                  <span className="text-white font-semibold">
                    {formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white">E-Mail:</span>
                  <span className="text-white">{formData.email}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white">Name:</span>
                  <span className="text-white">{formData.first_name} {formData.last_name}</span>
                </div>
                
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Monatlicher Preis:</span>
                    <span className="text-white font-bold text-xl">
                      {formData.plan === 'starter' && '€29'}
                      {formData.plan === 'pro' && '€99'}
                      {formData.plan === 'enterprise' && '€299'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </button>
              
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Jetzt bezahlen
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      <AuroraBackgroundClean />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationWithPayment;
