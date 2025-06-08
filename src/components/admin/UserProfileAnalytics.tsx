import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, Download, Search, TrendingUp, TrendingDown, Eye, Edit, Trash2, MoreVertical, Heart, MapPin, DollarSign, Calendar, Star, AlertTriangle } from 'lucide-react';
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
      const [analyticsData, usersData] = await Promise.all([
        advancedUserProfileService.generateProfileAnalytics(),
        advancedUserProfileService.getBatchUsers()
      ]);
      
      setAnalytics(analyticsData);
      setUsers(usersData.users);
    } catch (error) {
      logger.error('Error loading profile analytics', { error });
      toast.error('Veri yüklenirken hata oluştu');
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
    } catch (error) {
      logger.error('Error searching users', { error });
      toast.error('Arama sırasında hata oluştu');
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
        toast.success('Kullanıcı verisi export edildi');
      }
    } catch (error) {
      logger.error('Error exporting user data', { error });
      toast.error('Export sırasında hata oluştu');
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
    if (score >= 80) return <Badge className="bg-green-100 text-green-700">Yüksek</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-700">Orta</Badge>;
    return <Badge className="bg-red-100 text-red-700">Düşük</Badge>;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kullanıcı Profil Analizi</h2>
          <p className="text-gray-600">Detaylı kullanıcı davranış analizi ve segmentasyon</p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          {loading ? 'Yenileniyor...' : 'Verileri Yenile'}
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dönüşüm Oranı</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(analytics.engagementMetrics.conversionRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-pink-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ortalama Oturum</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.engagementMetrics.averageSessionDuration)}dk
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tutunma Oranı</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(analytics.engagementMetrics.retentionRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="segments">Segmentler</TabsTrigger>
          <TabsTrigger value="insights">İçgörüler</TabsTrigger>
          <TabsTrigger value="trends">Trendler</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtreler ve Arama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Kullanıcı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Segmentler</SelectItem>
                    {analytics?.segments.map(segment => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.userCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Min Bütçe"
                  value={filters.budgetMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, budgetMin: e.target.value }))}
                />

                <Input
                  placeholder="Max Bütçe"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, budgetMax: e.target.value }))}
                />

                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Ara
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcılar ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(user => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
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
                              <div className="text-xs text-gray-500 capitalize">{trait}</div>
                              <div className={`text-sm font-semibold ${getPersonalityColor(trait, value)}`}>
                                {value}/10
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Budget */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Bütçe</div>
                          <div className="text-sm font-semibold text-green-600">
                            {user.travelPreferences.budgetRange.min.toLocaleString()}-
                            {user.travelPreferences.budgetRange.max.toLocaleString()}₺
                          </div>
                        </div>

                        {/* Engagement */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Katılım</div>
                          {getEngagementBadge(user)}
                        </div>

                        {/* Segment */}
                        <Badge className={getSegmentBadge(user.analytics.userSegment)}>
                          {user.analytics.userSegment}
                        </Badge>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetail(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Detayları Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportUserData(user.userId)}>
                              <Download className="h-4 w-4 mr-2" />
                              Veriyi Export Et
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Kullanıcıyı Anonim Yap
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Progress Bar for Profile Completeness */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Profil Tamamlanma</span>
                        <span>{user.analytics.profileCompleteness}%</span>
                      </div>
                      <Progress value={user.analytics.profileCompleteness} className="h-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.segments.map(segment => (
                <Card key={segment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{segment.name}</span>
                      <Badge>{segment.userCount} kullanıcı</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{segment.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Ortalama Değer:</span>
                        <span className="font-semibold">{segment.averageValue.toLocaleString()}₺</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Toplam Oran:</span>
                        <span className="font-semibold">
                          {((segment.userCount / analytics.totalUsers) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Destinations */}
              <Card>
                <CardHeader>
                  <CardTitle>En Popüler Destinasyonlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topDestinations.slice(0, 5).map((dest, index) => (
                      <div key={dest.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{index + 1}.</span>
                          <span className="font-medium">{dest.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{dest.count}</div>
                          <div className="text-xs text-gray-500">{dest.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Bütçe Dağılımı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.budgetDistribution.map(budget => (
                      <div key={budget.range} className="flex items-center justify-between">
                        <span className="font-medium">{budget.range}</span>
                        <div className="text-right">
                          <div className="font-semibold">{budget.count}</div>
                          <div className="text-xs text-gray-500">{budget.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Personality Insights */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Kişilik Analizi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analytics.personalityInsights.map(insight => (
                      <div key={insight.trait} className="text-center">
                        <h4 className="font-semibold capitalize text-gray-900 mb-2">
                          {insight.trait}
                        </h4>
                        <div className="text-2xl font-bold text-pink-600 mb-1">
                          {insight.average.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">ortalama</div>
                        <Progress value={insight.average * 10} className="mt-2 h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Popular Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Popüler Özellikler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.trends.popularFeatures.map(feature => (
                      <div key={feature.feature} className="flex items-center justify-between">
                        <span className="font-medium">{feature.feature}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={(feature.usage / analytics.totalUsers) * 100} className="w-20 h-2" />
                          <span className="font-semibold">{feature.usage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Satisfaction Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Memnuniyet Trendi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analytics.trends.satisfactionTrend[analytics.trends.satisfactionTrend.length - 1]?.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">5 üzerinden ortalama puan</div>
                    <div className="mt-4 text-xs text-gray-400">
                      Son 12 aylık trend
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedUser.displayName} - Detaylı Profil</CardTitle>
                <Button variant="ghost" onClick={() => setShowUserDetail(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demografik Bilgiler */}
                <div>
                  <h3 className="font-semibold mb-3">Demografik Bilgiler</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                    <div><span className="font-medium">Konum:</span> {selectedUser.demographics.location.city}, {selectedUser.demographics.location.country}</div>
                    <div><span className="font-medium">İlişki Durumu:</span> {selectedUser.demographics.relationshipStatus}</div>
                    <div><span className="font-medium">Diller:</span> {selectedUser.demographics.languages.join(', ')}</div>
                  </div>
                </div>

                {/* Seyahat Tercihleri */}
                <div>
                  <h3 className="font-semibold mb-3">Seyahat Tercihleri</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Bütçe:</span> {selectedUser.travelPreferences.budgetRange.min.toLocaleString()}-{selectedUser.travelPreferences.budgetRange.max.toLocaleString()}₺</div>
                    <div><span className="font-medium">Konaklama:</span> {selectedUser.travelPreferences.accommodationType.join(', ')}</div>
                    <div><span className="font-medium">Seyahat Sıklığı:</span> {selectedUser.travelPreferences.travelFrequency}</div>
                  </div>
                </div>

                {/* Kişilik Profili */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-3">Kişilik Profili</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedUser.personality).map(([trait, value]) => (
                      <div key={trait} className="text-center">
                        <div className="text-xs text-gray-500 capitalize">{trait}</div>
                        <div className="text-lg font-bold text-pink-600">{value}/10</div>
                        <Progress value={value * 10} className="mt-1 h-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Davranışsal Veriler */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-3">Davranışsal Veriler</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{selectedUser.behaviorData.interactionHistory.messages_sent}</div>
                      <div className="text-xs text-gray-500">Mesaj Sayısı</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{selectedUser.behaviorData.interactionHistory.sessions_count}</div>
                      <div className="text-xs text-gray-500">Oturum Sayısı</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{selectedUser.behaviorData.packageInteractions.packages_viewed.length}</div>
                      <div className="text-xs text-gray-500">Görüntülenen Paket</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-pink-600">{selectedUser.analytics.engagementScore}</div>
                      <div className="text-xs text-gray-500">Katılım Skoru</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserProfileAnalytics;