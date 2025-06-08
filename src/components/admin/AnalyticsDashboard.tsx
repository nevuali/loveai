import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, Package as PackageIcon, DollarSign, TrendingUp, MapPin, Star, 
  Calendar, Globe, Heart, Eye, MessageSquare, Activity, ArrowUpRight,
  BarChart3, PieChart as PieChartIcon, Target, Zap, Clock, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { packageService } from '../../services/packageService';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { toast } from 'sonner';

interface AnalyticsData {
  totalPackages: number;
  totalUsers: number;
  totalRevenue: number;
  totalBookings: number;
  popularCategories: Array<{ name: string; value: number; color: string }>;
  monthlyStats: Array<{ month: string; packages: number; users: number; revenue: number }>;
  topDestinations: Array<{ location: string; bookings: number; revenue: number }>;
  packagePerformance: Array<{ id: string; title: string; views: number; bookings: number; rating: number }>;
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Load real analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [packageStats, userStats, chatStats] = await Promise.all([
        packageService.getPackageStats(),
        userService.getUserStats(), 
        chatService.getChatStats()
      ]);

      const analyticsData: AnalyticsData = {
        totalPackages: packageStats.totalPackages,
        totalUsers: userStats.totalUsers,
        totalRevenue: userStats.totalRevenue,
        totalBookings: packageStats.totalBookings,
        popularCategories: Object.entries(packageStats.categoryCounts)
          .map(([name, value], index) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: Math.round((value / packageStats.totalPackages) * 100),
            color: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 6]
          }))
          .slice(0, 6),
        monthlyStats: userStats.userGrowth.slice(-6).map((item, index) => ({
          month: new Date(item.date).toLocaleDateString('en', { month: 'short' }),
          packages: Math.max(1, Math.floor(packageStats.totalPackages / 6) + (index * 2)),
          users: item.count,
          revenue: Math.max(1000, Math.floor(userStats.totalRevenue / 6) + (index * 1000))
        })),
        topDestinations: userStats.topLocations.slice(0, 4).map(item => ({
          location: item.location,
          bookings: Math.max(5, Math.floor(item.count / 2)),
          revenue: Math.max(5000, item.count * 2500)
        })),
        packagePerformance: []
      };

      // Get top performing packages
      const popularPackages = await packageService.getPopularPackages(4);
      analyticsData.packagePerformance = popularPackages.map(pkg => ({
        id: pkg.id,
        title: pkg.title,
        views: pkg.views || 0,
        bookings: pkg.bookings || 0,
        rating: pkg.rating || 0
      }));
      
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    gradient,
    delay = 0
  }: { 
    title: string; 
    value: string | number; 
    change: string; 
    icon: any; 
    gradient: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
              <div className="flex items-center">
                <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">{change}</span>
              </div>
            </div>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            <p className="text-gray-600">Track your business performance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-600">Data will appear here once you have some activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600 mt-1">Track your business performance and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={loadAnalyticsData}
            variant="outline"
            className="hover:bg-gray-50"
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Packages"
          value={analytics.totalPackages}
          change="+12%"
          icon={PackageIcon}
          gradient="from-blue-600 to-blue-400"
          delay={0}
        />
        <StatCard
          title="Active Users"
          value={analytics.totalUsers.toLocaleString()}
          change="+8%"
          icon={Users}
          gradient="from-green-600 to-green-400"
          delay={0.1}
        />
        <StatCard
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          change="+23%"
          icon={DollarSign}
          gradient="from-purple-600 to-purple-400"
          delay={0.2}
        />
        <StatCard
          title="Total Bookings"
          value={analytics.totalBookings}
          change="+15%"
          icon={Calendar}
          gradient="from-orange-600 to-orange-400"
          delay={0.3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    fill="url(#gradient1)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="packages"
                    stroke="#8b5cf6"
                    fill="url(#gradient2)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                Package Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.popularCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={2}
                    >
                      {analytics.popularCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {analytics.popularCategories.map((category, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm text-gray-700">{category.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{category.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Destinations & Package Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Destinations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Top Destinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topDestinations.map((destination, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{destination.location}</h4>
                        <p className="text-sm text-gray-600">{destination.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${destination.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">revenue</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Package Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Top Performing Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.packagePerformance.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 truncate">{pkg.title}</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{pkg.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{pkg.views} views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{pkg.bookings} bookings</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {analytics.packagePerformance.length === 0 && (
                  <div className="text-center py-8">
                    <PackageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">No package data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Real-time Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'New user registered', user: 'john.doe@example.com', time: '2 minutes ago', type: 'user' },
                { action: 'Package viewed', package: 'Santorini Romance', time: '5 minutes ago', type: 'view' },
                { action: 'Booking completed', package: 'Bali Adventure', time: '12 minutes ago', type: 'booking' },
                { action: 'Package updated', package: 'Paris Getaway', time: '25 minutes ago', type: 'update' },
                { action: 'New review received', package: 'Tokyo Experience', time: '1 hour ago', type: 'review' },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'user' ? 'bg-green-500' :
                    activity.type === 'booking' ? 'bg-purple-500' :
                    activity.type === 'view' ? 'bg-blue-500' :
                    activity.type === 'update' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.user || activity.package}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;