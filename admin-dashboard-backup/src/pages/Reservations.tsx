import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { api } from '../services/api'

export default function Reservations() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['reservations', page, statusFilter],
    queryFn: () => api.getReservations(page, 10, statusFilter),
  })

  const reservations = reservationsData?.reservations || []
  const total = reservationsData?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlar</h1>
          <p className="text-gray-600">Rezervasyonları yönetin</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarDaysIcon className="h-5 w-5" />
          <span>Toplam {total} rezervasyon</span>
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
            <option value="confirmed">Onaylandı</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="completed">Tamamlandı</option>
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
                  <th>Müşteri</th>
                  <th>Paket</th>
                  <th>Tarih</th>
                  <th>Misafir</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation, index) => (
                  <motion.tr
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td>
                      <div>
                        <div className="font-medium">{reservation.customer?.name}</div>
                        <div className="text-sm text-gray-500">{reservation.customer?.email}</div>
                      </div>
                    </td>
                    <td>{reservation.package?.name}</td>
                    <td>
                      <div className="text-sm">
                        <div>{reservation.check_in}</div>
                        <div className="text-gray-500">→ {reservation.check_out}</div>
                      </div>
                    </td>
                    <td>{reservation.guests} kişi</td>
                    <td>₺{reservation.total_amount.toLocaleString()}</td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {reservation.status === 'confirmed' ? 'Onaylandı' :
                         reservation.status === 'pending' ? 'Beklemede' :
                         reservation.status === 'cancelled' ? 'İptal' :
                         'Tamamlandı'}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button className="text-cappalove-600 hover:text-cappalove-700 text-sm">
                          Görüntüle
                        </button>
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          Düzenle
                        </button>
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