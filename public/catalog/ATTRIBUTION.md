# Catalog image attribution

**Source of truth:** MongoDB `Product.image` from
`svhub-backend/scripts/product-images.js` (applied via `update-product-images.js`).

Every one of the **59** catalog products has a real hero image.
The photo-required placeholder must not be assigned to any live catalog SKU.

## Strategy

1. Prefer self-hosted `/catalog/{slug}.jpg` when a curated local asset exists.
2. Otherwise restore the earlier working remote map from backend commit `6e60c55`
   (`feat(catalog): assign unique relevant hero images per product`).
3. Never leave a blank / “coming soon” card for a catalog product.

## Forbidden

- Competitor packaging (Qualityfress / Quityfress, Spice Nest, Penzeys, …)
- Known wrong researched remotes (Pexels bird `14443199`, sailboat `11353753`, etc.)
- Assigning `/catalog/_photo-required.svg` to any of the 59 products

## Local replacements (unbranded)

| File | Subject | Notes |
|------|---------|-------|
| `cumin-powder.jpg` | Ground cumin + whole cumin seeds on spoons | Replaced Quityfress packet |
| `coriander-powder.jpg` | Ground coriander in masala dabba | Replaced Quityfress packet; Wikimedia Commons |
| `ginger-garlic-paste.jpg` | Fresh ginger + garlic (ingredients) | Replaced Spice Nest jar; Wikimedia Commons |
