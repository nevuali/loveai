import React, { useState, useEffect } from 'react';
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

  // Always call useEffect hooks before any conditional returns
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

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || pkg.category === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && pkg.availability) ||
                               (availabilityFilter === 'unavailable' && !pkg.availability);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Professional Sidebar */}
      <motion.div 
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-white via-gray-50/95 to-white/95 backdrop-blur-xl border-r border-gray-200/60 shadow-2xl z-50 transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Logo & Toggle */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <motion.div 
              className={`flex items-center gap-4 ${!sidebarOpen && 'justify-center'}`}
              layout
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col"
                  >
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      AI LOVVE
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Admin Control Center</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-100/80 rounded-xl p-2 transition-all duration-200"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </Button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 p-6 space-y-3">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/25' 
                      : 'hover:bg-white/80 hover:shadow-lg text-gray-700 hover:text-gray-900'
                  } ${!sidebarOpen && 'justify-center'}`}
                  whileHover={{ scale: 1.02, x: isActive ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Icon with background */}
                  <div className={`relative ${isActive ? '' : 'group-hover:scale-110 transition-transform duration-200'}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col items-start"
                      >
                        <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="text-xs text-white/80 mt-0.5">
                            Currently viewing
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Tooltip for collapsed state */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Enhanced User Profile */}
          <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className={`flex items-center gap-4 ${!sidebarOpen && 'justify-center'}`}>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                  {getUserInitial()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.displayName || user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">System Administrator</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className={`hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 ${!sidebarOpen && 'w-full'}`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Enhanced Header */}
        <motion.header 
          className="bg-gradient-to-r from-white/95 via-gray-50/95 to-white/95 backdrop-blur-xl border-b border-gray-200/60 p-8 shadow-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent capitalize">
                    {activeTab}
                  </h2>
                  {activeTab === 'overview' && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>}
                </div>
                <p className="text-gray-600 text-lg font-medium">
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
              {/* Notification Bell */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  className="relative bg-white/80 border-gray-200 hover:bg-white hover:border-indigo-300 rounded-2xl p-3 transition-all duration-200"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">3</span>
                </Button>
              </motion.div>
              
              {/* Quick Actions */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline"
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 rounded-2xl px-4 py-3 font-medium"
                  onClick={() => setActiveTab('packages')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </motion.div>
              
              {/* Date & Time */}
              <div className="text-right bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
                <p className="text-sm font-bold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-500 font-medium">
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
          className="p-8 min-h-screen bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-indigo-50/50"
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
                      color: 'from-blue-600 to-blue-400', 
                      change: dashboardStats.packageStats ? `+${Math.round(dashboardStats.packageStats.publishedPackages / dashboardStats.totalPackages * 100)}%` : '+0%'
                    },
                    { 
                      label: 'Active Users', 
                      value: dashboardStats.totalUsers.toLocaleString(), 
                      icon: Users, 
                      color: 'from-green-600 to-green-400', 
                      change: dashboardStats.userStats ? `+${dashboardStats.userStats.newUsersThisMonth}` : '+0'
                    },
                    { 
                      label: 'Revenue', 
                      value: `$${dashboardStats.totalRevenue.toLocaleString()}`, 
                      icon: DollarSign, 
                      color: 'from-purple-600 to-purple-400', 
                      change: dashboardStats.userStats ? `$${Math.round(dashboardStats.userStats.averageSpentPerUser)}` : '$0' + ' avg'
                    },
                    { 
                      label: 'Total Bookings', 
                      value: dashboardStats.totalBookings, 
                      icon: Calendar, 
                      color: 'from-orange-600 to-orange-400', 
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
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                          {/* Gradient overlay */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                          
                          <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
                                <p className="text-4xl font-bold text-gray-900 mb-3">{stat.value}</p>
                                <div className="flex items-center">
                                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                                  <span className="text-sm text-green-600 font-semibold">{stat.change}</span>
                                  <span className="text-xs text-gray-500 ml-2">vs last month</span>
                                </div>
                              </div>
                              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Enhanced Recent Activity */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                          <p className="text-sm text-gray-500">Latest system events and updates</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl bg-gray-50 hover:bg-gray-100 border-gray-200"
                      >
                        View All
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 transition-all duration-200 group border border-gray-100/50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ x: 4 }}
                          >
                            <div className={`w-4 h-4 rounded-full ${
                              activity.type === 'create' ? 'bg-green-500' :
                              activity.type === 'update' ? 'bg-blue-500' :
                              activity.type === 'view' ? 'bg-purple-500' : 'bg-orange-500'
                            } shadow-md group-hover:scale-110 transition-transform duration-200`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{activity.action}</p>
                              <p className="text-sm text-gray-600 truncate">{activity.item}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                      {packages.length === 0 && (
                        <div className="text-center py-8">
                          <Activity className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                {/* Package Management Header */}
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <PackageIcon className="w-5 h-5 text-indigo-600" />
                        Package Management
                      </CardTitle>
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
                  </CardHeader>
                  <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex-1 min-w-64">
                        <Input
                          placeholder="Search packages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border-gray-200 focus:border-indigo-500"
                        />
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bulk Actions */}
                    {selectedPackages.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl mb-6"
                      >
                        <span className="text-sm font-medium text-indigo-900">
                          {selectedPackages.length} package(s) selected
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleBulkAvailability(true)}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Mark Available
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleBulkAvailability(false)}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          Mark Unavailable
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleBulkDelete}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
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
                        {/* Select All */}
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                          <button onClick={toggleSelectAll} className="flex items-center gap-2">
                            {selectedPackages.length === filteredPackages.length && filteredPackages.length > 0 ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-600">
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
                              className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                                selectedPackages.includes(pkg.id) 
                                  ? 'border-indigo-200 bg-indigo-50/30' 
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="p-6">
                                <div className="flex items-start gap-4">
                                  <button
                                    onClick={() => togglePackageSelection(pkg.id)}
                                    className="mt-1"
                                  >
                                    {selectedPackages.includes(pkg.id) ? (
                                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                          <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">{pkg.title}</h3>
                                          {pkg.isPromoted && (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                              <Crown className="w-3 h-3 mr-1" />
                                              Promoted
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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
                                        <p className="text-gray-600 line-clamp-2 mb-3">{pkg.description}</p>
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant={pkg.availability ? 'default' : 'secondary'}
                                            className={pkg.availability ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                          >
                                            {pkg.availability ? 'Available' : 'Unavailable'}
                                          </Badge>
                                          <Badge variant="outline" className="capitalize">
                                            {pkg.category}
                                          </Badge>
                                          <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            {pkg.rating || 0}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 ml-4">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            // Open package in new tab to preview
                                            window.open(`/package/${pkg.id}`, '_blank');
                                          }}
                                          className="hover:bg-gray-50 hover:border-gray-200"
                                          title="Preview Package"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEdit(pkg)}
                                          className="hover:bg-blue-50 hover:border-blue-200"
                                          title="Edit Package"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            packageService.togglePackageAvailability(pkg.id, !pkg.availability);
                                            toast.success(`Package ${!pkg.availability ? 'enabled' : 'disabled'}`);
                                            loadDashboardData();
                                          }}
                                          className={pkg.availability ? 
                                            "hover:bg-orange-50 hover:border-orange-200 text-orange-600" : 
                                            "hover:bg-green-50 hover:border-green-200 text-green-600"
                                          }
                                          title={pkg.availability ? "Disable Package" : "Enable Package"}
                                        >
                                          {pkg.availability ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDelete(pkg.id)}
                                          className="hover:bg-red-50 hover:border-red-200 text-red-600"
                                          title="Delete Package"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
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
                            <PackageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                {/* Application Settings */}
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-600" />
                      Application Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* General Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
                          <Input defaultValue="AI LOVVE" className="border-gray-200 focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                          <Input defaultValue="support@ailovve.com" className="border-gray-200 focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                          <Select defaultValue="en">
                            <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="tr">Türkçe</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                          <Select defaultValue="USD">
                            <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                      <h3 className="text-lg font-semibold text-gray-900">Feature Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <h4 className="font-medium text-gray-900">Enable Package Bookings</h4>
                            <p className="text-sm text-gray-600">Allow users to book packages directly</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <h4 className="font-medium text-gray-900">AI Chat Assistant</h4>
                            <p className="text-sm text-gray-600">Enable AI-powered chat for customer support</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <h4 className="font-medium text-gray-900">Email Notifications</h4>
                            <p className="text-sm text-gray-600">Send email notifications to users</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <h4 className="font-medium text-gray-900">Analytics Tracking</h4>
                            <p className="text-sm text-gray-600">Collect user behavior data for analytics</p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* API Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">API & Integration Settings</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
                          <Input type="password" placeholder="Enter your Gemini API key" className="border-gray-200 focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Firebase Project ID</label>
                          <Input defaultValue="ai-lovve-project" className="border-gray-200 focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Analytics Provider</label>
                          <Select defaultValue="firebase">
                            <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="firebase">Firebase Analytics</SelectItem>
                              <SelectItem value="google">Google Analytics</SelectItem>
                              <SelectItem value="mixpanel">Mixpanel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Save Section */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
                  </CardContent>
                </Card>

                {/* Enhanced System Status */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">System Health</h3>
                          <p className="text-sm text-gray-500">Real-time service monitoring</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-green-700">All Systems Go</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
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

export default AdminDashboard;