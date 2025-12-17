import { useState, useEffect, useRef } from 'react';

export function useStickyElement() {
  const [isSticky, setIsSticky] = useState(false);
  const [elementHeight, setElementHeight] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is NOT visible (scrolled past), make sticky
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Track element height for spacer
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateHeight = () => setElementHeight(element.offsetHeight);
    updateHeight();
    
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return { isSticky, elementHeight, sentinelRef, elementRef };
}
