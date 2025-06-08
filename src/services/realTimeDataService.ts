import { logger } from '../utils/logger';

interface WeatherData {
  destination: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitationChance: number;
  }>;
  lastUpdated: number;
}

interface FlightData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  prices: Array<{
    airline: string;
    price: number;
    currency: string;
    bookingClass: 'economy' | 'business' | 'first';
    availableSeats: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  bestDeal: {
    airline: string;
    price: number;
    savings: number;
  };
  lastUpdated: number;
}

interface HotelData {
  destination: string;
  checkIn: string;
  checkOut: string;
  hotels: Array<{
    name: string;
    rating: number;
    price: number;
    currency: string;
    amenities: string[];
    availability: 'available' | 'limited' | 'sold_out';
    cancelFree: boolean;
    distanceFromCenter: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  lastUpdated: number;
}

interface CurrencyData {
  baseCurrency: string;
  rates: Record<string, number>;
  lastUpdated: number;
  trends: Record<string, {
    change24h: number;
    change7d: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

interface LocalEventsData {
  destination: string;
  events: Array<{
    name: string;
    type: 'festival' | 'concert' | 'exhibition' | 'holiday' | 'seasonal';
    date: string;
    duration: number; // days
    description: string;
    impact: 'high' | 'medium' | 'low'; // tourism impact
    priceImpact: number; // percentage
  }>;
  peakSeason: {
    start: string;
    end: string;
    reason: string;
    priceMultiplier: number;
  };
  lastUpdated: number;
}

interface TravelAdvisoryData {
  destination: string;
  safetyLevel: 'safe' | 'caution' | 'high_risk' | 'avoid';
  advisories: Array<{
    type: 'health' | 'security' | 'natural' | 'political';
    level: 'info' | 'warning' | 'alert';
    message: string;
    validUntil?: string;
  }>;
  requirements: {
    visa: boolean;
    vaccination: string[];
    covidRestrictions: string[];
  };
  lastUpdated: number;
}

class RealTimeDataService {
  private cache: Map<string, any> = new Map();
  private readonly CACHE_TTL = {
    weather: 30 * 60 * 1000, // 30 minutes
    flights: 15 * 60 * 1000, // 15 minutes
    hotels: 60 * 60 * 1000, // 1 hour
    currency: 60 * 60 * 1000, // 1 hour
    events: 24 * 60 * 60 * 1000, // 24 hours
    advisory: 12 * 60 * 60 * 1000 // 12 hours
  };

  // Mock Weather API (gerçek API entegrasyonu için OpenWeatherMap kullanılabilir)
  async getWeatherData(destination: string): Promise<WeatherData> {
    const cacheKey = `weather_${destination}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.weather);
    if (cached) return cached;

    try {
      // Mock weather data (gerçek API çağrısı burada olacak)
      const weatherData = this.generateMockWeatherData(destination);
      this.setCachedData(cacheKey, weatherData);
      
      logger.log(`🌤️ Weather data fetched for ${destination}`);
      return weatherData;
    } catch (error) {
      logger.error('Weather API error:', error);
      return this.getFallbackWeatherData(destination);
    }
  }

  // Mock Flight Price API (gerçek API için Skyscanner/Amadeus kullanılabilir)
  async getFlightData(origin: string, destination: string, departureDate: string, returnDate?: string): Promise<FlightData> {
    const cacheKey = `flights_${origin}_${destination}_${departureDate}_${returnDate || 'oneway'}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.flights);
    if (cached) return cached;

    try {
      const flightData = this.generateMockFlightData(origin, destination, departureDate, returnDate);
      this.setCachedData(cacheKey, flightData);
      
      logger.log(`✈️ Flight data fetched: ${origin} → ${destination}`);
      return flightData;
    } catch (error) {
      logger.error('Flight API error:', error);
      return this.getFallbackFlightData(origin, destination, departureDate, returnDate);
    }
  }

  // Mock Hotel API (gerçek API için Booking.com/Hotels.com kullanılabilir)
  async getHotelData(destination: string, checkIn: string, checkOut: string): Promise<HotelData> {
    const cacheKey = `hotels_${destination}_${checkIn}_${checkOut}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.hotels);
    if (cached) return cached;

    try {
      const hotelData = this.generateMockHotelData(destination, checkIn, checkOut);
      this.setCachedData(cacheKey, hotelData);
      
      logger.log(`🏨 Hotel data fetched for ${destination}`);
      return hotelData;
    } catch (error) {
      logger.error('Hotel API error:', error);
      return this.getFallbackHotelData(destination, checkIn, checkOut);
    }
  }

  // Currency Exchange API (gerçek API için ExchangeRate-API kullanılabilir)
  async getCurrencyData(baseCurrency: string = 'USD'): Promise<CurrencyData> {
    const cacheKey = `currency_${baseCurrency}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.currency);
    if (cached) return cached;

    try {
      // Gerçek API çağrısı burada olacak
      const currencyData = await this.fetchRealCurrencyData(baseCurrency);
      this.setCachedData(cacheKey, currencyData);
      
      logger.log(`💱 Currency data fetched for ${baseCurrency}`);
      return currencyData;
    } catch (error) {
      logger.error('Currency API error:', error);
      return this.getFallbackCurrencyData(baseCurrency);
    }
  }

