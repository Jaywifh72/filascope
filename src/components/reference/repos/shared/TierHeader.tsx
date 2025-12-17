import React from 'react';

interface TierHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
  count: string;
}

const TierHeader: React.FC<TierHeaderProps> = ({ icon, title, subtitle, count }) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <span className="ml-auto text-xs font-medium px-3 py-1 rounded-full bg-muted/50 text-muted-foreground">
        {count}
      </span>
    </div>
  );
};

export default TierHeader;
