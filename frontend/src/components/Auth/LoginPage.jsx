import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Styles
import './PremiumLogin.css';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
  const { loginWithGoogle, isLoading: googleLoading } = useGoogleAuth();

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
      toast.success('Welcome back!');
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
  };

  const handleCreateAccount = () => {
    // Navigiere zur neuen Payment-First Registration
    navigate('/register');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleLogin = async () => {
    try {
      const googleUser = await loginWithGoogle();
      
      // Convert Google user to our login format
      const loginData = {
        email: googleUser.email,
        password: '', // Not needed for OAuth
        google_id: googleUser.id,
        first_name: googleUser.given_name || googleUser.name.split(' ')[0],
        last_name: googleUser.family_name || googleUser.name.split(' ').slice(1).join(' '),
        profile_picture: googleUser.picture
      };

      // Call our backend login endpoint with Google user data
      const result = await loginMutation.mutateAsync(loginData);
      
      if (result.access_token && result.tenant?.id) {
        onLogin(result);
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
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

      {/* Centered Login Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <motion.div 
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Glass Card */}
          <motion.div 
            className="bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
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
                className="text-center mb-8"
              >
                <img 
                  src="/logo/immonow-logo.png" 
                  alt="ImmoNow" 
                  className="h-16 w-auto mx-auto drop-shadow-2xl"
                />
              </motion.div>

              {/* Header */}
              <motion.div 
                variants={itemVariants}
                className="text-center mb-6"
              >
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-2">
                  {isLogin ? 'Welcome Back' : 'Join the Elite'}
                </h2>
                <p className="text-sm text-purple-200/70 font-light">
                  {isLogin ? 'Continue your premium journey' : 'Start your transformation today'}
                </p>
              </motion.div>

              {/* Toggle */}
              <motion.div 
                variants={itemVariants}
                className="flex bg-white/8 rounded-xl p-1 mb-6 border border-white/15"
              >
                <motion.button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isLogin 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
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
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'text-purple-200 hover:text-white hover:bg-white/8'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Account
                </motion.button>
              </motion.div>

              {/* Content */}
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Email Field */}
                      <motion.div variants={itemVariants}>
                        <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-1">
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
                            className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 transition-all duration-300 ${
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
                        <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-1">
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
                            className={`w-full px-3 py-2 pr-10 bg-white/10 border rounded-lg text-white placeholder-purple-300/50 focus:bg-white/15 transition-all duration-300 ${
                              focusedField === 'password' ? 'border-purple-400/50' : 'border-white/20'
                            }`}
                            placeholder="Your secure password"
                            required
                            autoComplete="current-password"
                          />
                          <motion.button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              {showPassword ? (
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                              ) : (
                                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                              )}
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Social Login Section */}
                      <div className="space-y-3">
                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading || isSubmitting}
                            className="flex items-center justify-center space-x-2 bg-white/10 border border-white/20 rounded-lg py-2.5 px-4 text-sm font-medium text-white hover:bg-white/15 transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: googleLoading ? 1 : 1.02, y: googleLoading ? 0 : -1 }}
                            whileTap={{ scale: googleLoading ? 1 : 0.98 }}
                          >
                            {googleLoading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            )}
                            <span>{googleLoading ? 'Connecting...' : 'Google'}</span>
                          </motion.button>
                          
                          <motion.button
                            type="button"
                            onClick={() => toast('Apple Login coming soon!')}
                            className="flex items-center justify-center space-x-2 bg-white/10 border border-white/20 rounded-lg py-2.5 px-4 text-sm font-medium text-white hover:bg-white/15 transition-all duration-300 focus:outline-none"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            <span>Apple</span>
                          </motion.button>
                        </div>

                        {/* Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-transparent text-purple-300/60">or continue with email</span>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none group"
                        whileHover={{ 
                          scale: 1.02, 
                          boxShadow: "0 10px 20px -5px rgba(168, 85, 247, 0.5)"
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 rounded-lg"
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
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            <span className="text-sm">Signing you in...</span>
                          </div>
                        ) : (
                          <span className="relative z-10 flex items-center justify-center space-x-2">
                            <span className="text-sm">Sign In</span>
                            <motion.svg 
                              className="w-4 h-4"
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
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="registration"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>
                    <p className="text-purple-200 mb-8">
                      Start your journey with ImmoNow
                    </p>
                    <button
                      onClick={handleCreateAccount}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300"
                    >
                      Get Started
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Footer */}
              <div className="mt-4 text-center">
                <p className="text-xs text-purple-300/70">
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
      </div>

      {/* Success Overlay */}
      <SuccessOverlay 
        show={showSuccess} 
        message="Welcome to ImmoNow!" 
      />

    </div>
  );
};

export default LoginPage;