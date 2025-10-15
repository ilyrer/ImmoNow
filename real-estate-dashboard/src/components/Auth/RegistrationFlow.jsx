import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import PremiumPlanSelector from './PremiumPlanSelector';

const RegistrationFlow = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Step 2: Company Info
    companyName: '',
    companySize: '',
    industry: '',
    
    // Step 3: Plan Selection
    plan: 'starter',
    billingCycle: 'monthly',
    
    // Step 4: Account Setup
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    marketingEmails: false
  });

  const steps = [
    { id: 1, title: 'Personal Information', description: 'Tell us about yourself' },
    { id: 2, title: 'Company Details', description: 'About your business' },
    { id: 3, title: 'Choose Your Plan', description: 'Select the perfect plan' },
    { id: 4, title: 'Create Account', description: 'Secure your account' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate all fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (!formData.termsAccepted) {
        toast.error('Please accept the terms and conditions');
        return;
      }

      // Prepare payload
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        tenant_name: formData.companyName,
        plan: formData.plan,
        billing_cycle: formData.billingCycle,
        company_size: formData.companySize,
        industry: formData.industry
      };

      await onComplete(payload);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
                placeholder="john@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
                placeholder="+49 123 456 7890"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
                placeholder="Your Company GmbH"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Company Size
              </label>
              <select
                value={formData.companySize}
                onChange={(e) => handleInputChange('companySize', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
              >
                <option value="">Select industry</option>
                <option value="real-estate">Real Estate</option>
                <option value="property-management">Property Management</option>
                <option value="construction">Construction</option>
                <option value="architecture">Architecture</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <PremiumPlanSelector 
              value={formData.plan} 
              onChange={(plan) => handleInputChange('plan', plan)} 
            />
            
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Billing Cycle
              </label>
              <div className="flex space-x-3">
                <motion.button
                  type="button"
                  onClick={() => handleInputChange('billingCycle', 'monthly')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    formData.billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white/10 border border-white/20 text-purple-200 hover:bg-white/15'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Monthly
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleInputChange('billingCycle', 'yearly')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    formData.billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white/10 border border-white/20 text-purple-200 hover:bg-white/15'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Yearly (Save 20%)
                </motion.button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
                placeholder="Create a secure password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 focus:border-purple-400/50 transition-all duration-300"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                  required
                />
                <span className="text-xs text-purple-200/80">
                  I agree to the{' '}
                  <a href="#" className="text-purple-300 hover:text-white underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-purple-300 hover:text-white underline">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.marketingEmails}
                  onChange={(e) => handleInputChange('marketingEmails', e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-xs text-purple-200/80">
                  I'd like to receive product updates and marketing emails
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
              currentStep >= step.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 text-purple-200/60'
            }`}>
              {step.id}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${
                currentStep > step.id ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/20'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-1">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-sm text-purple-200/70">
              {steps[currentStep - 1].description}
            </p>
          </div>

          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <motion.button
          type="button"
          onClick={handlePrevious}
          className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentStep === 1 ? 'Back to Login' : 'Previous'}
        </motion.button>

        <motion.button
          type="button"
          onClick={handleNext}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentStep === 4 ? 'Create Account' : 'Continue'}
        </motion.button>
      </div>
    </div>
  );
};

export default RegistrationFlow;
