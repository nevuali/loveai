import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, Download, Search, TrendingUp, TrendingDown, Eye, Edit, Trash2, MoreVertical, Heart, MapPin, DollarSign, Calendar, Star, AlertTriangle, Target, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { advancedUserProfileService, DetailedUserProfile, ProfileAnalytics } from '../../services/advancedUserProfileService';
import { toast } from 'react-hot-toast';
import { logger } from '../../utils/logger';

const UserProfileAnalytics: React.FC = () => {
  const [users, setUsers] = useState<DetailedUserProfile[]>([]);
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<DetailedUserProfile | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    budgetMin: '',
    budgetMax: '',
    location: '',
    personality: '',
    engagement: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to load real analytics data from Firebase
      const analyticsData = await advancedUserProfileService.generateProfileAnalytics();
      setAnalytics(analyticsData);
      
      // Try to load real users data (empty search to get all users)
      const usersData = await advancedUserProfileService.searchUsers({});
      setUsers(usersData);
      
      // Show success message only if we have data
      if (analyticsData.totalUsers > 0) {
        toast.success(`${analyticsData.totalUsers} user profile loaded`);
      }
      
    } catch (error) {
      logger.error('Error loading profile analytics', { error });
      
      // Set empty/default analytics instead of null
      setAnalytics({
        totalUsers: 0,
        segments: [],
        topDestinations: [],
        budgetDistribution: [],
        personalityInsights: [],
        engagementMetrics: {
          averageSessionDuration: 0,
          averageMessagesPerSession: 0,
          retentionRate: 0,
          conversionRate: 0
        },
        trends: {
          newUsers: [],
          popularFeatures: [],
          satisfactionTrend: []
        }
      });
      setUsers([]);
      
      // Only show error toast if it's a real error, not just empty collection
      if (error && (error as any).code !== 'permission-denied') {
        toast.error('Profile analysis not ready yet');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const searchFilters: any = {};
      
      if (filters.budgetMin || filters.budgetMax) {
        searchFilters.budgetRange = {
          min: filters.budgetMin ? parseInt(filters.budgetMin) : undefined,
          max: filters.budgetMax ? parseInt(filters.budgetMax) : undefined
        };
      }
      
      if (filters.location) {
        searchFilters.locations = [filters.location];
      }
      
      if (selectedSegment !== 'all') {
        searchFilters.segments = [selectedSegment];
      }

      const filteredUsers = await advancedUserProfileService.searchUsers(searchFilters);
      
      // Client-side text search
      const finalUsers = filteredUsers.filter(user => 
        !searchTerm || 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.demographics.location.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setUsers(finalUsers);
      
      if (finalUsers.length === 0 && (searchTerm || Object.values(searchFilters).some(v => v))) {
        toast.success('No user found for the search criteria');
      }
      
    } catch (error) {
      logger.error('Error searching users', { error });
      setUsers([]);
      
      // Only show error for real search errors
      if (searchTerm || Object.values(filters).some(v => v)) {
        toast.error('Error occurred during search');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async (userId: string) => {
    try {
      const userData = await advancedUserProfileService.exportUserData(userId);
      if (userData) {
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-profile-${userId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('User data exported');
      }
    } catch (error) {
      logger.error('Error exporting user data', { error });
      toast.error('Error occurred during export');
    }
  };

  const getPersonalityColor = (trait: string, value: number) => {
    const colors = {
      adventurous: value > 7 ? 'text-orange-600' : value > 4 ? 'text-orange-400' : 'text-gray-400',
      luxury: value > 7 ? 'text-purple-600' : value > 4 ? 'text-purple-400' : 'text-gray-400',
      romantic: value > 7 ? 'text-pink-600' : value > 4 ? 'text-pink-400' : 'text-gray-400',
      cultural: value > 7 ? 'text-blue-600' : value > 4 ? 'text-blue-400' : 'text-gray-400',
      active: value > 7 ? 'text-green-600' : value > 4 ? 'text-green-400' : 'text-gray-400',
    };
    return colors[trait as keyof typeof colors] || 'text-gray-400';
  };

  const getEngagementBadge = (user: DetailedUserProfile) => {
    const score = user.analytics.engagementScore;
    if (score >= 80) return <Badge className="bg-green-100 text-green-700">High</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-700">Low</Badge>;
  };

  const getSegmentBadge = (segment: string) => {
    const colors = {
      'luxury_seekers': 'bg-purple-100 text-purple-700',
      'budget_conscious': 'bg-green-100 text-green-700',
      'adventure_lovers': 'bg-orange-100 text-orange-700',
      'romantic_couples': 'bg-pink-100 text-pink-700',
      'cultural_explorers': 'bg-blue-100 text-blue-700'
    };
    return colors[segment as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Golden Header */}
      <motion.div 
        className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
              User Profile Analysis
            </h2>
            <p className="text-secondary text-sm mt-1">Detailed user behavior analysis and segmentation</p>
          </div>
          <button 
            onClick={loadData} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass-card border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-200 disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </motion.div>

      {/* Modern Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-5 backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary mb-1">Total Users</p>
                <p className="text-2xl font-bold text-primary">{analytics.totalUsers || 0}</p>
                <div className="flex items-center mt-2">
                  {analytics.totalUsers > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-[#d4af37] mr-1" />
                      <span className="text-xs text-[#d4af37] font-medium">Active</span>
                    </>
                  ) : (
                    <span className="text-xs text-secondary">No data yet</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-5 backdrop-blur-xl border border-white/10 hover:border-green-400/30 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {analytics.totalUsers > 0 
                    ? `${(analytics.engagementMetrics.conversionRate * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
                <div className="flex items-center mt-2">
                  {analytics.totalUsers > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                      <span className="text-xs text-green-400 font-medium">Analyzed</span>
                    </>
                  ) : (
                    <span className="text-xs text-secondary">Data pending</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5 backdrop-blur-xl border border-white/10 hover:border-pink-400/30 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary mb-1">Average Session</p>
                <p className="text-2xl font-bold text-primary">
                  {analytics.totalUsers > 0 
                    ? `${Math.round(analytics.engagementMetrics.averageSessionDuration)}min`
                    : '0min'
                  }
                </p>
                <div className="flex items-center mt-2">
                  {analytics.totalUsers > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-pink-400 mr-1" />
                      <span className="text-xs text-pink-400 font-medium">Calculated</span>
                    </>
                  ) : (
                    <span className="text-xs text-secondary">User required</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-5 backdrop-blur-xl border border-white/10 hover:border-yellow-400/30 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary mb-1">Retention Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {analytics.totalUsers > 0 
                    ? `${(analytics.engagementMetrics.retentionRate * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
                <div className="flex items-center mt-2">
                  {analytics.totalUsers > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-yellow-400 mr-1" />
                      <span className="text-xs text-yellow-400 font-medium">Updated</span>
                    </>
                  ) : (
                    <span className="text-xs text-secondary">No statistics</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Show message when no analytics available */}
      {analytics && analytics.totalUsers === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 backdrop-blur-xl border border-white/10 text-center"
        >
          <Brain className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-primary mb-2">Detailed Profile Analysis</h3>
          <p className="text-secondary mb-4">
            This section displays detailed personality analysis, travel preferences, and behavioral data for users.
          </p>
          <p className="text-secondary text-sm">
            No detailed profile data exists yet. Analysis will appear here once users complete the profile wizard.
          </p>
        </motion.div>
      )}

      {/* Show message when loading */}
      {!analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 backdrop-blur-xl border border-white/10 text-center"
        >
          <TrendingUp className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-primary mb-2">Analysing Data</h3>
          <p className="text-secondary">
            User profile analysis is being prepared. Please wait...
          </p>
        </motion.div>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        {/* Golden Glassmorphism Tabs Header */}
        <motion.div 
          className="glass-card rounded-2xl p-2 backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <TabsList className="grid w-full grid-cols-4 bg-transparent border-0 space-x-2">
            <TabsTrigger 
              value="users" 
              className="glass-card text-primary data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d4af37] data-[state=active]:to-[#b8860b] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl border border-white/10 transition-all duration-300 font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="segments"
              className="glass-card text-primary data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d4af37] data-[state=active]:to-[#b8860b] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl border border-white/10 transition-all duration-300 font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              Segments
            </TabsTrigger>
            <TabsTrigger 
              value="insights"
              className="glass-card text-primary data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d4af37] data-[state=active]:to-[#b8860b] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl border border-white/10 transition-all duration-300 font-medium"
            >
              <Brain className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="glass-card text-primary data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d4af37] data-[state=active]:to-[#b8860b] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl border border-white/10 transition-all duration-300 font-medium"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="users" className="space-y-6">
          {/* Golden Search and Filters */}
          <motion.div 
            className="glass-card rounded-2xl p-6 backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
                Filters and Search
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="User search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-card border-white/10 bg-white/5 text-primary placeholder:text-secondary"
                />
              </div>
              
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger className="glass-card border-white/10 bg-white/5 text-primary">
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 bg-background/95 backdrop-blur-2xl">
                  <SelectItem value="all">All Segments</SelectItem>
                  {analytics?.segments.map(segment => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name} ({segment.userCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Min Budget"
                value={filters.budgetMin}
                onChange={(e) => setFilters(prev => ({ ...prev, budgetMin: e.target.value }))}
                className="glass-card border-white/10 bg-white/5 text-primary placeholder:text-secondary"
              />

              <Input
                placeholder="Max Budget"
                value={filters.budgetMax}
                onChange={(e) => setFilters(prev => ({ ...prev, budgetMax: e.target.value }))}
                className="glass-card border-white/10 bg-white/5 text-primary placeholder:text-secondary"
              />

              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37] text-white border-0 shadow-lg transition-all duration-300"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </motion.div>

          {/* Golden Users Table */}
          <motion.div 
            className="glass-card rounded-2xl p-6 backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
                Users ({users.length})
              </h3>
            </div>
            
            <div className="space-y-4">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-xl p-4 backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300 group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold shadow-lg">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-primary">{user.displayName}</h3>
                          <p className="text-sm text-secondary">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-[#d4af37]" />
                            <span className="text-xs text-secondary">
                              {user.demographics.location.city}, {user.demographics.location.country}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Personality Traits */}
                        <div className="hidden md:flex space-x-2">
                          {Object.entries(user.personality).slice(0, 4).map(([trait, value]) => (
                            <div key={trait} className="text-center">
                              <div className="text-xs text-secondary capitalize">{trait}</div>
                              <div className={`text-sm font-semibold ${getPersonalityColor(trait, value)}`}>
                                {value}/10
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Budget */}
                        <div className="text-center">
                          <div className="text-xs text-secondary">Budget</div>
                          <div className="text-sm font-semibold text-green-400">
                            {user.travelPreferences.budgetRange.min.toLocaleString()}-
                            {user.travelPreferences.budgetRange.max.toLocaleString()}₺
                          </div>
                        </div>

                        {/* Engagement */}
                        <div className="text-center">
                          <div className="text-xs text-secondary">Engagement</div>
                          {getEngagementBadge(user)}
                        </div>

                        {/* Segment */}
                        <Badge className={`${getSegmentBadge(user.analytics.userSegment)} glass-card border-white/20`}>
                          {user.analytics.userSegment}
                        </Badge>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="glass-card border-white/10 hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10">
                              <MoreVertical className="h-4 w-4 text-[#d4af37]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="glass-card border-white/10 bg-background/95 backdrop-blur-2xl">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetail(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportUserData(user.userId)}>
                              <Download className="h-4 w-4 mr-2" />
                              Export Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-400">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Anonymize User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Progress Bar for Profile Completeness */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-secondary mb-1">
                        <span>Profile Completeness</span>
                        <span>{user.analytics.profileCompleteness}%</span>
                      </div>
                      <Progress value={user.analytics.profileCompleteness} className="h-2 bg-white/20" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Users className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-primary mb-2">No users found</h3>
                  <p className="text-secondary">
                    No detailed profile data exists for users. Analysis will appear here once users complete the profile wizard.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="segments">
          {analytics && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {analytics.segments.map((segment, index) => (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 backdrop-blur-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary">{segment.name}</h3>
                    <Badge className="glass-card bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white border-0">
                      {segment.userCount} users
                    </Badge>
                  </div>
                  
                  <p className="text-secondary mb-4">{segment.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Average Value:</span>
                      <span className="font-semibold text-[#d4af37]">{segment.averageValue.toLocaleString()}₺</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Total Percentage:</span>
                      <span className="font-semibold text-[#d4af37]">
                        {((segment.userCount / analytics.totalUsers) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="insights">
          {analytics && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Top Destinations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 backdrop-blur-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Top Destinations</h3>
                </div>
                
                <div className="space-y-3">
                  {analytics.topDestinations.slice(0, 5).map((dest, index) => (
                    <div key={dest.name} className="flex items-center justify-between p-3 glass-card rounded-xl border border-white/10">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-medium text-primary">{dest.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#d4af37]">{dest.count}</div>
                        <div className="text-xs text-secondary">{dest.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Budget Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6 backdrop-blur-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Budget Distribution</h3>
                </div>
                
                <div className="space-y-3">
                  {analytics.budgetDistribution.map((budget, index) => (
                    <div key={budget.range} className="flex items-center justify-between p-3 glass-card rounded-xl border border-white/10">
                      <span className="font-medium text-primary">{budget.range}</span>
                      <div className="text-right">
                        <div className="font-semibold text-[#d4af37]">{budget.count}</div>
                        <div className="text-xs text-secondary">{budget.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Personality Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2 glass-card rounded-2xl p-6 backdrop-blur-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Personality Analysis</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analytics.personalityInsights.map((insight, index) => (
                    <motion.div 
                      key={insight.trait} 
                      className="text-center p-4 glass-card rounded-xl border border-white/10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <h4 className="font-semibold capitalize text-primary mb-2">
                        {insight.trait}
                      </h4>
                      <div className="text-2xl font-bold text-[#d4af37] mb-1">
                        {insight.average.toFixed(1)}
                      </div>
                      <div className="text-xs text-secondary mb-2">average</div>
                      <Progress value={insight.average * 10} className="h-2 bg-white/20" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="trends">
          {analytics && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Popular Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 backdrop-blur-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Popular Features</h3>
                </div>
                
                <div className="space-y-4">
                  {analytics.trends.popularFeatures.map((feature, index) => (
                    <div key={feature.feature} className="flex items-center justify-between p-3 glass-card rounded-xl border border-white/10">
                      <span className="font-medium text-primary">{feature.feature}</span>
                      <div className="flex items-center space-x-3">
                        <Progress value={(feature.usage / analytics.totalUsers) * 100} className="w-20 h-2 bg-white/20" />
                        <span className="font-semibold text-[#d4af37] min-w-[2rem]">{feature.usage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Satisfaction Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6 backdrop-blur-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Satisfaction Trend</h3>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                    {analytics.trends.satisfactionTrend[analytics.trends.satisfactionTrend.length - 1]?.score.toFixed(1)}
                  </div>
                  <div className="text-sm text-secondary mb-4">5-point average rating</div>
                  <div className="glass-card rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-secondary">
                      Last 12-month trend
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Golden User Detail Modal */}
      {showUserDetail && selectedUser && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto glass-card rounded-2xl backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(184, 134, 11, 0.15) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Golden Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center text-white font-bold shadow-lg">
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
                    {selectedUser.displayName}
                  </h2>
                  <p className="text-secondary">Detailed Profile</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowUserDetail(false)}
                className="glass-card border-white/10 hover:border-red-400/30 hover:bg-red-500/10 w-10 h-10 p-0"
              >
                <span className="text-red-400 text-lg">✕</span>
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demographic Information */}
                <motion.div 
                  className="glass-card rounded-xl p-5 backdrop-blur-xl border border-white/10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    Demographic Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Email:</span>
                      <span className="text-primary font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Location:</span>
                      <span className="text-primary font-medium">{selectedUser.demographics.location.city}, {selectedUser.demographics.location.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Relationship Status:</span>
                      <span className="text-primary font-medium">{selectedUser.demographics.relationshipStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Languages:</span>
                      <span className="text-primary font-medium">{selectedUser.demographics.languages.join(', ')}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Travel Preferences */}
                <motion.div 
                  className="glass-card rounded-xl p-5 backdrop-blur-xl border border-white/10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <DollarSign className="w-3 h-3 text-white" />
                    </div>
                    Travel Preferences
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Budget:</span>
                      <span className="text-[#d4af37] font-semibold">
                        {selectedUser.travelPreferences.budgetRange.min.toLocaleString()}-{selectedUser.travelPreferences.budgetRange.max.toLocaleString()}₺
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Accommodation:</span>
                      <span className="text-primary font-medium">{selectedUser.travelPreferences.accommodationType.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Travel Frequency:</span>
                      <span className="text-primary font-medium">{selectedUser.travelPreferences.travelFrequency}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Personality Profile */}
                <motion.div 
                  className="md:col-span-2 glass-card rounded-xl p-5 backdrop-blur-xl border border-white/10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                    Personality Profile
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedUser.personality).map(([trait, value], index) => (
                      <motion.div 
                        key={trait} 
                        className="text-center p-3 glass-card rounded-lg border border-white/10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                      >
                        <div className="text-xs text-secondary capitalize mb-1">{trait}</div>
                        <div className="text-lg font-bold text-[#d4af37] mb-1">{value}/10</div>
                        <Progress value={value * 10} className="h-1 bg-white/20" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Behavioral Data */}
                <motion.div 
                  className="md:col-span-2 glass-card rounded-xl p-5 backdrop-blur-xl border border-white/10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    Behavioral Data
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <motion.div 
                      className="p-3 glass-card rounded-lg border border-white/10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="text-2xl font-bold text-blue-400 mb-1">{selectedUser.behaviorData.interactionHistory.messages_sent}</div>
                      <div className="text-xs text-secondary">Message Count</div>
                    </motion.div>
                    <motion.div 
                      className="p-3 glass-card rounded-lg border border-white/10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 }}
                    >
                      <div className="text-2xl font-bold text-green-400 mb-1">{selectedUser.behaviorData.interactionHistory.sessions_count}</div>
                      <div className="text-xs text-secondary">Session Count</div>
                    </motion.div>
                    <motion.div 
                      className="p-3 glass-card rounded-lg border border-white/10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="text-2xl font-bold text-purple-400 mb-1">{selectedUser.behaviorData.packageInteractions.packages_liked.length}</div>
                      <div className="text-xs text-secondary">Liked Package</div>
                    </motion.div>
                    <motion.div 
                      className="p-3 glass-card rounded-lg border border-white/10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.65 }}
                    >
                      <div className="text-2xl font-bold text-pink-400 mb-1">{selectedUser.analytics.engagementScore}</div>
                      <div className="text-xs text-secondary">Engagement Score</div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default UserProfileAnalytics;