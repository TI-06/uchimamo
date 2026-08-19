# Catalog & Compare Repair

User-reported production issue on 2026-08-19:

- Comparison matrix rendered as mostly unstyled HTML because client-injected nodes did not receive Astro scoped style attributes.
- Product catalog contained only 6 launch items.

Planned repair:

1. Isolate compare page styling from Astro scoped CSS by using a page-local global namespace.
2. Expand the catalog to a curated multi-category launch set using current manufacturer model names.
3. Keep the 6 reviewed Rakuten itemCode pins immutable.
4. For newly added products, use strict model-token matching and fail closed when no exact-enough candidate exists.
5. Create a single PR after implementation so intermediate failures do not generate notification noise.
