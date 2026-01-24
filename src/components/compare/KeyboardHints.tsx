import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardHintsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'C', description: 'Toggle tray expand/collapse', scope: 'Finder' },
  { key: '⇧⌘C', description: 'Copy comparison URL', scope: 'Global' },
  { key: 'Delete', description: 'Remove last added material', scope: 'Finder' },
  { key: '1-4', description: 'Focus material card in tray', scope: 'Finder' },
  { key: 'Enter', description: 'Start comparison (≥2 items)', scope: 'Finder' },
  { key: 'Esc', description: 'Collapse tray', scope: 'Finder' },
  { key: '/', description: 'Focus search input', scope: 'Global' },
  { key: '?', description: 'Show all keyboard shortcuts', scope: 'Global' },
];

export function KeyboardHints({ isOpen, onClose }: KeyboardHintsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-1">
            {SHORTCUTS.map((shortcut, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <kbd className="min-w-[60px] px-2 py-1 text-xs font-mono bg-muted rounded border border-border text-center">
                    {shortcut.key}
                  </kbd>
                  <span className="text-sm">{shortcut.description}</span>
                </div>
                <span className="text-xs text-muted-foreground">{shortcut.scope}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Pro tip:</strong> Keyboard shortcuts work when you're not typing in an input field. 
              On Windows, use Ctrl instead of ⌘.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
