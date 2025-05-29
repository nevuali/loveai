import React, { useState } from 'react';
import { X, MessageCircle, Send, User, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
    email: user?.email || ''
  });
  
  const [isSending, setIsSending] = useState(false);

  const categories = [
    { value: 'general', label: 'General Question' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'account', label: 'Account Management' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' }
  ];

  const priorities = [
    { value: 'low', label: 'Low - General inquiry' },
    { value: 'medium', label: 'Medium - Needs attention' },
    { value: 'high', label: 'High - Urgent issue' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      // TODO: Send support ticket to backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      
      toast({
        title: "Support Ticket Created",
        description: "We've received your message and will respond within 24 hours",
      });
      onClose();
      setFormData({
        subject: '',
        category: 'general',
        priority: 'medium',
        message: '',
        email: user?.email || ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send support ticket",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2f2f2f] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3f3f3f]">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-medium text-white">Contact Support</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3f3f3f] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-6 border-b border-[#3f3f3f]">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium mb-1">Response Time</p>
              <p className="text-xs text-blue-200">
                We typically respond within 24 hours. For urgent issues, we'll prioritize your request.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none h-32"
              placeholder="Please describe your issue in detail..."
              required
            />
          </div>

          {/* Support Info */}
          <div className="bg-[#1f1f1f] rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Support Team Info</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p>• Response time: Within 24 hours</p>
              <p>• Available: Monday - Friday, 9 AM - 6 PM (EST)</p>
              <p>• Emergency support: High priority tickets only</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#3f3f3f] text-gray-300 rounded-lg hover:bg-[#4f4f4f] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !formData.subject.trim() || !formData.message.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactSupportModal; 