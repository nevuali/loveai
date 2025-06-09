import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, Brain, Cpu, Database, 
  Network, Server, Users, TrendingUp, TrendingDown, Clock, Zap, 
  BarChart3, Heart, Shield, Gauge, Target, ArrowUpRight
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

interface SystemMetrics {
  cpu: number;
  memory: number;
  requests: number;
  responseTime: number;
  uptime: string;
  errorRate: number;
}

interface SystemStatus {
  behaviorPrediction: { status: 'active' | 'inactive'; uptime: string; metrics: SystemMetrics };
  personalization: { status: 'active' | 'inactive'; uptime: string; metrics: SystemMetrics };
  chatbot: { status: 'active' | 'inactive'; uptime: string; metrics: SystemMetrics };
  analytics: { status: 'active' | 'inactive'; uptime: string; metrics: SystemMetrics };
}

const AISystemsDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate system status data
      const mockStatus: SystemStatus = {
        behaviorPrediction: {
          status: Math.random() > 0.1 ? 'active' : 'inactive',
          uptime: '99.8%',
          metrics: {
            cpu: Math.floor(Math.random() * 30) + 20,
            memory: Math.floor(Math.random() * 40) + 30,
            requests: Math.floor(Math.random() * 1000) + 500,
            responseTime: Math.floor(Math.random() * 50) + 20,
            uptime: '99.8%',
            errorRate: Math.random() * 0.5
          }
        },
        personalization: {
          status: Math.random() > 0.05 ? 'active' : 'inactive',
          uptime: '99.9%',
          metrics: {
            cpu: Math.floor(Math.random() * 25) + 15,
            memory: Math.floor(Math.random() * 35) + 25,
            requests: Math.floor(Math.random() * 800) + 400,
            responseTime: Math.floor(Math.random() * 40) + 15,
            uptime: '99.9%',
            errorRate: Math.random() * 0.3
          }
        },
        chatbot: {
          status: Math.random() > 0.02 ? 'active' : 'inactive',
          uptime: '99.95%',
          metrics: {
            cpu: Math.floor(Math.random() * 20) + 10,
            memory: Math.floor(Math.random() * 30) + 20,
            requests: Math.floor(Math.random() * 1200) + 600,
            responseTime: Math.floor(Math.random() * 30) + 10,
            uptime: '99.95%',
            errorRate: Math.random() * 0.2
          }
        },
        analytics: {
          status: Math.random() > 0.08 ? 'active' : 'inactive',
          uptime: '99.7%',
          metrics: {
            cpu: Math.floor(Math.random() * 35) + 25,
            memory: Math.floor(Math.random() * 45) + 35,
            requests: Math.floor(Math.random() * 600) + 300,
            responseTime: Math.floor(Math.random() * 60) + 30,
            uptime: '99.7%',
            errorRate: Math.random() * 0.8
          }
        }
      };

      setSystemStatus(mockStatus);
    } catch (error) {
      console.error('Error loading system status:', error);
      toast.error('Failed to load system status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'active' | 'inactive') => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (status: 'active' | 'inactive') => {
    return status === 'active' ? CheckCircle : XCircle;
  };

  const SystemCard = ({ 
    title, 
    icon: Icon, 
    status, 
    metrics, 
    delay = 0 
  }: { 
    title: string; 
    icon: any; 
    status: 'active' | 'inactive'; 
    metrics: SystemMetrics; 
    delay?: number;
  }) => {
    const StatusIcon = getStatusIcon(status);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300 group hover:-translate-y-1"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">{title}</h3>
                <p className="text-sm text-secondary">AI System Module</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${status === 'active' ? 'text-green-500' : 'text-red-500'}`} />
              <Badge className={getStatusColor(status)}>
                {status === 'active' ? 'Active' : 'Offline'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-secondary">CPU Usage</span>
              <span className="text-sm font-medium text-primary">{metrics.cpu}%</span>
            </div>
            <Progress value={metrics.cpu} className="h-2" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-secondary">Memory</span>
              <span className="text-sm font-medium text-primary">{metrics.memory}%</span>
            </div>
            <Progress value={metrics.memory} className="h-2" />

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <p className="text-xs text-secondary">Requests/min</p>
                <p className="text-lg font-semibold text-[#d4af37]">{metrics.requests}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">Response Time</p>
                <p className="text-lg font-semibold text-[#d4af37]">{metrics.responseTime}ms</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-xs text-secondary">Uptime</span>
              <span className="text-sm font-medium text-green-500">{metrics.uptime}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">AI Sistemler Dashboard</h2>
            <p className="text-secondary">Yapay zeka sistemlerinin performans ve analitikleri</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl animate-pulse h-64 border border-white/10"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 mx-auto text-secondary mb-4" />
        <h3 className="text-lg font-medium text-primary mb-2">No system data available</h3>
        <p className="text-secondary">System monitoring data will appear here.</p>
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">AI Sistemler Dashboard</h2>
          <p className="text-secondary mt-1">Yapay zeka sistemlerinin performans ve analitikleri</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32 glass-card border-white/10 bg-transparent backdrop-blur-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10 bg-surface/90 backdrop-blur-xl">
              <SelectItem value="1h">Son 1 saat</SelectItem>
              <SelectItem value="24h">Son 24 saat</SelectItem>
              <SelectItem value="7d">Son 7 gün</SelectItem>
              <SelectItem value="30d">Son 30 gün</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={loadDashboardData}
            className="sidebar-newchat-btn-half"
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </motion.div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SystemCard
          title="Davranış Tahmin Motoru"
          icon={Brain}
          status={systemStatus.behaviorPrediction.status}
          metrics={systemStatus.behaviorPrediction.metrics}
          delay={0}
        />
        <SystemCard
          title="Kişiselleştirme Sistemi"
          icon={Target}
          status={systemStatus.personalization.status}
          metrics={systemStatus.personalization.metrics}
          delay={0.1}
        />
        <SystemCard
          title="Chatbot Motoru"
          icon={Network}
          status={systemStatus.chatbot.status}
          metrics={systemStatus.chatbot.metrics}
          delay={0.2}
        />
        <SystemCard
          title="Analitik Sistemi"
          icon={BarChart3}
          status={systemStatus.analytics.status}
          metrics={systemStatus.analytics.metrics}
          delay={0.3}
        />
      </div>

      {/* Global System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center">
                <Gauge className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">Sistem Sağlığı</h3>
                <p className="text-sm text-secondary">Gerçek zamanlı sistem izleme</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-500">Tüm Sistemler Normal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-3">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-500">99.2%</p>
              <p className="text-sm text-secondary">Genel Uptime</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-[#d4af37]">2.4s</p>
              <p className="text-sm text-secondary">Ortalama Yanıt</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-500">1,247</p>
              <p className="text-sm text-secondary">Aktif Kullanıcı</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-purple-500">98.7%</p>
              <p className="text-sm text-secondary">Başarı Oranı</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent System Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl backdrop-blur-xl border border-white/10 hover:border-[#d4af37]/30 transition-all duration-300"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-primary">Sistem Uyarıları</h3>
            <Badge className="bg-green-100 text-green-800">Tüm Sistemler Normal</Badge>
          </div>
          
          <div className="space-y-3">
            {[
              { 
                type: 'info', 
                message: 'Chatbot motoru başarıyla güncellenmiştir', 
                time: '5 dakika önce',
                icon: CheckCircle 
              },
              { 
                type: 'success', 
                message: 'Analitik sistemi optimizasyonu tamamlandı', 
                time: '1 saat önce',
                icon: TrendingUp 
              },
              { 
                type: 'info', 
                message: 'Yeni kullanıcı davranış modeli eklendi', 
                time: '3 saat önce',
                icon: Brain 
              }
            ].map((alert, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center">
                  <alert.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">{alert.message}</p>
                  <p className="text-xs text-secondary">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AISystemsDashboard;