import React, { useState } from 'react';
import { Wifi, Monitor, FileCode, AppWindow } from 'lucide-react';
import SpecsDrawer, { SpecTable, SpecRow, ContentSection } from '../SpecsDrawer';
import { FirmwareSection } from '@/components/FirmwareSection';
import { SoftwareSection } from '@/components/SoftwareSection';
import { generateConnectivityPreview } from '@/lib/specsPreviewGenerator';

interface ConnectivityTabContentProps {
  printer: any;
  brand: string | null;
}

export function ConnectivityTabContent({ printer, brand }: ConnectivityTabContentProps) {
  const [expandedDrawers, setExpandedDrawers] = useState<Set<string>>(new Set(['connectivity']));

  const toggleDrawer = (id: string) => {
    setExpandedDrawers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Connectivity Specs Drawer */}
      <SpecsDrawer
        id="connectivity"
        icon={<Wifi className="w-5 h-5" />}
        title="Connectivity & Control"
        preview={generateConnectivityPreview(printer)}
        isExpanded={expandedDrawers.has('connectivity')}
        onToggle={() => toggleDrawer('connectivity')}
      >
        <ContentSection title="Connectivity">
          <SpecTable>
            <SpecRow label="WiFi" value={printer.has_wifi} />
            <SpecRow label="Ethernet" value={printer.has_ethernet} />
            <SpecRow label="Bluetooth" value={printer.has_bluetooth} />
            <SpecRow label="USB-A Port" value={printer.has_usb_a_port} />
            <SpecRow label="USB-C Port" value={printer.has_usb_c_port} />
            <SpecRow label="SD Card" value={printer.has_sd_card} />
            <SpecRow label="Micro SD Card" value={printer.has_micro_sd_card} />
            <SpecRow label="Onboard Storage" value={printer.onboard_storage_gb} unit=" GB" />
            <SpecRow label="Cloud Platforms" value={printer.cloud_platforms} />
            <SpecRow label="Remote Monitoring" value={printer.remote_monitoring_supported} />
            <SpecRow label="Remote Control" value={printer.remote_control_supported} />
          </SpecTable>
        </ContentSection>

        <ContentSection title="Display & UI">
          <SpecTable>
            <SpecRow label="Screen Type" value={printer.screen_type} />
            <SpecRow label="Screen Size" value={printer.screen_size_inch} unit='"' />
            <SpecRow label="Screen Resolution" value={printer.screen_resolution} />
            <SpecRow label="Control Knob" value={printer.control_knob} />
            <SpecRow label="UI Languages" value={printer.ui_language_options} />
          </SpecTable>
        </ContentSection>

        <ContentSection title="Camera & Monitoring">
          <SpecTable>
            <SpecRow label="Built-in Camera" value={printer.has_camera} />
            <SpecRow label="Camera Resolution" value={printer.camera_resolution} />
            <SpecRow label="Timelapse Support" value={printer.timelapse_supported} />
            <SpecRow label="AI Print Detection" value={printer.ai_print_detection} />
          </SpecTable>
        </ContentSection>
      </SpecsDrawer>

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
