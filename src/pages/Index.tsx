import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, Menu, MoreVertical, Mic, Search, Image, Video, FileText, Palette, X, LogOut, User, Settings, Activity, MapPin, ChevronDown, Heart, Star, Sparkles, Crown, Zap, MessageSquare, Edit, Plus } from 'lucide-react';
import { generateGeminiStream, getChatHistory } from '../services/geminiService';
import { authService } from '../services/authService';
import PackageCard from '../components/PackageCard';
import { packageService, HoneymoonPackage } from '../services/packageService';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isThinking?: boolean;
  packages?: HoneymoonPackage[];
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  sessionId: string;
};

type ModelType = 'ai-lovv3' | 'ai-lovv2';

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Kullanıcının baş harfini al
  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '👤';
  };

  // Premium degrade rengi üret (kullanıcı email'ine göre sabit)
  const getUserGradient = () => {
    const email = user?.email || 'default';
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const gradients = [
      'from-purple-500 via-pink-500 to-cyan-500',
      'from-blue-500 via-purple-500 to-pink-500', 
      'from-emerald-500 via-cyan-500 to-blue-500',
      'from-yellow-500 via-orange-500 to-red-500',
      'from-indigo-500 via-purple-500 to-pink-500',
      'from-pink-500 via-rose-500 to-orange-500',
      'from-cyan-500 via-teal-500 to-green-500',
      'from-violet-500 via-purple-500 to-indigo-500'
    ];
    
    return gradients[Math.abs(hash) % gradients.length];
  };
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('ai-lovv3');
  const [userLocation, setUserLocation] = useState('Turkey, Istanbul');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentEmoji] = useState(() => {
    const emojis = ['💖', '✨', '💫', '🌟', '💎', '👑', '🌹', '💝'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  });
  const [currentGreeting] = useState(() => {
    const name = user?.displayName?.split(' ')[0] || 'soul';
    const greetings = [
      `Greetings, beloved ${name}`,
      `Welcome, magnificent ${name}`,
      `Salutations, divine ${name}`,
      `Enchanted to see you, radiant ${name}`,
      `Blessings upon you, precious ${name}`,
      `Hail, exquisite ${name}`,
      `Good fortune to you, cherished ${name}`,
      `Royal greetings, noble ${name}`,
      `Celestial welcome, luminous ${name}`,
      `Sacred blessings, treasured ${name}`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  });
  const [currentSubtitle] = useState(() => {
    const subtitles = [
      "Begin crafting your dream honeymoon with AI LOVVE's luxury planning",
      "Let's design your perfect romantic escape together - start planning now",
      "Transform your honeymoon dreams into reality with our expert guidance",
      "Create an unforgettable honeymoon journey - tell us your desires",
      "Start planning your once-in-a-lifetime romantic adventure today",
      "Let AI LOVVE curate your personalized honeymoon masterpiece",
      "Begin your honeymoon planning journey with our luxury concierge",
      "Share your romantic vision and we'll craft your perfect getaway"
    ];
    return subtitles[Math.floor(Math.random() * subtitles.length)];
  });
  const [currentNewChatTitle, setCurrentNewChatTitle] = useState(() => {
    const titles = [
      "Weave New Love Story",
      "Create Magic Together", 
      "Begin Sacred Journey",
      "Craft Dream Escape",
      "Start Romance Chapter",
      "Design Love Adventure",
      "Open Heart's Desires",
      "Launch Eternal Quest",
      "Summon Love Magic",
      "Begin Enchantment"
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  });
  const [isMobile, setIsMobile] = useState(false);

  // Parse package recommendations from AI response
  const parsePackageRecommendations = async (responseContent: string): Promise<HoneymoonPackage[]> => {
    try {
      // Look for **SHOW_PACKAGES:xxx** patterns in the response
      const packageMatches = responseContent.match(/\*\*SHOW_PACKAGES:([^*]+)\*\*/g);
      
      if (!packageMatches) {
        return [];
      }

      const allPackages: HoneymoonPackage[] = [];
      
      for (const match of packageMatches) {
        // Extract the parameter (category, location, or "featured")
        const param = match.replace(/\*\*SHOW_PACKAGES:|\*\*/g, '').trim();
        
        let packages: HoneymoonPackage[] = [];
        
        if (param.toLowerCase() === 'featured') {
          packages = await packageService.getFeaturedPackages();
        } else if (['luxury', 'romantic', 'adventure', 'cultural', 'beach', 'city'].includes(param.toLowerCase())) {
          packages = await packageService.getPackagesByCategory(param.toLowerCase());
        } else {
          // Assume it's a location
          packages = await packageService.getPackagesByLocation(param);
        }
        
        // Add packages avoiding duplicates
        packages.forEach(pkg => {
          if (!allPackages.find(existing => existing.id === pkg.id)) {
            allPackages.push(pkg);
          }
        });
      }
      
      // Limit to 6 packages maximum for clean display
      return allPackages.slice(0, 6);
      
    } catch (error) {
      console.error('Error parsing package recommendations:', error);
      return [];
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // New Chat ismini düzenli olarak güncelle
  useEffect(() => {
    const updateNewChatTitle = () => {
      setCurrentNewChatTitle(getRandomNewChatTitle());
    };
    
    // İlk yüklemede hemen güncelle
    updateNewChatTitle();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(updateNewChatTitle, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter chats based on search query
  useEffect(() => {
    performMagicalSearch(searchQuery);
  }, [chats, searchQuery]);

  // Initialize session and load chat history
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get session ID from auth service
        const sessionId = await authService.getChatSessionId();
        setCurrentSessionId(sessionId);
        
        // Load chat history from Firebase
        await loadChatHistory(sessionId);
        
      } catch (error) {
        console.error('Error initializing app:', error);
        // Sessizce logla, toast gösterme
      }
    };

    initializeApp();
  }, [user]);

  // Load chat history from Firebase
  const loadChatHistory = async (sessionId: string) => {
    if (!sessionId) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await getChatHistory(sessionId, 20);
      
      if (history && history.length > 0) {
        // Convert Firebase history to frontend format
        const convertedHistory: Message[] = history.map((msg: any) => ({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.parts?.[0]?.text || msg.content || '',
          timestamp: msg.createdAt || new Date().toISOString()
        }));

        // Create a chat from history
        const chatId = sessionId;
        const chatTitle = convertedHistory[0]?.content.slice(0, 30) + '...' || '💬 Yeni Sohbet';
        
        const loadedChat: Chat = {
          id: chatId,
          title: chatTitle,
          messages: convertedHistory,
          lastMessage: '📱 Firebase\'den yüklendi',
          sessionId: sessionId
        };

        // Check if chat already exists to prevent duplicates
        setChats(prev => {
          const existingChatIndex = prev.findIndex(chat => chat.id === chatId);
          if (existingChatIndex >= 0) {
            // Update existing chat
            const updatedChats = [...prev];
            updatedChats[existingChatIndex] = loadedChat;
            return updatedChats;
          } else {
            // Add new chat
            return [loadedChat];
          }
        });
        setCurrentChatId(chatId);
        setMessages(convertedHistory);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Don't show error toast for empty history
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Get user location with enhanced accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode this
          setUserLocation('🌍 Gölyüzü, Bolu Merkez/Bolu, Turkey');
        },
        () => {
          setUserLocation('📍 Konum mevcut değil');
        }
      );
    }
  }, []);

  // Close menus when clicking outside with enhanced UX
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (profileMenuOpen && !target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
      if (modelMenuOpen && !target.closest('.model-menu-container')) {
        setModelMenuOpen(false);
      }
      if (settingsMenuOpen && !target.closest('.settings-menu-container')) {
        setSettingsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, modelMenuOpen, settingsMenuOpen]);

  const createNewChat = async () => {
    try {
      // Her yeni chat için yeni büyülü isim
      const newMagicalTitle = getRandomNewChatTitle();
      setCurrentNewChatTitle(newMagicalTitle);
      
      // Büyülü efekt - sidebar'ı kapat
      setSidebarOpen(false);
      
      // Get new session ID for new chat
      const newSessionId = await authService.getChatSessionId();
      const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newChat: Chat = {
        id: newChatId,
        title: newMagicalTitle,
        messages: [],
        lastMessage: 'Now',
        sessionId: newSessionId
      };
      
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      setCurrentSessionId(newSessionId);
      setMessages([]);
      
      console.log(`✨ New magical chat created: ${newMagicalTitle}`);
      
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setCurrentSessionId(chat.sessionId);
      setMessages(chat.messages);
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    const newUserMessage: Message = { 
      role: 'user', 
      content, 
      timestamp: new Date().toISOString()
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, newUserMessage]);

    // Add typing indicator
    const typingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: true
    };
    setMessages(prev => [...prev, typingMessage]);

    // If no current chat, create one
    let sessionId = currentSessionId;
    let chatId = currentChatId;
    
    if (!currentChatId) {
      sessionId = await authService.getChatSessionId();
      chatId = sessionId;
      
      // Check if chat with this ID already exists
      const existingChat = chats.find(chat => chat.id === chatId);
      if (existingChat) {
        console.log('Using existing chat instead of creating duplicate');
        setCurrentChatId(chatId);
        setCurrentSessionId(sessionId);
        // Update existing chat with new message
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? {...chat, messages: [...chat.messages, newUserMessage], lastMessage: 'Now'}
            : chat
        ));
      } else {
        const newChat: Chat = {
          id: chatId,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [newUserMessage],
          lastMessage: 'Now',
          sessionId: sessionId
        };
        
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(chatId);
        setCurrentSessionId(sessionId);
      }
    } else {
      // Update existing chat
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {...chat, messages: [...chat.messages, newUserMessage], lastMessage: 'Now'}
          : chat
      ));
    }

    setInputValue('');

    try {
      // Use Firebase Functions to generate response and save to Firestore
      let responseContent = '';
      const userId = user?.uid || null;
      
      // Pass selected model to generateGeminiStream
      for await (const chunk of generateGeminiStream([...messages, newUserMessage], sessionId, userId, selectedModel)) {
        responseContent += chunk;
        
        // Update the typing message with current content
        setMessages(prev => prev.map((msg, index) => 
          index === prev.length - 1 && msg.isThinking 
            ? { ...msg, content: responseContent, isThinking: false }
            : msg
        ));
      }
      
      // Final message without thinking indicator
      const assistantMessage: Message = {
        role: 'assistant', 
        content: responseContent, 
        timestamp: new Date().toISOString(),
        isThinking: false
      };

      // Parse package recommendations from response
      const packages = await parsePackageRecommendations(responseContent);
      if (packages.length > 0) {
        assistantMessage.packages = packages;
      }

      // Replace typing indicator with final message
      setMessages(prev => prev.slice(0, -1).concat(assistantMessage));
      
      // Update chat in chats array
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? {...chat, messages: [...chat.messages, assistantMessage]}
          : chat
      ));

    } catch (e: any) {
      // Remove user message and typing indicator on error
      setMessages(prev => prev.slice(0, prev.length - 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const openSettings = () => {
    navigate('/settings');
  };

  const openActivity = () => {
    // Activity sayfası geliştiriliyor, sessizce işle
    console.log('Activity page is under development...');
  };

  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
    setModelMenuOpen(false);
    // Toast yerine sessizce model değiştir
    console.log(`Model changed to: ${model === 'ai-lovv3' ? 'Advanced AI' : 'Fast AI'}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // Sessizce logla, toast gösterme
    }
  };

  // Büyülü arama fonksiyonları
  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchInput('');
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setIsSearching(true);
    
    // Büyülü arama gecikme efekti
    setTimeout(() => {
      setSearchQuery(value);
      setIsSearching(false);
    }, 300);
  };

  const performMagicalSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredChats(chats);
      return;
    }

    setIsSearching(true);
    
    // Büyülü arama algoritması
    setTimeout(() => {
      const filtered = chats.filter(chat => 
        chat.title.toLowerCase().includes(query.toLowerCase()) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(query.toLowerCase())
        )
      );
      setFilteredChats(filtered);
      setIsSearching(false);
      console.log(`✨ Magical search found ${filtered.length} treasures for: "${query}"`);
    }, 200);
  };

  const clearMagicalSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsSearching(false);
    setFilteredChats(chats);
    console.log('🧹 Search magic cleared');
  };

  const suggestionPrompts = [
    {
      title: "Plan romantic honeymoon in Paris",
      description: "Get detailed itinerary with romantic spots"
    },
    {
      title: "Budget-friendly honeymoon destinations", 
      description: "Find affordable romantic getaways"
    },
    {
      title: "Tropical honeymoon packing list",
      description: "What to pack for beach destinations"
    },
    {
      title: "European honeymoon itinerary",
      description: "Multi-city romantic tour planning"
    }
  ];

  // Rastgele büyülü New Chat isimleri
  const getRandomNewChatTitle = () => {
    const titles = [
      "Weave New Love Story",
      "Create Magic Together", 
      "Begin Sacred Journey",
      "Craft Dream Escape",
      "Start Romance Chapter",
      "Design Love Adventure",
      "Open Heart's Desires",
      "Launch Eternal Quest",
      "Summon Love Magic",
      "Begin Enchantment"
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`gemini-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Top */}
        <div className="gemini-sidebar-top">
          <div className="gemini-sidebar-menu">
            <button
              onClick={() => setSidebarOpen(true)}
              className="gemini-menu-button mobile-menu-button flex-shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={handleSearchToggle}
              className={`gemini-search-icon ${isSearchOpen ? 'active' : ''}`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          {/* Büyülü Arama Kutusu */}
          {isSearchOpen && (
            <div className="gemini-search-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#f1c40f', fontSize: '11px', fontWeight: '500' }}>🔮 Magical Search</span>
                <button 
                  onClick={handleSearchToggle}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#9aa0a6', 
                    cursor: 'pointer', 
                    padding: '2px',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search magical conversations..."
                  className="gemini-search-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      performMagicalSearch(searchInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => performMagicalSearch(searchInput)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    color: '#9aa0a6',
                    opacity: '0.7',
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  🔍
                </button>
              </div>
              {isSearching && (
                <div className="gemini-search-loading">
                  <span>🔮 Searching...</span>
                </div>
              )}
            </div>
          )}
          
          <div className="gemini-new-chat-container">
            <button onClick={createNewChat} className="gemini-new-chat">
              <Edit className="w-4 h-4" />
              <span>{currentNewChatTitle}</span>
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="gemini-sidebar-section">
          <span>Suggestions</span>
        </div>
        
        <div className="gemini-chat-list">
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Plan romantic Paris honeymoon")}
          >
            <Heart className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Romantic Paris Honeymoon</span>
          </div>
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Budget honeymoon destinations under $5000")}
          >
            <MapPin className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Budget Honeymoon Destinations</span>
          </div>
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Best time to visit Maldives for honeymoon")}
          >
            <Sparkles className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Maldives Honeymoon Guide</span>
          </div>
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Romantic surprises for honeymoon")}
          >
            <Crown className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Romantic Surprise Ideas</span>
          </div>
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Greek islands honeymoon itinerary")}
          >
            <Star className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Greek Islands Honeymoon</span>
          </div>
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Tuscany wine honeymoon tour")}
          >
            <Zap className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Tuscany Wine Honeymoon</span>
          </div>
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Swiss Alps winter honeymoon")}
          >
            <Sparkles className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Swiss Alps Winter Romance</span>
          </div>
          <div 
            className="gemini-chat-item" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleSendMessage("Bali temple honeymoon experience")}
          >
            <Heart className="gem-icon w-4 h-4 flex-shrink-0" />
            <span>Bali Temple Honeymoon</span>
          </div>
        </div>

        <div className="gemini-sidebar-section">
          <span>History</span>
        </div>
        
        <div className="gemini-chat-list">
          {isLoadingHistory ? (
            <div className="gemini-chat-item">
              <span>Weaving magic...</span>
            </div>
          ) : (searchInput ? filteredChats : chats).length > 0 ? (
            (searchInput ? filteredChats : chats).map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`gemini-chat-item truncate ${chat.id === currentChatId ? 'active' : ''}`}
                title={chat.title}
              >
                {chat.title}
              </div>
            ))
          ) : searchInput ? (
            <div className="gemini-chat-item">
              <span>🔮 No magical conversations found...</span>
            </div>
          ) : (
            <>
              <div className="gemini-chat-item truncate">
                <span>Journey to Forever Begins...</span>
              </div>
              <div className="gemini-chat-item truncate">
                <span>How May Love Guide You?</span>
              </div>
              <div className="gemini-chat-item truncate">
                <span>Whispers of the Heart</span>
              </div>
              <div className="gemini-chat-item truncate">
                <span>Crafting Eternal Memories...</span>
              </div>
              <div className="gemini-chat-item truncate">
                <span>Painting Dreams Together...</span>
              </div>
            </>
          )}
          
          <div className="gemini-sidebar-section">
            <button className="flex items-center w-full text-left text-sm">
              <span>Reveal more magic</span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="gemini-sidebar-footer">
          <div className="flex items-center justify-center">
            <button 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-lg transition-colors w-full justify-center sm:justify-start"
            >
              <Settings className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-400">Sacred settings & guidance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="gemini-main">
        {/* Header */}
        <div className="gemini-header">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="gemini-menu-button mobile-menu-button flex-shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="gemini-title truncate">
              AI LOVVE
            </div>
            
            <div className="model-menu-container relative flex-shrink-0">
              <button
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className="gemini-model-selector"
              >
                <span className="hidden md:inline">
                  {selectedModel === 'ai-lovv3' ? 'ai-lovv3' : 'ai-lovv2'}
                </span>
                <span className="md:hidden">
                  {selectedModel === 'ai-lovv3' ? 'v3' : 'v2'}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              
              {modelMenuOpen && (
                <div className="gemini-model-dropdown">
                  <button
                    onClick={() => handleModelChange('ai-lovv3')}
                    className="gemini-model-dropdown-item"
                  >
                    ai-lovv3
                  </button>
                  <button
                    onClick={() => handleModelChange('ai-lovv2')}
                    className="gemini-model-dropdown-item"
                  >
                    ai-lovv2
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">PRO</span>
            <div className="profile-menu-container relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="gemini-profile hover:ring-2 hover:ring-blue-400 transition-all text-sm sm:text-base"
              >
                {getUserInitial()}
              </button>
              
              {profileMenuOpen && (
                <div className="gemini-dropdown-menu" style={{ top: '100%', right: 0, marginTop: '8px' }}>
                  <div className="gemini-dropdown-header">
                    <div className="user-name truncate">{user?.displayName || 'Beloved User'}</div>
                    <div className="user-email truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setProfileMenuOpen(false);
                    }}
                    className="gemini-dropdown-item"
                  >
                    <User className="w-4 h-4" />
                    Profile settings
                  </button>
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(!settingsMenuOpen);
                      setProfileMenuOpen(false);
                    }}
                    className="gemini-dropdown-item"
                  >
                    <Settings className="w-4 h-4" />
                    Preferences
                  </button>
                  <div className="gemini-dropdown-separator"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileMenuOpen(false);
                    }}
                    className="gemini-dropdown-item danger"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages or Welcome */}
        {messages.length === 0 ? (
          <div className="gemini-welcome px-4 sm:px-8">
            <div className="gemini-welcome-title text-center text-2xl sm:text-3xl lg:text-4xl">
              {currentGreeting} {currentEmoji}
            </div>
            <div className="gemini-welcome-subtitle text-center text-sm sm:text-base lg:text-lg max-w-3xl mx-auto">
              {currentSubtitle}
            </div>
          </div>
        ) : (
          <div className="gemini-messages px-3 sm:px-6 lg:px-8">
            {messages.map((message, index) => (
              <div key={index} className="gemini-message">
                {message.role === 'user' ? (
                  <div className="gemini-message-user text-sm sm:text-base">
                    {message.content}
                  </div>
                ) : (
                  <div className="gemini-message-assistant text-sm sm:text-base">
                    <div className="message-content" style={{ 
                      whiteSpace: 'pre-wrap', 
                      lineHeight: '1.6',
                      wordSpacing: '0.1em'
                    }}>
                      {message.content
                        .replace(/\*\*SHOW_PACKAGES:[^*]+\*\*/g, '') // Remove package commands from display
                        .split('\n\n')
                        .map((paragraph, index) => (
                          <p key={index} style={{ 
                            marginBottom: index === message.content.replace(/\*\*SHOW_PACKAGES:[^*]+\*\*/g, '').split('\n\n').length - 1 ? '0' : '16px',
                            textAlign: 'left'
                          }}>
                            {paragraph.trim()}
                          </p>
                        ))
                      }
                    </div>
                    
                    {/* Package Cards */}
                    {message.packages && message.packages.length > 0 && (
                      <div className="package-cards-container">
                        <div className="package-cards-header">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          <h3 className="text-lg font-semibold text-white">
                            ✨ Curated Honeymoon Experiences
                          </h3>
                        </div>
                        <div className="package-cards-grid">
                          {message.packages.map((pkg) => (
                            <PackageCard
                              key={pkg.id}
                              package={pkg}
                              compact={true}
                              onSelect={(packageId) => {
                                console.log('Package selected:', packageId);
                                // Here you could open a detailed view or add to favorites
                              }}
                            />
                          ))}
                        </div>
                        <div className="package-cards-footer">
                          <p className="text-sm text-gray-400">
                            💫 Tap any package to explore magical details
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="gemini-thinking">
                <div className="gemini-dots">
                  <div className="gemini-dot"></div>
                  <div className="gemini-dot"></div>
                  <div className="gemini-dot"></div>
                </div>
                <span className="hidden sm:inline">AI LOVVE is conjuring magic...</span>
                <span className="sm:hidden">Thinking...</span>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="gemini-input-container px-3 sm:px-6 lg:px-8">
          <div className="gemini-toolbox">
            <button
              type="button"
              className="gemini-toolbox-button"
              disabled={isLoading}
            >
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Love's Symphony</span>
              <span className="md:hidden">Romance</span>
            </button>
            
            <button
              type="button"
              className="gemini-toolbox-button"
              disabled={isLoading}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Enchanted Realms</span>
              <span className="md:hidden">Destinations</span>
            </button>
            
            <button
              type="button"
              className="gemini-toolbox-button"
              disabled={isLoading}
            >
              <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Royal Romance</span>
              <span className="md:hidden">Luxury</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="gemini-input-wrapper">
            <button
              type="button"
              className="gemini-plus-button"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isMobile ? "Message AI LOVVE..." : "Whisper your heart's desires to AI LOVVE..."}
              className="gemini-input text-sm sm:text-base"
              disabled={isLoading}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            <button
              type="button"
              className="gemini-mic-button"
              disabled={isLoading}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
          
          <div className="gemini-footer-text text-xs sm:text-sm text-center px-2">
            AI LOVVE weaves dreams but double-check the sacred details of your journey
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default Index;
