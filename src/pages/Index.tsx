import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, Menu, MoreVertical, Mic, Search, Image, Video, FileText, Palette, X, LogOut, User, Settings, Activity, MapPin, ChevronDown, Heart, Star, Sparkles, Crown, Zap, Edit, Plus, Bot, Moon, Sun, Trash2, ThumbsUp, ThumbsDown, Copy, Check, RotateCcw } from 'lucide-react';
import { generateGeminiStream, getChatHistory, deleteChatHistory } from '../services/geminiService';
import { authService } from '../services/authService';
import PackageCarousel from '../components/PackageCarousel';
import { packageService, HoneymoonPackage } from '../services/packageService';
import PackageDetail from './PackageDetail';
import { useTheme } from '../contexts/ThemeContext';
import { detectLanguage, generateResponse, parseRegistrationData, parseLoginData, looksLikeRegistrationData, looksLikeLoginData, isChatCommand, processChatCommand } from '../services/geminiService';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isThinking?: boolean;
  packages?: HoneymoonPackage[];
  sessionId?: string;
  feedback?: 'thumbs_up' | 'thumbs_down' | null;
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
  const { actualTheme, toggleTheme } = useTheme();
  
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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<{[key: number]: 'thumbs_up' | 'thumbs_down' | null}>({});

  // Büyülü ve sürekli değişen placeholder için state ve metinler
  const [placeholderText, setPlaceholderText] = useState("Whisper your heart's desires to AI LOVVE...");
  
  // Büyülü placeholder mesajları
  const magicalPlaceholders = useMemo(() => [
    "✨ Whisper your enchanted wishes here...",
    "💫 Tell me your wildest romantic dreams...",
    "🔮 Unveil your heart's deepest desires...",
    "💕 What magical journey shall we plan today?",
    "✨ Speak, and let's weave your love story...",
    "🌟 What paradise awaits your eternal bond?",
    "💎 Command me to craft your perfect escape...",
    "🧙‍♂️ Your magical honeymoon awaits a word...",
    "🏝️ Where shall your love story unfold?",
    "🌹 Let your romantic adventure begin here...",
    "🌈 Ask, and I'll conjure honeymoon wonders...",
    "🧚 Your wish is my enchantment to create...",
    "🌙 What blissful moments shall we design?",
    "🧡 Your love deserves the perfect setting...",
    "⭐ Your romantic tale starts with your words..."
  ], []);
  
  // Placeholder mesajlarını düzenli olarak değiştir
  useEffect(() => {
    const placeholderInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * magicalPlaceholders.length);
      setPlaceholderText(magicalPlaceholders[randomIndex]);
    }, 5000); // Her 5 saniyede bir değiştir
    
    return () => clearInterval(placeholderInterval);
  }, [magicalPlaceholders]);
  
  // Mobil cihazlar için daha kısa büyülü mesajlar
  const mobilemagicalPlaceholders = useMemo(() => [
    "✨ Make a wish...",
    "💫 Dream with me...",
    "🔮 Ask your heart...",
    "💕 Your journey begins...",
    "✨ Tell me your desire...",
    "🌟 Where to, my love?",
    "💎 Command my magic...",
    "🧙‍♂️ Speak your wish...",
    "🏝️ Dream destination?",
    "🌹 Start the magic..."
  ], []);
  
  // Mobil placeholder mesajlarını düzenli olarak değiştir
  const [mobilePlaceholderText, setMobilePlaceholderText] = useState("Message AI LOVVE...");
  
  useEffect(() => {
    const mobilePlaceholderInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * mobilemagicalPlaceholders.length);
      setMobilePlaceholderText(mobilemagicalPlaceholders[randomIndex]);
    }, 4000); // Her 4 saniyede bir değiştir
    
    return () => clearInterval(mobilePlaceholderInterval);
  }, [mobilemagicalPlaceholders]);

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
        } else if (param.toLowerCase() === 'cities') {
          // Show curated city destinations
          packages = [
            {
              id: 'city-kapadokya',
              title: 'Kapadokya Romance',
              description: 'Hot air balloons & unique landscapes',
              location: 'Kapadokya',
              country: 'Turkey',
              duration: 4,
              price: 2500,
              currency: 'USD',
              category: 'romantic',
              features: ['Hot Air Balloon', 'Cave Hotels', 'Sunset Views'],
              inclusions: ['Luxury Cave Suite', 'Private Balloon Ride', 'Spa Treatment'],
              images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=500&h=400&fit=crop'],
              rating: 4.9,
              reviews: 245,
              availability: true,
              seasonality: ['Spring', 'Fall']
            },
            {
              id: 'city-antalya',
              title: 'Antalya Luxury',
              description: 'Mediterranean beaches & luxury resorts',
              location: 'Antalya',
              country: 'Turkey',
              duration: 5,
              price: 3200,
              currency: 'USD',
              category: 'beach',
              features: ['Private Beach', 'Spa Wellness', 'Fine Dining'],
              inclusions: ['5-Star Resort', 'Couple Spa', 'Private Beach Access'],
              images: ['https://images.unsplash.com/photo-1605540436563-5bca919ae766?q=80&w=500&h=400&fit=crop'],
              rating: 4.8,
              reviews: 312,
              availability: true,
              seasonality: ['Spring', 'Summer', 'Fall']
            },
            {
              id: 'city-istanbul',
              title: 'İstanbul Heritage',
              description: 'Historic charm & Bosphorus romance',
              location: 'İstanbul',
              country: 'Turkey',
              duration: 4,
              price: 2800,
              currency: 'USD',
              category: 'cultural',
              features: ['Bosphorus Cruise', 'Historic Tours', 'Turkish Baths'],
              inclusions: ['Luxury Hotel', 'Private Tours', 'Traditional Spa'],
              images: ['https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=500&h=400&fit=crop'],
              rating: 4.7,
              reviews: 189,
              availability: true,
              seasonality: ['Spring', 'Summer', 'Fall']
            },
            {
              id: 'city-bodrum',
              title: 'Bodrum Riviera',
              description: 'Aegean coast luxury & vibrant nightlife',
              location: 'Bodrum',
              country: 'Turkey',
              duration: 4,
              price: 3500,
              currency: 'USD',
              category: 'beach',
              features: ['Marina Views', 'Beach Clubs', 'Yacht Tours'],
              inclusions: ['Boutique Hotel', 'Yacht Day Trip', 'VIP Beach Access'],
              images: ['https://images.unsplash.com/photo-1605540436563-5bca919ae766?q=80&w=500&h=400&fit=crop'],
              rating: 4.6,
              reviews: 156,
              availability: true,
              seasonality: ['Spring', 'Summer', 'Fall']
            },
            {
              id: 'city-alacati',
              title: 'Alaçatı Boutique',
              description: 'Windmill charm & boutique sophistication',
              location: 'Alaçatı',
              country: 'Turkey',
              duration: 3,
              price: 2200,
              currency: 'USD',
              category: 'romantic',
              features: ['Stone Houses', 'Windsurfing', 'Local Vineyards'],
              inclusions: ['Boutique Hotel', 'Wine Tasting', 'Windsurf Lessons'],
              images: ['https://images.unsplash.com/photo-1605540436563-5bca919ae766?q=80&w=500&h=400&fit=crop'],
              rating: 4.5,
              reviews: 98,
              availability: true,
              seasonality: ['Spring', 'Summer', 'Fall']
            },
            {
              id: 'city-pamukkale',
              title: 'Pamukkale Thermal',
              description: 'Natural thermal pools & ancient history',
              location: 'Pamukkale',
              country: 'Turkey',
              duration: 2,
              price: 1800,
              currency: 'USD',
              category: 'romantic',
              features: ['Hot Air Balloon', 'Cave Hotels', 'Sunset Views'],
              inclusions: ['Luxury Cave Suite', 'Private Balloon Ride', 'Spa Treatment'],
              images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=500&h=400&fit=crop'],
              rating: 4.9,
              reviews: 245,
              availability: true,
              seasonality: ['Spring', 'Fall']
            },
            {
              id: 'city-srilanka',
              title: 'Sri Lanka Paradise',
              description: 'Tropical paradise & ancient culture',
              location: 'Sri Lanka',
              country: 'Sri Lanka',
              duration: 7,
              price: 3500,
              currency: 'USD',
              category: 'adventure',
              features: ['Wildlife Safari', 'Tea Plantations', 'Beach Resorts'],
              inclusions: ['Luxury Villa', 'Safari Experience', 'Cultural Tours'],
              images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=500&h=400&fit=crop'],
              rating: 4.9,
              reviews: 187,
              availability: true,
              seasonality: ['Winter', 'Spring']
            },
            {
              id: 'city-phuket',
              title: 'Phuket Wellness',
              description: 'Thai beaches & luxury wellness',
              location: 'Phuket',
              country: 'Thailand',
              duration: 6,
              price: 4200,
              currency: 'USD',
              category: 'luxury',
              features: ['Private Villa', 'Spa Retreat', 'Island Hopping'],
              inclusions: ['Beachfront Villa', 'Couples Spa', 'Private Yacht'],
              images: ['https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?q=80&w=500&h=400&fit=crop'],
              rating: 4.8,
              reviews: 356,
              availability: true,
              seasonality: ['Winter', 'Spring']
            },
            {
              id: 'city-bali',
              title: 'Bali Bliss',
              description: 'Island of gods & romantic villas',
              location: 'Bali',
              country: 'Indonesia',
              duration: 7,
              price: 3800,
              currency: 'USD',
              category: 'romantic',
              features: ['Private Villa', 'Rice Terraces', 'Temple Tours'],
              inclusions: ['Luxury Villa', 'Spa Treatment', 'Cultural Experience'],
              images: ['https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=500&h=400&fit=crop'],
              rating: 4.9,
              reviews: 423,
              availability: true,
              seasonality: ['Spring', 'Summer', 'Fall']
            }
          ];
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

  // Auto-scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  // Effect for auto-scrolling when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length, isLoading]);

  // Effect for scrolling when new message is added
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !lastMessage.isThinking) {
        // Scroll after assistant response is complete
        setTimeout(() => scrollToBottom(), 200);
      }
    }
  }, [messages]);

  // Enhanced scroll effect for all message changes
  useEffect(() => {
    // Always scroll to bottom when messages array changes
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [messages]);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sidebar durumunu izleyen ve body class'ını güncelleyen effect
  useEffect(() => {
    // Safari düzeltmeleri için sidebar açıkken body'ye class ekle
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [sidebarOpen]);

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
      console.log('🚀 Initializing app...');
      
      try {
        const sessionId = await authService.getChatSessionId();
        setCurrentSessionId(sessionId);
        console.log('✅ Session ID obtained:', sessionId);
        
        // Always try to load from Firebase first (primary data source)
        console.log('📡 Loading chat history from Firebase (primary source)...');
        await loadChatHistory(sessionId);
        
        // If no Firebase data, then try localStorage as fallback
        if (chats.length === 0) {
          console.log('📱 No Firebase data, trying localStorage fallback...');
          const backupChats = localStorage.getItem('ailovve_chats_backup');
          if (backupChats) {
            try {
              const parsedChats = JSON.parse(backupChats);
              setChats(parsedChats);
              console.log('📦 Restored from localStorage fallback:', parsedChats.length, 'chats');
            } catch (error) {
              console.error('❌ Error parsing backup chats:', error);
              localStorage.removeItem('ailovve_chats_backup');
            }
          }
        }
        
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        // Try localStorage as emergency fallback
        console.log('🆘 Firebase failed, using localStorage emergency backup...');
        const backupChats = localStorage.getItem('ailovve_chats_backup');
        if (backupChats) {
          try {
            const parsedChats = JSON.parse(backupChats);
            setChats(parsedChats);
            console.log('🔧 Emergency restore from localStorage:', parsedChats.length, 'chats');
          } catch (parseError) {
            console.error('❌ Emergency backup also failed:', parseError);
          }
        }
      }
    };

    initializeApp();
  }, [user]);

  // Load chat history from Firebase
  const loadChatHistory = async (sessionId: string) => {
    if (!sessionId) {
      console.log('❌ loadChatHistory: No sessionId provided');
      return;
    }
    
    console.log('🔄 Starting chat history load for sessionId:', sessionId);
    setIsLoadingHistory(true);
    
    try {
      console.log('🔧 Calling getChatHistory with sessionId:', sessionId);
      const history = await getChatHistory(sessionId, 20);
      console.log('📋 getChatHistory response:', history);
      
      if (history && history.length > 0) {
        console.log('✅ Found chat history, converting', history.length, 'messages');
        
        // Convert Firebase history to frontend format
        const convertedHistory: Message[] = history.map((msg: any) => ({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.parts?.[0]?.text || msg.content || '',
          timestamp: msg.createdAt || new Date().toISOString()
        }));

        console.log('🔄 Converted history:', convertedHistory);

        // Sort all messages by timestamp first
        convertedHistory.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        });
        
        console.log('🔄 Converted history:', convertedHistory);
        
        // Group messages by time gaps (create new chat if >1 hour gap)
        const chatSessions: Message[][] = [];
        let currentSession: Message[] = [];
        let lastTimestamp = 0;
        const TIME_GAP_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds
        
        convertedHistory.forEach((message, index) => {
          const msgTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
          
          // Create new chat if:
          // 1. Time gap is > 1 hour, OR
          // 2. This is the first message of a new conversation (user message after assistant)
          const isNewConversation = index > 0 && 
            convertedHistory[index - 1].role === 'assistant' && 
            message.role === 'user';
          
          if ((msgTime - lastTimestamp > TIME_GAP_THRESHOLD || isNewConversation) && currentSession.length > 0) {
            chatSessions.push([...currentSession]);
            currentSession = [];
          }
          
          currentSession.push(message);
          lastTimestamp = msgTime;
        });
        
        // Add the last session
        if (currentSession.length > 0) {
          chatSessions.push(currentSession);
        }
        
        console.log('📊 Messages grouped into', chatSessions.length, 'chat sessions');
        
        // Create chat objects for each session
        const newChats: Chat[] = chatSessions.map((messages, index) => {
          // Generate unique chat ID based on timestamp
          const firstMessage = messages[0];
          const chatId = `chat_${firstMessage.timestamp ? new Date(firstMessage.timestamp).getTime() : Date.now()}_${index}`;
          
          // Create meaningful chat title from first user message
          const firstUserMessage = messages.find(msg => msg.role === 'user');
          const chatTitle = firstUserMessage?.content.slice(0, 40) + '...' || `💬 Konuşma ${index + 1}`;
          
          // Get last message for preview
          const lastMessage = messages[messages.length - 1];
          const lastMessagePreview = lastMessage?.content.slice(0, 50) + '...' || 'Yüklenmiş konuşma';
          
          return {
            id: chatId,
            title: chatTitle,
            messages: messages,
            lastMessage: lastMessagePreview,
            sessionId: sessionId // Use the original session ID
          };
        });
        
        console.log('📦 Created', newChats.length, 'chat objects from history');

        // Update chats list without removing existing chats
        setChats(prev => {
          const existingChats = [...prev];
          const firebaseBasedChats = existingChats.filter(chat => 
            chat.sessionId === sessionId || chat.id.startsWith('chat_')
          );
          const localOnlyChats = existingChats.filter(chat => 
            chat.sessionId !== sessionId && !chat.id.startsWith(sessionId)
          );
          
          // Merge Firebase history with existing chats
          const updatedChats = [...localOnlyChats]; // Keep local chats
          
          newChats.forEach(newChat => {
            const existingChatIndex = firebaseBasedChats.findIndex(chat => chat.id === newChat.id);
            if (existingChatIndex >= 0) {
              console.log('🔄 Updating existing Firebase-based chat:', newChat.title);
              // Update existing Firebase chat
              updatedChats.push(newChat);
            } else {
              console.log('➕ Adding new Firebase chat:', newChat.title);
              updatedChats.push(newChat);
            }
          });
          
          // Sort chats by last message timestamp (newest first)
          return updatedChats.sort((a, b) => {
            const timeA = a.messages[a.messages.length - 1]?.timestamp 
              ? new Date(a.messages[a.messages.length - 1].timestamp!).getTime() 
              : Date.now();
            const timeB = b.messages[b.messages.length - 1]?.timestamp 
              ? new Date(b.messages[b.messages.length - 1].timestamp!).getTime() 
              : Date.now();
            return timeB - timeA;
          });
        });
        
        // DON'T automatically select the most recent chat
        // Let the welcome screen show first, user can manually select chats
        console.log('✅ Chat history loaded. Welcome screen will be shown.');
        
        console.log('✅ Chat history loaded and applied successfully');
      } else {
        console.log('ℹ️ No chat history found for sessionId:', sessionId);
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      // Don't show error toast for empty history
    } finally {
      setIsLoadingHistory(false);
      console.log('🏁 Chat history loading completed');
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
      
      // Scroll to bottom after chat is loaded
      setTimeout(() => {
        scrollToBottom(false); // Instant scroll for chat switching
      }, 100);
      
      console.log(`✅ Selected chat: ${chat.title} with ${chat.messages.length} messages`);
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
    setMessages(prev => {
      const updated = [...prev, newUserMessage];
      // Scroll to bottom after adding user message
      setTimeout(() => scrollToBottom(), 50);
      return updated;
    });

    // Add typing indicator
    const typingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: true
    };
    
    setMessages(prev => {
      const updated = [...prev, typingMessage];
      // Scroll to bottom after adding typing indicator
      setTimeout(() => scrollToBottom(), 100);
      return updated;
    });

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
            ? {...chat, messages: [...chat.messages, newUserMessage], lastMessage: content.slice(0, 50) + '...'}
            : chat
        ));
      } else {
        const newChat: Chat = {
          id: chatId,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [newUserMessage],
          lastMessage: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          sessionId: sessionId
        };
        
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(chatId);
        setCurrentSessionId(sessionId);
      }
    } else {
      // Update existing chat with user message
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === currentChatId 
            ? {...chat, messages: [...chat.messages, newUserMessage], lastMessage: content.slice(0, 50) + '...'}
            : chat
        );
        
        // Sort chats by last message timestamp (newest first)
        return updatedChats.sort((a, b) => {
          const timeA = a.messages[a.messages.length - 1]?.timestamp 
            ? new Date(a.messages[a.messages.length - 1].timestamp!).getTime() 
            : 0;
          const timeB = b.messages[b.messages.length - 1]?.timestamp 
            ? new Date(b.messages[b.messages.length - 1].timestamp!).getTime() 
            : 0;
          return timeB - timeA; // Newest first
        });
      });
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
        setMessages(prev => {
          const updated = prev.map((msg, index) => 
            index === prev.length - 1 && msg.isThinking 
              ? { ...msg, content: responseContent, isThinking: true }
              : msg
          );
          // Scroll during streaming response
          setTimeout(() => scrollToBottom(true), 10);
          return updated;
        });
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
      setMessages(prev => {
        const updated = prev.slice(0, -1).concat(assistantMessage);
        // Final scroll to bottom after response is complete
        setTimeout(() => scrollToBottom(true), 200);
        return updated;
      });
      
      // Update chat in chats array with assistant message
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === (chatId || currentChatId) 
            ? {
                ...chat, 
                messages: [...chat.messages, assistantMessage],
                lastMessage: responseContent.slice(0, 50) + (responseContent.length > 50 ? '...' : ''),
                title: chat.title === 'Now' || chat.title.startsWith('💬') ? content.slice(0, 40) + '...' : chat.title
              }
            : chat
        );
        
        // Sort chats by last message timestamp (newest first)
        return updatedChats.sort((a, b) => {
          const timeA = a.messages[a.messages.length - 1]?.timestamp 
            ? new Date(a.messages[a.messages.length - 1].timestamp!).getTime() 
            : 0;
          const timeB = b.messages[b.messages.length - 1]?.timestamp 
            ? new Date(b.messages[b.messages.length - 1].timestamp!).getTime() 
            : 0;
          return timeB - timeA; // Newest first
        });
      });

    } catch (e: any) {
      // Remove user message and typing indicator on error
      setMessages(prev => prev.slice(0, prev.length - 2));
      
      // Also revert chat updates
      setChats(prev => prev.map(chat => 
        chat.id === (chatId || currentChatId) 
          ? {...chat, messages: chat.messages.slice(0, -1)}
          : chat
      ));
    } finally {
      setIsLoading(false);
      // Final scroll to ensure we're at bottom
      setTimeout(() => scrollToBottom(true), 300);
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

  // Toggle sidebar and update body class
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (!sidebarOpen) {
      document.body.classList.remove('sidebar-closed');
    } else {
      document.body.classList.add('sidebar-closed');
    }
  };

  // Package modal functions
  const openPackageModal = (packageId: string) => {
    setSelectedPackageId(packageId);
    setIsPackageModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closePackageModal = () => {
    setSelectedPackageId(null);
    setIsPackageModalOpen(false);
    document.body.style.overflow = 'unset';
  };
  
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
        document.body.classList.add('sidebar-closed');
      } else {
        setSidebarOpen(true);
        document.body.classList.remove('sidebar-closed');
      }
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', checkMobile);
    checkMobile();

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-backup chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      try {
        localStorage.setItem('ailovve_chats_backup', JSON.stringify(chats));
        console.log('💾 Auto-backup saved to localStorage:', chats.length, 'chats');
      } catch (error) {
        console.error('❌ Failed to backup chats to localStorage:', error);
      }
    }
  }, [chats]);

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering selectChat
    
    try {
      console.log('🗑️ Deleting chat:', chatId);
      
      // Find the chat to get its sessionId
      const chatToDelete = chats.find(chat => chat.id === chatId);
      if (!chatToDelete) {
        console.error('❌ Chat not found:', chatId);
        return;
      }
      
      // Remove from local state immediately for instant UI feedback
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If deleting current chat, switch to another chat or clear
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          // Switch to the most recent remaining chat
          const mostRecentChat = remainingChats[0];
          setCurrentChatId(mostRecentChat.id);
          setCurrentSessionId(mostRecentChat.sessionId);
          setMessages(mostRecentChat.messages);
        } else {
          // No remaining chats, clear everything
          setCurrentChatId('');
          setCurrentSessionId('');
          setMessages([]);
        }
      }
      
      // Delete from Firebase Firestore
      console.log('🔥 Deleting from Firebase, sessionId:', chatToDelete.sessionId);
      const firebaseDeleteSuccess = await deleteChatHistory(chatToDelete.sessionId);
      
      if (firebaseDeleteSuccess) {
        console.log('✅ Chat deleted from Firebase successfully');
      } else {
        console.warn('⚠️ Failed to delete from Firebase, but local deletion completed');
      }
      
      // Also remove from localStorage backup
      localStorage.removeItem(`chat_${chatId}`);
      
      // Update localStorage backup
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      localStorage.setItem('ailovve_chats_backup', JSON.stringify(updatedChats));
      
      console.log('✅ Chat deleted successfully from all sources');
      
    } catch (error) {
      console.error('❌ Error deleting chat:', error);
      
      // Revert the optimistic update on error
      const originalChats = [...chats];
      setChats(originalChats);
      
      // Show error message to user (you could implement a toast notification here)
      alert('Konuşma silinirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Copy message function
  const copyMessage = async (content: string, index: number) => {
    try {
      // Clean the content from package commands and extra formatting
      const cleanContent = content
        .replace(/\*\*SHOW_PACKAGES:[^*]+\*\*/g, '')
        .trim();
      
      await navigator.clipboard.writeText(cleanContent);
      setCopiedMessageIndex(index);
      
      // Simulate haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Auto-hide copied state
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content.replace(/\*\*SHOW_PACKAGES:[^*]+\*\*/g, '').trim();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    }
  };

  // Feedback function
  const handleMessageFeedback = (index: number, feedback: 'thumbs_up' | 'thumbs_down') => {
    const currentFeedback = messageFeedback[index];
    const newFeedback = currentFeedback === feedback ? null : feedback;
    
    setMessageFeedback(prev => ({
      ...prev,
      [index]: newFeedback
    }));
    
    // Simulate haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(newFeedback ? [30, 10, 30] : 20);
    }
    
    // Here you could also send feedback to analytics or backend
    console.log(`Message ${index} feedback:`, newFeedback || 'removed');
    
    // Optional: Send feedback to backend
    // await sendFeedbackToBackend(messages[index], newFeedback);
  };

  // Regenerate response function
  const regenerateResponse = async (messageIndex: number) => {
    if (messageIndex === 0) return; // Can't regenerate if no previous user message
    
    const userMessage = messages[messageIndex - 1];
    if (userMessage.role !== 'user') return;
    
    // Simulate haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
    
    // Remove all messages from the regenerating point
    const messagesBeforeRegenerate = messages.slice(0, messageIndex);
    setMessages(messagesBeforeRegenerate);
    
    // Clear any feedback for regenerated messages
    setMessageFeedback(prev => {
      const newFeedback = { ...prev };
      Object.keys(newFeedback).forEach(key => {
        if (parseInt(key) >= messageIndex) {
          delete newFeedback[parseInt(key)];
        }
      });
      return newFeedback;
    });
    
    // Re-send the user message to get a new response
    await handleSendMessage(userMessage.content);
  };

  return (
    <div className="flex h-screen">
      {/* CLASSIC SIDEBAR DESIGN - RESTORED */}
      <div className={`gemini-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Top */}
        <div className="gemini-sidebar-top">
          {/* Button Layout: Menu 25% - New Chat 75% (Search moved to bottom) */}
          <div className="sidebar-button-container">
            {/* Menu Button - 25% */}
            <button
              onClick={() => toggleSidebar()}
              className="gemini-menu-button sidebar-menu-btn-half"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            {/* New Chat Button - 75% */}
            <button 
              onClick={createNewChat} 
              className="gemini-new-chat sidebar-newchat-btn-half"
            >
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
                className={`gemini-chat-item ${chat.id === currentChatId ? 'active' : ''} group flex items-center gap-2`}
                title={chat.title}
              >
                <div 
                  className="flex-1 min-w-0 cursor-pointer truncate"
                  onClick={() => selectChat(chat.id)}
                >
                  {chat.title}
                </div>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 flex-shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : searchInput ? (
            <div className="gemini-chat-item">
              <span>🔮 No magical conversations found...</span>
            </div>
          ) : (
            <div className="gemini-chat-item" style={{ textAlign: 'center', opacity: 0.7 }}>
              <span>✨ Start your first conversation to see history</span>
            </div>
          )}
          
          <div className="gemini-sidebar-section">
            <button className="flex items-center w-full text-left text-sm">
              <span>Reveal more magic</span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Enhanced Search Box - Always visible at bottom */}
        <div className="gemini-search-box">
          <div className="gemini-search-header">
            <div className="gemini-search-label">
              <span>🔮</span>
              <span>Magical Search</span>
            </div>
            {searchInput && (
              <button 
                className="gemini-search-clear"
                onClick={(e) => {
                  setSearchInput('');
                  setSearchQuery('');
                  setIsSearching(false);
                  setFilteredChats(chats);
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="gemini-search-input-container">
            <div 
              className="gemini-search-icon-enhanced"
              onClick={() => performMagicalSearch(searchInput)}
              title="Search"
            >
              <Search className="w-3 h-3" />
            </div>
            
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search magical conversations..."
              className="gemini-search-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  performMagicalSearch(searchInput);
                }
              }}
            />
          </div>
          
          {isSearching && (
            <div className="gemini-search-loading">
              <span>Searching magic</span>
              <div className="gemini-search-loading-dots">
                <div className="gemini-search-loading-dot"></div>
                <div className="gemini-search-loading-dot"></div>
                <div className="gemini-search-loading-dot"></div>
              </div>
            </div>
          )}
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
              onClick={() => toggleSidebar()}
              className="gemini-menu-button flex-shrink-0"
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
                className="gemini-profile text-sm sm:text-base"
              >
                {getUserInitial()}
              </button>
              
              {profileMenuOpen && (
                <div className={`gemini-dropdown-menu ${profileMenuOpen ? 'open' : ''}`} style={{ top: '100%', right: 0, marginTop: '8px' }}>
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
                  <button
                    onClick={() => {
                      toggleTheme();
                      setProfileMenuOpen(false);
                    }}
                    className="gemini-dropdown-item theme-toggle"
                  >
                    {actualTheme === 'dark' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    {actualTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
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
        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="gemini-welcome px-4 sm:px-8">
              <div className="welcome-content-wrapper">
                <div className="gemini-welcome-title text-center text-2xl sm:text-3xl lg:text-4xl">
                  {currentGreeting} {currentEmoji}
                </div>
                <div className="gemini-welcome-subtitle text-center text-sm sm:text-base lg:text-lg max-w-3xl mx-auto">
                  {currentSubtitle}
                </div>
              </div>
            </div>
          ) : (
            <div className="gemini-messages">
              {messages.map((message, index) => (
                <div key={index} className="gemini-message">
                  {message.role === 'user' ? (
                    <div className="gemini-message-user text-sm sm:text-base">
                      {message.content}
                    </div>
                  ) : (
                    <div className="gemini-message-assistant text-sm sm:text-base">
                      {/* Package Cards - Show ONLY if packages exist, NO text */}
                      {message.packages && message.packages.length > 0 ? (
                        <PackageCarousel 
                          packages={message.packages}
                          onSelectPackage={(packageId) => {
                            console.log('Package selected:', packageId);
                            openPackageModal(packageId);
                          }}
                        />
                      ) : (
                        /* Regular text message - Clean without **SHOW_PACKAGES:** */
                        <>
                          <div className="whitespace-pre-wrap">
                            {message.content.replace(/\*\*SHOW_PACKAGES:[^*]+\*\*/g, '').trim()}
                          </div>
                          
                          {/* Message Feedback Toolkit - Only for completed assistant messages */}
                          {!message.isThinking && (
                            <div className="message-feedback-toolkit">
                              <div className="feedback-actions">
                                {/* Copy Button */}
                                <button
                                  onClick={() => copyMessage(message.content, index)}
                                  className={`feedback-button ${copiedMessageIndex === index ? 'copied' : ''}`}
                                  title="Copy message"
                                  aria-label={copiedMessageIndex === index ? 'Copied!' : 'Copy message'}
                                >
                                  {copiedMessageIndex === index ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                
                                {/* Thumbs Up */}
                                <button
                                  onClick={() => handleMessageFeedback(index, 'thumbs_up')}
                                  className={`feedback-button ${messageFeedback[index] === 'thumbs_up' ? 'active-positive' : ''}`}
                                  title="Good response"
                                  aria-label="Good response"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                
                                {/* Thumbs Down */}
                                <button
                                  onClick={() => handleMessageFeedback(index, 'thumbs_down')}
                                  className={`feedback-button ${messageFeedback[index] === 'thumbs_down' ? 'active-negative' : ''}`}
                                  title="Bad response"
                                  aria-label="Bad response"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                                
                                {/* Regenerate */}
                                <button
                                  onClick={() => regenerateResponse(index)}
                                  className="feedback-button"
                                  title="Regenerate response"
                                  aria-label="Regenerate response"
                                  disabled={index === 0}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                              
                              <div className="feedback-disclaimer">
                                <span className="disclaimer-text">
                                  AI LOVVE can make mistakes. Please double-check responses.
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Thinking Indicator */}
                      {message.isThinking && (
                        <div className="gemini-thinking">
                          <div className="gemini-dots">
                            <div className="gemini-dot"></div>
                            <div className="gemini-dot"></div>
                            <div className="gemini-dot"></div>
                          </div>
                          <span>AI is thinking...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Scroll anchor point */}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="gemini-input-container px-3 sm:px-6 lg:px-8">
          <div className="gemini-toolbox">
            <button
              type="button"
              className="gemini-toolbox-button"
              disabled={isLoading}
              onClick={() => handleSendMessage("Suggest romantic luxury honeymoon experiences and activities for couples")}
            >
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Love's Symphony</span>
              <span className="md:hidden">Romance</span>
            </button>
            
            <button
              type="button"
              className="gemini-toolbox-button"
              disabled={isLoading}
              onClick={() => handleSendMessage("Recommend top 5 dreamy honeymoon destinations with unique experiences")}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Enchanted Realms</span>
              <span className="md:hidden">Destinations</span>
            </button>
            
            <button
              type="button"
              className="gemini-toolbox-button"
              disabled={isLoading}
              onClick={() => handleSendMessage("Suggest luxury honeymoon packages and exclusive experiences for couples")}
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
              placeholder={isMobile ? mobilePlaceholderText : placeholderText}
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
              type="submit"
              className="gemini-send-button"
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
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
        onClick={() => toggleSidebar()}
      />

      {/* Package Detail Modal */}
      {isPackageModalOpen && selectedPackageId && (
        <div className="package-modal-overlay" onClick={closePackageModal}>
          <div className="package-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closePackageModal}
              className="package-modal-close"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
            <PackageDetail packageId={selectedPackageId} isModal={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
