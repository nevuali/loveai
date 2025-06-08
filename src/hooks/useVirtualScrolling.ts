import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface VirtualScrollingOptions {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Extra items to render outside viewport
  estimatedItemHeight?: number; // For dynamic heights
}

interface VirtualScrollingResult {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    item: any;
  }>;
  totalHeight: number;
  scrollElementProps: {
    ref: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  containerProps: {
    style: React.CSSProperties;
  };
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export const useVirtualScrolling = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  estimatedItemHeight
}: VirtualScrollingOptions): VirtualScrollingResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  
  // Dynamic height support
  const useEstimatedHeight = Boolean(estimatedItemHeight);
  const actualItemHeight = useEstimatedHeight ? estimatedItemHeight : itemHeight;

  // Calculate which items are visible
  const visibleRange = useMemo(() => {
    if (!items.length) return { startIndex: 0, endIndex: 0 };

    let startIndex: number;
    let endIndex: number;

    if (useEstimatedHeight && itemHeights.length > 0) {
      // Dynamic height calculation
      let currentOffset = 0;
      startIndex = 0;
      
      for (let i = 0; i < items.length; i++) {
        const height = itemHeights[i] || actualItemHeight!;
        if (currentOffset + height > scrollTop) {
          startIndex = i;
          break;
        }
        currentOffset += height;
      }

      currentOffset = itemHeights.slice(0, startIndex).reduce((sum, h) => sum + (h || actualItemHeight!), 0);
      endIndex = startIndex;
      
      while (endIndex < items.length && currentOffset < scrollTop + containerHeight) {
        currentOffset += itemHeights[endIndex] || actualItemHeight!;
        endIndex++;
      }
    } else {
      // Fixed height calculation (much faster)
      startIndex = Math.floor(scrollTop / actualItemHeight!);
      endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / actualItemHeight!)
      );
    }

    // Apply overscan
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(items.length, endIndex + overscan);

    return { startIndex, endIndex };
  }, [scrollTop, items.length, actualItemHeight, containerHeight, overscan, itemHeights, useEstimatedHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (useEstimatedHeight && itemHeights.length > 0) {
      return itemHeights.reduce((sum, height) => sum + (height || actualItemHeight!), 0);
    }
    return items.length * actualItemHeight!;
  }, [items.length, actualItemHeight, itemHeights, useEstimatedHeight]);

  // Create virtual items
  const virtualItems = useMemo(() => {
    const result = [];
    let currentOffset = 0;

    if (useEstimatedHeight && itemHeights.length > 0) {
      // Dynamic height virtual items
      for (let i = 0; i < visibleRange.startIndex; i++) {
        currentOffset += itemHeights[i] || actualItemHeight!;
      }
    } else {
      // Fixed height virtual items
      currentOffset = visibleRange.startIndex * actualItemHeight!;
    }

    for (let i = visibleRange.startIndex; i < visibleRange.endIndex; i++) {
      const height = useEstimatedHeight ? (itemHeights[i] || actualItemHeight!) : actualItemHeight!;
      
      result.push({
        index: i,
        start: currentOffset,
        end: currentOffset + height,
        item: items[i]
      });
      
      currentOffset += height;
    }

    return result;
  }, [visibleRange, items, actualItemHeight, itemHeights, useEstimatedHeight]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollElementRef.current) return;

    let offset: number;
    
    if (useEstimatedHeight && itemHeights.length > 0) {
      offset = itemHeights.slice(0, index).reduce((sum, h) => sum + (h || actualItemHeight!), 0);
    } else {
      offset = index * actualItemHeight!;
    }

    scrollElementRef.current.scrollTo({
      top: offset,
      behavior
    });
  }, [actualItemHeight, itemHeights, useEstimatedHeight]);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollElementRef.current) return;

    scrollElementRef.current.scrollTo({
      top: totalHeight,
      behavior
    });
  }, [totalHeight]);

  // Update item height when using dynamic heights
  const updateItemHeight = useCallback((index: number, height: number) => {
    if (!useEstimatedHeight) return;
    
    setItemHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  }, [useEstimatedHeight]);

  // Initialize item heights array for dynamic heights
  useEffect(() => {
    if (useEstimatedHeight) {
      setItemHeights(new Array(items.length).fill(actualItemHeight));
    }
  }, [items.length, useEstimatedHeight, actualItemHeight]);

  return {
    virtualItems,
    totalHeight,
    scrollElementProps: {
      ref: scrollElementRef,
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
      }
    },
    containerProps: {
      style: {
        height: totalHeight,
        position: 'relative' as const,
      }
    },
    scrollToIndex,
    scrollToBottom
  };
};

export default useVirtualScrolling;