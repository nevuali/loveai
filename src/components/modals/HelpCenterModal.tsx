import React, { useState } from 'react';
import { X, Search, HelpCircle, ChevronRight, MessageCircle, Book, Shield, Settings } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      color: 'text-blue-500',
      articles: [
        { title: 'How to create your first honeymoon plan', description: 'Step-by-step guide to get started' },
        { title: 'Understanding AI LOVVE features', description: 'Overview of all available features' },
        { title: 'Setting up your profile', description: 'Complete your profile for better recommendations' },
      ]
    },
    {
      id: 'planning',
      title: 'Honeymoon Planning',
      icon: HelpCircle,
      color: 'text-pink-500',
      articles: [
        { title: 'How does AI recommendation work?', description: 'Understanding our AI-powered suggestions' },
        { title: 'Customizing your honeymoon preferences', description: 'Tailor recommendations to your style' },
        { title: 'Budget planning tips', description: 'Make the most of your honeymoon budget' },
        { title: 'Best time to book your honeymoon', description: 'Timing tips for better deals' },
      ]
    },
    {
      id: 'account',
      title: 'Account & Settings',
      icon: Settings,
      color: 'text-purple-500',
      articles: [
        { title: 'Managing your account settings', description: 'Update preferences and profile info' },
        { title: 'Privacy and data protection', description: 'How we protect your information' },
        { title: 'Notification preferences', description: 'Control what notifications you receive' },
        { title: 'Deleting your account', description: 'Steps to remove your account' },
      ]
    },
    {
      id: 'security',
      title: 'Privacy & Security',
      icon: Shield,
      color: 'text-green-500',
      articles: [
        { title: 'How we protect your data', description: 'Our security measures and policies' },
        { title: 'Sharing your honeymoon plans', description: 'Control who can see your plans' },
        { title: 'Payment security', description: 'Safe and secure payment processing' },
      ]
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2f2f2f] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3f3f3f]">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-medium text-white">Help Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3f3f3f] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-[#3f3f3f]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help articles..."
              className="w-full bg-[#1f1f1f] text-white rounded-lg pl-10 pr-4 py-3 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {selectedCategory ? (
            // Article view
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-4"
              >
                ← Back to categories
              </button>
              {(() => {
                const category = helpCategories.find(c => c.id === selectedCategory);
                const Icon = category?.icon || HelpCircle;
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Icon className={`w-6 h-6 ${category?.color}`} />
                      <h3 className="text-xl font-medium text-white">{category?.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {category?.articles.map((article, index) => (
                        <div
                          key={index}
                          className="p-4 bg-[#1f1f1f] rounded-lg hover:bg-[#252525] transition-colors cursor-pointer"
                        >
                          <h4 className="font-medium text-white mb-2">{article.title}</h4>
                          <p className="text-sm text-gray-400">{article.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            // Categories view
            <div>
              <h3 className="text-lg font-medium text-white mb-4">How can we help you?</h3>
              <div className="grid gap-4">
                {filteredCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="p-4 bg-[#1f1f1f] rounded-lg hover:bg-[#252525] transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${category.color}`} />
                          <div>
                            <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                              {category.title}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {category.articles.length} articles
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Contact Support */}
              <div className="mt-8 p-4 bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="w-5 h-5 text-pink-500" />
                  <h4 className="font-medium text-white">Still need help?</h4>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors text-sm">
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpCenterModal; 