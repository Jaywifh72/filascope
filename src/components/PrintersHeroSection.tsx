import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Wand2 } from "lucide-react";

interface PrintersHeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  printerCount: number;
  brandCount: number;
  activeQuickFilters: string[];
  onQuickFilterToggle: (filterId: string) => void;
  onOpenQuiz?: () => void;
}

// 3D Isometric Calibration Cube Component
const CalibrationCube = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Scanning Laser Line */}
      <div 
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00CFE8] to-transparent z-20 pointer-events-none"
        style={{
          animation: 'scanLine 4s ease-in-out infinite',
          boxShadow: '0 0 20px 4px rgba(0, 207, 232, 0.6), 0 0 40px 8px rgba(0, 207, 232, 0.3)',
        }}
      />
      
      {/* 3D Isometric Cube Container */}
      <div 
        className="relative"
        style={{
          transform: 'rotateX(-20deg) rotateY(-30deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Cube */}
        <div 
          className="relative w-32 h-32"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face */}
          <div 
            className="absolute w-32 h-32 border-2 border-[#00CFE8]/60 bg-[#00CFE8]/5"
            style={{ 
              transform: 'translateZ(64px)',
              backdropFilter: 'blur(4px)',
            }}
          />
          {/* Back Face */}
          <div 
            className="absolute w-32 h-32 border border-[#00CFE8]/30 bg-[#00CFE8]/3"
            style={{ transform: 'translateZ(-64px)' }}
          />
          {/* Left Face */}
          <div 
            className="absolute w-32 h-32 border border-[#00CFE8]/40 bg-[#00CFE8]/4"
            style={{ 
              transform: 'rotateY(-90deg) translateZ(64px)',
              backdropFilter: 'blur(2px)',
            }}
          />
          {/* Right Face */}
          <div 
            className="absolute w-32 h-32 border-2 border-[#00CFE8]/50 bg-[#00CFE8]/5"
            style={{ 
              transform: 'rotateY(90deg) translateZ(64px)',
              backdropFilter: 'blur(4px)',
            }}
          />
          {/* Top Face */}
          <div 
            className="absolute w-32 h-32 border-2 border-[#00CFE8]/60 bg-[#00CFE8]/8"
            style={{ 
              transform: 'rotateX(90deg) translateZ(64px)',
              backdropFilter: 'blur(4px)',
            }}
          />
          {/* Bottom Face */}
          <div 
            className="absolute w-32 h-32 border border-[#00CFE8]/20 bg-[#00CFE8]/2"
            style={{ transform: 'rotateX(-90deg) translateZ(64px)' }}
          />
          
          {/* Grid Lines on Top Face */}
          <div 
            className="absolute w-32 h-32 pointer-events-none"
            style={{ transform: 'rotateX(90deg) translateZ(64px)' }}
          >
            {[...Array(5)].map((_, i) => (
              <div 
                key={`h-${i}`}
                className="absolute w-full h-px bg-[#00CFE8]/20"
                style={{ top: `${(i + 1) * 20}%` }}
              />
            ))}
            {[...Array(5)].map((_, i) => (
              <div 
                key={`v-${i}`}
                className="absolute h-full w-px bg-[#00CFE8]/20"
                style={{ left: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>
        </div>
        
        {/* X Axis */}
        <div 
          className="absolute flex items-center"
          style={{ 
            transform: 'translateX(80px) translateY(40px) translateZ(64px)',
          }}
        >
          <div className="w-16 h-0.5 bg-gradient-to-r from-[#00CFE8] to-[#00CFE8]/30" />
          <span className="ml-2 text-[10px] font-mono text-[#00CFE8] tracking-wider">X</span>
        </div>
        
        {/* Y Axis */}
        <div 
          className="absolute flex flex-col items-center"
          style={{ 
            transform: 'translateX(-10px) translateY(-100px) translateZ(64px)',
          }}
        >
          <span className="mb-2 text-[10px] font-mono text-[#00CFE8] tracking-wider">Y</span>
          <div className="h-16 w-0.5 bg-gradient-to-b from-[#00CFE8]/30 to-[#00CFE8]" />
        </div>
        
        {/* Z Axis */}
        <div 
          className="absolute flex items-center"
          style={{ 
            transform: 'translateX(-80px) translateY(60px) rotateY(-45deg)',
          }}
        >
          <span className="mr-2 text-[10px] font-mono text-[#00CFE8] tracking-wider">Z</span>
          <div className="w-12 h-0.5 bg-gradient-to-r from-[#00CFE8] to-[#00CFE8]/30" />
        </div>
      </div>
      
      {/* Floating Measurement Points */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-[#00CFE8] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 207, 232, 0.8)' }} />
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-[#00CFE8]/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-[#00CFE8] animate-pulse" style={{ animationDelay: '1s', boxShadow: '0 0 10px rgba(0, 207, 232, 0.8)' }} />
    </div>
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
      {/* Inline keyframes for scan animation */}
      <style>{`
        @keyframes scanLine {
          0%, 100% {
            top: 15%;
            opacity: 0.3;
          }
          50% {
            top: 85%;
            opacity: 1;
          }
        }
      `}</style>
      
      <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden border-b border-white/10">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00CFE8]/5 via-transparent to-[#FF0055]/3" />
        
        <div className="relative z-10 h-full max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center">
          {/* Left Side - Text Content */}
          <div className="flex-1 flex flex-col justify-center pr-8 lg:pr-16">
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light uppercase tracking-[0.2em] leading-tight mb-8">
              <span className="block text-foreground">Measure Material.</span>
              <span className="block">
                <span className="text-foreground">Master the </span>
                <span className="text-[#00CFE8] italic font-medium">Print.</span>
              </span>
            </h1>
            
            {/* Stats Row */}
            <div className="flex items-center gap-8 mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#00CFE8]">{printerCount}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Printers</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#00CFE8]">{brandCount}+</span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Brands</span>
              </div>
            </div>
            
            {/* Action Row - Button + Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-2xl">
              {/* Material Wizard Button */}
              <button
                onClick={() => navigate('/wizard')}
                className="flex items-center justify-center gap-2.5 h-14 px-8 rounded-xl font-semibold text-sm transition-all duration-300 btn-breathing"
                style={{
                  background: 'linear-gradient(135deg, #00CFE8 0%, #0077B6 100%)',
                  color: '#0A0C10',
                  boxShadow: '0 4px 20px rgba(0, 207, 232, 0.3)',
                }}
              >
                <Wand2 className="w-5 h-5" />
                Material Wizard
              </button>
              
              {/* Search Bar */}
              <form 
                onSubmit={handleSearchSubmit}
                className="flex-1 min-w-0"
              >
                <div 
                  className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                  <input
                    type="text"
                    placeholder="Search printers..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full h-14 pl-12 pr-4 text-sm bg-white/5 text-foreground placeholder:text-muted-foreground rounded-xl border transition-all duration-300 outline-none ${
                      isFocused 
                        ? 'border-[#00CFE8] shadow-[0_0_0_3px_rgba(0,207,232,0.15)]' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  />
                </div>
              </form>
            </div>
          </div>
          
          {/* Right Side - Glassmorphic 3D Visual */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div 
              className="relative w-[400px] h-[350px] rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Corner Accents */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#00CFE8]/50" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#00CFE8]/50" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#00CFE8]/50" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#00CFE8]/50" />
              
              {/* Header Label */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00CFE8] animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00CFE8]">
                  Calibration
                </span>
              </div>
              
              {/* 3D Cube */}
              <CalibrationCube />
              
              {/* Footer Stats */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6">
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Precision</span>
                  <span className="block text-sm font-mono text-[#00CFE8]">±0.01mm</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Status</span>
                  <span className="block text-sm font-mono text-emerald-400">Active</span>
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