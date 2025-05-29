import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { api, GeminiConversation } from '../services/api'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function Messages() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  const { data: conversationsData, isLoading, refetch } = useQuery({
    queryKey: ['conversations', page, search],
    queryFn: () => api.getConversations(page, 10, search),
    keepPreviousData: true,
  })

  const { data: conversationDetails } = useQuery({
    queryKey: ['conversation-details', selectedConversation],
    queryFn: () => selectedConversation ? api.getConversation(selectedConversation) : null,
    enabled: !!selectedConversation,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  const handleDeleteConversation = async (id: number) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await api.deleteConversation(id.toString())
        refetch()
      } catch (error) {
        console.error('Error deleting conversation:', error)
      }
    }
  }

  const conversations = conversationsData?.conversations || []
  const total = conversationsData?.total || 0
  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Conversations</h1>
            <p className="text-slate-600 mt-1">Manage AI LOVVE conversations</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-100/80 px-4 py-2 rounded-xl">
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span>Total {total} conversations</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email, session ID or message content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent"
            />
          </div>
          <button 
            type="submit" 
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800">Conversations</h3>
            </div>
            
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                <p className="mt-2 text-slate-500">Loading...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No conversations found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60">
                {conversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 hover:bg-slate-50/80 cursor-pointer transition-all duration-200 ${
                      selectedConversation === conversation.session_id 
                        ? 'bg-slate-100/80 border-l-4 border-slate-600' 
                        : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.session_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-800">
                              {conversation.customer_email || 'Anonymous User'}
                            </span>
                            <div className="text-xs text-slate-500">
                              Session: {conversation.session_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="bg-slate-50/80 p-3 rounded-lg">
                            <div className="text-xs text-slate-600 font-medium mb-1">User Message</div>
                            <p className="text-sm text-slate-800 line-clamp-2">{conversation.user_message}</p>
                          </div>
                          <div className="bg-blue-50/80 p-3 rounded-lg">
                            <div className="text-xs text-blue-600 font-medium mb-1">AI LOVVE Response</div>
                            <p className="text-sm text-slate-700 line-clamp-2">{conversation.ai_response}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(conversation.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedConversation(conversation.session_id)
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConversation(conversation.id)
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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
              <div className="px-6 py-4 border-t border-slate-200/60 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Page {page} of {totalPages} (Total {total} conversations)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Details */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800">Conversation Details</h3>
            </div>
            
            {!selectedConversation ? (
              <div className="p-6 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Select a conversation to view details</p>
              </div>
            ) : conversationDetails ? (
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {conversationDetails.map((message, index) => (
                  <div key={message.id} className="space-y-3">
                    <div className="bg-slate-50/80 p-4 rounded-xl">
                      <div className="text-xs text-slate-600 font-medium mb-2 flex items-center">
                        <UserIcon className="w-3 h-3 mr-1" />
                        User
                      </div>
                      <p className="text-sm text-slate-800">{message.user_message}</p>
                    </div>
                    <div className="bg-blue-50/80 p-4 rounded-xl">
                      <div className="text-xs text-blue-600 font-medium mb-2 flex items-center">
                        <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" />
                        AI LOVVE
                      </div>
                      <p className="text-sm text-slate-700">{message.ai_response}</p>
                    </div>
                    <div className="text-xs text-slate-500 text-center py-1">
                      {format(new Date(message.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </div>
                    {index < conversationDetails.length - 1 && (
                      <hr className="border-slate-200/60" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                <p className="mt-2 text-slate-500">Loading...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 