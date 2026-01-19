import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Target, Activity } from "lucide-react";

interface PrintersHeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  printerCount: number;
  brandCount: number;
  activeQuickFilters: string[];
  onQuickFilterToggle: (filterId: string) => void;
  onOpenQuiz?: () => void;
}

// Wireframe Isometric Calibration Cube SVG
const WireframeCube = () => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 0 10px rgba(0, 207, 232, 0.3))' }}
    >
      {/* Top Face (Z) - White lines */}
      <polygon 
        points="100,30 160,60 100,90 40,60" 
        fill="none" 
        stroke="#FFFFFF" 
        strokeWidth="1.5"
        opacity="0.8"
      />
      {/* Grid lines on top face */}
      <line x1="70" y1="45" x2="130" y2="75" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.3" />
      <line x1="70" y1="75" x2="130" y2="45" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.3" />
      
      {/* Left Face (X) - Cyan lines */}
      <polygon 
        points="40,60 100,90 100,160 40,130" 
        fill="none" 
        stroke="#00CFE8" 
        strokeWidth="1.5"
        opacity="0.8"
      />
      {/* Grid lines on left face */}
      <line x1="40" y1="95" x2="100" y2="125" stroke="#00CFE8" strokeWidth="0.5" opacity="0.3" />
      <line x1="70" y1="75" x2="70" y2="145" stroke="#00CFE8" strokeWidth="0.5" opacity="0.3" />
      
      {/* Right Face (Y) - Magenta lines */}
      <polygon 
        points="100,90 160,60 160,130 100,160" 
        fill="none" 
        stroke="#FF0055" 
        strokeWidth="1.5"
        opacity="0.8"
      />
      {/* Grid lines on right face */}
      <line x1="100" y1="125" x2="160" y2="95" stroke="#FF0055" strokeWidth="0.5" opacity="0.3" />
      <line x1="130" y1="75" x2="130" y2="145" stroke="#FF0055" strokeWidth="0.5" opacity="0.3" />
      
      {/* Axis Labels */}
      <text x="25" y="100" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="bold">X</text>
      <text x="170" y="100" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="bold">Y</text>
      <text x="97" y="22" fill="#00CFE8" fontSize="12" fontFamily="monospace" fontWeight="bold">Z</text>
      
      {/* Corner dots */}
      <circle cx="100" cy="30" r="3" fill="#00CFE8" opacity="0.8" />
      <circle cx="160" cy="60" r="2" fill="#FF0055" opacity="0.8" />
      <circle cx="40" cy="60" r="2" fill="#00CFE8" opacity="0.8" />
      <circle cx="100" cy="160" r="3" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
};

const PrintersHeroSection = ({ 
  searchTerm, 
  onSearchChange, 
  printerCount, 
  brandCount,
  activeQuickFilters,
  onQuickFilterToggle,
  onOpenQuiz
}: PrintersHeroSectionProps) => {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      {/* Inline keyframes for laser scan animation */}
      <style>{`
        @keyframes laserScan {
          0%, 100% {
            top: 10%;
            opacity: 0.4;
          }
          50% {
            top: 85%;
            opacity: 1;
          }
        }
      `}</style>
      
      <section className="relative overflow-hidden" style={{ backgroundColor: '#0A0C10' }}>
        {/* Dot Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #FFFFFF 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Glow Blobs */}
        <div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #00CFE8 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #FF0055 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        
        {/* Main Content Container */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 pt-32 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column - Typography & Content */}
            <div className="flex flex-col">
              {/* System Registry Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 w-fit"
                style={{
                  backgroundColor: 'rgba(0, 207, 232, 0.1)',
                  borderColor: 'rgba(0, 207, 232, 0.3)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00CFE8] animate-pulse" />
                <span 
                  className="text-[10px] uppercase font-bold"
                  style={{ 
                    color: '#00CFE8',
                    letterSpacing: '0.2em',
                  }}
                >
                  System Registry: Verified Hardware
                </span>
              </div>
              
              {/* Main Heading */}
              <h1 
                className="text-5xl md:text-7xl font-light uppercase mb-8"
                style={{ 
                  letterSpacing: '-0.02em',
                  lineHeight: '0.9',
                }}
              >
                <span className="block text-white">PRECISION HARDWARE.</span>
                <span className="block text-gray-500">Master the</span>
                <span 
                  className="block font-medium italic"
                  style={{ color: '#00CFE8' }}
                >
                  Print.
                </span>
              </h1>
              
              {/* Paragraph */}
              <p 
                className="text-lg max-w-xl mb-12 font-light italic"
                style={{ 
                  color: 'rgb(156, 163, 175)',
                  lineHeight: '1.75',
                }}
              >
                Access industrial-grade profiles for the world's leading 3D printers. 
                Factory-verified kinematics and flow-calibrated configurations for surgical print accuracy.
              </p>
              
              {/* Action Row - Button + Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Printer Registry Button */}
                <button
                  onClick={() => navigate('/printers')}
                  className="flex items-center justify-center gap-2 h-14 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #00CFE8 0%, #008BA3 100%)',
                    color: '#000000',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    boxShadow: '0 4px 20px rgba(0, 207, 232, 0.4)',
                  }}
                >
                  Printer Registry
                </button>
                
                {/* Search Bar */}
                <form 
                  onSubmit={handleSearchSubmit}
                  className="w-80"
                >
                  <div 
                    className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}
                  >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10" style={{ color: 'rgb(156, 163, 175)' }} />
                    <input
                      type="text"
                      placeholder="Search printers..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className={`w-full h-14 pl-12 pr-4 text-sm text-white rounded-xl transition-all duration-300 outline-none`}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: isFocused ? '1px solid #00CFE8' : '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: isFocused ? '0 0 0 3px rgba(0, 207, 232, 0.15)' : 'none',
                      }}
                    />
                  </div>
                </form>
              </div>
            </div>
            
            {/* Right Column - Visual Asset */}
            <div className="hidden lg:flex items-center justify-center">
              <div 
                className="relative w-80 h-96 rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transform: 'rotate(-3deg)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Laser Scanner Line */}
                <div 
                  className="absolute left-4 right-4 h-[2px] z-20 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #00CFE8, transparent)',
                    boxShadow: '0 0 20px #00CFE8, 0 0 40px rgba(0, 207, 232, 0.5)',
                    animation: 'laserScan 4s ease-in-out infinite',
                  }}
                />
                
                {/* Wireframe Cube */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <WireframeCube />
                </div>
                
                {/* Floating Telemetry Tags */}
                <div 
                  className="absolute top-6 left-4 flex items-center gap-2 px-3 py-1.5 rounded-md"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <Target className="w-3 h-3" style={{ color: '#FF0055' }} />
                  <span className="text-[10px] font-mono text-white tracking-wider">
                    CALIB_STATUS: OK
                  </span>
                </div>
                
                <div 
                  className="absolute bottom-6 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <Activity className="w-3 h-3" style={{ color: '#00CFE8' }} />
                  <span className="text-[10px] font-mono text-white tracking-wider">
                    T_DISTANCE: 4.2mm
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </>
  );
};

export default PrintersHeroSection;
