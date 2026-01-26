import { useEffect, useCallback } from 'react';

interface UseInventoryKeyboardShortcutsOptions {
  activeTab: 'filaments' | 'printers' | 'sync';
  onAddFilament: () => void;
  onAddPrinter: () => void;
}

export function useInventoryKeyboardShortcuts({
  activeTab,
  onAddFilament,
  onAddPrinter,
}: UseInventoryKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModifier = event.metaKey || event.ctrlKey;
    const target = event.target as HTMLElement;
    
    // Don't trigger shortcuts when typing in inputs
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Ctrl/Cmd + N - Add Filament (when on Filaments tab)
    if (isModifier && !event.shiftKey && event.key.toLowerCase() === 'n') {
      if (activeTab === 'filaments') {
        event.preventDefault();
        onAddFilament();
      }
    }

    // Ctrl/Cmd + Shift + N - Add Printer (when on Printers tab)
    if (isModifier && event.shiftKey && event.key.toLowerCase() === 'n') {
      if (activeTab === 'printers') {
        event.preventDefault();
        onAddPrinter();
      }
    }
  }, [activeTab, onAddFilament, onAddPrinter]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
