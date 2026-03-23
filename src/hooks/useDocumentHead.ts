import { useEffect } from 'react';

/**
 * SEO defaults that match the static tags in index.html.
 * On cleanup, tags revert to these values so navigating away
 * from a detail page restores the homepage defaults.
 */
const DEFAULTS = {
  title: 'FilaScope — Compare 16,000+ 3D Printer Filaments | Specs, Prices & TD Values',
  description:
    'Compare 16,000+ 3D printer filaments from 49+ brands. Live pricing from 15+ stores, HueForge TD values, printer compatibility & specs. The most comprehensive filament database online.',
  canonical: 'https://filascope.com/',
  ogTitle: 'FilaScope — Compare 16,000+ 3D Printer Filaments | Specs, Prices & TD Values',
  ogDescription: 'Compare 16,000+ 3D printer filaments from 49+ brands.',
  ogUrl: 'https://filascope.com/',
  ogType: 'website',
  ogImage: 'https://filascope.com/og-image.png',
  ogSiteName: 'FilaScope',
  twitterCard: 'summary_large_image',
  twitterSite: '@FilaScope',
  twitterTitle: 'FilaScope — Compare 16,000+ 3D Printer Filaments | Specs, Prices & TD Values',
  twitterDescription: 'Compare 16,000+ 3D printer filaments from 49+ brands.',
  twitterImage: 'https://filascope.com/og-image.png',
} as const;

export interface DocumentHeadOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogType?: string;
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogImageAlt?: string;
  ogSiteName?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  /** Extra <meta name="keywords"> */
  keywords?: string;
  /** Extra <meta name="author"> */
  author?: string;
  /** Extra <meta name="rating"> */
  rating?: string;
  /** Extra <meta name="geo.region"> */
  geoRegion?: string;
  /** og:locale */
  ogLocale?: string;
  /** product:brand */
  productBrand?: string;
  /** product:category */
  productCategory?: string;
  /** product:price:amount */
  productPriceAmount?: string;
  /** product:price:currency */
  productPriceCurrency?: string;
  /** product:availability */
  productAvailability?: string;
  /** product:target_country */
  productTargetCountry?: string;
  /** product:transmission_distance */
  productTransmissionDistance?: string;
  /** rel="prev" pagination link href */
  paginationPrev?: string;
  /** rel="next" pagination link href */
  paginationNext?: string;
  /**
   * robots meta — e.g. "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
   * or "noindex, nofollow" for admin/settings pages.
   * Defaults to the index.html static value when not set.
   */
  robots?: string;
}

// ── helpers ────────────────────────────────────────────────

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  );
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// ── hook ───────────────────────────────────────────────────

/**
 * Directly sets document.title and upserts <meta>/<link> tags in <head>.
 * On unmount reverts to index.html defaults.
 */
