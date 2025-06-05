import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Calendar, MapPin, Star, Users, Crown, Sparkles, Check, Clock, Camera, Utensils, Plane, Car, Wifi, Phone, Mail, MessageCircle } from 'lucide-react';
import { packageService, HoneymoonPackage } from '../services/packageService';
import { useTheme } from '../contexts/ThemeContext';

interface PackageDetailProps {
  packageId?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const PackageDetail: React.FC<PackageDetailProps> = ({ packageId: propPackageId, isModal = false, onClose }) => {
  const { packageId: urlPackageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const packageId = propPackageId || urlPackageId;
  const { actualTheme } = useTheme();
  
  const [packageData, setPackageData] = useState<HoneymoonPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const loadPackageData = async () => {
      if (!packageId) return;
      
      try {
        setIsLoading(true);
        // Try to get from service first, fallback to mock data
        let pkg = await packageService.getPackage(packageId);
        
        // If not found, create mock data
        if (!pkg) {
          pkg = {
            id: packageId,
            title: 'Romantic Paradise Getaway',
            description: 'Escape to a world of romance and luxury with breathtaking views, exquisite dining, and unforgettable experiences designed for couples in love.',
            location: 'Santorini',
            country: 'Greece',
            duration: 7,
            price: 4500,
            currency: 'USD',
            category: 'romantic',
            features: ['Private Pool Villa', 'Couples Spa', 'Sunset Cruise', 'Fine Dining', 'Wine Tasting'],
            inclusions: [
              'Luxury accommodation for 7 nights',
              'Daily breakfast and 3 romantic dinners',
              'Private airport transfers',
              'Couples spa treatment (90 minutes)',
              'Private sunset cruise with champagne',
              'Wine tasting experience',
              '24/7 concierge service',
              'Professional photography session'
            ],
            images: [
              'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=800&h=600&fit=crop',
              'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&h=600&fit=crop',
              'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&h=600&fit=crop'
            ],
            rating: 4.9,
            reviews: 324,
            availability: true,
            seasonality: ['Spring', 'Summer', 'Fall']
          };
        }
        
        setPackageData(pkg);
      } catch (error) {
        console.error('Error loading package:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPackageData();
  }, [packageId]);

  const formatPrice = (price: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryIcon = (category: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      luxury: <Crown className="w-5 h-5" />,
      romantic: <Heart className="w-5 h-5" />,
      adventure: <Sparkles className="w-5 h-5" />,
      cultural: <Camera className="w-5 h-5" />,
      beach: <MapPin className="w-5 h-5" />,
      city: <MapPin className="w-5 h-5" />
    };
    return icons[category] || <Heart className="w-5 h-5" />;
  };

  const handleBookNow = () => {
    // Navigate to booking or contact form
    window.open('mailto:bookings@ailovve.com?subject=Booking Request&body=I would like to book this package: ' + packageData?.title, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: packageData?.title,
          text: packageData?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast here
    }
  };

  if (isLoading) {
    return (
      <div className={isModal ? "p-6 text-center" : `min-h-screen ${actualTheme === 'light' ? 'bg-gray-50' : 'bg-[#1f1f1f]'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-8 h-8 border-2 ${actualTheme === 'light' ? 'border-gray-300 border-t-gray-700' : 'border-white/20 border-t-white/80'} rounded-full animate-spin`}></div>
          <p className={actualTheme === 'light' ? 'text-gray-600' : 'text-white/70'}>Loading magical details...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className={isModal ? "p-6 text-center" : `min-h-screen ${actualTheme === 'light' ? 'bg-gray-50' : 'bg-[#1f1f1f]'} flex items-center justify-center`}>
        <div className="text-center">
          <h2 className={`text-2xl ${actualTheme === 'light' ? 'text-gray-900' : 'text-white'} mb-4`}>Package not found</h2>
          {!isModal && (
            <button
              onClick={() => navigate('/')}
              className="premium-package-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // Modal content layout
  if (isModal) {
    return (
      <div className={`package-modal-content ${actualTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>
        {/* Hero Section - Modal Version */}
        <div className="relative h-[300px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={packageData.images?.[selectedImage] || 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&h=800&fit=crop'}
              alt={packageData.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          {/* Image Navigation */}
          {packageData.images && packageData.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {packageData.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-3 h-3 rounded-full transition-all golden-dot ${
                    index === selectedImage ? 'active' : ''
                  }`}
                />
              ))}
            </div>
          )}

          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-3">
              {getCategoryIcon(packageData.category)}
              <span className="px-3 py-1 bg-white/20 backdrop-blur-10 rounded-full text-sm capitalize text-white">
                {packageData.category}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
              {packageData.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{packageData.location}, {packageData.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{packageData.duration} days</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{packageData.rating} ({packageData.reviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Modal Version */}
        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="glassmorphism-card p-4">
                <h2 className={`text-xl font-semibold mb-3 ${actualTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>About This Experience</h2>
                <p className={`leading-relaxed text-sm ${actualTheme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>
                  {packageData.description}
                </p>
              </div>

              {/* Features */}
              <div className="glassmorphism-card p-4">
                <h2 className={`text-xl font-semibold mb-4 ${actualTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>What's Included</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {packageData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="golden-luxury-dot">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className={`text-sm ${actualTheme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Inclusions */}
              <div className="glassmorphism-card p-4">
                <h2 className={`text-xl font-semibold mb-4 ${actualTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Package Inclusions</h2>
                <div className="space-y-2">
                  {packageData.inclusions.map((inclusion, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className={`text-sm ${actualTheme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>{inclusion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Booking Card */}
              <div className="glassmorphism-card p-4">
                <div className="text-center mb-4">
                  <div className={`text-2xl font-bold mb-1 ${actualTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {formatPrice(packageData.price)}
                  </div>
                  <div className={`text-xs ${actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>per couple</div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className={actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}>Duration:</span>
                    <span className={actualTheme === 'light' ? 'text-gray-900' : 'text-white'}>{packageData.duration} days</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}>Availability:</span>
                    <span className="text-green-400">
                      {packageData.availability ? 'Available' : 'Fully Booked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}>Best Season:</span>
                    <span className={actualTheme === 'light' ? 'text-gray-900' : 'text-white'}>{packageData.seasonality.join(', ')}</span>
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  className="w-full premium-package-btn"
                >
                  <Calendar className="w-4 h-4" />
                  Book Now
                </button>

                <div className="text-center mt-3">
                  <p className={`text-xs ${actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>
                    Or contact our romance specialists
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <a href="tel:+1234567890" className="premium-contact-btn">
                      <Phone className="w-3 h-3" />
                    </a>
                    <a href="mailto:love@ailovve.com" className="premium-contact-btn">
                      <Mail className="w-3 h-3" />
                    </a>
                    <button className="premium-contact-btn">
                      <MessageCircle className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="glassmorphism-card p-4">
                <h3 className={`text-base font-semibold mb-3 ${actualTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Quick Info</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className={`w-3 h-3 ${actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}`} />
                    <span className={actualTheme === 'light' ? 'text-gray-700' : 'text-white/80'}>Perfect for couples</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-3 h-3 ${actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}`} />
                    <span className={actualTheme === 'light' ? 'text-gray-700' : 'text-white/80'}>Instant confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className={`w-3 h-3 ${actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}`} />
                    <span className={actualTheme === 'light' ? 'text-gray-700' : 'text-white/80'}>Transport included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className={`w-3 h-3 ${actualTheme === 'light' ? 'text-gray-600' : 'text-white/60'}`} />
                    <span className={actualTheme === 'light' ? 'text-gray-700' : 'text-white/80'}>Free WiFi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full page layout (unchanged)
  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1f1f1f]/95 backdrop-blur-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to AI LOVVE</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-lg border transition-all ${
                  isFavorite 
                    ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={packageData.images?.[selectedImage] || 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&h=800&fit=crop'}
            alt={packageData.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Image Navigation */}
        {packageData.images && packageData.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {packageData.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-3 h-3 rounded-full transition-all golden-dot ${
                  index === selectedImage ? 'active' : ''
                }`}
              />
            ))}
          </div>
        )}

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              {getCategoryIcon(packageData.category)}
              <span className="px-3 py-1 bg-white/20 backdrop-blur-10 rounded-full text-sm capitalize">
                {packageData.category}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              {packageData.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{packageData.location}, {packageData.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{packageData.duration} days</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{packageData.rating} ({packageData.reviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="glassmorphism-card p-6">
              <h2 className="text-2xl font-semibold mb-4 text-white">About This Experience</h2>
              <p className="text-white/80 leading-relaxed">
                {packageData.description}
              </p>
            </div>

            {/* Features */}
            <div className="glassmorphism-card p-6">
              <h2 className="text-2xl font-semibold mb-6 text-white">What's Included</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {packageData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="golden-luxury-dot">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Inclusions */}
            <div className="glassmorphism-card p-6">
              <h2 className="text-2xl font-semibold mb-6 text-white">Package Inclusions</h2>
              <div className="space-y-3">
                {packageData.inclusions.map((inclusion, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80">{inclusion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="glassmorphism-card p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatPrice(packageData.price)}
                </div>
                <div className="text-white/60 text-sm">per couple</div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Duration:</span>
                  <span className="text-white">{packageData.duration} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Availability:</span>
                  <span className="text-green-400">
                    {packageData.availability ? 'Available' : 'Fully Booked'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Best Season:</span>
                  <span className="text-white">{packageData.seasonality.join(', ')}</span>
                </div>
              </div>

              <button
                onClick={handleBookNow}
                className="w-full premium-package-btn"
              >
                <Calendar className="w-4 h-4" />
                Book Now
              </button>

              <div className="text-center mt-4">
                <p className="text-white/60 text-xs">
                  Or contact our romance specialists
                </p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <a href="tel:+1234567890" className="premium-contact-btn">
                    <Phone className="w-4 h-4" />
                  </a>
                  <a href="mailto:love@ailovve.com" className="premium-contact-btn">
                    <Mail className="w-4 h-4" />
                  </a>
                  <button className="premium-contact-btn">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="glassmorphism-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">Perfect for couples</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">Instant confirmation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">Transport included</span>
                </div>
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">Free WiFi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetail; 