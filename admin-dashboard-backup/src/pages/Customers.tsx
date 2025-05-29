import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  MagnifyingGlassIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { api, Customer } from '../services/api'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function Customers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { data: customersData, isLoading, refetch } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => api.getCustomers(page, 10, search),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        await api.deleteCustomer(id)
        refetch()
                                if (selectedCustomer?.id === Number(id)) {
          setSelectedCustomer(null)
        }
      } catch (error) {
        console.error('Müşteri silinirken hata:', error)
      }
    }
  }

  const customers = customersData?.customers || []
  const total = customersData?.total || 0
  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-gray-600">Müşteri bilgilerini yönetin</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <UsersIcon className="h-5 w-5" />
          <span>Toplam {total} müşteri</span>
        </div>
      </div>

      {/* Search */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="İsim, email veya telefon ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn-primary px-6">
            Ara
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customers List */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Müşteri Listesi</h3>
            </div>
            
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cappalove-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Yükleniyor...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-6 text-center">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz müşteri bulunmuyor</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id ? 'bg-cappalove-50 border-l-4 border-cappalove-600' : ''
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="h-10 w-10 rounded-full bg-cappalove-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{customer.name}</h4>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-3 w-3 mr-1" />
                                {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="flex items-center">
                                  <PhoneIcon className="h-3 w-3 mr-1" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Rezervasyon:</span>
                            <span className="ml-1 font-medium">{customer.reservation_count}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Toplam Harcama:</span>
                            <span className="ml-1 font-medium">₺{customer.total_spent.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Kayıt:</span>
                            <span className="ml-1 font-medium">
                              {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          to={`/customers/${customer.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-400 hover:text-cappalove-600 transition-colors"
                          title="Detayları görüntüle"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Edit functionality would go here
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Düzenle"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCustomer(customer.id.toString())
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Sil"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Sayfa {page} / {totalPages} (Toplam {total} müşteri)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Müşteri Detayları</h3>
            </div>
            
            {!selectedCustomer ? (
              <div className="p-6 text-center">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Detayları görmek için bir müşteri seçin</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-cappalove-600 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl font-medium">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedCustomer.name}</h4>
                  <p className="text-sm text-gray-500">Müşteri ID: {selectedCustomer.id}</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">İletişim Bilgileri</h5>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{selectedCustomer.email}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center text-sm">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{selectedCustomer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">İstatistikler</h5>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Toplam Rezervasyon</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedCustomer.reservation_count}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Toplam Harcama</div>
                      <div className="text-lg font-semibold text-gray-900">₺{selectedCustomer.total_spent.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Kayıt Tarihi</div>
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(selectedCustomer.created_at), 'dd MMMM yyyy', { locale: tr })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button className="w-full btn-primary py-2">
                    Müşteriyi Düzenle
                  </button>
                  <button className="w-full btn-secondary py-2">
                    Rezervasyon Geçmişi
                  </button>
                  <button className="w-full btn-secondary py-2">
                    Mesaj Geçmişi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 