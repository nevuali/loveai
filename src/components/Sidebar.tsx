import { Heart, User, MapPin, Sparkles, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type UserStatus = 'new' | 'prospect' | 'active' | 'returning';
type Message = { role: 'user' | 'assistant'; content: string };

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userStatus: UserStatus;
  setUserStatus: Dispatch<SetStateAction<UserStatus>>;
  currentChatId: string | null;
  setCurrentChatId: Dispatch<SetStateAction<string | null>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

const Sidebar = ({ 
  isOpen, 
  onClose, 
  userStatus, 
  setUserStatus, 
  currentChatId, 
  setCurrentChatId, 
  setMessages 
}: SidebarProps) => {
  const navigate = useNavigate();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);

  // Simulate chat archive from localStorage
  const [chatArchive, setChatArchive] = useState<{id: string, title: string}[]>([]);

  // Kullanıcı giriş durumu
  const isAuthenticated = localStorage.getItem('userMockAuthenticated') === 'true';

  useEffect(() => {
    // İlk yüklemede oku
    const archive = JSON.parse(localStorage.getItem('chatArchive') || '[]');
    setChatArchive(archive);
    // Event listener ekle
    const handleArchiveUpdate = () => {
      const updatedArchive = JSON.parse(localStorage.getItem('chatArchive') || '[]');
      setChatArchive(updatedArchive);
    };
    window.addEventListener('chatArchiveUpdated', handleArchiveUpdate);
    return () => {
      window.removeEventListener('chatArchiveUpdated', handleArchiveUpdate);
    };
  }, []);

  const recentSearches = [
    { title: "Romantic Beach Destinations", icon: MapPin, route: '/recent-searches' },
    { title: "All-Inclusive Packages", icon: ShoppingBag, route: '/recent-searches' },
    { title: "Special Anniversary Ideas", icon: Sparkles, route: '/recent-searches' },
    { title: "Best Honeymoon Islands", icon: MapPin, route: '/recent-searches' },
    { title: "Couples Spa Retreats", icon: Heart, route: '/recent-searches' },
  ];

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder for future Supabase API key implementation
  };

  // Hem durum değiştirir hem mesaj gönderir hem de ana sayfaya yönlendirir
  const handleStatusAndSendMessage = (status: UserStatus, message: string) => {
    navigate('/'); // Ana sayfaya önce yönlendir
    setUserStatus(status);
    // Kısa bir gecikme ile mesaj gönder ki önce status değişikliği tamamlansın
    setTimeout(() => {
      // Yeni mesaj eklemek için
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'user', content: message }
      ]);
    }, 100);
  };

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <motion.div 
      className={cn(
        "fixed top-0 left-0 z-10 h-screen w-64 bg-white border-r border-cappalove-border transition-all duration-300",
        !isOpen && "transform -translate-x-full",
        "sm:translate-x-0" // Desktop'ta her zaman görünür
      )}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
          onClick={onClose}
        ></div>
      )}
      
      <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
        <div className="flex justify-end h-[60px] items-center">
          <motion.button 
            className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm hover:bg-cappalove-hover"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="h-6 w-6 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatType: "loop" }}
              >
                <Heart className="h-5 w-5 text-pink-400" />
              </motion.div>
            </div>
          </motion.button>
        </div>

        <div className="flex-col flex-1 transition-opacity duration-500 relative -mr-2 pr-2 overflow-y-auto">
          <motion.div 
            className="p-3 mb-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 
              className="font-serif text-lg text-gray-800 mb-3"
              variants={headerVariants}
            >
              LOVE AI
            </motion.h2>
            
            <motion.p 
              className="text-sm text-gray-600 mb-4"
              variants={itemVariants}
            >
              Your personal honeymoon assistant
            </motion.p>
            
            <div className="space-y-2">
              <motion.h3 
                className="text-sm font-medium text-gray-700"
                variants={headerVariants}
              >
                User Status
              </motion.h3>
              
              <motion.div 
                className="flex flex-col gap-2"
                variants={containerVariants}
              >
                {!isAuthenticated ? (
                  <motion.div variants={itemVariants}>
                    <Button 
                      onClick={() => {
                        setUserStatus('new');
                        navigate('/profile');
                      }}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal w-full",
                        userStatus === 'new' && "bg-cappalove-peach/20 border-cappalove-peach"
                      )}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>New User</span>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants}>
                    <Button
                      onClick={() => navigate('/settings')}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left font-normal w-full"
                    >
                      <span className="mr-2"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6l4 2m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg></span>
                      <span>Settings</span>
                    </Button>
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <Button 
                    onClick={() => handleStatusAndSendMessage('prospect', 'Trip Planning')}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal w-full relative overflow-hidden",
                      userStatus === 'prospect' && "bg-cappalove-peach/20 border-cappalove-peach"
                    )}
                  >
                    {userStatus === 'prospect' && (
                      <motion.div
                        className="absolute inset-0 bg-cappalove-peach/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layoutId="activeStatus"
                      />
                    )}
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Trip Planning</span>
                  </Button>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button 
                    onClick={() => handleStatusAndSendMessage('active', 'Active Honeymoon')}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal w-full relative overflow-hidden",
                      userStatus === 'active' && "bg-cappalove-peach/20 border-cappalove-peach"
                    )}
                  >
                    {userStatus === 'active' && (
                      <motion.div
                        className="absolute inset-0 bg-cappalove-peach/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layoutId="activeStatus"
                      />
                    )}
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Active Honeymoon</span>
                  </Button>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button 
                    onClick={() => handleStatusAndSendMessage('returning', 'Returning Customer')}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal w-full relative overflow-hidden", 
                      userStatus === 'returning' && "bg-cappalove-peach/20 border-cappalove-peach"
                    )}
                  >
                    {userStatus === 'returning' && (
                      <motion.div
                        className="absolute inset-0 bg-cappalove-peach/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layoutId="activeStatus"
                      />
                    )}
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Returning Customer</span>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Chat Archive Section */}
          <motion.div 
            className="mt-4 flex flex-col gap-2 px-3"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            onMouseEnter={() => setActiveSectionIndex(1)}
          >
            <motion.h3 
              className="text-xs text-gray-500 font-medium mb-1"
              variants={headerVariants}
            >
              Chat Archive
            </motion.h3>
            
            {chatArchive.length === 0 ? (
              <motion.span 
                className="text-xs text-gray-400"
                variants={itemVariants}
              >
                No previous chats
              </motion.span>
            ) : (
              <AnimatePresence>
                {chatArchive.map((chat, index) => (
                  <motion.div
                    key={chat.id}
                    className="sidebar-item group cursor-pointer"
                    onClick={() => {
                      navigate('/'); // Önce ana sayfaya yönlendir 
                      // Sayfaya geçtikten sonra sohbeti seç
                      setTimeout(() => {
                        setCurrentChatId(chat.id);
                      }, 100);
                    }}
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.02, 
                      backgroundColor: "rgba(255, 241, 242, 0.5)" 
                    }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <span className="h-4 w-4 text-gray-500 group-hover:text-pink-400 transition-colors mr-2">
                      {hoverIndex === index ? "💕" : "💬"}
                    </span>
                    <span>{chat.title}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>

          {/* Recent Searches Section */}
          <motion.div 
            className="mt-4 flex flex-col gap-2 px-3"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            onMouseEnter={() => setActiveSectionIndex(2)}
          >
            <motion.h3 
              className="text-xs text-gray-500 font-medium mb-1"
              variants={headerVariants}
            >
              Recent Searches
            </motion.h3>
            
            <AnimatePresence>
              {recentSearches.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="sidebar-item group cursor-pointer"
                  onClick={() => {
                    navigate('/'); // Önce sayfaya yönlendir
                    // Sayfaya geçtikten sonra mesaj gönder
                    setTimeout(() => {
                      handleStatusAndSendMessage('new', item.title);
                    }, 100);
                  }}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.02, 
                    backgroundColor: "rgba(255, 241, 242, 0.5)" 
                  }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoverIndex(index + 100)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <motion.span
                    animate={hoverIndex === index + 100 ? { scale: [1, 1.2, 1], rotate: [0, 5, 0, -5, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon className={`h-4 w-4 ${hoverIndex === index + 100 ? 'text-pink-400' : 'text-gray-500'} transition-colors`} />
                  </motion.span>
                  <span>{item.title}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div 
          className="flex flex-col py-2 border-t border-cappalove-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {/* Cappalove Premium Card (compact) */}
          <motion.div 
            className="bg-gradient-to-r from-cappalove-peach/40 to-cappalove-blue/30 rounded-xl shadow p-2 mx-2 mt-2 mb-1 flex flex-col items-start gap-2 border border-cappalove-peach/30"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <motion.span 
                className="flex h-7 w-7 items-center justify-center rounded-full border border-cappalove-border bg-gradient-to-r from-cappalove-peach/60 to-cappalove-blue/40 shadow"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, repeatType: "mirror" }}
              >
                <Heart className="h-4 w-4 text-pink-500" />
              </motion.span>
              <span className="font-bold text-base text-gray-800">LOVE AI Society</span>
            </div>
            <div className="text-xs text-gray-700 mb-0.5">Unlock exclusive honeymoon packages and VIP support!</div>
            <motion.ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5 mb-1">
              <motion.li 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                Special discounts
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                Personal consultant
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                Early access
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                Priority support
              </motion.li>
            </motion.ul>
            <motion.button
              className="love-gradient-button w-full py-1.5 rounded-full font-semibold text-sm mt-0.5 shadow hover:scale-105 transition-all"
              onClick={() => {
                handleStatusAndSendMessage('new', 'LOVE AI Society');
                navigate('/');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Premium
            </motion.button>
          </motion.div>
        </motion.div>
      </nav>
    </motion.div>
  );
};

export default Sidebar;
