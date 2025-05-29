import React, { useState } from 'react';
import { X, MessageSquare, Send, Star, Heart, ThumbsUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    type: 'general',
    rating: 0,
    title: '',
    message: '',
    email: user?.email || ''
  });
  
  const [isSending, setIsSending] = useState(false);

  const feedbackTypes = [
    { value: 'general', label: 'General Feedback', emoji: '💭' },
    { value: 'feature', label: 'Feature Request', emoji: '✨' },
    { value: 'bug', label: 'Bug Report', emoji: '🐛' },
    { value: 'ui', label: 'UI/UX Improvement', emoji: '🎨' },
    { value: 'performance', label: 'Performance Issue', emoji: '⚡' },
    { value: 'compliment', label: 'Compliment', emoji: '❤️' }
  ];

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      // TODO: Send feedback to backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      
      toast({
        title: "Feedback Sent! 💝",
        description: "Thank you for helping us improve AI LOVVE",
      });
      onClose();
      setFormData({
        type: 'general',
        rating: 0,
        title: '',
        message: '',
        email: user?.email || ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send feedback",
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
            <MessageSquare className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-medium text-white">Send Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3f3f3f] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Header Message */}
        <div className="p-6 border-b border-[#3f3f3f]">
          <div className="text-center">
            <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-white mb-2">We Love Your Input!</h3>
            <p className="text-sm text-gray-400">
              Your feedback helps us create the perfect honeymoon planning experience. 
              Every suggestion matters! ✨
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              What type of feedback do you have?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.type === type.value 
                      ? 'border-pink-500 bg-pink-500/10 text-pink-300' 
                      : 'border-[#3f3f3f] hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{type.emoji}</div>
                  <div className="text-xs">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              How would you rate your experience?
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="p-1 transition-colors hover:scale-110"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= formData.rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-500'
                    }`} 
                  />
                </button>
              ))}
            </div>
            {formData.rating > 0 && (
              <p className="text-center text-sm text-gray-400 mt-2">
                {formData.rating === 1 && "We're sorry to hear that 😔"}
                {formData.rating === 2 && "Help us improve! 🤔"}
                {formData.rating === 3 && "Thanks for the feedback! 👍"}
                {formData.rating === 4 && "We're glad you like it! 😊"}
                {formData.rating === 5 && "You're amazing! Thank you! 🥰"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 border border-[#3f3f3f] focus:border-pink-500 focus:outline-none"
              placeholder="Brief summary of your feedback"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Feedback
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 border border-[#3f3f3f] focus:border-pink-500 focus:outline-none h-32"
              placeholder="Tell us what you think... Every detail helps! 💭"
              required
            />
          </div>

          {/* Incentive Message */}
          <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <ThumbsUp className="w-5 h-5 text-pink-500" />
              <h4 className="text-sm font-medium text-white">Why feedback matters</h4>
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Helps us add features you actually want</li>
              <li>• Makes AI LOVVE more romantic and intuitive</li>
              <li>• Creates the perfect honeymoon planning experience</li>
              <li>• Shows us what's working (and what's not!)</li>
            </ul>
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
              disabled={isSending || !formData.message.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal; 