import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalKeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutSection {
  title: string;
  shortcuts: Array<{
    key: string | string[];
    description: string;
  }>;
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "Global Navigation",
    shortcuts: [
      { key: "/", description: "Focus search input" },
      { key: "?", description: "Show this help dialog" },
      { key: "Esc", description: "Close modals / blur input" },
    ],
  },
  {
    title: "Quick Navigation (g + key)",
    shortcuts: [
      { key: ["g", "f"], description: "Go to Filaments" },
      { key: ["g", "p"], description: "Go to Printers" },
      { key: ["g", "b"], description: "Go to Brands" },
      { key: ["g", "d"], description: "Go to Deals" },
      { key: ["g", "c"], description: "Go to Compare" },
      { key: ["g", "w"], description: "Go to Wizard" },
    ],
  },
  {
    title: "Compare Tray",
    shortcuts: [
      { key: "C", description: "Toggle tray expand/collapse" },
      { key: ["⌘", "⇧", "C"], description: "Copy comparison URL" },
      { key: "Delete", description: "Remove last added item" },
      { key: "1-4", description: "Focus specific card" },
      { key: "Enter", description: "Start comparison" },
    ],
  },
  {
    title: "Within Pages & Menus",
    shortcuts: [
      { key: "← →", description: "Navigate tabs on detail pages" },
      { key: "↑ ↓", description: "Navigate dropdown options" },
      { key: "Home", description: "Jump to first item" },
      { key: "End", description: "Jump to last item" },
      { key: "Enter / Space", description: "Select option" },
      { key: "Tab", description: "Move to next element" },
    ],
  },
];

const KeyboardKey = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-mono font-medium bg-muted rounded-md border border-border shadow-sm">
    {children}
  </kbd>
);

export function GlobalKeyboardShortcutsDialog({ isOpen, onClose }: GlobalKeyboardShortcutsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate FilaScope faster with keyboard shortcuts. On Windows/Linux, use Ctrl instead of ⌘.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {SHORTCUT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center justify-between py-2 px-3 rounded-lg",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <span className="text-sm text-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.isArray(shortcut.key) ? (
                        shortcut.key.map((k, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <KeyboardKey>{k}</KeyboardKey>
                            {i < shortcut.key.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            )}
                          </span>
                        ))
                      ) : (
                        <KeyboardKey>{shortcut.key}</KeyboardKey>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Pro tip:</strong> Keyboard shortcuts work when 
            you're not typing in an input field. Press <KeyboardKey>Tab</KeyboardKey> to navigate 
            through interactive elements, and look for visible focus indicators.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
