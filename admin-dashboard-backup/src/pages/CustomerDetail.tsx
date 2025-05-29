import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, MessageCircle, CreditCard, Star, Trash2 } from 'lucide-react';
import { api, Customer as ApiCustomer, GeminiConversation } from '../services/api';

interface Customer extends ApiCustomer {
  // Add any additional frontend-specific fields if needed
}

interface Conversation extends GeminiConversation {
  // Add any additional frontend-specific fields if needed
}

interface Reservation {
  id: number;
  package_name: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  created_at: string;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'conversations' | 'reservations'>('info');
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    if (!id) {
      setError("Customer ID is missing.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      // Load customer info
      const customerData = await api.getCustomer(id);
      setCustomer(customerData as Customer);

      // Load conversations
      const conversationsData = await api.getConversationsByCustomerId(id);
      setConversations(conversationsData.conversations as Conversation[]);

      // Load reservations (if endpoint exists)
      // const reservationsResponse = await fetch(`http://localhost:3001/api/admin/customers/${id}/reservations`);
      // if (reservationsResponse.ok) {
      //   const reservationsData = await reservationsResponse.json();
      //   setReservations(reservationsData.reservations || []);
      // }
    } catch (err: any) {
      console.error('Error loading customer data:', err);
      setError('Error loading customer data.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: number) => {
    if (!confirm('Bu konuşmayı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/admin/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      } else {
        alert('Konuşma silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Konuşma silinirken bir hata oluştu.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  const fetchConversationMessages = async (conversationId: string) => {
    if (!id) return;
    try {
      // Fetch full conversation details
      const detailedConversation = await api.getConversation(conversationId);
      setSelectedConversation({ id: conversationId, messages: detailedConversation as Conversation[] });
    } catch (err: any) {
      console.error('Error fetching conversation messages:', err);
      alert('Konuşma detaylarını yüklerken bir hata oluştu.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Müşteri Bulunamadı</h2>
          <button
            onClick={() => navigate('/customers')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Müşteri Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.name} {customer.surname || ''}
            </h1>
            <p className="text-gray-600">{customer.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {customer.is_premium && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Star className="w-4 h-4 mr-1" />
              Premium
            </span>
          )}
          {customer.is_verified && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Doğrulanmış
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bilgiler
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conversations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Konuşmalar ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reservations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rezervasyonlar ({customer.reservation_count})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Ad Soyad</p>
                  <p className="font-medium">{customer.name} {customer.surname || ''}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">E-posta</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              
              {customer.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kayıt Tarihi</p>
                  <p className="font-medium">{formatDate(customer.created_at)}</p>
                </div>
              </div>
              
              {customer.last_login && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Son Giriş</p>
                    <p className="font-medium">{formatDate(customer.last_login)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{customer.message_count}</div>
                <div className="text-sm text-blue-600">Mesaj Sayısı</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{customer.reservation_count}</div>
                <div className="text-sm text-green-600">Rezervasyon</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center col-span-2">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(customer.total_spent)}</div>
                <div className="text-sm text-purple-600">Toplam Harcama</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conversations' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Konuşma Geçmişi</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Henüz konuşma bulunmuyor.
              </div>
            ) : (
              conversations.map((conversation) => (
                <div key={conversation.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-2">
                        {formatDate(conversation.created_at)} • Session: {conversation.session_id}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Kullanıcı:</div>
                        <div className="text-gray-900">{conversation.user_message}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-700 mb-1">LOVE AI:</div>
                        <div className="text-gray-900 whitespace-pre-wrap">{conversation.ai_response}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteConversation(conversation.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Konuşmayı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Rezervasyonlar</h3>
          </div>
          <div className="p-6 text-center text-gray-500">
            Rezervasyon sistemi henüz entegre edilmedi.
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail; 