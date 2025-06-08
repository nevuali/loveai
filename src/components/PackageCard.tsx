import React, { memo, useCallback } from 'react';
import { HoneymoonPackage } from '../services/packageService';
import { MapPin, Calendar, Star, Heart, Eye } from 'lucide-react';

interface PackageCardProps {
  package: HoneymoonPackage;
  onSelect?: (packageId: string) => void;
  compact?: boolean;
  isCarousel?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

const PackageCard: React.FC<PackageCardProps> = memo(({ 
  package: pkg, 
  onSelect,
  compact = false,
  isCarousel = false,
  onPrevious,
  onNext,
  currentIndex = 0,
  totalCount = 1
}) => {
  const formatPrice = useCallback((price: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const getCategoryColor = useCallback((category: string): string => {
    const colors: Record<string, string> = {
      luxury: 'text-amber-600',
      adventure: 'text-emerald-600',
      romantic: 'text-rose-600',
      cultural: 'text-violet-600',
      beach: 'text-cyan-600',
      city: 'text-blue-600'
    };
    return colors[category] || 'text-gray-600';
  }, []);

  const handleSelect = useCallback(() => {
    if (onSelect && pkg.id) {
      onSelect(pkg.id);
    }
  }, [onSelect, pkg.id]);

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      luxury: '✨',
      adventure: '🏔️',
      romantic: '💝',
      cultural: '🏛️',
      beach: '🏖️',
      city: '🏙️'
    };
    return icons[category] || '✨';
  };

  if (isCarousel) {
    return (
      <div className="package-card-carousel">
        {/* Navigation Buttons */}
        <div className="carousel-nav">
          <button
            onClick={onPrevious}
            className="nav-button nav-previous"
            disabled={totalCount <= 1}
          >
            ←
          </button>
          
          <div className="carousel-counter">
            {currentIndex + 1} / {totalCount}
          </div>
          
          <button
            onClick={onNext}
            className="nav-button nav-next"
            disabled={totalCount <= 1}
          >
            →
          </button>
        </div>

        {/* Minimalist Card Content */}
        <div className="min-card-content">
          <div className="card-header">
            <span className={`category-badge ${getCategoryColor(pkg.category)}`}>
              {getCategoryIcon(pkg.category)} {pkg.category}
            </span>
            <button className="heart-btn">
              <Heart className="w-4 h-4" />
            </button>
          </div>

          <div className="card-body">
            <h3 className="card-title">{pkg.title}</h3>
            
            <div className="location-info">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{pkg.location}, {pkg.country}</span>
            </div>

            <p className="card-description">{pkg.description}</p>

            <div className="features-grid">
              {pkg.features.slice(0, 3).map((feature, index) => (
                <span key={index} className="feature-tag">
                  {feature}
                </span>
              ))}
              {pkg.features.length > 3 && (
                <span className="feature-more">
                  +{pkg.features.length - 3} more
                </span>
              )}
            </div>
          </div>

          <div className="card-footer">
            <div className="meta-info">
              <div className="duration-info">
                <Calendar className="w-4 h-4" />
                <span>{pkg.duration} days</span>
              </div>
              <div className="rating-info">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{pkg.rating}</span>
              </div>
            </div>
            
            <div className="price-section">
              <div className="price-label">From</div>
              <div className="price-amount">{formatPrice(pkg.price)}</div>
            </div>
          </div>

          <button 
            onClick={handleSelect}
            className="select-btn"
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className="compact-card"
        onClick={handleSelect}
      >
        <div className="compact-content">
          <div className="compact-header">
            <h4 className="compact-title">{pkg.title}</h4>
            <Heart className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="compact-location">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span>{pkg.location}, {pkg.country}</span>
          </div>
          
          <div className="compact-footer">
            <div className="compact-rating">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{pkg.rating}</span>
            </div>
            <div className="compact-price">
              {formatPrice(pkg.price)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default card layout - minimalist
  return (
    <div 
      className="default-card"
      onClick={handleSelect}
    >
      <div className="card-image-placeholder">
        <span className={`category-indicator ${getCategoryColor(pkg.category)}`}>
          {getCategoryIcon(pkg.category)}
        </span>
        <button className="favorite-btn">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      
      <div className="card-content">
        <div className="content-header">
          <h3 className="content-title">{pkg.title}</h3>
          <div className="location-row">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="location-text">{pkg.location}, {pkg.country}</span>
          </div>
        </div>
        
        <p className="content-description">{pkg.description}</p>
        
        <div className="features-section">
          {pkg.features.slice(0, 3).map((feature, index) => (
            <span key={index} className="simple-feature">
              {feature}
            </span>
          ))}
          {pkg.features.length > 3 && (
            <span className="more-features">
              +{pkg.features.length - 3} more
            </span>
          )}
        </div>
        
        <div className="content-footer">
          <div className="info-row">
            <div className="duration-item">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{pkg.duration} days</span>
            </div>
            <div className="reviews-item">
              <Eye className="w-4 h-4 text-gray-500" />
              <span>{pkg.reviews} reviews</span>
            </div>
          </div>
          
          <div className="price-row">
            <div className="price-label">Starting from</div>
            <div className="price-value">{formatPrice(pkg.price)}</div>
          </div>
        </div>
        
        <button className="action-button">
          Explore Package
        </button>
      </div>
    </div>
  );
});

PackageCard.displayName = 'PackageCard';

export default PackageCard; 