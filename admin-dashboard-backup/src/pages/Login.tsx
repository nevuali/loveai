import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('🔥 Firebase ile giriş başarılı!')
      navigate('/dashboard')
    } catch (error: any) {
      let errorMessage = 'Giriş yapılırken bir hata oluştu!'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı!'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Geçersiz şifre!'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi!'
      } else if (error.message === 'Admin access required') {
        errorMessage = 'Admin yetkisi gerekli!'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{
              rotate: [0, 5, 0, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <HeartIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-800">AI LOVVE</h1>
          <p className="text-slate-600 mt-2">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl p-8">
          {/* Firebase Info */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔥</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Firebase Authentication
                </h3>
                <p className="text-sm text-orange-600">
                  Güvenli ve profesyonel giriş sistemi
                </p>
              </div>
            </div>
          </div>
          
          {/* Admin Credentials Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔑</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Test Admin Giriş Bilgileri
                </h3>
                <p className="text-sm text-blue-600">
                  Email: admin@ailovve.com | Password: Admin123!
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all duration-200"
                placeholder="Email adresinizi girin"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all duration-200 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-medium focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-600"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Firebase ile giriş yapılıyor...
                </div>
              ) : (
                '🔥 Firebase ile Giriş Yap'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
} 