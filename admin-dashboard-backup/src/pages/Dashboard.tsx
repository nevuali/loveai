import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { motion } from 'framer-motion'
import { api } from '../services/api'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(1, 5),
  })

  const { data: conversations } = useQuery({
    queryKey: ['recent-conversations'],
    queryFn: () => api.getConversations(1, 5),
  })

  const statsCards = [
    { 
      name: 'Total Customers', 
      value: stats?.totalCustomers || 0, 
      change: '+12%', 
      trend: 'up', 
      icon: UsersIcon,
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600'
    },
    { 
      name: 'Active Conversations', 
      value: stats?.activeConversations || 0, 
      change: '+5%', 
      trend: 'up', 
      icon: ChatBubbleLeftRightIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    { 
      name: 'Monthly Reservations', 
      value: stats?.monthlyReservations || 0, 
      change: stats?.reservationChange || '+0%', 
      trend: 'up', 
      icon: CalendarDaysIcon,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    { 
      name: 'Total Revenue', 
      value: `₺${(stats?.totalRevenue || 0).toLocaleString()}`, 
      change: stats?.revenueChange || '+0%', 
      trend: 'up', 
      icon: CreditCardIcon,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
  ]

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to AI LOVVE Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                <div className="flex items-center mt-1">
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <div className={`ml-2 flex items-center text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Customers */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm"
        >
          <div className="px-6 py-4 border-b border-slate-200/60">
            <h3 className="text-lg font-semibold text-slate-800">Recent Customers</h3>
          </div>
          <div className="divide-y divide-slate-200/60">
            {isLoading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
              </div>
            ) : customers?.customers && customers.customers.length > 0 ? (
              customers.customers.map((customer: any) => (
                <div key={customer.id} className="px-6 py-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{customer.name}</p>
                      <p className="text-sm text-slate-600">{customer.email}</p>
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-500">
                No customers yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm"
        >
          <div className="px-6 py-4 border-b border-slate-200/60">
            <h3 className="text-lg font-semibold text-slate-800">Recent Conversations</h3>
          </div>
          <div className="divide-y divide-slate-200/60">
            {isLoading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
              </div>
            ) : conversations?.conversations && conversations.conversations.length > 0 ? (
              conversations.conversations.map((conv: any) => (
                <div key={conv.id} className="px-6 py-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {conv.user_message?.substring(0, 50)}...
                      </p>
                      <p className="text-sm text-slate-600">
                        {conv.customer_email || 'Anonymous'}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-500">
                No conversations yet
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm"
      >
        <div className="px-6 py-4 border-b border-slate-200/60">
          <h3 className="text-lg font-semibold text-slate-800">System Status</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-700">Backend Server</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-700">Database</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-700">AI Service</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 