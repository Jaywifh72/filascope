import { Link } from 'react-router-dom';

interface RelatedLink {
  label: string;
  href: string;
  description?: string;
}

interface RelatedContentBlockProps {
  title: string;
  links: RelatedLink[];
  className?: string;
}

export function RelatedContentBlock({ title, links, className = '' }: RelatedContentBlockProps) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="bg-card border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors block"
          >
            <span className="text-sm font-medium text-foreground">{link.label}</span>
            {link.description && (
              <span className="text-xs text-muted-foreground mt-1 block">{link.description}</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default RelatedContentBlock;
