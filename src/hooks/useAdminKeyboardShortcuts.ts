import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { RegionCode } from '@/types/regional';

interface UseAdminKeyboardShortcutsOptions {
  onRegionChange?: (region: RegionCode) => void;
  onShowAllRegions?: () => void;
  onRefresh?: () => void;
  isEnabled?: boolean;
}

const REGION_SHORTCUTS: Record<string, RegionCode> = {
  '1': 'US',
  '2': 'CA',
  '3': 'UK',
  '4': 'EU',
  '5': 'AU',
};

/**
 * Admin Keyboard Shortcuts for Regional Controls
 * 
 * Shortcuts (only active on admin pages):
 * - 1-5: Switch to US/CA/UK/EU/AU region
 * - A: Toggle Show All Regions view
 * - R: Refresh current data
 */
export function useAdminKeyboardShortcuts({
  onRegionChange,
  onShowAllRegions,
  onRefresh,
  isEnabled = true,
}: UseAdminKeyboardShortcutsOptions) {
  const location = useLocation();
  
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if disabled or not on admin page
    if (!isEnabled || !isAdminPage) return;
    
    // Skip if in an input field
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const isInputFocused = 
      tagName === 'input' || 
      tagName === 'textarea' || 
      target.isContentEditable ||
      target.getAttribute('role') === 'textbox';
    
    if (isInputFocused) return;

    // Skip if modifier keys are pressed (except shift for some)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Number keys 1-5 for region switching
    if (REGION_SHORTCUTS[e.key] && onRegionChange) {
      e.preventDefault();
      onRegionChange(REGION_SHORTCUTS[e.key]);
      return;
    }

    // 'A' to toggle all regions view
    if (e.key.toLowerCase() === 'a' && onShowAllRegions) {
      e.preventDefault();
      onShowAllRegions();
      return;
    }

    // 'R' to refresh data
    if (e.key.toLowerCase() === 'r' && onRefresh) {
      e.preventDefault();
      onRefresh();
      return;
    }
  }, [isEnabled, isAdminPage, onRegionChange, onShowAllRegions, onRefresh]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { key: '1', description: 'Switch to US view' },
      { key: '2', description: 'Switch to Canada view' },
      { key: '3', description: 'Switch to UK view' },
      { key: '4', description: 'Switch to Europe view' },
      { key: '5', description: 'Switch to Australia view' },
      { key: 'A', description: 'Toggle Show All Regions' },
      { key: 'R', description: 'Refresh data' },
    ],
  };
}
