import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserPrinterPreference } from '@/hooks/useUserPrinterPreference';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Printer, Settings, Check, X, Thermometer, Square, LogIn } from 'lucide-react';

interface SavePrinterButtonProps {
  printerId: string;
  printerName: string;
  nozzleTempMax?: number;
  bedTempMax?: number;
  hasEnclosure?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SavePrinterButton({
  printerId,
  printerName,
  nozzleTempMax,
  bedTempMax,
  hasEnclosure = false,
  variant = 'outline',
  size = 'default',
  className,
}: SavePrinterButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { printerId: savedPrinterId, savePrinter, isSaving } = useUserPrinterPreference();

  const isSaved = savedPrinterId === printerId;

  const handleClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    savePrinter({
      printerId,
      printerName,
      nozzleTempMax,
      bedTempMax,
      hasEnclosure,
    });
  };

  return (
    <Button
      variant={isSaved ? 'default' : variant}
      size={size}
      onClick={handleClick}
      disabled={isSaving}
      className={className}
    >
      {isSaved ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          My Printer
        </>
      ) : (
        <>
          <Printer className="w-4 h-4 mr-2" />
          Save as My Printer
        </>
      )}
    </Button>
  );
}

export function SavedPrinterCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    printerName, 
    printerId,
    autoFilter, 
    nozzleTempMax,
    bedTempMax,
    hasEnclosure,
    hasSavedPrinter,
    clearPrinter,
    toggleAutoFilter,
  } = useUserPrinterPreference();

  if (!user) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Printer className="w-5 h-5 text-primary" />
            My Printer
          </CardTitle>
          <CardDescription>
            Sign in to save your printer for personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/auth')} className="w-full gap-2">
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasSavedPrinter) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Printer className="w-5 h-5 text-primary" />
            My Printer
          </CardTitle>
          <CardDescription>
            Save your printer to get personalized filament recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/printers')} variant="outline" className="w-full gap-2">
            <Settings className="w-4 h-4" />
            Browse Printers
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Printer className="w-5 h-5 text-primary" />
            My Printer
          </span>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Saved
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Printer Info */}
        <div className="p-3 bg-gray-700/30 rounded-lg">
          <h4 className="font-medium text-white mb-2">{printerName}</h4>
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            {nozzleTempMax && (
              <span className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                Max {nozzleTempMax}°C nozzle
              </span>
            )}
            {bedTempMax && (
              <span className="flex items-center gap-1">
                <Square className="w-3 h-3" />
                Max {bedTempMax}°C bed
              </span>
            )}
            {hasEnclosure && (
              <span className="flex items-center gap-1 text-green-400">
                <Check className="w-3 h-3" />
                Enclosed
              </span>
            )}
          </div>
        </div>

        {/* Auto-filter Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-filter" className="text-sm">
            Auto-filter compatible filaments
          </Label>
          <Switch
            id="auto-filter"
            checked={autoFilter}
            onCheckedChange={toggleAutoFilter}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/printers/${printerId}`)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => clearPrinter()}
            className="text-gray-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Badge to show on compatible filaments
interface CompatibleWithPrinterBadgeProps {
  className?: string;
}

export function CompatibleWithPrinterBadge({ className }: CompatibleWithPrinterBadgeProps) {
  const { printerName, hasSavedPrinter } = useUserPrinterPreference();

  if (!hasSavedPrinter) return null;

  return (
    <Badge 
      variant="outline" 
      className={`bg-green-500/10 text-green-400 border-green-500/30 ${className}`}
    >
      <Check className="w-3 h-3 mr-1" />
      Works with your {printerName?.split(' ').slice(-1)[0] || 'printer'}
    </Badge>
  );
}
