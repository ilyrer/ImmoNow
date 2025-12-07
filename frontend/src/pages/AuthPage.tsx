import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, User, Building2, Phone, CheckCircle2, XCircle } from 'lucide-react';
import apiService from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register';

// Password strength checker
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  
  const strength = Object.values(checks).filter(Boolean).length;
  return { checks, strength };
};

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    tenant_name: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const passwordStrength = checkPasswordStrength(registerData.password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiService.login({ 
        email: loginEmail, 
        password: loginPassword 
      });
      console.log('✅ AuthPage: Login successful:', response.user.email);
      
      // apiService.login() already called apiClient.setAuth() and stored tokens
      // Update the AuthContext state
      setAuth(response.token, response.user.tenant_id);
      
      console.log('✅ AuthPage: Auth state updated, navigating to /dashboard');
      // IMPORTANT: Don't navigate immediately - let React finish state updates
      // The App.jsx will automatically render the dashboard when user state is set
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (err: any) {
      console.error('❌ AuthPage: Login error:', err);
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!registerData.email || !registerData.password || !registerData.first_name || 
        !registerData.last_name || !registerData.tenant_name) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.strength < 4) {
      setError('Password does not meet all requirements');
      return;
    }
    
    setIsLoading(true);
    try {
      const { confirmPassword, ...data } = registerData;
      const response = await apiService.register({
        ...data,
        plan: 'free',
        billing_cycle: 'monthly'
      });
      console.log('✅ Registration successful:', response.user);
      console.log('✅ Navigating to /dashboard...');
      
      // apiService.register() already called apiClient.setAuth() and stored tokens
      // Just update the AuthContext state
      setAuth(response.token, response.user.tenant_id);
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-3xl relative z-10"
      >
        {/* Card with glassmorphism */}
        <div className="bg-white/15 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/30 p-10 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Logo - LARGE */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <img 
                  src="/img/logos/Immonow_logo.png" 
                  alt="IMMONOW" 
                  className="h-24 mx-auto drop-shadow-2xl"
                />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg"
              >
                Welcome Back
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-lg"
              >
                Continue your premium journey
              </motion.p>
            </div>

            {/* Tab Buttons - Larger & More Beautiful */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 mb-8 bg-white/10 p-2 rounded-2xl backdrop-blur-sm"
            >
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-white text-purple-600 shadow-2xl shadow-white/20 scale-105'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  mode === 'register'
                    ? 'bg-white text-purple-600 shadow-2xl shadow-white/20 scale-105'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Create Account
              </button>
            </motion.div>

            {/* Error Message - More Prominent */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/20 backdrop-blur border border-red-300/40 rounded-2xl text-white text-base font-medium shadow-lg"
              >
                ⚠️ {error}
              </motion.div>
            )}

          {/* Login Form */}
          {mode === 'login' && (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleLogin} 
              className="space-y-6"
            >
              {/* Email */}
              <div>
                <label className="block text-base font-semibold text-white/95 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="h-6 w-6 text-white/70" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-14 pr-5 py-4 text-lg bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-base font-semibold text-white/95 mb-3">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-white/70" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-14 py-4 text-lg bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-white/70 hover:text-white transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              {/* Submit Button - EXTRA LARGE */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 px-6 text-lg font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.03] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mt-8 border-2 border-white/30"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Premium Dashboard</span>
                    <span className="text-2xl">→</span>
                  </>
                )}
              </button>

              {/* Forgot Password */}
              <div className="text-center mt-6">
                <button
                  type="button"
                  className="text-base text-white/90 hover:text-white transition-colors font-medium hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </motion.form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleRegister} 
              className="space-y-4"
            >
              {/* First Row: Name + Email */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/95 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={registerData.first_name}
                    onChange={handleRegisterChange}
                    placeholder="Max"
                    className="w-full px-4 py-3 text-base bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/95 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={registerData.last_name}
                    onChange={handleRegisterChange}
                    placeholder="Mustermann"
                    className="w-full px-4 py-3 text-base bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/95 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/70" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="your@email.com"
                      className="w-full pl-12 pr-4 py-3 text-base bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Second Row: Company + Password + Confirm */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/95 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-white/70" />
                    </div>
                    <input
                      type="text"
                      name="tenant_name"
                      value={registerData.tenant_name}
                      onChange={handleRegisterChange}
                      placeholder="Your Company GmbH"
                      className="w-full pl-12 pr-4 py-3 text-base bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/95 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/70" />
                    </div>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 text-base bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/70 hover:text-white transition-colors"
                    >
                      {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/95 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/70" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 text-base bg-white/25 backdrop-blur-md border-2 border-white/40 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white/60 outline-none transition-all text-white placeholder-white/60 font-medium shadow-lg"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/70 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength - Compact */}
              {registerData.password && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 bg-white/15 backdrop-blur-lg rounded-xl border border-white/30"
                >
                  <span className="text-sm font-medium text-white/90">Strength:</span>
                  <div className="flex gap-1.5 flex-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                          passwordStrength.strength >= level
                            ? level >= 4 ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-white shadow-lg'
                            : level >= 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                            : 'bg-gradient-to-r from-red-400 to-pink-400'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-sm font-bold ${
                    passwordStrength.strength >= 4 ? 'text-pink-300' :
                    passwordStrength.strength >= 3 ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                    {passwordStrength.strength >= 4 ? 'STRONG' : passwordStrength.strength >= 3 ? 'GOOD' : 'WEAK'}
                  </span>
                </motion.div>
              )}

              {/* Submit Button - Pink/Purple/White Gradient */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 px-6 text-lg font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-white hover:from-pink-600 hover:via-purple-600 hover:to-pink-100 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.03] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mt-6 border-2 border-white/30"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Premium Account</span>
                    <span className="text-2xl">✨</span>
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-base text-white/80 font-medium">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-white font-bold hover:underline hover:text-white/95 transition-colors text-lg"
              >
                {mode === 'login' ? 'Create one now' : 'Sign in'}
              </button>
            </p>
          </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
