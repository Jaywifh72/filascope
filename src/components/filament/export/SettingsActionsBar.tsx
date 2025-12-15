import { CopyFormatSelector } from './CopyFormatSelector';
import { ShareSettingsModal } from './ShareSettingsModal';
import { ExportOptionsModal } from './ExportOptionsModal';
import { ImportSettingsModal } from './ImportSettingsModal';
import { SettingsHistoryModal } from './SettingsHistoryModal';
import type { PrintSettings } from '@/lib/settingsFormatters';
import type { ShareableSettings } from '@/lib/settingsSharing';
import type { ParsedSettings } from '@/lib/settingsParser';

interface SettingsActionsBarProps {
  settings: PrintSettings;
  shareableSettings: ShareableSettings;
  filamentId: string;
  filamentImage?: string;
  onImport?: (settings: ParsedSettings) => void;
  onRestore?: (settings: {
    nozzleTemp: number;
    bedTemp: number;
    printSpeed?: number;
    cooling?: number;
  }) => void;
  showHistory?: boolean;
  showImport?: boolean;
}

export function SettingsActionsBar({
  settings,
  shareableSettings,
  filamentId,
  filamentImage,
  onImport,
  onRestore,
  showHistory = true,
  showImport = true,
}: SettingsActionsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CopyFormatSelector settings={settings} />
      
      <ShareSettingsModal
        settings={shareableSettings}
        filamentName={settings.filamentName}
      />
      
      <ExportOptionsModal
        settings={settings}
        filamentImage={filamentImage}
      />
      
      {showImport && onImport && (
        <ImportSettingsModal onImport={onImport} />
      )}
      
      {showHistory && onRestore && (
        <SettingsHistoryModal
          filamentId={filamentId}
          filamentName={settings.filamentName}
          onRestore={onRestore}
        />
      )}
    </div>
  );
}
