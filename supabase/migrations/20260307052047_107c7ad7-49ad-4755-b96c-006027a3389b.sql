
COMMENT ON TABLE public.filament_comments IS 'STATUS: Empty/Unused. Planned for user comment feature. Review Q2 2026 for implementation or removal.';
COMMENT ON TABLE public.filament_inventory IS 'STATUS: Empty/Unused. Planned for real-time stock tracking. Currently stock data lives in filament_listings.stock_level and filaments.available_regions.';
COMMENT ON TABLE public.filament_properties IS 'STATUS: Empty/Unused. Extended properties. Currently all filament properties are columns on the filaments table directly.';
COMMENT ON TABLE public.filament_reviews IS 'STATUS: Empty/Unused. Planned for user review feature. product_reviews table (also 0 rows) may duplicate this intent.';
COMMENT ON TABLE public.filament_score_history IS 'STATUS: Empty/Unused. Planned for tracking filascope_score changes over time.';
COMMENT ON TABLE public.filament_search_embeddings IS 'STATUS: Empty/Unused. Planned for vector similarity search. Requires pgvector setup.';
COMMENT ON TABLE public.filament_trait_tags IS 'STATUS: Empty/Unused. Planned tag system. trait_taxonomy table (15 rows) exists as the tag dictionary.';
COMMENT ON TABLE public.filament_use_cases IS 'STATUS: Empty/Unused. Planned for mapping filaments to use cases.';
COMMENT ON TABLE public.filament_user_ratings IS 'STATUS: Empty/Unused. Planned for user rating feature.';
COMMENT ON TABLE public.listing_price_history IS 'STATUS: Empty/Unused. Intended for tracking filament_listings price changes. price_history table (19,055 rows) currently tracks prices for the filaments table instead.';
COMMENT ON TABLE public.duplicate_candidates IS 'STATUS: Empty/Unused. For deduplication workflow. AdminDuplicates.tsx page exists but no candidates have been generated.';
COMMENT ON TABLE public.filaments IS 'PRIMARY SOURCE OF TRUTH for all filament product data. 8,535 rows. All pages (Finder, BrandDetail, Compare, etc.) query from this table. Regional prices are embedded as flat columns (price_aud, price_cad, etc.) and also normalized in product_regional_prices and filament_listings tables.';
COMMENT ON TABLE public.filament_listings IS 'Per-retailer, per-region price listings. FK to filaments.id. Used by FilamentDetail page purchase sidebar. Being backfilled from filaments table flat price columns.';
