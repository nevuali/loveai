import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MessageCircle, Star, CreditCard } from 'lucide-react';
import { authService, User as AuthUser } from '../services/authService';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [profileData, setProfileData] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getProfile(user.id);
      setProfileData(data);
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '₺0';
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
          <h2 className="text-2xl font-bold text-slate-800">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : profileData ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-800">
                      {profileData.name} {profileData.surname || ''}
                    </h3>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      {profileData.isPremium ? (
                        <>
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          Premium Member
                        </>
                      ) : (
                        'Standard Member'
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-700">{profileData.email}</span>
                  </div>
                  
                  {profileData.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-sm text-slate-700">{profileData.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-700">
                      Member since: {formatDate(profileData.createdAt)}
                    </span>
                  </div>

                  {profileData.lastLogin && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-sm text-slate-700">
                        Last login: {formatDate(profileData.lastLogin)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {profileData.messageCount || 0}
                  </div>
                  <div className="text-sm text-slate-600">Messages</div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {profileData.reservationCount || 0}
                  </div>
                  <div className="text-sm text-slate-600">Bookings</div>
                </div>
              </div>

              {/* Spending Info */}
              {(profileData.totalSpent || 0) > 0 && (
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">Spending Summary</h4>
                  <div className="text-2xl font-bold text-slate-700">
                    {formatCurrency(profileData.totalSpent)}
                  </div>
                  <div className="text-sm text-slate-600">Total Spent</div>
                </div>
              )}

              {/* Message Limits */}
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4">
                <h4 className="font-semibold text-slate-800 mb-3">Message Usage</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Current Limit:</span>
                    <span className="text-sm font-medium text-slate-800">
                      {profileData.isPremium ? '1000 messages' : '50 messages'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Used:</span>
                    <span className="text-sm font-medium text-slate-800">
                      {profileData.messageCount || 0} messages
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-slate-600 to-slate-800 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, ((profileData.messageCount || 0) / (profileData.isPremium ? 1000 : 50)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Premium Upgrade */}
              {!profileData.isPremium && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Star className="w-5 h-5 text-slate-600" />
                    <h4 className="font-semibold text-slate-800">Upgrade to Premium</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Get 1000 message limit and exclusive features with Premium membership!
                  </p>
                  <button className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3 px-4 rounded-xl font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-sm">
                    Upgrade to Premium (Coming Soon)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Unable to load profile information.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 