# Metafield definitions

| Name | Key | Type | Used for |
|---|---|---|---|
| Card badge | custom.card_badge | Single line text | "Best seller" / "Top rated" / "New" pill on product cards |
| Rating | custom.rating | Single line text | Star rating shown on product cards |
| Rating count | custom.rating_count | Integer | Review count shown alongside rating |

Note: I used custom.* fields rather than Shopify's standard reviews.rating
metafield, for time. A review app installed later would need either the
card snippet updated to read reviews.rating, or its values copied into
these custom fields — documented as a next step in NOTES-BUILD.md.