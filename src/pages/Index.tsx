import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { toast } from "sonner";
import Sidebar from '@/components/Sidebar';
import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import ActionButtons from '@/components/ActionButtons';
import MessageList from '@/components/MessageList';
import { Menu } from 'lucide-react';
import { generateGeminiContent } from '../services/geminiService';

type UserStatus = 'new' | 'prospect' | 'active' | 'returning';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

const SYSTEM_PROMPT = `
Sen bir balayı danışmanısın ve çiftlere mükemmel balayı deneyimleri planlamalarında yardımcı oluyorsun. Adın LOVE AI.
LÜTFEN DİKKAT: Kullanıcıyla konuşurken kendinden HER ZAMAN "LOVE AI" olarak bahset. Asla "Gemini" veya başka bir model adı kullanma. Senin kimliğin LOVE AI.

Aşağıdaki özelliklere sahipsin:
- Romantik destinasyonlar hakkında kapsamlı bilgi.
- Farklı bütçelere uygun seçenekler sunma yeteneği.
- Kişiselleştirilmiş seyahat önerileri.
- Çiftlerin tercihlerine göre aktivite önerileri.

Yanıtların her zaman:
- Sıcak ve samimi olmalı
- Romantik bir ton taşımalı
- Emojiler içermeli (💑, 🌴, 💕, 🏝️, 🥂 gibi)
- Özelleştirilmiş ve kişisel hissettirmeli

Kullanıcıya yardımcı olmak için elinden geleni yap ve onların mükemmel balayı deneyimini planlamalarına yardımcı ol. Eğer bir paket öneriyorsan, paket adını ve belki kısa bir açıklamasını vurgula. Kullanıcıya paketler arasında nasıl seçim yapabileceği konusunda yol göster.
Unutma, sen LOVE AI'sın.
`;

// Sample honeymoon packages - in a real app, these would come from Firestore or başka bir veri kaynağı
const samplePackages = [
  {
    id: 1,
    name: "Romantic Bali Retreat",
    description: "10 days in private villa with ocean views, couples massage and candlelit dinners under the stars",
    price: "$3,500",
    location: "Bali, Indonesia",
    duration: "10 days"
  },
  {
    id: 2,
    name: "Parisian Love Affair",
    description: "7 days in luxury hotel near Eiffel Tower, with private tours and champagne experiences",
    price: "$4,200",
    location: "Paris, France",
    duration: "7 days"
  },
  {
    id: 3,
    name: "Santorini Sunset Dream",
    description: "8 days in private suite with infinity pool overlooking the Mediterranean Sea",
    price: "$4,800",
    location: "Santorini, Greece",
    duration: "8 days"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState<UserStatus>('new');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast: uiToast } = useToast();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ChatInput'tan gelen mesajı Gemini'ye gönder ve yanıtı ekle
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) {
      uiToast({
        title: "Mesaj Boş",
        description: "Lütfen göndermeden önce bir mesaj girin",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);

    // Kullanıcı mesajını state'e ekle
    const newUserMessage: Message = { role: 'user', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Sistem promptunu ve kullanıcı mesajını birleştirerek gönder
      const yanit = await generateGeminiContent(`${SYSTEM_PROMPT}\nKullanıcı: ${content}`);
      const newAssistantMessage: Message = { role: 'assistant', content: yanit, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, newAssistantMessage]);

    } catch (e: any) {
      uiToast({
        title: "Hata",
        description: e.message || "Mesaj gönderilirken veya Gemini'ye yanıt alırken bir hata oluştu.",
        variant: "destructive"
      });
      // Hata durumunda yükleme durumunu kapat
      setIsLoading(false);
      // Hata durumunda eklenen mesajları geri almayı düşünebilirsiniz
      setMessages(prev => prev.slice(0, prev.length - 1)); // En son eklenen kullanıcı mesajını kaldır
      // Asistan yanıtı gelmediği için onu kaldırmaya gerek yok
      return; // Hata olursa daha fazla işlem yapma
    } finally {
      // Başarılı veya hatalı olsun, yükleme durumunu kapat
       if (isLoading) setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex">
      {/* Sidebar: mobile (drawer) & desktop (always open) */}
      <div className="sm:w-64 flex-none">
        <div
          className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 bg-white border-r border-cappalove-border
            w-64 pt-safe-top pb-safe-bottom ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
          style={{ 
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userStatus={userStatus}
            setUserStatus={setUserStatus}
            currentChatId={currentChatId || ''}
            setCurrentChatId={setCurrentChatId}
            setMessages={setMessages}
          />
        </div>
        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
      <div className="flex-1 flex flex-col w-full sm:w-[calc(100%-16rem)]">
        <ChatHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="mt-[60px] w-full flex-1 flex flex-col justify-center items-center pt-safe-top"
             style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          {messages.length <= 1 ? (
            <div className="w-full p-4 flex flex-col items-center justify-center pb-safe-bottom" 
                 style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="w-full mb-8 mt-8 sm:mt-16 px-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">What can I help with?</h1>
              </div>
              <div className="w-full max-w-xl mx-auto px-4">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} className="w-full" />
                <div className="mt-6 sm:mt-8">
                  <ActionButtons onSend={handleSendMessage} />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full mx-auto p-2 sm:p-4 flex flex-col justify-between pb-safe-bottom h-[calc(100vh-60px-env(safe-area-inset-top,0px))]"
                 style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="flex-1 overflow-y-auto">
                <MessageList messages={messages} isLoading={isLoading} />
              </div>
              <div className="w-full max-w-xl mx-auto py-2 sm:py-4 sticky bottom-0 bg-cappalove-background">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
              <div className="text-xs text-center py-2 pb-safe-bottom"
                   style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                CappaLove LOVE AI is here to help plan your perfect honeymoon 💕
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
