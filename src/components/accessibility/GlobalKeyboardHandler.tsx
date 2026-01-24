import { useState } from "react";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import { GlobalKeyboardShortcutsDialog } from "@/components/accessibility/GlobalKeyboardShortcutsDialog";

/**
 * Global Keyboard Handler Component
 * 
 * Provides site-wide keyboard shortcuts and the shortcuts help dialog.
 * Must be placed inside the React Router context.
 */
export function GlobalKeyboardHandler({ children }: { children: React.ReactNode }) {
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Initialize global keyboard shortcuts
  useGlobalKeyboardShortcuts({
    onShowKeyboardHints: () => setShowShortcutsDialog(true),
  });

  return (
    <>
      {children}
      <GlobalKeyboardShortcutsDialog 
        isOpen={showShortcutsDialog} 
        onClose={() => setShowShortcutsDialog(false)} 
      />
    </>
  );
}