export function useDocumentHead(opts: DocumentHeadOptions) {
  useEffect(() => {
    // Title
    if (opts.title) document.title = opts.title;

    // Description
    if (opts.description) upsertMeta('name', 'description', opts.description);

    // Canonical
    if (opts.canonical) upsertLink('canonical', opts.canonical);

    // Open Graph
    if (opts.ogTitle || opts.title) upsertMeta('property', 'og:title', opts.ogTitle || opts.title!);
    if (opts.ogDescription || opts.description) upsertMeta('property', 'og:description', opts.ogDescription || opts.description!);
    if (opts.ogUrl || opts.canonical) upsertMeta('property', 'og:url', opts.ogUrl || opts.canonical!);
    if (opts.ogType) upsertMeta('property', 'og:type', opts.ogType);
    if (opts.ogImage) upsertMeta('property', 'og:image', opts.ogImage);
    if (opts.ogImageWidth) upsertMeta('property', 'og:image:width', opts.ogImageWidth);
    if (opts.ogImageHeight) upsertMeta('property', 'og:image:height', opts.ogImageHeight);
    if (opts.ogImageAlt) upsertMeta('property', 'og:image:alt', opts.ogImageAlt);
    if (opts.ogSiteName) upsertMeta('property', 'og:site_name', opts.ogSiteName);
    if (opts.ogLocale) upsertMeta('property', 'og:locale', opts.ogLocale);

    // Twitter
    if (opts.twitterCard) upsertMeta('name', 'twitter:card', opts.twitterCard);
    if (opts.twitterSite) upsertMeta('name', 'twitter:site', opts.twitterSite);
    if (opts.twitterTitle || opts.title) upsertMeta('name', 'twitter:title', opts.twitterTitle || opts.title!);
    if (opts.twitterDescription || opts.description) upsertMeta('name', 'twitter:description', opts.twitterDescription || opts.description!);
    if (opts.twitterImage) upsertMeta('name', 'twitter:image', opts.twitterImage);

    // Optional extras
    if (opts.keywords) upsertMeta('name', 'keywords', opts.keywords);
    if (opts.author) upsertMeta('name', 'author', opts.author);
    if (opts.rating) upsertMeta('name', 'rating', opts.rating);
    if (opts.geoRegion) upsertMeta('name', 'geo.region', opts.geoRegion);

    // Product meta
    if (opts.productBrand) upsertMeta('property', 'product:brand', opts.productBrand);
    if (opts.productCategory) upsertMeta('property', 'product:category', opts.productCategory);
    if (opts.productPriceAmount) upsertMeta('property', 'product:price:amount', opts.productPriceAmount);
    if (opts.productPriceCurrency) upsertMeta('property', 'product:price:currency', opts.productPriceCurrency);
    if (opts.productAvailability) upsertMeta('property', 'product:availability', opts.productAvailability);
    if (opts.productTargetCountry) upsertMeta('property', 'product:target_country', opts.productTargetCountry);
    if (opts.productTransmissionDistance) upsertMeta('property', 'product:transmission_distance', opts.productTransmissionDistance);

    // Pagination rel links
    if (opts.paginationPrev) upsertLink('prev', opts.paginationPrev);
    if (opts.paginationNext) upsertLink('next', opts.paginationNext);

    // Robots
    if (opts.robots) upsertMeta('name', 'robots', opts.robots);

    // Cleanup → only revert tags that THIS call explicitly set
    return () => {
      // Don't reset title, description, or OG tags to homepage defaults —
      // the next page's useDocumentHead call will overwrite them immediately.
      // Reverting causes a flash of homepage meta during SPA transitions.
      if (opts.ogImage) upsertMeta('property', 'og:image', DEFAULTS.ogImage);
      if (opts.ogImageWidth) removeMeta('property', 'og:image:width');
      if (opts.ogImageHeight) removeMeta('property', 'og:image:height');
      if (opts.ogImageAlt) removeMeta('property', 'og:image:alt');
      if (opts.ogSiteName) upsertMeta('property', 'og:site_name', DEFAULTS.ogSiteName);
      if (opts.twitterCard) upsertMeta('name', 'twitter:card', DEFAULTS.twitterCard);
      if (opts.twitterSite) upsertMeta('name', 'twitter:site', DEFAULTS.twitterSite);
      // Don't reset twitter:title/twitter:description to homepage defaults

      // Remove optional extras only if they were set
      if (opts.keywords) removeMeta('name', 'keywords');
      if (opts.author) removeMeta('name', 'author');
      if (opts.rating) removeMeta('name', 'rating');
      if (opts.geoRegion) removeMeta('name', 'geo.region');
      if (opts.ogLocale) removeMeta('property', 'og:locale');
      if (opts.productBrand) removeMeta('property', 'product:brand');
      if (opts.productCategory) removeMeta('property', 'product:category');
      if (opts.productPriceAmount) removeMeta('property', 'product:price:amount');
      if (opts.productPriceCurrency) removeMeta('property', 'product:price:currency');
      if (opts.productAvailability) removeMeta('property', 'product:availability');
      if (opts.productTargetCountry) removeMeta('property', 'product:target_country');
      if (opts.productTransmissionDistance) removeMeta('property', 'product:transmission_distance');
      if (opts.paginationPrev) document.head.querySelector('link[rel="prev"]')?.remove();
      if (opts.paginationNext) document.head.querySelector('link[rel="next"]')?.remove();
      // Revert robots to the default indexable value when unmounting
      if (opts.robots) upsertMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    };
  }, [
    opts.title, opts.description, opts.canonical,
    opts.ogTitle, opts.ogDescription, opts.ogUrl, opts.ogType, opts.ogImage, opts.ogImageWidth, opts.ogImageHeight, opts.ogImageAlt, opts.ogSiteName, opts.ogLocale,
    opts.twitterCard, opts.twitterSite, opts.twitterTitle, opts.twitterDescription, opts.twitterImage,
    opts.keywords, opts.author, opts.rating, opts.geoRegion,
    opts.productBrand, opts.productCategory, opts.productPriceAmount, opts.productPriceCurrency,
    opts.productAvailability, opts.productTargetCountry, opts.productTransmissionDistance,
    opts.paginationPrev, opts.paginationNext, opts.robots,
  ]);
}