  // Local Events API (gerçek API için Eventbrite/Ticketmaster kullanılabilir)
  async getLocalEventsData(destination: string): Promise<LocalEventsData> {
    const cacheKey = `events_${destination}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.events);
    if (cached) return cached;

    try {
      const eventsData = this.generateMockEventsData(destination);
      this.setCachedData(cacheKey, eventsData);
      
      logger.log(`🎭 Events data fetched for ${destination}`);
      return eventsData;
    } catch (error) {
      logger.error('Events API error:', error);
      return this.getFallbackEventsData(destination);
    }
  }

  // Travel Advisory API (gerçek API için government travel advisories)
  async getTravelAdvisoryData(destination: string): Promise<TravelAdvisoryData> {
    const cacheKey = `advisory_${destination}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.advisory);
    if (cached) return cached;

    try {
      const advisoryData = this.generateMockAdvisoryData(destination);
      this.setCachedData(cacheKey, advisoryData);
      
      logger.log(`⚠️ Travel advisory fetched for ${destination}`);
      return advisoryData;
    } catch (error) {
      logger.error('Advisory API error:', error);
      return this.getFallbackAdvisoryData(destination);
    }
  }

  // Cache helpers
  private getCachedData(key: string, ttl: number): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Mock data generators
  private generateMockWeatherData(destination: string): WeatherData {
    const temps = {
      'paris': { min: 8, max: 18 },
      'bali': { min: 24, max: 32 },
      'santorini': { min: 15, max: 25 },
      'maldives': { min: 26, max: 30 },
      'kapadokya': { min: 5, max: 20 },
      'antalya': { min: 12, max: 26 }
    };

    const destTemp = temps[destination.toLowerCase() as keyof typeof temps] || { min: 10, max: 25 };
    const currentTemp = Math.floor(Math.random() * (destTemp.max - destTemp.min) + destTemp.min);

    const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'light_rain', 'clear'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      destination,
      current: {
        temperature: currentTemp,
        condition,
        humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
        windSpeed: Math.floor(Math.random() * 20 + 5) // 5-25 km/h
      },
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        high: destTemp.max + Math.floor(Math.random() * 6 - 3),
        low: destTemp.min + Math.floor(Math.random() * 6 - 3),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        precipitationChance: Math.floor(Math.random() * 100)
      })),
      lastUpdated: Date.now()
    };
  }

  private generateMockFlightData(origin: string, destination: string, departureDate: string, returnDate?: string): FlightData {
    const basePrice = Math.floor(Math.random() * 800 + 200); // 200-1000 USD
    
    const airlines = ['Turkish Airlines', 'Emirates', 'Lufthansa', 'Air France', 'Qatar Airways'];
    const prices = airlines.map(airline => ({
      airline,
      price: basePrice + Math.floor(Math.random() * 400 - 200),
      currency: 'USD',
      bookingClass: 'economy' as const,
      availableSeats: Math.floor(Math.random() * 50 + 1)
    }));

    const priceList = prices.map(p => p.price);
    const minPrice = Math.min(...priceList);
    const maxPrice = Math.max(...priceList);
    const avgPrice = Math.floor(priceList.reduce((a, b) => a + b, 0) / priceList.length);

    const bestDeal = prices.find(p => p.price === minPrice)!;

    return {
      origin,
      destination,
      departureDate,
      returnDate,
      prices,
      priceRange: {
        min: minPrice,
        max: maxPrice,
        average: avgPrice
      },
      bestDeal: {
        airline: bestDeal.airline,
        price: bestDeal.price,
        savings: avgPrice - bestDeal.price
      },
      lastUpdated: Date.now()
    };
  }

  private generateMockHotelData(destination: string, checkIn: string, checkOut: string): HotelData {
    const hotelNames = [
      'Grand Luxury Resort', 'Romantic Hideaway', 'Paradise Villa', 
      'Royal Palace Hotel', 'Sunset Resort & Spa', 'Diamond Beach Resort'
    ];

    const basePrice = Math.floor(Math.random() * 400 + 100); // 100-500 USD per night

    const hotels = hotelNames.map(name => ({
      name,
      rating: Math.floor(Math.random() * 2 + 4), // 4-5 stars
      price: basePrice + Math.floor(Math.random() * 300 - 150),
      currency: 'USD',
      amenities: ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Beach Access'].slice(0, Math.floor(Math.random() * 3 + 3)),
      availability: ['available', 'limited', 'sold_out'][Math.floor(Math.random() * 3)] as any,
      cancelFree: Math.random() > 0.3,
      distanceFromCenter: Math.floor(Math.random() * 20 + 1) // 1-20 km
    }));

    const availableHotels = hotels.filter(h => h.availability !== 'sold_out');
    const priceList = availableHotels.map(h => h.price);
    
    return {
      destination,
      checkIn,
      checkOut,
      hotels: availableHotels,
      priceRange: {
        min: Math.min(...priceList),
        max: Math.max(...priceList),
        average: Math.floor(priceList.reduce((a, b) => a + b, 0) / priceList.length)
      },
      lastUpdated: Date.now()
    };
  }

  private async fetchRealCurrencyData(baseCurrency: string): Promise<CurrencyData> {
    try {
      // Gerçek ücretsiz API kullanımı
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      const data = await response.json();
      
      return {
        baseCurrency,
        rates: data.rates,
        lastUpdated: Date.now(),
        trends: this.generateCurrencyTrends(data.rates)
      };
    } catch (error) {
      throw new Error('Currency API failed');
    }
  }

  private generateCurrencyTrends(rates: Record<string, number>): CurrencyData['trends'] {
    const trends: CurrencyData['trends'] = {};
    
    Object.keys(rates).forEach(currency => {
      const change24h = (Math.random() - 0.5) * 0.1; // -5% to +5%
      const change7d = (Math.random() - 0.5) * 0.3; // -15% to +15%
      
      trends[currency] = {
        change24h,
        change7d,
        trend: change24h > 0.01 ? 'up' : change24h < -0.01 ? 'down' : 'stable'
      };
    });
    
    return trends;
  }

  private generateMockEventsData(destination: string): LocalEventsData {
    const events = [
      { name: 'Summer Music Festival', type: 'festival' as const, impact: 'high' as const, priceImpact: 25 },
      { name: 'Art Exhibition', type: 'exhibition' as const, impact: 'medium' as const, priceImpact: 10 },
      { name: 'Local Holiday', type: 'holiday' as const, impact: 'high' as const, priceImpact: 30 },
      { name: 'Food Festival', type: 'festival' as const, impact: 'medium' as const, priceImpact: 15 }
    ];

    const selectedEvents = events.slice(0, Math.floor(Math.random() * 3 + 1)).map(event => ({
      ...event,
      date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: Math.floor(Math.random() * 7 + 1),
      description: `Experience the amazing ${event.name} in ${destination}`
    }));

    return {
      destination,
      events: selectedEvents,
      peakSeason: {
        start: '2024-06-01',
        end: '2024-08-31',
        reason: 'Summer tourism season',
        priceMultiplier: 1.4
      },
      lastUpdated: Date.now()
    };
  }

  private generateMockAdvisoryData(destination: string): TravelAdvisoryData {
    const safetyLevels: TravelAdvisoryData['safetyLevel'][] = ['safe', 'caution', 'high_risk'];
    const safetyLevel = safetyLevels[Math.floor(Math.random() * 2)]; // Mostly safe or caution

    const advisories = [];
    if (safetyLevel === 'caution') {
      advisories.push({
        type: 'health' as const,
        level: 'warning' as const,
        message: 'Monitor health guidelines and local restrictions',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return {
      destination,
      safetyLevel,
      advisories,
      requirements: {
        visa: Math.random() > 0.6,
        vaccination: Math.random() > 0.7 ? ['COVID-19'] : [],
        covidRestrictions: Math.random() > 0.8 ? ['Mask required in public transport'] : []
      },
      lastUpdated: Date.now()
    };
  }

  // Fallback data methods
  private getFallbackWeatherData(destination: string): WeatherData {
    return {
      destination,
      current: { temperature: 22, condition: 'sunny', humidity: 60, windSpeed: 10 },
      forecast: [],
      lastUpdated: Date.now()
    };
  }

  private getFallbackFlightData(origin: string, destination: string, departureDate: string, returnDate?: string): FlightData {
    return {
      origin, destination, departureDate, returnDate,
      prices: [], priceRange: { min: 0, max: 0, average: 0 },
      bestDeal: { airline: 'N/A', price: 0, savings: 0 },
      lastUpdated: Date.now()
    };
  }

  private getFallbackHotelData(destination: string, checkIn: string, checkOut: string): HotelData {
    return {
      destination, checkIn, checkOut, hotels: [],
      priceRange: { min: 0, max: 0, average: 0 },
      lastUpdated: Date.now()
    };
  }

  private getFallbackCurrencyData(baseCurrency: string): CurrencyData {
    return {
      baseCurrency, rates: { 'EUR': 0.85, 'TRY': 27.5, 'GBP': 0.75 },
      trends: {}, lastUpdated: Date.now()
    };
  }

  private getFallbackEventsData(destination: string): LocalEventsData {
    return {
      destination, events: [],
      peakSeason: { start: '2024-06-01', end: '2024-08-31', reason: 'Summer season', priceMultiplier: 1.2 },
      lastUpdated: Date.now()
    };
  }

  private getFallbackAdvisoryData(destination: string): TravelAdvisoryData {
    return {
      destination, safetyLevel: 'safe', advisories: [],
      requirements: { visa: false, vaccination: [], covidRestrictions: [] },
      lastUpdated: Date.now()
    };
  }

  // Comprehensive travel data for AI
  async getComprehensiveTravelData(destination: string, origin?: string, dates?: { checkIn: string; checkOut: string }): Promise<{
    weather: WeatherData;
    currency: CurrencyData;
    events: LocalEventsData;
    advisory: TravelAdvisoryData;
    flights?: FlightData;
    hotels?: HotelData;
    insights: {
      bestTimeToVisit: string;
      priceInsights: string[];
      weatherInsights: string[];
      travelTips: string[];
    };
  }> {
    const [weather, currency, events, advisory] = await Promise.all([
      this.getWeatherData(destination),
      this.getCurrencyData(),
      this.getLocalEventsData(destination),
      this.getTravelAdvisoryData(destination)
    ]);

    let flights, hotels;
    if (origin && dates) {
      [flights, hotels] = await Promise.all([
        this.getFlightData(origin, destination, dates.checkIn, dates.checkOut),
        this.getHotelData(destination, dates.checkIn, dates.checkOut)
      ]);
    }

    const insights = this.generateTravelInsights({ weather, currency, events, advisory, flights, hotels });

    return { weather, currency, events, advisory, flights, hotels, insights };
  }

  private generateTravelInsights(data: any): any {
    const insights = {
      bestTimeToVisit: 'Spring and fall offer the best weather and fewer crowds',
      priceInsights: [],
      weatherInsights: [],
      travelTips: []
    };

    // Weather insights
    if (data.weather.current.temperature > 30) {
      insights.weatherInsights.push('Pack light, breathable clothing for hot weather');
    } else if (data.weather.current.temperature < 10) {
      insights.weatherInsights.push('Pack warm clothing for cool temperatures');
    }

    // Price insights
    if (data.events.events.some((e: any) => e.impact === 'high')) {
      insights.priceInsights.push('Prices may be higher due to local events');
    }

    // Travel tips
    if (data.advisory.requirements.visa) {
      insights.travelTips.push('Visa required - apply in advance');
    }

    return insights;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    logger.log('🗑️ Real-time data cache cleared');
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const realTimeDataService = new RealTimeDataService();
export type { WeatherData, FlightData, HotelData, CurrencyData, LocalEventsData, TravelAdvisoryData };