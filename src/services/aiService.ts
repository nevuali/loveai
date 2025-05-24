// Honeymoon AI Service - Basitleştirilmiş

// Yanıt kategorilerini tanımlayalım
type ResponseCategory = 
  | 'holiday_package' 
  | 'suitable_holiday' 
  | 'honeymoon_couple' 
  | 'family_holiday'
  | 'advice'
  | 'default';

// Kategori tespiti için anahtar kelimeler
const CATEGORY_KEYWORDS: Record<ResponseCategory, string[]> = {
  holiday_package: ['tatil paketi', 'paket', 'holiday package', 'package'],
  suitable_holiday: ['en uygun tatil', 'suitable holiday', 'uygun tatil', 'bana göre'],
  honeymoon_couple: ['balayı çifti', 'honeymoon couple', 'çift tipi', 'hangi çift'],
  family_holiday: ['aile tatili', 'family', 'aile', 'çocuk'],
  advice: ['tavsiye', 'advice', 'öneri', 'öner', 'ne yapmalıyım'],
  default: []
};

// Farklı kategoriler için yanıtlar
const RESPONSES: Record<ResponseCategory, string[]> = {
  holiday_package: [
    "Mükemmel bir tatil paketi oluşturmak için buradayım! 💖 İşte en popüler balayı paketlerimizden birkaçı:\n\n• **Romantik Bali Kaçamağı** (Endonezya): 10 günlük özel villa konaklaması, masaj ve yıldızlar altında romantik akşam yemeği - $3,500\n\n• **Paris Aşk Macerası** (Fransa): Eyfel Manzaralı 7 günlük lüks otel konaklaması, özel turlar ve şampanya deneyimleri - $4,200\n\n• **Santorini Gün Batımı Rüyası** (Yunanistan): Akdeniz manzaralı infinity pool'lu 8 günlük özel süit - $4,800\n\nBu romantik kaçamaklar hakkında daha fazla bilgi ister misiniz? Yoksa farklı aktiviteler veya farklı bir fiyat aralığı mı tercih edersiniz? 💑✨",
    "Harika bir balayı paketi için birlikte çalışabiliriz! 💞 Size şu an en çok tercih edilen paketlerimizi sunmak isterim:\n\n• **Maldivler Su Üstü Villa** (Maldivler): 9 gün kristal berraklığında sularda lüks konaklama, dalış dersleri ve özel plaj akşam yemekleri - $5,100\n\n• **Toskana Bağ Evi** (İtalya): 8 gün boyunca özel şarap tadımları, İtalyan mutfağı dersleri ve tarihi şehir turları - $3,800\n\n• **Kyoto Zen Deneyimi** (Japonya): 10 gün boyunca geleneksel ryokan konaklaması, çay seremonileri ve özel bahçe turları - $4,300\n\nHangi tarz deneyimi tercih edersiniz? Bütçeniz ve tercihleriniz doğrultusunda özel bir paket oluşturabilirim! 🌺🥂"
  ],
  suitable_holiday: [
    "Size en uygun balayı destinasyonunu bulmak için birkaç soru sormak istiyorum. Öncelikle, nasıl bir atmosfer hayal ediyorsunuz? Plaj ve güneş, tarih ve kültür, yoksa macera dolu bir balayı mı? Ayrıca, bütçeniz ve düşündüğünüz tarihler hakkında bilgi verebilir misiniz? Bu bilgilerle size mükemmel romantik bir kaçamak önerebilirim! 🌴💑✨",
    "Tam size göre bir balayı destinasyonu bulmak için yardımcı olabilirim! 💕 Tercihiniz daha çok şunlardan hangisi olurdu?\n\n1. Lüks ve sakinlik (özel plajlar, spa, romantik akşam yemekleri)\n2. Macera ve keşif (doğa yürüyüşleri, dalış, safari)\n3. Kültür ve tarih (müzeler, tarihi yerler, yerel deneyimler)\n4. Karışık (hepsinden biraz)\n\nAyrıca ortalama bütçeniz ve seyahat etmek istediğiniz mevsim/ay hakkında bilgi verirseniz, size en uygun seçenekleri sunabilirim! 🏝️✈️💖"
  ],
  honeymoon_couple: [
    "Hızlı bir testle hangi Balayı Çifti olduğunuzu bulalım! 🧪💑\n\n1. İdeal bir akşam için tercihiniz nedir?\n   a) Lüks bir restoranda romantik bir akşam yemeği\n   b) Şampanya ile plajda gün batımını izlemek\n   c) Yerel bir festival veya etkinliği keşfetmek\n   d) Otel odanızda yemek sipariş edip film izlemek\n\n2. Hangi konaklama türünü tercih edersiniz?\n   a) Şehir merkezinde lüks bir otel\n   b) Deniz manzaralı özel bir villa\n   c) Butik veya tarihi bir konaklama\n   d) Her şey dahil bir resort\n\nHazır olduğunuzda cevaplarınızı paylaşın, size hangi balayı çifti olduğunuzu söyleyeyim! 💕",
    "Balayı Çifti Kişilik Testine hoş geldiniz! 💞 Tercihinize göre hangi balayı çifti olduğunuzu bulalım:\n\n1. Tatilde en çok ne yapmayı seviyorsunuz?\n   a) Lüks mekanlarda yemek ve alışveriş\n   b) Doğal güzellikleri keşfetmek\n   c) Yerel kültürü deneyimlemek\n   d) Dinlenmek ve rahatlamak\n\n2. Balayınızda ne kadar fotoğraf çekmek istersiniz?\n   a) Her anı belgelemek isterim\n   b) Sadece güzel manzaraları\n   c) Özel anlar ve yerel insanlarla\n   d) Minimum - anı yaşamak daha önemli\n\n3. İdeal balayı süreniz?\n   a) 7-10 gün lüks tatil\n   b) 2+ hafta, birkaç destinasyon\n   c) 2 hafta, derin kültürel deneyim\n   d) Kısa ama yoğun bir kaçamak\n\nYanıtlarınıza göre size özel balayı karakterinizi ve en uygun destinasyonları sunacağım! 💑🌍✨"
  ],
  family_holiday: [
    "Aile tatili paketlerimizle ilgilenmeniz harika! Balayınızın ötesinde seyahat planlarınızı desteklemek için buradayız. Çocuk dostu resortlarımızı, aile aktivitelerini ve özel indirimleri keşfetmek ister misiniz? Yoksa şimdi balayınıza odaklanıp aile tatillerini daha sonra mı konuşmak istersiniz? 👨‍👩‍👧‍👦✨",
    "Ailenizle birlikte harika anılar biriktirmek için mükemmel tatil seçeneklerimiz var! 🏖️ Çocuk kulüpleri, aile odaları ve herkes için aktiviteler sunan premium resort'larımız çok popüler. Çocuklarınızın yaşları ve ilgi alanları nedir? Bu bilgilerle size en uygun aile tatili paketlerini önerebilirim. Ayrıca balayınız için özel olarak planlama yapabilir, ileriki yıllarda aile tatiliniz için erken rezervasyon avantajlarından yararlanabilirsiniz! 👨‍👩‍👧‍👦💕"
  ],
  advice: [
    "Size kişisel tavsiyeler sunmaktan mutluluk duyarım! Balayınızda en romantik anları yaşamanıza yardımcı olacak önerilerim var. Aklınızda belirli bir destinasyon var mı? Ya da belirli bir bütçe veya zaman dilimi? Bu bilgilerle, unutulmaz anılar yaratmanız için size özel öneriler sunabilirim. Ayrıca yerel kültürü deneyimleme, en iyi fotoğraf noktalarını bulma veya romantik sürprizler planlama konusunda da yardımcı olabilirim! 💑🌍✨",
    "Balayınızı daha da özel kılmak için bazı tavsiyelerim var! 💖\n\n1. Mümkünse düğün sonrası hemen yola çıkmayın, bir gün dinlenin\n2. Yolculuk sırasında \"balayında olduğunuzu\" belirtin, çoğu yer size özel ikramlar sunacaktır\n3. Her şeyi planlamayın - spontane anlar için zaman bırakın\n4. Bir günü sadece odanızda geçirin - bu önemli!\n5. Telefonları mümkün olduğunca az kullanın\n6. Birlikte yeni bir şey deneyin - dalış, yemek kursu vb.\n\nBelirli bir destinasyon hakkında daha spesifik tavsiyeler ister misiniz? 🌴💑✨"
  ],
  default: [
    "Mükemmel balayı deneyiminizi planlamanıza yardımcı olmak için buradayım! Romantik kaçamak hayallerinizi gerçekleştirmenize nasıl yardımcı olabileceğimi lütfen bana söyleyin! 💖✨",
    "Hayalinizdeki balayına başlamanın heyecanını birlikte yaşayalım! 💕 Size en romantik destinasyonlar, unutulmaz deneyimler ve özel anılar için rehberlik etmekten mutluluk duyarım. Nasıl yardımcı olabilirim? Belirli bir destinasyon, bütçe aralığı veya yapmak istediğiniz aktiviteler hakkında bilgi verebilirseniz, size özel öneriler sunabilirim! 🏝️💑✨"
  ]
};

// Mesaj kategorisini tespit et
const detectCategory = (message: string): ResponseCategory => {
  const lowercaseMessage = message.toLowerCase();
  
  // Her kategori için kontrol et
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category !== 'default' && keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      return category as ResponseCategory;
    }
  }
  
  // Hiçbir kategori bulunamadıysa default dön
  return 'default';
};

// Rastgele yanıt seç
const getRandomResponse = (category: ResponseCategory): string => {
  const responses = RESPONSES[category];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// Ana AI yanıt fonksiyonu
export const getAIResponse = async (message: string): Promise<string> => {
  console.log("AI servisine gelen mesaj:", message);
  
  // Kategori tespit et
  const category = detectCategory(message);
  console.log("Tespit edilen kategori:", category);
  
  // Yanıt üret - basit rastgele seçim
  const response = getRandomResponse(category);
  
  // Gerçek bir AI API çağrısı gibi gecikme simüle et (500-1500ms)
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  console.log("Oluşturulan yanıt uzunluğu:", response.length);
  return response;
}; 