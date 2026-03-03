import { useNavigate } from 'react-router-dom';
import {
  Tag, BookOpen, Scissors, Database, Heart, Clock,
  Sun, Moon, Globe, LogOut, User, Settings, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { RegionSelector } from '@/components/RegionSelector';
import { supabase } from '@/integrations/supabase/client';
import BottomSheet from '@/components/filament/mobile/BottomSheet';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMoreSheet({ isOpen, onClose }: MobileMoreSheetProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate('/');
  };

  const Row = ({ icon: Icon, label, onClick, rightSlot }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
    rightSlot?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground",
        "hover:bg-muted/50 active:bg-muted transition-colors",
        !onClick && "cursor-default"
      )}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="flex-1 text-left">{label}</span>
      {rightSlot}
    </button>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 pt-4 pb-1">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </span>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="More" snapPoints={[0.6, 0.9]}>
      {/* Navigation */}
      <SectionHeader title="Navigation" />
      <Row icon={Tag} label="Brands" onClick={() => go('/brands')} />
      <Row icon={BookOpen} label="Material Knowledge Base" onClick={() => go('/reference/materials')} />
      <Row icon={Scissors} label="Slicer Directory" onClick={() => go('/reference/slicers')} />
      <Row icon={Database} label="HueForge Tools" onClick={() => go('/hueforge-tools')} />

      <div className="border-t border-border/30 my-1" />

      {/* Your Activity */}
      <SectionHeader title="Your Activity" />
      <Row icon={Heart} label="Saved Items" onClick={() => go('/vault')} />
      <Row icon={Clock} label="Recently Viewed" onClick={() => go('/')} />

      <div className="border-t border-border/30 my-1" />

      {/* Settings */}
      <SectionHeader title="Settings" />
      <Row
        icon={isDark ? Moon : Sun}
        label={isDark ? 'Dark Mode' : 'Light Mode'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        rightSlot={
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            aria-label="Toggle theme"
          />
        }
      />
      <div className="px-4 py-2">
        <RegionSelector />
      </div>

      <div className="border-t border-border/30 my-1" />

      {/* Account */}
      <SectionHeader title="Account" />
      {user ? (
        <>
          <Row icon={User} label="My Profile" onClick={() => go('/settings')} />
          {isAdmin && (
            <Row icon={Shield} label="Admin" onClick={() => go('/admin')} />
          )}
          <Row icon={LogOut} label="Sign Out" onClick={handleSignOut} />
        </>
      ) : (
        <Row icon={User} label="Sign In" onClick={() => go('/auth')} />
      )}
    </BottomSheet>
  );
}
