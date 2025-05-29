import axios from 'axios'

// Backend port 3001'de çalışıyor
const API_BASE_URL = 'http://localhost:3001/api'

// LocalStorage'ı tamamen temizle
const clearAllStorage = () => {
  localStorage.removeItem('admin_session_id')
  localStorage.removeItem('admin_user')
  // Tüm admin ile başlayan key'leri temizle
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('admin_')) {
      localStorage.removeItem(key)
    }
  })
  // Session storage da temizle
  sessionStorage.clear()
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Sadece Session desteği
apiClient.interceptors.request.use(
  (config) => {
    // Session ID'yi kontrol et
    const sessionId = localStorage.getItem('admin_session_id');
    
    console.log('🚀 Sending request to:', config.url);
    console.log('🚀 Session ID from localStorage:', sessionId ? `${sessionId.substring(0, 20)}...` : 'null');
    
    config.headers = config.headers || {};
    
    if (sessionId && sessionId.trim() !== '') {
      // Session-based authentication (tek sistem)
      config.headers['X-Session-ID'] = sessionId;
      console.log('✅ Session ID header set');
    } else {
      console.log('⚠️ No valid session found, request will be sent without auth headers');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Request successful: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response.data;
  },
  (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;
    
    console.error(`❌ Request failed: ${originalRequest?.method?.toUpperCase()} ${url} - ${status}`);
    
    // 401/403 hatalarını özel olarak işle
    if (status === 401 || status === 403) {
      const hadSessionHeader = originalRequest.headers?.['X-Session-ID'];
      
      if (hadSessionHeader) {
        console.warn('🔑 Session rejected by backend, clearing storage and redirecting to login.', url);
        clearAllStorage();
        // Sadece login sayfasında değilsek yönlendir
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      } else {
        console.warn('🤔 Request failed with 401/403 but no Session header was present. This might be expected for some endpoints.', url);
      }
    }
    
    return Promise.reject(error);
  }
);

// Session-based login (tek güvenlik sistemi)
export const loginSession = async (email: string, password: string) => {
  try {
    // Login öncesi storage'ı temizle
    clearAllStorage()
    
    const response = await axios.post(`${API_BASE_URL}/admin/login`, {
      email,
      password
    })
    return response.data
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data
    }
    throw error
  }
}

// Storage temizleme fonksiyonunu export et
export const clearStorage = clearAllStorage

export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  created_at: string
  updated_at: string
  reservation_count: number
  total_spent: number
  surname?: string
  is_premium?: boolean
  is_verified?: boolean
  message_count?: number
  last_login?: string
  chat_session_id?: string
}

export interface Reservation {
  id: number
  customer_id: number
  package_id: number
  check_in_date: string
  check_out_date: string
  guest_count: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  total_amount: number
  special_requests?: string
  created_at: string
  updated_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  package_name: string
  package_price: number
}

export interface Package {
  id: number
  name: string
  description: string
  price: number
  original_price: number
  room_type: string
  features: string[]
  duration_nights: number
  duration_days: number
  location: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  reservation_id: number
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string
  stripe_payment_intent_id?: string
  stripe_charge_id?: string
  created_at: string
  updated_at: string
  customer_name: string
  customer_email: string
  package_name: string
}

export interface GeminiConversation {
  id: number
  session_id: string
  user_message: string
  ai_response: string
  created_at: string
  customer_email?: string
}

export interface DashboardStats {
  totalCustomers: number
  activeConversations: number
  monthlyReservations: number
  totalRevenue: number
  revenueChange: number
  reservationChange: number
}

export const api = {
  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    apiClient.get('/admin/dashboard/stats'),

  // Customers
  getCustomers: (page = 1, limit = 10, search = ''): Promise<{ customers: Customer[], total: number }> =>
    apiClient.get(`/admin/customers?page=${page}&limit=${limit}&search=${search}`),
  
  getCustomer: (id: string): Promise<Customer> =>
    apiClient.get(`/admin/customers/${id}`),
  
  updateCustomer: (id: string, data: Partial<Customer>): Promise<Customer> =>
    apiClient.put(`/admin/customers/${id}`, data),
  
  deleteCustomer: (id: string): Promise<void> =>
    apiClient.delete(`/admin/customers/${id}`),

  // Reservations
  getReservations: (page = 1, limit = 10, status = '', search = ''): Promise<{ reservations: Reservation[], total: number }> =>
    apiClient.get(`/admin/reservations?page=${page}&limit=${limit}&status=${status}&search=${search}`),
  
  getReservation: (id: string): Promise<Reservation> =>
    apiClient.get(`/admin/reservations/${id}`),
  
  updateReservationStatus: (id: string, status: Reservation['status']): Promise<Reservation> =>
    apiClient.put(`/admin/reservations/${id}/status`, { status }),
  
  deleteReservation: (id: string): Promise<void> =>
    apiClient.delete(`/admin/reservations/${id}`),

  // Payments
  getPayments: (page = 1, limit = 10, status = ''): Promise<{ payments: Payment[], total: number }> =>
    apiClient.get(`/admin/payments?page=${page}&limit=${limit}&status=${status}`),
  
  getPayment: (id: string): Promise<Payment> =>
    apiClient.get(`/admin/payments/${id}`),
  
  refundPayment: (id: string): Promise<Payment> =>
    apiClient.post(`/admin/payments/${id}/refund`),

  // Messages/Conversations
  getConversations: (page = 1, limit = 10, search = ''): Promise<{ conversations: GeminiConversation[], total: number }> =>
    apiClient.get(`/admin/conversations?page=${page}&limit=${limit}&search=${search}`),
  
  getConversation: (sessionId: string): Promise<GeminiConversation[]> =>
    apiClient.get(`/admin/conversations/${sessionId}`),
  
  getConversationsByCustomerId: (customerId: string, page = 1, limit = 10): Promise<{ conversations: GeminiConversation[], total: number }> =>
    apiClient.get(`/admin/conversations?customerId=${customerId}&page=${page}&limit=${limit}`),
  
  deleteConversation: (id: string): Promise<void> =>
    apiClient.delete(`/admin/conversations/${id}`),

  // Packages
  getPackages: (): Promise<{ packages: Package[] }> =>
    apiClient.get('/admin/packages'),
  
  updatePackage: (id: string, data: Partial<Package>): Promise<Package> =>
    apiClient.put(`/admin/packages/${id}`, data),
  
  createPackage: (data: Omit<Package, 'id'>): Promise<Package> =>
    apiClient.post('/admin/packages', data),
  
  deletePackage: (id: string): Promise<void> =>
    apiClient.delete(`/admin/packages/${id}`),

  // Settings
  getSettings: (): Promise<{ settings: Array<{ key: string, value: string, description: string }> }> =>
    apiClient.get('/admin/settings'),
  
  updateSetting: (key: string, value: string): Promise<void> =>
    apiClient.put(`/admin/settings/${key}`, { value }),

  // System
  getSystemHealth: (): Promise<{ status: string, services: Record<string, boolean> }> =>
    apiClient.get('/admin/system/health'),
  
  getSystemLogs: (page = 1, limit = 50): Promise<{ logs: any[], total: number }> =>
    apiClient.get(`/admin/system/logs?page=${page}&limit=${limit}`),
} 