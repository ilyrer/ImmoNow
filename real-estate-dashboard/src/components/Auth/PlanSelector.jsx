import React from 'react';
import { motion } from 'framer-motion';
import { usePlans } from '../../api/hooks';

const PlanSelector = ({ value, onChange }) => {
  const { data, isLoading } = usePlans();
  
  const plans = (data?.plans || []).map(p => ({
    id: p.id,
    name: p.id.charAt(0).toUpperCase() + p.id.slice(1),
    price: (p.price_cents/100).toFixed(2),
    features: p.features || [],
    popular: p.id === 'professional',
    recommended: p.id === 'professional',
    icon: p.id === 'basic' ? '🌟' : p.id === 'professional' ? '💎' : '⚡',
    gradient: p.id === 'basic' ? 'from-emerald-500 via-teal-500 to-cyan-500' : 
              p.id === 'professional' ? 'from-purple-500 via-pink-500 to-rose-500' : 
              'from-orange-500 via-red-500 to-pink-500',
    description: p.id === 'basic' ? 'Perfect for small teams getting started' :
                 p.id === 'professional' ? 'Ideal for growing businesses' :
                 'Complete solution for large organizations'
  }));

  if (isLoading) return (
    <div className="text-sm text-purple-300/70 flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full mr-3"
      />
      <span className="font-medium">Loading premium plans...</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {plans.map((plan, index) => {
        const active = value === plan.id;
        return (
          <motion.div
            key={plan.id}
            className="relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1, 
              duration: 0.6, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
          >
            {plan.recommended && (
              <motion.div 
                className="absolute -top-3 left-6 z-20"
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", delay: 0.4 + index * 0.1, stiffness: 200 }}
              >
                <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center space-x-2">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    ⭐
                  </motion.span>
                  <span className="tracking-wide">RECOMMENDED</span>
                </div>
              </motion.div>
            )}

            <motion.button
              type="button"
              onClick={() => onChange(plan.id)}
              className={`group relative w-full text-left overflow-hidden rounded-2xl border-2 transition-all duration-500 focus:outline-none ${
                active 
                  ? `border-white/40 bg-gradient-to-br ${plan.gradient} shadow-2xl scale-[1.02]` 
                  : 'border-white/20 bg-white/8 hover:border-white/30 hover:bg-white/12 hover:shadow-xl hover:shadow-purple-500/10'
              }`}
              whileHover={{ 
                scale: active ? 1.02 : 1.01,
                y: -4
              }}
              whileTap={{ scale: 0.98 }}
            >
              {active && (
                <>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10"
                    animate={{
                      background: [
                        'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                        'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
                        'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ translateX: ['0%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </>
              )}

              <div className={`relative z-10 p-6 ${active ? 'text-white' : 'text-white'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg ${
                        active 
                          ? 'bg-white/25 border border-white/40' 
                          : `bg-gradient-to-r ${plan.gradient}`
                      }`}
                      animate={active ? { 
                        scale: [1, 1.1, 1],
                        rotateY: [0, 10, 0]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-2xl">{plan.icon}</span>
                    </motion.div>
                    
                    <div>
                      <h4 className={`text-2xl font-bold mb-1 ${active ? 'text-white' : 'text-white'}`}>
                        {plan.name}
                      </h4>
                      <p className={`text-sm ${active ? 'text-white/80' : 'text-purple-200/70'}`}>
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <motion.div 
                      className={`flex items-baseline justify-end ${active ? 'text-white' : 'text-white'}`}
                      animate={active ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className={`text-xl font-medium ${active ? 'text-white/70' : 'text-purple-300/70'}`}>€</span>
                      <span className="text-4xl font-black ml-1">{plan.price}</span>
                    </motion.div>
                    <div className={`text-sm font-medium ${active ? 'text-white/60' : 'text-purple-300/60'}`}>
                      per month
                    </div>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="grid grid-cols-1 gap-3">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <motion.div
                        key={feature}
                        className={`flex items-center space-x-3 text-sm ${active ? 'text-white/90' : 'text-purple-200/80'}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <motion.div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            active 
                              ? 'bg-white/25 border border-white/40' 
                              : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          }`}
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </motion.div>
                        <span className="font-medium">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.button>
          </motion.div>
        );
      })}
      
      <motion.div 
        className="text-center mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center justify-center space-x-2 text-sm text-purple-200/70">
          <span>✨</span>
          <span>30-day money-back guarantee • Cancel anytime</span>
          <span>💎</span>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanSelector;
