const SectionSeparator = () => {
  return (
    <div 
      className="py-6 sm:py-8 w-full flex justify-center"
      role="separator"
      aria-hidden="true"
    >
      <div 
        className="h-[2px] w-[80%] max-w-[600px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(0,217,217,0.4)] animate-line-draw-in"
      />
    </div>
  );
};

export default SectionSeparator;
