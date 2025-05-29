import React, { useState } from 'react';
import { X, CreditCard, Check, Crown, Heart, Star, Users, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = 'pro';

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'Forever',
      icon: Heart,
      popular: false,
      features: [
        '5 AI conversations per day',
        'Basic destination suggestions',
        'Email support',
        'Standard planning tools'
      ]
    },
    {
      id: 'pro',
      name: 'PRO',
      price: '$19.99',
      period: 'per month',
      icon: Crown,
      popular: true,
      features: [
        'Unlimited AI conversations',
        'Premium destination recommendations',
        'Personalized itinerary creation',
        'Advanced budget planning',
        'Priority customer support',
        'Early access to new features'
      ]
    },
    {
      id: 'wedding-consultant',
      name: 'Wedding Consultant',
      price: '$100',
      period: 'One-time',
      icon: Users,
      special: true,
      features: [
        'Personal AI Wedding Consultant',
        'Complete wedding planning experience',
        'Exclusive bridal assistant interface',
        'Personalized wedding timeline',
        'Vendor recommendations',
        'Stress-free planning companion'
      ]
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (planId === 'wedding-consultant') {
      const confirmed = window.confirm(
        'You will be redirected to our exclusive Wedding Consultant experience.\n\nReady to start your wedding planning journey?'
      );
      
      if (confirmed) {
        toast({
          title: "Welcome to Wedding Consultant! 💒",
          description: "Redirecting you to your personal bridal experience...",
        });
        console.log('Redirecting to wedding consultant site...');
        onClose();
        return;
      } else {
        return;
      }
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Subscription Updated!",
        description: `Welcome to ${plans.find(p => p.id === planId)?.name}!`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You\'ll lose access to premium features at the end of your billing period.'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of your billing period",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-gemini">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#1f1f1f] glass-elevated rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 sidebar-header-glow border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-gradient rounded-xl sidebar-icon-glow">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white glow-text">
                Subscription Management
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 sidebar-glow min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/60 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Current Plan Status */}
        <div className="p-6 border-b border-white/10">
          <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg sidebar-icon-glow">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white glow-text mb-1">
                    AI LOVE PRO
                  </h3>
                  <p className="text-sm text-gray-400">
                    Renews January 15, 2025 • $19.99/month
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-gray-400 hover:text-red-400 transition-all duration-200 hover:scale-105 disabled:opacity-50 min-h-[44px] rounded-xl hover:bg-red-500/10"
              >
                {isLoading ? 'Processing...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-white glow-text mb-2">
              Choose Your Perfect Plan
            </h3>
            <p className="text-gray-400">
              Unlock the full potential of AI-powered honeymoon planning
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === currentPlan;
              
              return (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-105 glass-card ${
                    plan.special
                      ? 'border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10 sidebar-glow'
                      : plan.popular 
                      ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 sidebar-glow' 
                      : isCurrentPlan
                      ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {/* Popular/Special Badge */}
                  {(plan.popular || plan.special) && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold ${
                      plan.special 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    } flex items-center gap-1`}>
                      {plan.special ? (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Special Offer
                        </>
                      ) : (
                        <>
                          <Star className="w-3 h-3" />
                          Most Popular
                        </>
                      )}
                    </div>
                  )}

                  {/* Plan Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                      plan.special 
                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 sidebar-icon-glow'
                        : plan.popular
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 sidebar-icon-glow'
                        : isCurrentPlan
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Plan Name */}
                  <h4 className="text-xl font-semibold text-white text-center mb-2 glow-text">
                    {plan.name}
                  </h4>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <span className="text-3xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      {plan.period}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.special || plan.popular
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-green-500'
                        }`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-300 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading || isCurrentPlan}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 min-h-[48px] ${
                      isCurrentPlan
                        ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                        : plan.special
                        ? 'luxury-button text-white hover:scale-105 shadow-lg'
                        : plan.popular
                        ? 'btn-primary text-white hover:scale-105 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 border border-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-white glow-text mb-2">
                Why Choose AI LOVE Premium?
              </h4>
              <p className="text-gray-400 text-sm">
                Experience the ultimate in AI-powered romance planning
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sidebar-icon-glow">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h5 className="font-semibold text-white mb-2">Personalized Experience</h5>
                <p className="text-gray-400 text-sm">
                  AI that learns your preferences for perfect recommendations
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sidebar-icon-glow">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h5 className="font-semibold text-white mb-2">Trusted Platform</h5>
                <p className="text-gray-400 text-sm">
                  Secure, reliable service with 24/7 customer support
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sidebar-icon-glow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h5 className="font-semibold text-white mb-2">Premium Features</h5>
                <p className="text-gray-400 text-sm">
                  Access to exclusive tools and advanced planning capabilities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal; 