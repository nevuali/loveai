import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Mail, Calendar, MapPin, Heart, Ban, CheckCircle, 
  Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Shield,
  Crown, User as UserIcon, Clock, Activity, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { userService, UserFilters } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { User, Chat } from '../../types/firestore';

// Remove duplicate interface - using the one from firestore types

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'premium' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [bulkActions, setBulkActions] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    adminUsers: 0
  });

  // Load real users from Firestore
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersData, userStats] = await Promise.all([
        userService.getUsers({ limit: 100 }),
        userService.getUserStats()
      ]);
      
      setUsers(usersData);
      setStats({
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        premiumUsers: userStats.premiumUsers,
        adminUsers: userStats.adminUsers
      });
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: 'user' | 'premium' | 'admin') => {
    try {
      await userService.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      loadUsers(); // Reload users
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    try {
      await userService.updateUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      loadUsers(); // Reload users
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleViewUserChats = async (userId: string) => {
    try {
      const chats = await chatService.getUserChats(userId);
      setUserChats(chats);
    } catch (error) {
      console.error('Error loading user chats:', error);
      toast.error('Failed to load user chats');
    }
  };

  const handleBulkAction = (action: string) => {
    if (bulkActions.length === 0) {
      toast.error('Please select users first');
      return;
    }

    // Implement bulk actions
    switch (action) {
      case 'activate':
        bulkActions.forEach(userId => handleStatusChange(userId, 'active'));
        break;
      case 'suspend':
        bulkActions.forEach(userId => handleStatusChange(userId, 'suspended'));
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${bulkActions.length} users?`)) {
          setUsers(prev => prev.filter(user => !bulkActions.includes(user.uid)));
          toast.success(`${bulkActions.length} users deleted`);
        }
        break;
    }
    setBulkActions([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'premium': return Crown;
      case 'user': return UserIcon;
      default: return UserIcon;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleBulkAction('activate')}
            disabled={bulkActions.length === 0}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Activate Selected ({bulkActions.length})
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleBulkAction('suspend')}
            disabled={bulkActions.length === 0}
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            <Ban className="w-4 h-4 mr-2" />
            Suspend Selected ({bulkActions.length})
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadUsers}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Users', 
            value: stats.totalUsers, 
            icon: Users, 
            color: 'from-blue-600 to-blue-400',
            bgColor: 'bg-blue-50',
            change: '+12%',
            description: 'All registered users'
          },
          { 
            label: 'Active Users', 
            value: stats.activeUsers, 
            icon: CheckCircle, 
            color: 'from-green-600 to-green-400',
            bgColor: 'bg-green-50',
            change: '+8%',
            description: 'Currently active users'
          },
          { 
            label: 'Premium Users', 
            value: stats.premiumUsers, 
            icon: Crown, 
            color: 'from-purple-600 to-purple-400',
            bgColor: 'bg-purple-50',
            change: '+23%',
            description: 'Subscribed users'
          },
          { 
            label: 'Admin Users', 
            value: stats.adminUsers, 
            icon: Shield, 
            color: 'from-orange-600 to-orange-400',
            bgColor: 'bg-orange-50',
            change: '2 total',
            description: 'Administrative accounts'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value.toLocaleString()}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{stat.description}</span>
                        <span className="text-sm font-medium text-green-600">{stat.change}</span>
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
            <Select value="all" onValueChange={(value: any) => {}}>
              <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                <SelectValue placeholder="User Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🔍 All Status</SelectItem>
                <SelectItem value="active">✅ Active</SelectItem>
                <SelectItem value="suspended">⛔ Suspended</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 All Roles</SelectItem>
                <SelectItem value="admin">🛡️ Admin</SelectItem>
                <SelectItem value="premium">👑 Premium</SelectItem>
                <SelectItem value="user">👤 User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Search Results Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users
              {searchTerm && (
                <span> matching "<span className="font-semibold text-indigo-600">{searchTerm}</span>"</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={bulkActions.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkActions(filteredUsers.map(u => u.uid));
                        } else {
                          setBulkActions([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={bulkActions.includes(user.uid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkActions(prev => [...prev, user.uid]);
                            } else {
                              setBulkActions(prev => prev.filter(id => id !== user.uid));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.photoURL ? (
                              <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                            ) : (
                              <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {(user.displayName || user.email).split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.displayName || user.email}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor('active')}>
                          active
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRoleColor(user.role)}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {user.stats?.totalBookings || 0} bookings
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {user.lastLoginAt ? new Date(user.lastLoginAt.toDate()).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${(user.stats?.totalSpent || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetail(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Select onValueChange={(value) => handleStatusChange(user.uid, value as any)}>
                            <SelectTrigger className="w-24 h-8">
                              <MoreHorizontal className="w-3 h-3" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Activate</SelectItem>
                              <SelectItem value="suspended">Suspend</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} alt="" className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {(selectedUser.displayName || selectedUser.email).split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.displayName || selectedUser.email}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getStatusColor('active')}>
                      active
                    </Badge>
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.stats?.totalBookings || 0}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${(selectedUser.stats?.totalSpent || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedUser.stats?.totalChats || 0}</div>
                  <div className="text-sm text-gray-600">Chat Sessions</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedUser.stats?.totalMessages || 0}</div>
                  <div className="text-sm text-gray-600">Messages Sent</div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h4 className="font-semibold mb-2">User Information</h4>
                <div className="space-y-2">
                  <div><strong>Language:</strong> {selectedUser.profileData?.preferences?.language || 'English'}</div>
                  <div><strong>Theme:</strong> {selectedUser.profileData?.preferences?.theme || 'Light'}</div>
                  <div><strong>Location:</strong> {selectedUser.profileData?.location || 'Not specified'}</div>
                  <div><strong>Subscription:</strong> {selectedUser.subscription?.type || 'Free'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Select onValueChange={(value) => handleRoleChange(selectedUser.uid, value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange(selectedUser.uid, 'active')}
                >
                  Activate User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;