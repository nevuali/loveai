export class LanguageManager {
  private static readonly LANGUAGE_STORAGE_KEY = 'ai_lovve_preferred_language';
  private static readonly DEFAULT_LANGUAGE = 'tr'; // Turkish as default

  // Get user's preferred language
  static getPreferredLanguage(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.LANGUAGE_STORAGE_KEY) || this.DEFAULT_LANGUAGE;
    }
    return this.DEFAULT_LANGUAGE;
  }

  // Set user's preferred language
  static setPreferredLanguage(language: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.LANGUAGE_STORAGE_KEY, language);
      console.log(`💾 Language preference saved: ${language}`);
    }
  }

  // Detect if message contains mixed content (e.g., Turkish + place names)
  static isMixedContent(message: string, detectedLanguage: string, preferredLanguage: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Common place names that might appear in any language
    const placeNames = /\b(sri\s+lanka|new\s+york|los\s+angeles|san\s+francisco|united\s+states|uk|usa|london|paris|tokyo|berlin|madrid|rome|moscow|beijing|sydney|mumbai|delhi|bangkok|singapore|dubai|istanbul|cairo|lagos|cape\s+town|buenos\s+aires|rio\s+de\s+janeiro|mexico\s+city|toronto|vancouver|montreal|amsterdam|brussels|vienna|prague|budapest|warsaw|stockholm|oslo|helsinki|copenhagen|zurich|geneva|milan|barcelona|lisbon|athens|dublin|edinburgh|manchester|liverpool|glasgow|cardiff|belfast|birmingham|leeds|sheffield|bristol|nottingham|newcastle|southampton|portsmouth|brighton|cambridge|oxford|canterbury|york|bath|exeter|chester|lincoln|norwich|leicester|coventry|wolverhampton|stoke|derby|plymouth|luton|reading|northampton|preston|blackpool|bournemouth|swindon|milton\s+keynes|basildon|crawley|slough|gillingham|watford|st\s+albans|woking|chelmsford|colchester|southend|ipswich|norwich|great\s+yarmouth|king's\s+lynn|peterborough|cambridge|ely|huntingdon|st\s+neots|bedford|luton|dunstable|leighton\s+buzzard|aylesbury|high\s+wycombe|amersham|chesham|watford|hemel\s+hempstead|st\s+albans|welwyn\s+garden\s+city|hatfield|stevenage|hitchin|letchworth|royston|bishop's\s+stortford|harlow|epping|brentwood|romford|ilford|barking|dagenham|upminster|grays|tilbury|basildon|canvey\s+island|southend-on-sea|rochford|rayleigh|wickford|billericay|brentwood|chelmsford|braintree|halstead|sudbury|haverhill|newmarket|bury\s+st\s+edmunds|lowestoft|beccles|bungay|diss|thetford|downham\s+market|swaffham|fakenham|wells-next-the-sea|sheringham|cromer|north\s+walsham|aylsham|wroxham|stalham|caister-on-sea|hemsby|winterton-on-sea|sea\s+palling|happisburgh|mundesley|overstrand|trimingham|sidestrand|northrepps|southrepps|antingham|swafield|bacton|walcott|lessingham|eccles\s+on\s+sea|cart\s+gap|waxham|horsey|somerton|winterton-on-sea|california|florida|texas|nevada|arizona|utah|colorado|oregon|washington|alaska|hawaii|montana|wyoming|north\s+dakota|south\s+dakota|nebraska|kansas|oklahoma|arkansas|louisiana|mississippi|alabama|tennessee|kentucky|indiana|ohio|michigan|wisconsin|minnesota|iowa|missouri|illinois|georgia|south\s+carolina|north\s+carolina|virginia|west\s+virginia|pennsylvania|new\s+jersey|delaware|maryland|connecticut|rhode\s+island|massachusetts|vermont|new\s+hampshire|maine|ontario|quebec|british\s+columbia|alberta|saskatchewan|manitoba|nova\s+scotia|new\s+brunswick|prince\s+edward\s+island|newfoundland|labrador|yukon|northwest\s+territories|nunavut|australia|new\s+zealand|south\s+africa|kenya|tanzania|uganda|rwanda|burundi|ethiopia|somalia|djibouti|eritrea|sudan|south\s+sudan|chad|central\s+african\s+republic|cameroon|equatorial\s+guinea|gabon|sao\s+tome\s+and\s+principe|democratic\s+republic\s+of\s+the\s+congo|republic\s+of\s+the\s+congo|angola|zambia|zimbabwe|botswana|namibia|lesotho|swaziland|madagascar|mauritius|seychelles|comoros|mayotte|reunion|saint\s+helena|ascension\s+island|tristan\s+da\s+cunha|falkland\s+islands|south\s+georgia\s+and\s+the\s+south\s+sandwich\s+islands|british\s+antarctic\s+territory|bouvet\s+island|heard\s+island\s+and\s+mcdonald\s+islands|french\s+southern\s+and\s+antarctic\s+lands|american\s+samoa|cook\s+islands|french\s+polynesia|guam|kiribati|marshall\s+islands|micronesia|nauru|new\s+caledonia|niue|norfolk\s+island|northern\s+mariana\s+islands|palau|papua\s+new\s+guinea|pitcairn\s+islands|samoa|solomon\s+islands|tokelau|tonga|tuvalu|vanuatu|wallis\s+and\s+futuna|fiji|china|japan|south\s+korea|north\s+korea|mongolia|taiwan|hong\s+kong|macau|india|pakistan|bangladesh|nepal|bhutan|myanmar|thailand|laos|cambodia|vietnam|malaysia|brunei|indonesia|philippines|east\s+timor|russia|ukraine|belarus|moldova|romania|bulgaria|serbia|montenegro|bosnia\s+and\s+herzegovina|croatia|slovenia|slovakia|czech\s+republic|poland|lithuania|latvia|estonia|finland|sweden|norway|denmark|iceland|ireland|united\s+kingdom|netherlands|belgium|luxembourg|france|monaco|switzerland|liechtenstein|austria|germany|italy|san\s+marino|vatican\s+city|malta|spain|andorra|portugal|greece|cyprus|turkey|georgia|armenia|azerbaijan|iran|iraq|syria|lebanon|jordan|israel|palestine|saudi\s+arabia|yemen|oman|united\s+arab\s+emirates|qatar|bahrain|kuwait|afghanistan|uzbekistan|turkmenistan|tajikistan|kyrgyzstan|kazakhstan|mexico|belize|guatemala|honduras|el\s+salvador|nicaragua|costa\s+rica|panama|cuba|jamaica|haiti|dominican\s+republic|puerto\s+rico|trinidad\s+and\s+tobago|barbados|saint\s+lucia|saint\s+vincent\s+and\s+the\s+grenadines|grenada|antigua\s+and\s+barbuda|saint\s+kitts\s+and\s+nevis|dominica|colombia|venezuela|guyana|suriname|french\s+guiana|brazil|ecuador|peru|bolivia|paraguay|uruguay|argentina|chile|morocco|algeria|tunisia|libya|egypt|sudan|mali|burkina\s+faso|niger|nigeria|benin|togo|ghana|ivory\s+coast|liberia|sierra\s+leone|guinea|guinea-bissau|senegal|gambia|mauritania)/i;
    
    // Check if message contains place names
    const hasPlaceNames = placeNames.test(message);
    
    // If detected language differs from preferred and message has place names
    if (detectedLanguage !== preferredLanguage && hasPlaceNames) {
      return true;
    }
    
    return false;
  }

  // Smart language detection that considers user preference and context
  static smartDetectLanguage(
    message: string, 
    conversationHistory: any[], 
    forceDetection: boolean = false
  ): string {
    const preferredLanguage = this.getPreferredLanguage();
    
    // If user explicitly set a language preference and it's not forced detection
    if (!forceDetection && preferredLanguage && preferredLanguage !== 'auto') {
      // Check if this might be mixed content
      const basicDetection = this.basicLanguageDetection(message);
      
      if (this.isMixedContent(message, basicDetection, preferredLanguage)) {
        console.log(`🌍 Mixed content detected: keeping preferred language ${preferredLanguage}`);
        return preferredLanguage;
      }
      
      // If message is very short or has low confidence, use preferred
      if (message.length < 10) {
        return preferredLanguage;
      }
    }
    
    // Otherwise use enhanced detection
    return this.enhancedLanguageDetection(message, conversationHistory);
  }

  // Basic language detection (simplified version)
  private static basicLanguageDetection(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (/[çğıöşüÇĞIÖŞÜ]|merhaba|selam|teşekkür|nasıl/.test(lowerMessage)) return 'tr';
    if (/[ñáéíóú¿¡]|hola|gracias|cómo|está/.test(lowerMessage)) return 'es';
    if (/[àâéèêçôœ]|bonjour|merci|comment/.test(lowerMessage)) return 'fr';
    if (/[äöüß]|hallo|danke|bitte/.test(lowerMessage)) return 'de';
    if (/[а-я]|привет|спасибо/.test(lowerMessage)) return 'ru';
    
    return 'en';
  }

  // Enhanced language detection (uses the improved algorithm)
  private static enhancedLanguageDetection(message: string, conversationHistory: any[]): string {
    // This would call the enhanced detectLanguage function from geminiService
    // For now, return basic detection
    return this.basicLanguageDetection(message);
  }

  // Get supported languages list
  static getSupportedLanguages() {
    return [
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷', native: 'Türkçe' },
      { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
      { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
      { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
      { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
      { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский' },
    ];
  }

  // Auto-detect and save user's language preference
  static autoDetectAndSave(message: string): void {
    const detected = this.basicLanguageDetection(message);
    const current = this.getPreferredLanguage();
    
    // Only auto-save if we don't have a preference yet
    if (current === this.DEFAULT_LANGUAGE && detected !== 'en') {
      this.setPreferredLanguage(detected);
      console.log(`🤖 Auto-detected and saved language preference: ${detected}`);
    }
  }
} 