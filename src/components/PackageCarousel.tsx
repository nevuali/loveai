import React, { useState, useEffect } from 'react';
import { HoneymoonPackage } from '../services/packageService';
import PackageCard from './PackageCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PackageCarouselProps {
  packages: HoneymoonPackage[];
  onSelectPackage: (packageId: string) => void;
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

const PackageCarousel: React.FC<PackageCarouselProps> = ({
  packages,
  onSelectPackage,
  title = "✨ Curated Honeymoon Experiences",
  subtitle = "Swipe through our handpicked romantic getaways",
  autoPlay = true,
  autoPlayDelay = 7000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play functionality with smooth transition
  useEffect(() => {
    if (!autoPlay || packages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      // Quick fade out and in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev < packages.length - 1 ? prev + 1 : 0));
        setIsTransitioning(false);
      }, 75); // Ultra-fast transition
    }, autoPlayDelay);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayDelay, packages.length, isPaused]);

  const handlePrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : packages.length - 1));
      setIsTransitioning(false);
    }, 75);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < packages.length - 1 ? prev + 1 : 0));
      setIsTransitioning(false);
    }, 75);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleDotClick = (index: number) => {
    if (index !== currentIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 75);
    }
  };

  if (!packages || packages.length === 0) {
    return null;
  }

  return (
    <div 
      className="package-cards-carousel-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="carousel-header">
        <h3 className="carousel-title">{title}</h3>
        <p className="carousel-subtitle">{subtitle}</p>
      </div>
      
      <div className="carousel-wrapper">
        <div 
          className="carousel-content"
          style={{
            opacity: isTransitioning ? 0.3 : 1,
            transition: 'opacity 0.075s ease-out'
          }}
        >
          <PackageCard
            package={packages[currentIndex]}
            onSelect={onSelectPackage}
            isCarousel={true}
            onPrevious={handlePrevious}
            onNext={handleNext}
            currentIndex={currentIndex}
            totalCount={packages.length}
          />
        </div>
        
        <div className="carousel-progress">
          {packages.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PackageCarousel; 