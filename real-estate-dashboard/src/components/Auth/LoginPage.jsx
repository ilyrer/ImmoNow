import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Components
import AuroraBackgroundClean from './AuroraBackgroundClean';
import PasswordStrength from './PasswordStrength';
import PlanSelector from './PlanSelector';
import TopProgressBar from '../common/TopProgressBar';
import SuccessOverlay from '../common/SuccessOverlay';

// Hooks & Services
import { useLogin, useRegister, useResetPassword } from '../../api/hooks';

// Styles
import './PremiumLogin.css';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    plan: 'starter'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const controls = useAnimation();

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const resetPasswordMutation = useResetPassword();

  // Enhanced animations
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all fields.');
        return;
      }

      try {
        console.log('🔐 LoginPage: Starting login with credentials:', formData.email);
        setIsSubmitting(true);
        // Call the REAL onLogin handler from App.jsx which does the actual API call
        await onLogin({
          email: formData.email,
          password: formData.password
        });
        console.log('✅ LoginPage: onLogin completed successfully');
        // Success! Show overlay and navigate
        setShowSuccess(true);
        toast.success('Welcome back to premium!');
        setTimeout(() => {
          console.log('🚀 LoginPage: Navigating to dashboard');
          setShowSuccess(false);
          navigate('/dashboard', { replace: true });
        }, 1000);
      } catch (error) {
        console.error('❌ LoginPage: Login failed:', error);
        toast.error(`Login failed: ${error.message}`);
        setIsSubmitting(false);
      }
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.company) {
        toast.error('Please fill in all fields.');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }

      try {
        setIsSubmitting(true);
        const [first, ...rest] = String(formData.name).trim().split(' ');
        const payload = {
          email: formData.email,
          password: formData.password,
          first_name: first || formData.email.split('@')[0],
          last_name: rest.join(' ').trim() || 'User', // Backend requires min 2 characters
          company: formData.company,
          plan: formData.plan,
          billing_cycle: 'monthly',
          role: 'agent' // Backend requires role field
        };
        
        const data = await registerMutation.mutateAsync(payload);
        if (data?.access_token) localStorage.setItem('access_token', data.access_token);
        if (data?.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        
        onLogin(data.user);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Navigate to dashboard after successful registration
          navigate('/', { replace: true });
        }, 1500);
        toast.success('Welcome to the elite!');
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.message || 'Registration failed';
        toast.error(String(msg));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <TopProgressBar active={isSubmitting} />
      
      {/* Premium Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 via-indigo-900 to-slate-900" />
        <AuroraBackgroundClean />
        
        {/* Interactive Light Effect */}
        <motion.div 
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)`,
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            pointerEvents: 'none'
          }}
          transition={{ type: "tween", duration: 0.3 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <motion.div 
          className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center p-12 xl:p-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="max-w-xl">
            {/* Logo */}
            <motion.div className="mb-12">
              <img 
                src="/logo/logo-removebg-preview.png" 
                alt="Weltberg Immobilien" 
                className="h-16 w-auto mb-8 drop-shadow-2xl"
              />
            </motion.div>

            {/* Hero Content */}
            <motion.h1 
              variants={itemVariants}
              className="text-5xl xl:text-6xl font-black text-white mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Die Zukunft des
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                Immobilienmanagements
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-purple-100/90 mb-4 font-light leading-relaxed"
            >
              Revolutionäre KI-gestützte Plattform für Premium-Immobilienerfahrungen
            </motion.p>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg text-indigo-200/80 font-extralight mb-12"
            >
              Maximale Effizienz. Minimaler Aufwand. Maximaler Erfolg.
            </motion.p>

            {/* Features */}
            <motion.div variants={itemVariants} className="space-y-6">
              {[
                { icon: "✨", title: "KI-gestützte Marktanalysen", desc: "Predictive Analytics für optimale Entscheidungen" },
                { icon: "🚀", title: "Automatisierte Workflows", desc: "99% weniger manueller Aufwand" },
                { icon: "💎", title: "Premium Dashboard", desc: "Real-time Insights und Performance Tracking" },
                { icon: "🎯", title: "Smart Lead Management", desc: "Conversion-Rate um 400% gesteigert" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                  className="flex items-start space-x-4 group"
                >
                  <motion.div
                    className="text-2xl"
                    animate={{ rotate: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-white mb-1 text-lg">{feature.title}</h3>
                    <p className="text-purple-200/70 font-light">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div 
          className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="w-full max-w-3xl"
            variants={itemVariants}
          >
            {/* Glass Card */}
            <motion.div 
              className="bg-white/10 border border-white/20 rounded-3xl p-16 shadow-2xl relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated border glow */}
              <motion.div 
                className="absolute inset-0 rounded-3xl"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(168, 85, 247, 0.3)',
                    '0 0 40px rgba(59, 130, 246, 0.3)',
                    '0 0 20px rgba(168, 85, 247, 0.3)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              
              <div className="relative z-10">
                {/* Logo */}
                <motion.div 
                  variants={itemVariants}
                  className="text-center mb-2"
                >
                  <img 
                    src="/img/logos/Immonow_logo.png" 
                    alt="ImmoNow" 
                    className="h-64 w-auto mx-auto drop-shadow-2xl"
                  />
                </motion.div>

                {/* Header */}
                <motion.div 
                  variants={itemVariants}
                  className="text-center mb-8"
                >
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-3 text-shimmer">
                    {isLogin ? 'Welcome Back' : 'Join the Elite'}
                  </h2>
                  <p className="text-lg text-purple-200/70 font-light">
                    {isLogin ? 'Continue your premium journey' : 'Start your transformation today'}
                  </p>
                </motion.div>

                {/* Toggle */}
                <motion.div 
                  variants={itemVariants}
                  className="flex bg-white/8 rounded-2xl p-1 mb-8 border border-white/15"
                >
                  <motion.button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isLogin 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg btn-premium' 
                        : 'text-purple-200 hover:text-white hover:bg-white/8'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-300 ${
                      !isLogin 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg btn-premium' 
                        : 'text-purple-200 hover:text-white hover:bg-white/8'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Account
                  </motion.button>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field (Registration only) */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-purple-300/50 focus:bg-white/15 transition-all duration-300 ${
                              focusedField === 'name' ? 'border-purple-400/50' : 'border-white/20'
                            }`}
                            placeholder="Your full name"
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-purple-300/50 focus:bg-white/15 transition-all duration-300 ${
                          focusedField === 'email' ? 'border-purple-400/50' : 'border-white/20'
                        }`}
                        placeholder="your@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-purple-300/50 focus:bg-white/15 transition-all duration-300 ${
                          focusedField === 'password' ? 'border-purple-400/50' : 'border-white/20'
                        }`}
                        placeholder="Your secure password"
                        required
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          {showPassword ? (
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          ) : (
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                          )}
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Registration Additional Fields */}
                  <AnimatePresence>
                    {!isLogin && (
                      <>
                        {/* Confirm Password */}
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-200 mb-2">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              onFocus={() => setFocusedField('confirmPassword')}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-purple-300/50 focus:bg-white/15 transition-all duration-300 ${
                                focusedField === 'confirmPassword' ? 'border-purple-400/50' : 'border-white/20'
                              }`}
                              placeholder="Confirm your password"
                              required
                              autoComplete="new-password"
                            />
                            <motion.button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                {showConfirmPassword ? (
                                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                ) : (
                                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                )}
                              </svg>
                            </motion.button>
                          </div>
                          <PasswordStrength value={formData.password} />
                        </motion.div>

                        {/* Company Field */}
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          <label htmlFor="company" className="block text-sm font-medium text-purple-200 mb-2">
                            Company Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="company"
                              name="company"
                              value={formData.company}
                              onChange={handleInputChange}
                              onFocus={() => setFocusedField('company')}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-purple-300/50 focus:bg-white/15 transition-all duration-300 ${
                                focusedField === 'company' ? 'border-purple-400/50' : 'border-white/20'
                              }`}
                              placeholder="Your company name"
                              required
                              autoComplete="organization"
                            />
                          </div>
                        </motion.div>

                        {/* Plan Selection */}
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                        >
                          <label className="block text-sm font-medium text-purple-200 mb-3">
                            Choose Your Premium Plan
                          </label>
                          <div className="bg-white/10 rounded-xl border border-white/20 p-4">
                            <PlanSelector 
                              value={formData.plan} 
                              onChange={(v) => setFormData({ ...formData, plan: v })} 
                            />
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none group btn-premium"
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: "0 20px 40px -12px rgba(168, 85, 247, 0.5)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 rounded-xl"
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>{isLogin ? 'Signing you in...' : 'Creating your account...'}</span>
                      </div>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <span>{isLogin ? 'Enter Premium Dashboard' : 'Start Premium Journey'}</span>
                        <motion.svg 
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          initial={{ x: 0 }}
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                        </motion.svg>
                      </span>
                    )}
                  </motion.button>

                  {/* Social Login */}
                  <div className="pt-4">
                    <div className="relative text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative bg-transparent px-4">
                        <span className="text-sm text-purple-300/70">Or continue with</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      {[
                        { name: 'Google', onClick: () => toast('Google Login coming soon') },
                        { name: 'Microsoft', onClick: () => toast('Microsoft Login coming soon') },
                        { name: 'Apple', onClick: () => toast('Apple Login coming soon') }
                      ].map((provider, index) => (
                        <motion.button
                          key={provider.name}
                          type="button"
                          onClick={provider.onClick}
                          className="bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-sm font-medium text-white hover:bg-white/15 transition-all duration-300 focus:outline-none"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {provider.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Forgot Password */}
                  {isLogin && (
                    <div className="text-center">
                      <motion.button
                        type="button"
                        onClick={async () => {
                          const email = formData.email?.trim();
                          if (!email) {
                            toast.error('Please enter your email address first.');
                            return;
                          }
                          try {
                            await resetPasswordMutation.mutateAsync({ email });
                            toast.success('If an account exists, a reset email has been sent.');
                          } catch (e) {
                            toast.error('Error requesting password reset');
                          }
                        }}
                        className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                      >
                        Forgot your password?
                      </motion.button>
                    </div>
                  )}
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-purple-300/70">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <motion.button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-purple-200 hover:text-white font-medium transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                    >
                      {isLogin ? 'Create one now' : 'Sign in here'}
                    </motion.button>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Success Overlay */}
      <SuccessOverlay 
        show={showSuccess} 
        message={isLogin ? 'Welcome back to premium!' : 'Welcome to the elite!'} 
      />
    </div>
  );
};

export default LoginPage;
