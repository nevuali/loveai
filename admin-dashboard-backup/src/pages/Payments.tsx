import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCardIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { api } from '../services/api'

export default function Payments() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: () => api.getPayments(page, 10, statusFilter),
  })

  const payments = paymentsData?.payments || []
  const total = paymentsData?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ödemeler</h1>
          <p className="text-gray-600">Ödeme işlemlerini yönetin</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CreditCardIcon className="h-5 w-5" />
          <span>Toplam {total} ödeme</span>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="completed">Tamamlandı</option>
            <option value="failed">Başarısız</option>
            <option value="refunded">İade Edildi</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cappalove-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ödeme ID</th>
                  <th>Müşteri</th>
                  <th>Rezervasyon</th>
                  <th>Tutar</th>
                  <th>Yöntem</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="font-mono text-sm">{payment.id.slice(0, 8)}...</td>
                    <td>
                      <div>
                        <div className="font-medium">{payment.reservation?.customer?.name}</div>
                        <div className="text-sm text-gray-500">{payment.reservation?.customer?.email}</div>
                      </div>
                    </td>
                    <td>{payment.reservation?.package?.name}</td>
                    <td className="font-semibold">₺{payment.amount.toLocaleString()}</td>
                    <td className="capitalize">{payment.payment_method}</td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {payment.status === 'completed' ? 'Tamamlandı' :
                         payment.status === 'pending' ? 'Beklemede' :
                         payment.status === 'failed' ? 'Başarısız' :
                         'İade Edildi'}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button className="text-cappalove-600 hover:text-cappalove-700 text-sm">
                          Detay
                        </button>
                        {payment.status === 'completed' && (
                          <button className="text-red-600 hover:text-red-700 text-sm">
                            İade Et
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 