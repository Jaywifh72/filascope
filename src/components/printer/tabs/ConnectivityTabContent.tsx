import React, { useState } from 'react';
import { 
  Wifi, Monitor, Cloud, Check, X, 
  Usb, HardDrive, CreditCard, Cable, Bluetooth, 
  Camera, Settings, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirmwareSection } from '@/components/FirmwareSection';
import { SoftwareSection } from '@/components/SoftwareSection';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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

// Connection option card component with enhanced visuals and tooltip
function ConnectionCard({ 
  icon: Icon, 
  label, 
  available,
  tooltip
}: { 
  icon: React.ElementType; 
  label: string; 
  available: boolean | null | undefined;
  tooltip?: string;
}) {
  const isAvailable = available === true;
  const isUnavailable = available === false;
  const isUnknown = available === null || available === undefined;

  const card = (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border-2 transition-all cursor-default group",
      isAvailable && "bg-green-500/10 border-green-500/40 shadow-[0_0_15px_-3px] shadow-green-500/20",
      isUnavailable && "bg-muted/20 border-border/40",
      isUnknown && "bg-muted/10 border-border/30 border-dashed"
    )}>
      {/* Icon container with glow effect for available */}
      <div className={cn(
        "p-3 sm:p-4 rounded-full mb-2 sm:mb-3 transition-all",
        isAvailable && "bg-green-500/20 ring-2 ring-green-500/30",
        isUnavailable && "bg-muted/40",
        isUnknown && "bg-muted/30"
      )}>
        <Icon className={cn(
          "w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110",
          isAvailable && "text-green-400",
          isUnavailable && "text-muted-foreground/40",
          isUnknown && "text-muted-foreground/30"
        )} />
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-xs sm:text-sm text-center font-medium mb-1",
        isAvailable && "text-white",
        isUnavailable && "text-gray-500",
        isUnknown && "text-gray-500"
      )}>
        {label}
      </span>
      
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 mt-1">
        {isAvailable && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-[10px] sm:text-xs text-green-400 font-medium">
            <Check className="w-3 h-3" />
            Yes
          </span>
        )}
        {isUnavailable && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/30 text-[10px] sm:text-xs text-muted-foreground/50">
            <X className="w-3 h-3" />
            No
          </span>
        )}
        {isUnknown && (
          <span className="text-[10px] sm:text-xs text-muted-foreground/40 italic">Unknown</span>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}

// Info row component with enhanced spacing and improved boolean icons
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
    displayValue = <span className="text-muted-foreground/50 italic">—</span>;
  } else if (isBoolean) {
    displayValue = value ? (
      <span className="inline-flex items-center gap-1.5 text-green-400">
        <Check className="w-4 h-4" />
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-gray-500">
        <X className="w-4 h-4" />
        No
      </span>
    );
  } else {
    displayValue = <span className="text-foreground">{String(value)}{unit}</span>;
  }

  return (
    <div className={cn("spec-row", isEmpty && "opacity-60")}>
      <span className="data-label">{label}</span>
      <span className="data-value">{displayValue}</span>
    </div>
  );
}

