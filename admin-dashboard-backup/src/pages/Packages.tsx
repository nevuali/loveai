import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CubeIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { api, Package } from '../services/api'

interface PackageFormData {
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
}

export default function Packages() {
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    description: '',
    price: 0,
    original_price: 0,
    room_type: '',
    features: [],
    duration_nights: 2,
    duration_days: 3,
    location: 'Kapadokya, Türkiye',
    is_active: true
  })

  const queryClient = useQueryClient()

  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => api.getPackages(),
  })

  const createMutation = useMutation({
    mutationFn: (data: PackageFormData) => api.createPackage(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setShowModal(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: PackageFormData }) => 
      api.updatePackage(id.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setShowModal(false)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePackage(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      original_price: 0,
      room_type: '',
      features: [],
      duration_nights: 2,
      duration_days: 3,
      location: 'Kapadokya, Türkiye',
      is_active: true
    })
    setEditingPackage(null)
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      original_price: pkg.original_price,
      room_type: pkg.room_type,
      features: pkg.features,
      duration_nights: pkg.duration_nights,
      duration_days: pkg.duration_days,
      location: pkg.location,
      is_active: pkg.is_active
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: number) => {
    if (confirm('Bu paketi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id)
    }
  }

  const packages = packagesData?.packages || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paketler</h1>
          <p className="text-gray-600">CappaLove paketlerini yönetin</p>
        </div>
        <button 
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yeni Paket Ekle</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cappalove-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages?.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-cappalove-600 flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                    <p className="text-sm text-gray-500">{pkg.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cappalove-600">₺{pkg.price.toLocaleString()}</div>
                  {pkg.original_price && (
                    <div className="text-sm text-gray-500 line-through">₺{pkg.original_price.toLocaleString()}</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Süre:</span>
                  <span className="ml-2 text-sm text-gray-600">{pkg.duration_nights} gece / {pkg.duration_days} gün</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Oda Tipi:</span>
                  <span className="ml-2 text-sm text-gray-600">{pkg.room_type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Açıklama:</span>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{pkg.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Özellikler:</div>
                <div className="space-y-1">
                  {pkg.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-cappalove-600 mr-2"></div>
                      {feature}
                    </div>
                  ))}
                  {pkg.features.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{pkg.features.length - 3} özellik daha
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button 
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 btn-primary py-2 text-sm flex items-center justify-center space-x-1"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Düzenle</span>
                </button>
                <button 
                  onClick={() => handleDelete(pkg.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 text-sm rounded-lg flex items-center justify-center space-x-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Sil</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPackage ? 'Paket Düzenle' : 'Yeni Paket Ekle'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paket Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oda Tipi
                  </label>
                  <input
                    type="text"
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orijinal Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gece Sayısı
                  </label>
                  <input
                    type="number"
                    value={formData.duration_nights}
                    onChange={(e) => setFormData({ ...formData, duration_nights: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gün Sayısı
                  </label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasyon
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Özellikler (her satıra bir özellik)
                </label>
                <textarea
                  value={formData.features.join('\n')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cappalove-500 focus:border-transparent"
                  placeholder="2 gece konaklama&#10;Balayı süslemesi&#10;Kahvaltı dahil"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-cappalove-600 focus:ring-cappalove-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Aktif paket
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-cappalove-600 hover:bg-cappalove-700 rounded-lg disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 