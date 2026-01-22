import React from 'react';
import { 
  Wifi, Monitor, Cloud, Check, X, 
  Usb, HardDrive, CreditCard, Cable, Bluetooth, 
  Camera, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirmwareSection } from '@/components/FirmwareSection';
import { SoftwareSection } from '@/components/SoftwareSection';

interface ConnectivityTabContentProps {
  printer: any;
  brand: string | null;
}

// Section header with icon and border
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="section-header">
      <div className="section-header-icon">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="section-title">{title}</h3>
    </div>
  );
}

// Connection option card component
function ConnectionCard({ 
  icon: Icon, 
  label, 
  available 
}: { 
  icon: React.ElementType; 
  label: string; 
  available: boolean | null | undefined;
}) {
  const isAvailable = available === true;
  const isUnavailable = available === false;
  const isUnknown = available === null || available === undefined;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-5 rounded-xl border transition-all",
      isAvailable && "bg-green-500/10 border-green-500/30",
      isUnavailable && "bg-muted/30 border-border/40",
      isUnknown && "bg-muted/20 border-border/30"
    )}>
      <div className={cn(
        "p-3 rounded-full mb-3",
        isAvailable && "bg-green-500/20",
        isUnavailable && "bg-muted/50",
        isUnknown && "bg-muted/40"
      )}>
        <Icon className={cn(
          "w-5 h-5",
          isAvailable && "text-green-400",
          isUnavailable && "text-muted-foreground/50",
          isUnknown && "text-muted-foreground/40"
        )} />
      </div>
      <span className={cn(
        "data-label text-center font-medium",
        isAvailable && "text-foreground",
        isUnavailable && "text-muted-foreground/60",
        isUnknown && "text-muted-foreground/50"
      )}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 mt-2">
        {isAvailable && (
          <>
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Yes</span>
          </>
        )}
        {isUnavailable && (
          <>
            <X className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/50">No</span>
          </>
        )}
        {isUnknown && (
          <span className="text-xs text-muted-foreground/40">Unknown</span>
        )}
      </div>
    </div>
  );
}

// Info row component with enhanced spacing
function InfoRow({ 
  label, 
  value, 
  unit = '' 
}: { 
  label: string; 
  value: any; 
  unit?: string;
}) {
  const isEmpty = value === null || value === undefined || value === '';
  const isBoolean = typeof value === 'boolean';

  let displayValue: React.ReactNode;
  if (isEmpty) {
    displayValue = <span className="text-muted-foreground/50">—</span>;
  } else if (isBoolean) {
    displayValue = value ? (
      <span className="inline-flex items-center gap-1.5 text-green-400">
        <Check className="w-4 h-4" />
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground/60">
        <X className="w-4 h-4" />
        No
      </span>
    );
  } else {
    displayValue = <span className="text-foreground">{String(value)}{unit}</span>;
  }

  return (
    <div className="spec-row">
      <span className="data-label">{label}</span>
      <span className="data-value">{displayValue}</span>
    </div>
  );
}

export function ConnectivityTabContent({ printer, brand }: ConnectivityTabContentProps) {
  return (
    <div className="tab-content">
      {/* Connection Options Grid */}
      <section className="section-card">
        <SectionHeader icon={Wifi} title="Connection Options" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <ConnectionCard icon={Wifi} label="Wi-Fi" available={printer.has_wifi} />
          <ConnectionCard icon={Cable} label="Ethernet" available={printer.has_ethernet} />
          <ConnectionCard icon={Usb} label="USB-A" available={printer.has_usb_a_port} />
          <ConnectionCard icon={Usb} label="USB-C" available={printer.has_usb_c_port} />
          <ConnectionCard icon={CreditCard} label="SD Card" available={printer.has_sd_card} />
          <ConnectionCard icon={CreditCard} label="Micro SD" available={printer.has_micro_sd_card} />
        </div>
        
        {/* Additional connectivity info */}
        <div className="mt-6 pt-6 border-t border-border/30 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2.5 rounded-lg",
              printer.has_bluetooth ? "bg-blue-500/10" : "bg-muted/30"
            )}>
              <Bluetooth className={cn(
                "w-5 h-5",
                printer.has_bluetooth ? "text-blue-400" : "text-muted-foreground/50"
              )} />
            </div>
            <div>
              <span className="data-label block">Bluetooth</span>
              <p className={cn(
                "data-value",
                printer.has_bluetooth ? "text-foreground" : "text-muted-foreground/60"
              )}>
                {printer.has_bluetooth ? 'Supported' : 'Not available'}
              </p>
            </div>
          </div>
          {printer.onboard_storage_gb && (
            <div className="flex items-center gap-4">
              <div className="section-header-icon">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="data-label block">Onboard Storage</span>
                <p className="data-value">{printer.onboard_storage_gb} GB</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Display & Controls */}
      <section className="section-card">
        <SectionHeader icon={Monitor} title="Display & Controls" />
        <div className="space-y-0">
          <InfoRow label="Screen Type" value={printer.screen_type} />
          <InfoRow label="Screen Size" value={printer.screen_size_inch} unit='"' />
          <InfoRow label="Screen Resolution" value={printer.screen_resolution} />
          <InfoRow label="Control Knob" value={printer.control_knob} />
          <InfoRow label="UI Languages" value={printer.ui_language_options} />
        </div>
      </section>

      {/* Camera & Monitoring */}
      <section className="section-card">
        <SectionHeader icon={Camera} title="Camera & Monitoring" />
        <div className="grid md:grid-cols-2 gap-8">
          {/* Camera Info */}
          <div className="space-y-0">
            <InfoRow label="Built-in Camera" value={printer.has_camera} />
            <InfoRow label="Camera Resolution" value={printer.camera_resolution} />
            <InfoRow label="Camera Count" value={printer.camera_count} />
          </div>
          {/* Features */}
          <div className="space-y-0">
            <InfoRow label="Timelapse Support" value={printer.timelapse_supported} />
            <InfoRow label="AI Print Detection" value={printer.ai_print_detection} />
            <InfoRow label="AI Camera Features" value={printer.ai_camera_features} />
          </div>
        </div>
      </section>

      {/* Remote & Cloud Features */}
      <section className="section-card">
        <SectionHeader icon={Cloud} title="Remote & Cloud Features" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-0">
            <InfoRow label="Cloud Platforms" value={printer.cloud_platforms} />
            <InfoRow label="Remote Monitoring" value={printer.remote_monitoring_supported} />
            <InfoRow label="Remote Control" value={printer.remote_control_supported} />
          </div>
          <div className="space-y-0">
            <InfoRow label="Mobile App" value={printer.has_mobile_app} />
            <InfoRow label="Web Interface" value={printer.has_web_interface} />
            <InfoRow label="API Access" value={printer.has_api_access} />
          </div>
        </div>
      </section>

      {/* Software Compatibility */}
      <section className="section-card">
        <SectionHeader icon={Settings} title="Software Compatibility" />
        <div className="space-y-0">
          <InfoRow label="Slicer Software" value={printer.slicer_software} />
          <InfoRow label="File Formats" value={printer.supported_file_formats} />
          <InfoRow label="Operating Systems" value={printer.supported_os} />
        </div>
      </section>

      {/* Firmware Section */}
      <FirmwareSection 
        printerId={printer.id} 
        brandName={brand} 
        printerName={printer.model_name} 
      />

      {/* Software Section */}
      <SoftwareSection 
        printerId={printer.id} 
        brandName={brand} 
        printerName={printer.model_name} 
      />
    </div>
  );
}
