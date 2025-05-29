import React from 'react';
import { HoneymoonPackage } from '../services/packageService';
import { MapPin, Calendar, Star, Heart, Eye } from 'lucide-react';

interface PackageCardProps {
  package: HoneymoonPackage;
  onSelect?: (packageId: string) => void;
  compact?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  package: pkg, 
  onSelect,
  compact = false 
}) => {
  const formatPrice = (price: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      luxury: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      adventure: 'bg-green-500/20 text-green-300 border-green-400/30',
      romantic: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
      cultural: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      beach: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      city: 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-300 border-gray-400/30';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      luxury: '💎',
      adventure: '🏔️',
      romantic: '💕',
      cultural: '🏛️',
      beach: '🏖️',
      city: '🏙️'
    };
    return icons[category] || '✨';
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(pkg.id);
    }
  };

  if (compact) {
    return (
      <div 
        className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-gray-700/50 hover:to-gray-800/50 hover:transform hover:scale-[1.02]"
        onClick={handleCardClick}
      >
        <div className="flex gap-3">
          {/* Image */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={pkg.images[0]} 
              alt={pkg.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1571417904834-b745c0359781?w=400&h=400&fit=crop`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-white text-sm truncate group-hover:text-yellow-300 transition-colors">
                {pkg.title}
              </h4>
              <Heart className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-pink-400 transition-all duration-300" />
            </div>
            
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-300">{pkg.location}, {pkg.country}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-300">{pkg.rating}</span>
              </div>
              <div className="text-sm font-bold text-yellow-300">
                {formatPrice(pkg.price)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:border-white/20 hover:bg-gradient-to-br hover:from-gray-700/60 hover:to-gray-800/60 hover:transform hover:scale-[1.02] hover:shadow-2xl"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={pkg.images[0]} 
          alt={pkg.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1571417904834-b745c0359781?w=600&h=400&fit=crop`;
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Category Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(pkg.category)} backdrop-blur-sm`}>
          <span className="mr-1">{getCategoryIcon(pkg.category)}</span>
          {pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1)}
        </div>
        
        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-white font-medium">{pkg.rating}</span>
        </div>
        
        {/* Heart Icon */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-pink-400 group-hover:fill-pink-400 transition-all duration-300" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {/* Title & Location */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-white mb-1 group-hover:text-yellow-300 transition-colors duration-300">
            {pkg.title}
          </h3>
          <div className="flex items-center gap-1 text-gray-300">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{pkg.location}, {pkg.country}</span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-300 mb-4 line-clamp-2 leading-relaxed">
          {pkg.description}
        </p>
        
        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {pkg.features.slice(0, 3).map((feature, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-white/10 text-xs text-gray-300 rounded-full backdrop-blur-sm"
              >
                {feature}
              </span>
            ))}
            {pkg.features.length > 3 && (
              <span className="px-2 py-1 bg-white/10 text-xs text-gray-300 rounded-full backdrop-blur-sm">
                +{pkg.features.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{pkg.duration} days</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{pkg.reviews} reviews</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-400">Starting from</div>
            <div className="font-bold text-xl text-yellow-300">
              {formatPrice(pkg.price)}
            </div>
          </div>
        </div>
        
        {/* Action Hint */}
        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="text-center py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-lg backdrop-blur-sm">
            <span className="text-sm text-yellow-300 font-medium">✨ Tap to explore this magical journey</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCard; 