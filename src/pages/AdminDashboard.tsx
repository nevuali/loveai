import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Eye, Upload, Save, BarChart3, Users, Package as PackageIcon, 
  Search, Filter, CheckSquare, Square, Settings, Bell, LogOut, Menu, X,
  TrendingUp, DollarSign, Activity, Calendar, Star, Heart, MapPin, Clock,
  ArrowUpRight, ArrowDownRight, MoreVertical, Sparkles, Crown, Shield, Ban, CheckCircle, Bot
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { toast } from 'sonner';
import { packageService } from '../services/packageService';
import { userService } from '../services/userService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import UserManagement from '../components/admin/UserManagement';
import UserProfileAnalytics from '../components/admin/UserProfileAnalytics';
import AISystemsDashboard from '../components/admin/AISystemsDashboard';

// Using Package interface from firestore types instead
import { Package, CreatePackageData } from '../types/firestore';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError, userRole } = useAdmin();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalPackages: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    packageStats: null as any,
    userStats: null as any
  });

  const emptyPackage = {
    title: '',
    description: '',
    longDescription: '',
    location: '',
    country: '',
    region: '',
    duration: 7,
    price: 0,
    originalPrice: 0,
    currency: 'USD',
    category: 'romantic' as const,
    subcategory: '',
    features: [],
    inclusions: [],
    exclusions: [],
    highlights: [],
    images: [],
    itinerary: [],
    accommodation: [],
    transportation: [],
    seasonality: [],
    bestTime: [],
    maxGuests: 2,
    difficulty: 'easy' as const,
    tags: [],
    seoData: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    }
  };

  const [formData, setFormData] = useState(emptyPackage);

  // Always call all hooks before any conditional returns
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const matchesSearch = pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pkg.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || pkg.category === categoryFilter;
      const matchesAvailability = availabilityFilter === 'all' || 
                                 (availabilityFilter === 'available' && pkg.availability) ||
                                 (availabilityFilter === 'unavailable' && !pkg.availability);
      
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [packages, searchTerm, categoryFilter, availabilityFilter]);

  useEffect(() => {
    if (isAdmin && !adminLoading) {
      loadDashboardData();
    }
  }, [isAdmin, adminLoading]);

  // Check admin permissions after all hooks
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Checking permissions...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            Return to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel for better performance
      const [packagesData, packageStats, userStats] = await Promise.all([
        packageService.getAllPackagesForAdmin(),
        packageService.getPackageStats(),
        userService.getUserStats()
      ]);
      
      setPackages(packagesData);
      setDashboardStats({
        totalPackages: packageStats.totalPackages,
        totalUsers: userStats.totalUsers,
        totalRevenue: userStats.totalRevenue,
        totalBookings: packageStats.totalBookings,
        packageStats,
        userStats
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const result = await packageService.getAllPackagesForAdmin();
      setPackages(result);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await packageService.updatePackage(editingPackage.id, formData);
        toast.success('Package updated successfully');
      } else {
        await packageService.createPackage(formData, user?.uid || 'admin');
        toast.success('Package created successfully');
      }
      
      setShowForm(false);
      setEditingPackage(null);
      setFormData(emptyPackage);
      loadDashboardData();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      ...pkg,
      originalPrice: pkg.originalPrice || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    
    try {
      await packageService.deletePackage(id);
      toast.success('Package deleted successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPackages.length === 0) {
      toast.error('No packages selected');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedPackages.length} packages?`)) return;
    
    try {
      await Promise.all(selectedPackages.map(id => packageService.deletePackage(id)));
      toast.success(`${selectedPackages.length} packages deleted successfully`);
      setSelectedPackages([]);
      loadDashboardData();
    } catch (error) {
      console.error('Error bulk deleting packages:', error);
      toast.error('Failed to delete packages');
    }
  };

  const handleBulkAvailability = async (availability: boolean) => {
    if (selectedPackages.length === 0) {
      toast.error('No packages selected');
      return;
    }
    
    try {
      await Promise.all(selectedPackages.map(id => 
        packageService.updatePackage(id, { availability })
      ));
      toast.success(`${selectedPackages.length} packages updated successfully`);
      setSelectedPackages([]);
      loadDashboardData();
    } catch (error) {
      console.error('Error updating packages:', error);
      toast.error('Failed to update packages');
    }
  };

  const togglePackageSelection = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedPackages(prev => 
      prev.length === filteredPackages.length ? [] : filteredPackages.map(pkg => pkg.id)
    );
  };

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'A';
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'ai-systems', label: 'AI Systems', icon: Bot },
    { id: 'packages', label: 'Packages', icon: PackageIcon },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'test-center', label: 'Test Center', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      {/* Golden Glassmorphism Sidebar - Enhanced Design */}
      <motion.div 
        className={`fixed left-0 top-0 h-full glass-card backdrop-blur-3xl z-50 transition-all duration-500 ${
          sidebarOpen ? 'w-80' : 'w-20'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(184, 134, 11, 0.12) 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '25px 0 50px -12px rgba(0, 0, 0, 0.4), inset 1px 0 1px rgba(255, 255, 255, 0.1)'
        }}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#d4af37]/10 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#d4af37]/10 to-transparent"></div>
        </div>

        <div className="relative flex flex-col h-full">
          {/* Clean Logo Section */}
          <div className={`${sidebarOpen ? 'p-6' : 'py-6 px-2'} ${sidebarOpen ? 'border-b border-white/5' : ''}`}>
            {sidebarOpen ? (
              // Açık sidebar - Logo ve menü yan yana
              <div className="flex items-center justify-between">
                <motion.div 
                  className="flex items-center gap-3"
                  layout
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#b8860b] rounded-2xl flex items-center justify-center shadow-lg">
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#d4af37] rounded-full border border-white animate-pulse"></div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col"
                  >
                    <h1 className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
                      AI LOVVE
                    </h1>
                    <p className="text-xs text-secondary">Admin Panel</p>
                  </motion.div>
                </motion.div>
                
                {/* Menü butonu - sadece açık halde */}
                <motion.button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-xl border border-white/10 hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 transition-all duration-200 flex items-center justify-center backdrop-blur-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu className="w-4 h-4 text-[#d4af37]" />
                </motion.button>
              </div>
            ) : (
              // Kapalı sidebar - Sadece logo merkezde
              <div className="flex justify-center">
                <motion.button
                  onClick={() => setSidebarOpen(true)}
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#b8860b] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#d4af37] rounded-full border border-white animate-pulse"></div>
                </motion.button>
              </div>
            )}
          </div>

          {/* Clean Navigation Menu */}
          <nav className={`flex-1 ${sidebarOpen ? 'p-6' : 'p-3'} space-y-2 overflow-y-auto scrollbar-hide`}>
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'gap-3 p-3' : 'justify-center p-2'} rounded-xl transition-all duration-200 relative group ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white shadow-lg' 
                      : 'hover:bg-[#d4af37]/10 text-primary'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Simple active indicator - Sadece sidebar açıkken */}
                  {isActive && sidebarOpen && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                  )}
                  
                  {/* Icon */}
                  <div className={`${sidebarOpen ? 'w-8 h-8' : 'w-12 h-12'} rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? (sidebarOpen ? '' : 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] shadow-lg') : ''
                  }`}>
                    <Icon className={`${sidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-white' : 'text-[#d4af37]'} transition-colors duration-200`} />
                  </div>
                  
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 text-left"
                      >
                        <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-primary group-hover:text-[#d4af37]'} transition-colors duration-200`}>
                          {item.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Simple tooltip for collapsed state */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Clean User Profile Section */}
          <div className={`${sidebarOpen ? 'p-6' : 'p-3'} border-t border-white/5`}>
            {sidebarOpen ? (
              // Açık sidebar - Profil ve çıkış yan yana
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#b8860b] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {getUserInitial()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#d4af37] rounded-full border border-white flex items-center justify-center">
                    <Crown className="w-2 h-2 text-white" />
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold text-primary truncate">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-secondary">Admin</p>
                </motion.div>
                <motion.button
                  onClick={logout}
                  className="w-8 h-8 rounded-lg border border-white/10 hover:border-red-400/30 hover:bg-red-500/10 transition-all duration-200 flex items-center justify-center"
                  title="Çıkış Yap"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                </motion.button>
              </div>
            ) : (
              // Kapalı sidebar - Sadece profil merkezde
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#b8860b] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {getUserInitial()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#d4af37] rounded-full border border-white flex items-center justify-center">
                    <Crown className="w-2 h-2 text-white" />
                  </div>
                </div>
                <motion.button
                  onClick={logout}
                  className="w-8 h-8 rounded-lg border border-white/10 hover:border-red-400/30 hover:bg-red-500/10 transition-all duration-200 flex items-center justify-center"
                  title="Çıkış Yap"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`transition-all duration-500 ${sidebarOpen ? 'ml-80' : 'ml-20'}`}>
        {/* Golden Header */}
        <motion.header 
          className="glass-card border-b border-white/10 backdrop-blur-xl p-8 rounded-none"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                                  <h2 className="text-4xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent capitalize">
                  {activeTab}
                </h2>
                {activeTab === 'overview' && <div className="w-3 h-3 bg-[#d4af37] rounded-full animate-pulse"></div>}
                </div>
                <p className="text-secondary text-lg font-medium">
                  {activeTab === 'overview' && '📊 Complete overview of your AI LOVVE platform'}
                  {activeTab === 'analytics' && '📈 Deep insights and performance metrics'}
                  {activeTab === 'ai-systems' && '🤖 Advanced AI engine monitoring and control'}
                  {activeTab === 'packages' && '📦 Comprehensive honeymoon package management'}
                  {activeTab === 'users' && '👥 Advanced user management and analytics'}
                  {activeTab === 'settings' && '⚙️ System configuration and preferences'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Golden Notification Bell */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button 
                  className="relative glass-card border border-white/10 hover:border-[#d4af37]/30 rounded-2xl p-3 transition-all duration-200 backdrop-blur-xl"
                >
                  <Bell className="w-5 h-5 text-[#d4af37]" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-full text-xs text-white flex items-center justify-center animate-pulse">3</span>
                </button>
              </motion.div>
              
              {/* Quick Actions */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button 
                  className="sidebar-newchat-btn-half"
                  onClick={() => setActiveTab('packages')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add
                </button>
              </motion.div>
              
              {/* Date & Time */}
              <div className="text-right glass-card backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                <p className="text-sm font-bold text-primary">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-secondary font-medium">
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Enhanced Content Area */}
        <motion.main 
          className="p-8 min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      label: 'Total Packages', 
                      value: dashboardStats.totalPackages, 
                      icon: PackageIcon, 
                      change: dashboardStats.packageStats ? `+${Math.round(dashboardStats.packageStats.publishedPackages / dashboardStats.totalPackages * 100)}%` : '+0%'
                    },
                    { 
                      label: 'Active Users', 
                      value: dashboardStats.totalUsers.toLocaleString(), 
                      icon: Users, 
                      change: dashboardStats.userStats ? `+${dashboardStats.userStats.newUsersThisMonth}` : '+0'
                    },
                    { 
                      label: 'Revenue', 
                      value: `$${dashboardStats.totalRevenue.toLocaleString()}`, 
                      icon: DollarSign, 
                      change: dashboardStats.userStats ? `$${Math.round(dashboardStats.userStats.averageSpentPerUser)}` : '$0' + ' avg'
                    },
                    { 
                      label: 'Total Bookings', 
                      value: dashboardStats.totalBookings, 
                      icon: Calendar, 
                      change: dashboardStats.packageStats ? `${dashboardStats.packageStats.totalViews} views` : '0 views'
                    },
                  ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                      >
                        <div className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300 group hover:-translate-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-secondary mb-1">{stat.label}</p>
                              <p className="text-3xl font-bold text-primary mb-2">{stat.value}</p>
                              <div className="flex items-center">
                                <ArrowUpRight className="w-4 h-4 text-[#d4af37] mr-1" />
                                <span className="text-sm text-[#d4af37] font-medium">{stat.change}</span>
                                <span className="text-xs text-secondary ml-2">vs last month</span>
                              </div>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg">
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Enhanced Recent Activity */}
                <div className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300">
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-2xl flex items-center justify-center shadow-lg">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-primary">Recent Activity</h3>
                          <p className="text-sm text-secondary">Latest system events and updates</p>
                        </div>
                      </div>
                      <button className="sidebar-newchat-btn-half text-sm px-4 py-2">
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="space-y-4">
                      {packages.slice(0, 4).map((pkg, index) => {
                        const activities = [
                          { action: 'Package created', item: pkg.title, time: pkg.createdAt ? new Date(pkg.createdAt.toDate()).toLocaleDateString() : 'Recently', type: 'create' },
                          { action: 'Package viewed', item: `${pkg.views || 0} times`, time: 'Today', type: 'view' },
                          { action: 'Package updated', item: pkg.title, time: pkg.updatedAt ? new Date(pkg.updatedAt.toDate()).toLocaleDateString() : 'Recently', type: 'update' },
                        ];
                        const activity = activities[index % activities.length];
                        return (
                          <motion.div 
                            key={`${pkg.id}-${index}`} 
                            className="flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/10 hover:border-[#d4af37]/30 hover:-translate-y-1 transition-all duration-300 group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ x: 4 }}
                          >
                            <div className={`w-4 h-4 rounded-full ${
                              activity.type === 'create' ? 'bg-[#d4af37]' :
                              activity.type === 'update' ? 'bg-[#b8860b]' :
                              activity.type === 'view' ? 'bg-[#daa520]' : 'bg-[#ffd700]'
                            } shadow-lg group-hover:scale-110 transition-transform duration-200`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-primary group-hover:text-primary">{activity.action}</p>
                              <p className="text-sm text-secondary truncate">{activity.item}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-secondary font-medium">{activity.time}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                      {packages.length === 0 && (
                        <div className="text-center py-8">
                          <Activity className="w-8 h-8 mx-auto text-secondary mb-2" />
                          <p className="text-secondary">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AnalyticsDashboard />
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Tabs defaultValue="management" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="management">Kullanıcı Yönetimi</TabsTrigger>
                    <TabsTrigger value="analytics">Profil Analizi</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="management">
                    <UserManagement />
                  </TabsContent>
                  
                  <TabsContent value="analytics">
                    <UserProfileAnalytics />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {activeTab === 'ai-systems' && (
              <motion.div
                key="ai-systems"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AISystemsDashboard />
              </motion.div>
            )}

            {activeTab === 'packages' && (
              <motion.div
                key="packages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Golden Package Management Header */}
                <div className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xl font-semibold text-primary">
                        <PackageIcon className="w-5 h-5 text-[#d4af37]" />
                        Package Management
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setEditingPackage(null);
                            setFormData(emptyPackage);
                            setShowForm(true);
                          }}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Package
                        </Button>
                        <Button 
                          onClick={() => {
                            setEditingPackage(null);
                            setFormData({
                              ...emptyPackage,
                              title: "Romantic Paris Getaway",
                              description: "A magical 5-day romantic escape to the City of Love with luxury accommodations and intimate experiences.",
                              location: "Paris",
                              country: "France",
                              duration: 5,
                              price: 2800,
                              originalPrice: 3200,
                              category: "romantic",
                              features: ["Luxury Hotel", "Private Tours", "Fine Dining", "River Cruise"],
                              inclusions: ["5-star accommodation", "All meals", "Private transportation", "Tour guide"],
                              tags: ["romantic", "luxury", "city", "culture", "food"]
                            });
                            setShowForm(true);
                          }}
                          variant="outline"
                          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Add Sample Package
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    {/* Golden Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex-1 min-w-64">
                        <Input
                          placeholder="Search packages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl"
                        />
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-48 glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="romantic">Romantic</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="beach">Beach</SelectItem>
                          <SelectItem value="city">City</SelectItem>
                          <SelectItem value="mountain">Mountain</SelectItem>
                          <SelectItem value="safari">Safari</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                        <SelectTrigger className="w-48 glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Golden Bulk Actions */}
                    {selectedPackages.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-4 glass-card rounded-xl mb-6 border border-white/10 backdrop-blur-xl"
                      >
                        <span className="text-sm font-medium text-[#d4af37]">
                          {selectedPackages.length} package(s) selected
                        </span>
                        <button 
                          onClick={() => handleBulkAvailability(true)}
                          className="sidebar-newchat-btn-half text-sm px-4 py-2"
                        >
                          Mark Available
                        </button>
                        <button 
                          onClick={() => handleBulkAvailability(false)}
                          className="glass-card rounded-xl px-4 py-2 text-sm border border-white/10 hover:border-orange-400/30 text-orange-400 backdrop-blur-xl transition-all duration-200"
                        >
                          Mark Unavailable
                        </button>
                        <button 
                          onClick={handleBulkDelete}
                          className="glass-card rounded-xl px-4 py-2 text-sm border border-white/10 hover:border-red-400/30 text-red-400 backdrop-blur-xl transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </motion.div>
                    )}

                    {/* Package Grid */}
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Golden Select All */}
                        <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                          <button onClick={toggleSelectAll} className="flex items-center gap-2">
                            {selectedPackages.length === filteredPackages.length && filteredPackages.length > 0 ? (
                              <CheckSquare className="w-5 h-5 text-[#d4af37]" />
                            ) : (
                              <Square className="w-5 h-5 text-secondary" />
                            )}
                            <span className="text-sm text-secondary">
                              Select All ({filteredPackages.length} packages)
                            </span>
                          </button>
                        </div>

                        {/* Package List */}
                        <div className="grid grid-cols-1 gap-4">
                          {filteredPackages.map((pkg, index) => (
                            <motion.div
                              key={pkg.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`glass-card rounded-2xl backdrop-blur-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                                selectedPackages.includes(pkg.id) 
                                  ? 'border-[#d4af37]/50 bg-[#d4af37]/5' 
                                  : 'border-white/10 hover:border-[#d4af37]/30'
                              }`}
                            >
                              <div className="p-6">
                                <div className="flex items-start gap-4">
                                  <button
                                    onClick={() => togglePackageSelection(pkg.id)}
                                    className="mt-1"
                                  >
                                    {selectedPackages.includes(pkg.id) ? (
                                      <CheckSquare className="w-5 h-5 text-[#d4af37]" />
                                    ) : (
                                      <Square className="w-5 h-5 text-secondary hover:text-[#d4af37]" />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                          <h3 className="text-lg font-semibold text-primary flex-1 mr-4">{pkg.title}</h3>
                                          {pkg.isPromoted && (
                                            <Badge className="bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white">
                                              <Crown className="w-3 h-3 mr-1" />
                                              Promoted
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-secondary mb-3">
                                          <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {pkg.location}, {pkg.country}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {pkg.duration} days
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <DollarSign className="w-4 h-4" />
                                            {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
                                              <>
                                                <span className="line-through text-gray-400">${pkg.originalPrice}</span>
                                                <span className="font-semibold text-green-600">${pkg.price}</span>
                                              </>
                                            ) : (
                                              <span>${pkg.price}</span>
                                            )}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            {pkg.views || 0} views
                                          </span>
                                        </div>
                                        <p className="text-secondary line-clamp-2 mb-3">{pkg.description}</p>
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            className={pkg.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                          >
                                            {pkg.availability ? 'Available' : 'Unavailable'}
                                          </Badge>
                                          <Badge className="glass-card border-white/10 text-[#d4af37] capitalize backdrop-blur-xl">
                                            {pkg.category}
                                          </Badge>
                                          <div className="flex items-center gap-1 text-sm text-secondary">
                                            <Star className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                                            {pkg.rating || 0}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={() => {
                                            // Open package in new tab to preview
                                            window.open(`/package/${pkg.id}`, '_blank');
                                          }}
                                          className="w-8 h-8 rounded-lg glass-card border border-white/10 hover:border-[#d4af37]/30 flex items-center justify-center transition-colors backdrop-blur-xl"
                                          title="Preview Package"
                                        >
                                          <Eye className="w-4 h-4 text-[#d4af37]" />
                                        </button>
                                        <button
                                          onClick={() => handleEdit(pkg)}
                                          className="w-8 h-8 rounded-lg glass-card border border-white/10 hover:border-blue-400/30 flex items-center justify-center transition-colors backdrop-blur-xl"
                                          title="Edit Package"
                                        >
                                          <Edit className="w-4 h-4 text-blue-400" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            packageService.togglePackageAvailability(pkg.id, !pkg.availability);
                                            toast.success(`Package ${!pkg.availability ? 'enabled' : 'disabled'}`);
                                            loadDashboardData();
                                          }}
                                          className={`w-8 h-8 rounded-lg glass-card border border-white/10 flex items-center justify-center transition-colors backdrop-blur-xl ${pkg.availability ? 
                                            "hover:border-red-400/30" : 
                                            "hover:border-green-400/30"
                                          }`}
                                          title={pkg.availability ? "Disable Package" : "Enable Package"}
                                        >
                                          {pkg.availability ? 
                                            <Ban className="w-4 h-4 text-red-400" /> : 
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                          }
                                        </button>
                                        <button
                                          onClick={() => handleDelete(pkg.id)}
                                          className="w-8 h-8 rounded-lg glass-card border border-white/10 hover:border-red-400/30 flex items-center justify-center transition-colors backdrop-blur-xl"
                                          title="Delete Package"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {filteredPackages.length === 0 && (
                          <div className="text-center py-12">
                            <PackageIcon className="w-12 h-12 mx-auto text-[#d4af37] mb-4" />
                            <h3 className="text-lg font-medium text-primary mb-2">No packages found</h3>
                            <p className="text-secondary">Try adjusting your search or filter criteria.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'test-center' && (
              <motion.div
                key="test-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-2xl flex items-center justify-center shadow-lg">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-primary">Test Center</h3>
                          <p className="text-sm text-secondary">Development and testing tools</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-200">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-lg">🧪</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Personality Test</h4>
                          <p className="text-sm text-gray-600 mb-4">Test the personality onboarding system</p>
                          <button 
                            onClick={() => window.open('/test/personality', '_blank')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Open Test
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-green-50 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-200">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-lg">🤖</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">AI Responses</h4>
                          <p className="text-sm text-gray-600 mb-4">Test AI personality responses</p>
                          <button 
                            onClick={() => {
                              console.log('AI Test not implemented yet');
                              toast.info('AI Test coming soon');
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Test AI
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-200">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-lg">📊</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
                          <p className="text-sm text-gray-600 mb-4">Test user analytics tracking</p>
                          <button 
                            onClick={() => {
                              console.log('Analytics Test not implemented yet');
                              toast.info('Analytics Test coming soon');
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Test Analytics
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <h4 className="font-semibold text-amber-800 mb-2">Development Notes</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Personality test opens in new tab for isolated testing</li>
                        <li>• Test results are saved to browser console</li>
                        <li>• Use browser dev tools to inspect personality profiles</li>
                        <li>• Reset onboarding status from browser localStorage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Golden Application Settings */}
                <div className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300">
                  <div className="p-6 pb-4">
                    <h3 className="flex items-center gap-2 text-xl font-semibold text-primary">
                      <Settings className="w-5 h-5 text-[#d4af37]" />
                      Application Settings
                    </h3>
                  </div>
                  <div className="p-6 pt-0 space-y-6">
                    {/* General Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">General Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Application Name</label>
                          <Input defaultValue="AI LOVVE" className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Support Email</label>
                          <Input defaultValue="support@ailovve.com" className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Default Language</label>
                          <Select defaultValue="en">
                            <SelectTrigger className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="tr">Türkçe</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Default Currency</label>
                          <Select defaultValue="USD">
                            <SelectTrigger className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="TRY">TRY (₺)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">Feature Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-white/10 backdrop-blur-xl">
                          <div>
                            <h4 className="font-medium text-primary">Enable Package Bookings</h4>
                            <p className="text-sm text-secondary">Allow users to book packages directly</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-[#d4af37]/20 cursor-pointer"></label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-white/10 backdrop-blur-xl">
                          <div>
                            <h4 className="font-medium text-primary">AI Chat Assistant</h4>
                            <p className="text-sm text-secondary">Enable AI-powered chat for customer support</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-[#d4af37]/20 cursor-pointer"></label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-white/10 backdrop-blur-xl">
                          <div>
                            <h4 className="font-medium text-primary">Email Notifications</h4>
                            <p className="text-sm text-secondary">Send email notifications to users</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-[#d4af37]/20 cursor-pointer"></label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-white/10 backdrop-blur-xl">
                          <div>
                            <h4 className="font-medium text-primary">Analytics Tracking</h4>
                            <p className="text-sm text-secondary">Collect user behavior data for analytics</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-[#d4af37]/20 cursor-pointer"></label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* API Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">API & Integration Settings</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Gemini API Key</label>
                          <Input type="password" placeholder="Enter your Gemini API key" className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Firebase Project ID</label>
                          <Input defaultValue="ai-lovve-project" className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">Analytics Provider</label>
                          <Select defaultValue="firebase">
                            <SelectTrigger className="glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
                              <SelectItem value="firebase">Firebase Analytics</SelectItem>
                              <SelectItem value="google">Google Analytics</SelectItem>
                              <SelectItem value="mixpanel">Mixpanel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Save Section */}
                    <div className="flex items-center justify-between pt-8 border-t border-white/10">
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
                        <span>All changes are saved automatically</span>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          className="rounded-xl border-gray-200 hover:bg-gray-50"
                          onClick={() => {
                            // Reset to defaults
                            toast.info('Settings reset to defaults');
                          }}
                        >
                          Reset to Defaults
                        </Button>
                        <Button 
                          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 rounded-xl px-6 py-3 font-semibold shadow-lg"
                          onClick={() => {
                            toast.success('All settings saved successfully!', {
                              description: 'Your preferences have been updated across the system.'
                            });
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save All Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Golden System Status */}
                <div className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300">
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-2xl flex items-center justify-center shadow-lg">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-primary">System Health</h3>
                          <p className="text-sm text-secondary">Real-time service monitoring</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#d4af37]/10 to-[#b8860b]/10 rounded-full border border-[#d4af37]/20">
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-[#d4af37]">All Systems Go</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { name: 'Firebase Database', status: 'Operational', uptime: '99.9%', response: '45ms' },
                        { name: 'API Services', status: 'Operational', uptime: '99.8%', response: '120ms' },
                        { name: 'AI Chat Service', status: 'Operational', uptime: '99.7%', response: '200ms' }
                      ].map((service, index) => (
                        <motion.div 
                          key={service.name}
                          className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 hover:shadow-lg transition-all duration-200"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                              <p className="font-bold text-gray-900">{service.name}</p>
                            </div>
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                              {service.status}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Uptime</span>
                              <span className="font-semibold text-gray-900">{service.uptime}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Response</span>
                              <span className="font-semibold text-gray-900">{service.response}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Additional System Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <p className="text-sm text-gray-600">Server Load</p>
                          <p className="text-lg font-bold text-blue-600">23%</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <p className="text-sm text-gray-600">Memory Usage</p>
                          <p className="text-lg font-bold text-purple-600">67%</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <p className="text-sm text-gray-600">Storage</p>
                          <p className="text-lg font-bold text-orange-600">45%</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl">
                          <p className="text-sm text-gray-600">Bandwidth</p>
                          <p className="text-lg font-bold text-indigo-600">12%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      </div>

      {/* Package Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingPackage ? 'Edit Package' : 'Create New Package'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPackage(null);
                      setFormData(emptyPackage);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Package Title *</label>
                      <Input
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Romantic Paris Getaway"
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                      <Input
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Paris"
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                      <Input
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="e.g., France"
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                      <Input
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        placeholder="e.g., Europe"
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Short Description *</label>
                    <Textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description for package cards (max 200 characters)"
                      rows={2}
                      maxLength={200}
                      className="border-gray-200 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
                    <Textarea
                      value={formData.longDescription}
                      onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                      placeholder="Detailed description for package details page"
                      rows={4}
                      className="border-gray-200 focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days) *</label>
                      <Input
                        type="number"
                        required
                        min="1"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                      <Input
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Original Price ($)</label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: parseInt(e.target.value) || 0 })}
                        placeholder="For discount display"
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.maxGuests}
                        onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 2 })}
                        className="border-gray-200 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luxury">💎 Luxury</SelectItem>
                          <SelectItem value="adventure">🏔️ Adventure</SelectItem>
                          <SelectItem value="romantic">💕 Romantic</SelectItem>
                          <SelectItem value="cultural">🏛️ Cultural</SelectItem>
                          <SelectItem value="beach">🏖️ Beach</SelectItem>
                          <SelectItem value="city">🏙️ City</SelectItem>
                          <SelectItem value="mountain">⛰️ Mountain</SelectItem>
                          <SelectItem value="safari">🦁 Safari</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <Select value={formData.difficulty} onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}>
                        <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">🟢 Easy</SelectItem>
                          <SelectItem value="moderate">🟡 Moderate</SelectItem>
                          <SelectItem value="challenging">🔴 Challenging</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <Select value={formData.currency} onValueChange={(value: any) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">🇺🇸 USD</SelectItem>
                          <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                          <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                          <SelectItem value="TRY">🇹🇷 TRY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPackage(null);
                      setFormData(emptyPackage);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Package
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(AdminDashboard);