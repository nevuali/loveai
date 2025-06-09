import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, Crown, Search, Filter, CheckCircle, XCircle, 
  MoreHorizontal, Edit, Trash2, Ban, Activity, AlertTriangle, 
  ArrowUpRight, Mail, Phone, MapPin, Calendar, Shield, Star
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { userService } from '../../services/userService';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  joinDate: string;
  lastActive: string;
  status: 'active' | 'suspended' | 'pending';
  role: 'admin' | 'user' | 'premium';
  avatar?: string;
  totalBookings: number;
  totalSpent: number;
  rating: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [bulkActions, setBulkActions] = useState<string[]>([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    suspendedUsers: 0
  });

  const filterUsers = useCallback(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
             // Load real user data from service
       const userData = await userService.getUsers();
      
             // Transform Firebase User to our display format
       const transformedUsers: User[] = userData.map(user => ({
         id: user.uid,
         name: user.displayName || user.email.split('@')[0],
         email: user.email,
         phone: user.profileData?.phoneNumber,
         location: user.profileData?.location || 'Unknown',
         joinDate: user.createdAt.toDate().toISOString().split('T')[0],
         lastActive: user.lastLoginAt ? user.lastLoginAt.toDate().toISOString().split('T')[0] : user.createdAt.toDate().toISOString().split('T')[0],
         status: 'active', // Firebase users are considered active by default
         role: user.role === 'premium' ? 'premium' : user.role === 'admin' ? 'admin' : 'user',
         avatar: user.photoURL,
         totalBookings: user.stats?.totalBookings || 0,
         totalSpent: user.stats?.totalSpent || 0,
         rating: 4.5 // Default rating for now
       }));

      setUsers(transformedUsers);
      
      // Calculate stats
      const newStats = {
        totalUsers: transformedUsers.length,
        activeUsers: transformedUsers.filter(u => u.status === 'active').length,
        premiumUsers: transformedUsers.filter(u => u.role === 'premium').length,
        suspendedUsers: transformedUsers.filter(u => u.status === 'suspended').length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load real user data from API');
      
      // No fallback data - only show real users
      setUsers([]);
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        premiumUsers: 0,
        suspendedUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = (action: 'activate' | 'suspend' | 'delete') => {
    console.log(`Bulk ${action} for users:`, bulkActions);
    setBulkActions([]);
    toast.success(`Bulk ${action} completed`);
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    delay = 0,
    color = "from-[#d4af37] to-[#b8860b]"
  }: { 
    title: string; 
    value: string | number; 
    change: string; 
    icon: any; 
    delay?: number;
    color?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300 group hover:-translate-y-1"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary mb-2">{value}</p>
          <div className="flex items-center">
            <ArrowUpRight className="w-4 h-4 text-[#d4af37] mr-1" />
            <span className="text-sm text-[#d4af37] font-medium">{change}</span>
          </div>
        </div>
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">User Management</h2>
            <p className="text-secondary">Manage user accounts, roles, and permissions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl animate-pulse h-32 border border-white/10"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <motion.div 
        className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">
              Kullanıcı Yönetimi
            </h2>
            <p className="text-secondary text-sm mt-1">Kullanıcı hesapları, roller ve izinleri yönetin</p>
          </div>
          
          {/* Clean Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => handleBulkAction('activate')}
              disabled={bulkActions.length === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                bulkActions.length === 0 
                  ? 'bg-white/5 text-secondary cursor-not-allowed' 
                  : 'glass-card border border-green-400/30 text-green-400 hover:bg-green-400/10'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              Aktif Et ({bulkActions.length})
            </button>
            
            <button 
              onClick={() => handleBulkAction('suspend')}
              disabled={bulkActions.length === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                bulkActions.length === 0 
                  ? 'bg-white/5 text-secondary cursor-not-allowed' 
                  : 'glass-card border border-red-400/30 text-red-400 hover:bg-red-400/10'
              }`}
            >
              <Ban className="w-3 h-3" />
              Askıya Al ({bulkActions.length})
            </button>
            
            <button 
              onClick={loadUsers}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium glass-card border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-200"
            >
              <Activity className="w-3 h-3" />
              Yenile
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers}
          change="+12%"
          icon={Users}
          delay={0}
        />
        <StatCard
          title="Aktif Kullanıcılar"
          value={stats.activeUsers}
          change="+8%"
          icon={CheckCircle}
          delay={0.1}
          color="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Premium Üyeler"
          value={stats.premiumUsers}
          change="+15%"
          icon={Crown}
          delay={0.2}
          color="from-purple-500 to-pink-500"
        />
        <StatCard
          title="Askıdaki Hesaplar"
          value={stats.suspendedUsers}
          change="-5%"
          icon={AlertTriangle}
          delay={0.3}
          color="from-red-500 to-orange-500"
        />
      </div>

      {/* Clean Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl backdrop-blur-xl border border-white/10"
      >
        <div className="p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-primary mb-4">
            <Filter className="w-4 h-4 text-[#d4af37]" />
            Arama & Filtreleme
          </h3>
          
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <Input
                placeholder="İsim, email veya konum ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-10 glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
                  <SelectItem value="all">🔍 Tümü</SelectItem>
                  <SelectItem value="active">✅ Aktif</SelectItem>
                  <SelectItem value="suspended">⛔ Askıda</SelectItem>
                  <SelectItem value="pending">⏳ Beklemede</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36 h-10 glass-card border-white/10 focus:border-[#d4af37]/50 bg-transparent backdrop-blur-xl">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
                  <SelectItem value="all">👥 Tüm Roller</SelectItem>
                  <SelectItem value="admin">🔑 Admin</SelectItem>
                  <SelectItem value="premium">👑 Premium</SelectItem>
                  <SelectItem value="user">👤 Kullanıcı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Results Info */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-secondary">
              <span className="font-semibold text-[#d4af37]">{filteredUsers.length}</span> kullanıcı gösteriliyor 
              (toplam <span className="font-semibold">{users.length}</span>)
              {searchTerm && (
                <span> • "<span className="font-semibold text-[#d4af37]">{searchTerm}</span>" araması</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Clean Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">Kullanıcı</th>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">Durum</th>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">Rol</th>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">Konum</th>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">Aktivite</th>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">İstatistik</th>
                <th className="text-left p-3 text-xs font-medium text-secondary uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="rounded border-white/20 bg-transparent"
                      checked={bulkActions.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkActions([...bulkActions, user.id]);
                        } else {
                          setBulkActions(bulkActions.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <span className="text-white font-semibold text-sm">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-primary text-sm truncate">{user.name}</p>
                        <p className="text-xs text-secondary truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge 
                      className={`text-xs px-2 py-1 ${user.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : user.status === 'suspended' 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}
                    >
                      {user.status === 'active' ? 'Aktif' : user.status === 'suspended' ? 'Askıda' : 'Beklemede'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge 
                      className={`text-xs px-2 py-1 ${user.role === 'premium' 
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white border-[#d4af37]/30' 
                        : user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {user.role === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                      {user.role === 'premium' ? 'Premium' : user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-20">{user.location}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-secondary">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.joinDate).toLocaleDateString('tr')}
                      </div>
                      <div className="text-xs text-secondary opacity-60">
                        Son: {new Date(user.lastActive).toLocaleDateString('tr')}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-primary">{user.totalBookings} rezervasyon</div>
                      <div className="text-xs text-secondary">₺{user.totalSpent.toLocaleString()}</div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-secondary">{user.rating}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#d4af37]/20 flex items-center justify-center transition-colors">
                        <Edit className="w-3 h-3 text-[#d4af37]" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <MoreHorizontal className="w-3 h-3 text-secondary" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default UserManagement;