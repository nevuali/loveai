import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  UsersIcon, 
  CalendarDaysIcon,
  CreditCardIcon,
  CubeIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Conversations', href: '/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Reservations', href: '/reservations', icon: CalendarDaysIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Packages', href: '/packages', icon: CubeIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-xl shadow-xl border-r border-slate-200/60 lg:hidden"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/60">
                <div className="flex items-center space-x-3">
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
                    className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center"
                  >
                    <HeartIcon className="h-4 w-4 text-white" />
                  </motion.div>
                  <span className="text-xl font-bold text-slate-800">AI LOVVE</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-6 px-3">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl mb-2 transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-100 text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-xl border-r border-slate-200/60 shadow-sm">
          <div className="flex h-16 items-center px-6 border-b border-slate-200/60">
            <div className="flex items-center space-x-3">
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
                className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center"
              >
                <HeartIcon className="h-4 w-4 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-slate-800">AI LOVVE</span>
            </div>
          </div>
          <nav className="mt-6 flex-1 px-3 pb-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl mb-2 transition-all duration-200 hover:scale-[1.02] ${
                    isActive
                      ? 'bg-slate-100 text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Admin info at bottom */}
          <div className="p-4 border-t border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Admin</div>
                  <div className="text-xs text-slate-500">Administrator</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors lg:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-500 bg-slate-100/80 px-3 py-1 rounded-lg">
                Admin Dashboard
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <span className="text-white text-sm font-medium">AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 