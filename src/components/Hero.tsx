import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import filascopeHero from "@/assets/filascope-hero.png";

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-background pt-8 pb-16 md:pt-16 md:pb-24">
      {/* Radial glow effect behind the image */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 40%, hsla(187, 94%, 54%, 0.15) 0%, transparent 60%)',
        }}
      />
      
      {/* Additional blur glow layer */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Image with animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center mb-10 md:mb-14"
        >
          <img
            src={filascopeHero}
            alt="FilaScope - Precision Calibration for HueForge"
            className="w-full max-w-4xl h-auto object-contain"
          />
        </motion.div>

        {/* Content below the image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Precision Calibration for{" "}
            <span className="text-primary">HueForge</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl mb-8 font-sans">
            Master filament transmissivity with the ultimate 3D printing calibration tool.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono font-semibold px-8 py-6 text-base"
            >
              <Link to="/wizard">Get Started</Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary/10 font-mono font-semibold px-8 py-6 text-base"
            >
              <Link to="/diagnose">View Documentation</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
