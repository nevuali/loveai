// Critical resource preloader for performance optimization

export interface PreloadOptions {
  href: string;
  as: 'script' | 'style' | 'font' | 'image' | 'fetch' | 'document';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
  media?: string;
  onload?: () => void;
  onerror?: () => void;
}

class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private criticalResources: PreloadOptions[] = [
    {
      href: 'https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&display=swap',
      as: 'style',
      type: 'text/css'
    },
    {
      href: 'https://fonts.gstatic.com/s/googlesans/v29/4UaGrENHsxJlGDuGo1OIlL3Owp5eKQtGBlc.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous'
    },
    {
      href: '/favicon.svg',
      as: 'image',
      type: 'image/svg+xml'
    },
    {
      href: '/icons/icon.svg',
      as: 'image', 
      type: 'image/svg+xml'
    }
  ];

  /**
   * Preload a resource with the specified options
   */
  preload(options: PreloadOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(options.href)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = options.href;
      link.as = options.as;
      
      if (options.type) link.type = options.type;
      if (options.crossorigin) link.crossOrigin = options.crossorigin;
      if (options.media) link.media = options.media;

      link.onload = () => {
        this.preloadedResources.add(options.href);
        options.onload?.();
        resolve();
      };

      link.onerror = () => {
        console.warn(`Failed to preload resource: ${options.href}`);
        options.onerror?.();
        reject(new Error(`Failed to preload: ${options.href}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Preload multiple resources in parallel
   */
  async preloadAll(resources: PreloadOptions[]): Promise<void> {
    const promises = resources.map(resource => 
      this.preload(resource).catch(err => {
        console.warn('Preload failed:', err);
        return null;
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Preload critical resources for initial page load
   */
  async preloadCritical(): Promise<void> {
    console.log('🚀 Preloading critical resources...');
    const startTime = performance.now();

    await this.preloadAll(this.criticalResources);

    const endTime = performance.now();
    console.log(`✅ Critical resources preloaded in ${Math.round(endTime - startTime)}ms`);
  }

  /**
   * Prefetch resources for future pages
   */
  prefetch(href: string, as: PreloadOptions['as'] = 'fetch'): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = as;

    link.onload = () => {
      this.preloadedResources.add(href);
      console.log(`🔮 Prefetched: ${href}`);
    };

    document.head.appendChild(link);
  }

  /**
   * Preload images with intersection observer for lazy loading
   */
  preloadImagesOnView(selector: string = '[data-preload-src]'): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.preloadSrc;
            
            if (src) {
              this.preload({ href: src, as: 'image' })
                .then(() => {
                  img.src = src;
                  img.removeAttribute('data-preload-src');
                })
                .catch(() => {
                  console.warn(`Failed to preload image: ${src}`);
                });
            }
            
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Warmup connections to external domains
   */
  warmupConnections(): void {
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://firebase.googleapis.com',
      'https://firebaseapp.com',
      'https://images.unsplash.com',
      'https://generativelanguage.googleapis.com'
    ];

    domains.forEach(domain => {
      // DNS prefetch
      const dnsLink = document.createElement('link');
      dnsLink.rel = 'dns-prefetch';
      dnsLink.href = domain;
      document.head.appendChild(dnsLink);

      // Preconnect for critical domains
      if (domain.includes('fonts.g') || domain.includes('firebase')) {
        const preconnectLink = document.createElement('link');
        preconnectLink.rel = 'preconnect';
        preconnectLink.href = domain;
        if (domain.includes('fonts.gstatic')) {
          preconnectLink.crossOrigin = 'anonymous';
        }
        document.head.appendChild(preconnectLink);
      }
    });

    console.log('🔗 Connection warmup completed');
  }

  /**
   * Monitor and report preload performance
   */
  reportPerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.initiatorType === 'link' && entry.name.includes('preload')) {
            console.log(`📊 Preload timing for ${entry.name}:`, {
              duration: `${Math.round(entry.duration)}ms`,
              transferSize: `${Math.round((entry as any).transferSize / 1024)}KB`
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }
}

// Export singleton instance
export const preloader = new ResourcePreloader();

// Auto-initialize critical preloading
export const initializePreloader = () => {
  // Start connection warmup immediately
  preloader.warmupConnections();
  
  // Preload critical resources when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloader.preloadCritical();
      preloader.reportPerformance();
    });
  } else {
    preloader.preloadCritical();
    preloader.reportPerformance();
  }

  // Setup image lazy loading
  setTimeout(() => preloader.preloadImagesOnView(), 100);
};