// Collapsible section that auto-collapses when all fields are empty
function CollapsibleSection({ 
  icon: Icon, 
  title, 
  allEmpty, 
  children 
}: { 
  icon: React.ElementType; 
  title: string; 
  allEmpty: boolean; 
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(!allEmpty);

  if (allEmpty) {
    return (
      <section className="section-card">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="section-header-icon">
                  <Icon className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <h3 className="section-title text-muted-foreground/70">{title}</h3>
                <span className="text-xs text-muted-foreground/50 italic">— Data pending</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground/50 transition-transform", isOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4">
              {children}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    );
  }

  return (
    <section className="section-card">
      <SectionHeader icon={Icon} title={title} />
      {children}
    </section>
  );
}

export function ConnectivityTabContent({ printer, brand }: ConnectivityTabContentProps) {
  // Check which sections have all empty fields
  const isFieldEmpty = (v: any) => v === null || v === undefined || v === '';
  
  const displayControlsAllEmpty = [printer.screen_type, printer.screen_size_inch, printer.screen_resolution, printer.control_knob, printer.ui_language_options].every(isFieldEmpty);
  const cameraAllEmpty = [printer.has_camera, printer.camera_resolution, printer.camera_count, printer.timelapse_supported, printer.ai_print_detection, printer.ai_camera_features].every(isFieldEmpty);
  const remoteAllEmpty = [printer.cloud_platforms, printer.remote_monitoring_supported, printer.remote_control_supported, printer.has_mobile_app, printer.has_web_interface, printer.has_api_access].every(isFieldEmpty);
  const softwareAllEmpty = [printer.slicer_software, printer.supported_file_formats, printer.supported_os].every(isFieldEmpty);

  // Determine cloud connectivity based on cloud_platforms or remote features
  const hasCloudConnectivity = !!(printer.cloud_platforms || printer.remote_monitoring_supported);

  return (
    <TooltipProvider>
      <div className="tab-content">
        {/* Connection Options Grid - 2x3 layout */}
        <section className="section-card">
          <SectionHeader icon={Wifi} title="Connection Options" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <ConnectionCard 
              icon={Wifi} 
              label="Wi-Fi" 
              available={printer.has_wifi}
              tooltip="Wireless network connectivity for remote printing and monitoring"
            />
            <ConnectionCard 
              icon={Cable} 
              label="Ethernet" 
              available={printer.has_ethernet}
              tooltip="Wired network connection for stable, high-speed data transfer"
            />
            <ConnectionCard 
              icon={Bluetooth} 
              label="Bluetooth" 
              available={printer.has_bluetooth}
              tooltip="Short-range wireless for mobile device connectivity"
            />
            <ConnectionCard 
              icon={Usb} 
              label="USB" 
              available={printer.has_usb_a_port || printer.has_usb_c_port || printer.has_usb}
              tooltip={`${printer.has_usb_a_port ? 'USB-A port available. ' : ''}${printer.has_usb_c_port ? 'USB-C port available.' : ''}`}
            />
            <ConnectionCard 
              icon={CreditCard} 
              label="SD Card" 
              available={printer.has_sd_card || printer.has_micro_sd_card}
              tooltip={`${printer.has_sd_card ? 'Standard SD card slot. ' : ''}${printer.has_micro_sd_card ? 'Micro SD card slot.' : ''}`}
            />
            <ConnectionCard 
              icon={Cloud} 
              label="Cloud" 
              available={hasCloudConnectivity}
              tooltip={printer.cloud_platforms || "Cloud printing and remote monitoring capabilities"}
            />
          </div>
          
          {/* Onboard storage info if available */}
          {printer.onboard_storage_gb && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/30">
              <div className="flex items-center gap-4">
                <div className="section-header-icon">
                  <HardDrive className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-gray-400 block mb-1">Onboard Storage</span>
                  <p className="text-base font-medium text-white">{printer.onboard_storage_gb} GB</p>
                </div>
              </div>
            </div>
          )}
        </section>

      {/* Display & Controls */}
      <CollapsibleSection 
        icon={Monitor} 
        title="Display & Controls" 
        allEmpty={displayControlsAllEmpty}
      >
        <div className="space-y-0">
          <InfoRow label="Screen Type" value={printer.screen_type} />
          <InfoRow label="Screen Size" value={printer.screen_size_inch} unit='"' />
          <InfoRow label="Screen Resolution" value={printer.screen_resolution} />
          <InfoRow label="Control Knob" value={printer.control_knob} />
          <InfoRow label="UI Languages" value={printer.ui_language_options} />
        </div>
      </CollapsibleSection>

      {/* Camera & Monitoring */}
      <CollapsibleSection
        icon={Camera}
        title="Camera & Monitoring"
        allEmpty={cameraAllEmpty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-0">
            <InfoRow label="Built-in Camera" value={printer.has_camera} />
            <InfoRow label="Camera Resolution" value={printer.camera_resolution} />
            <InfoRow label="Camera Count" value={printer.camera_count} />
          </div>
          <div className="space-y-0">
            <InfoRow label="Timelapse Support" value={printer.timelapse_supported} />
            <InfoRow label="AI Print Detection" value={printer.ai_print_detection} />
            <InfoRow label="AI Camera Features" value={printer.ai_camera_features} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Remote & Cloud Features */}
      <CollapsibleSection
        icon={Cloud}
        title="Remote & Cloud Features"
        allEmpty={remoteAllEmpty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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
      </CollapsibleSection>

      {/* Software Compatibility */}
      <CollapsibleSection
        icon={Settings}
        title="Software Compatibility"
        allEmpty={softwareAllEmpty}
      >
        <div className="space-y-0">
          <InfoRow label="Slicer Software" value={printer.slicer_software} />
          <InfoRow label="File Formats" value={printer.supported_file_formats} />
          <InfoRow label="Operating Systems" value={printer.supported_os} />
        </div>
      </CollapsibleSection>

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
    </TooltipProvider>
  );
}
