import { useEffect, useRef } from 'react';

type ShortcutMap = Record<string, () => void>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const mapRef = useRef(shortcuts);
  mapRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      
      // Prevent running if user holds ctrl/meta unless specifically captured
      if (e.metaKey || e.ctrlKey) return;
      
      const key = e.key.toLowerCase();
      if (mapRef.current[key]) {
        e.preventDefault();
        mapRef.current[key]();
      } else if (e.key === 'Escape' && mapRef.current['escape']) {
        e.preventDefault();
        mapRef.current['escape']();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
