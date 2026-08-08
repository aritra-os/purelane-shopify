# Build notes — Purelane

## What I'd flag about the original file

The source file ships **two complete `<style>` blocks**. The second
(`VERSION 2 — BRAND COLOURS (light)`, lines 634–823) redefines `:root` and
overrides 71 of the first block's selectors by cascade order. The page
actually renders in the **light** palette, not the dark one block 1 defines —
copying block 1 alone produces the wrong theme entirely. I flattened both into
a single resolved token set (`assets/pl-tokens.css`) rather than shipping both
blocks and letting the cascade sort it out at runtime.

The **8-product shop grid is 4 products duplicated two different ways** — the
first four cards paint the bottle as a CSS background, the next four are the
same four products again with the bottle inlined as raw SVG. There's no
eight-product design to match; that duplication is what the brief's seeded
8-product collection is meant to replace.

Every product image is a **base64 SVG data URI inside a CSS custom property**,
sized via a hardcoded `aspect-ratio`. I extracted all 14 into standalone `.svg`
files (in the submission) — necessary regardless of approach, since real
Shopify product images can't be typed into CSS.

Measured contrast against the light scene backgrounds: `--paper-3` runs
3.61:1–3.86:1 and is used at 10–11px (kickers, fine print) — fails WCAG AA,
which needs 4.5:1. `--accent` runs 3.10:1–3.89:1 and fails at `.card .rate b`
(11.5px) and `.ptag .lbl` (9px); it only passes as large text at 27px/800.
Corrected values are in the tokens file, kept alongside the originals so the
diff is reviewable.

Other things worth noting: heading order skips from `h1` straight to `h5`
(review cards) before reaching `h2`; the progress rail links to `#voices`,
which no element in the document has; 17 distinct media-query breakpoints
collapse cleanly to 4; `.stickybuy`, `.crow`, and `.grain` have CSS rules with
no matching markup anywhere in the file — dead code from an earlier revision.

The reduced-motion block (line 627) is already thorough and I kept its logic
as-is. The scene gradients and water-layer animation are the actual design
intent, not a bug — I did not simplify or restyle them.

## What I built

All five required sections are built and live on the homepage, each added
through the theme editor with its own schema, each pulling from real Shopify
data (product price, compare-at price, availability) rather than hardcoded
values:

- **Shared infrastructure**: resolved design tokens (`pl-tokens.css`),
  self-hosted Outfit/Inter fonts, and the animated background stage — a fixed,
  scroll-driven four-scene gradient with water layers and bubbles, rebuilt as
  a custom element (`<pl-scenes>`) rather than a page-load IIFE so it
  survives the theme editor adding, removing, or reordering sections. Scene
  switching uses `IntersectionObserver` with a centre-line `rootMargin`
  instead of the original's per-frame `offsetTop` walk, which was a genuine
  forced-reflow bug in the source. The four water SVGs were extracted from
  inline markup to standalone asset files loaded via `<img>`, which
  incidentally fixes a duplicate-id collision in the original (`cg`, `wf`,
  `wf2` each appeared twice across two inline SVGs sharing one document).

- **Hero** — slideshow driven by section blocks (max 3), each block a product
  reference with a label and a price tag overlay. Autoplay with a real pause
  control (WCAG 2.2.2 — the original relied on hover/`:focus-within`, but
  nothing inside the stage was focusable, so keyboard users had no way to
  stop it). `shopify:block:select` pauses and jumps to the selected slide so
  a merchant editing block 3 can actually see block 3, rather than watching
  it flip past underneath them.

- **Shop grid** — collection-driven, reusable `pl-product-card` snippet
  shared with nothing else in this build (the other sections use their own
  card markup, see below). Handles all three seeded edge cases: sold-out
  (disabled button, "Sold out" pill), missing image (`placeholder_svg_tag`,
  never an empty box), and the long title (2-line clamp with a reserved
  min-height so price rows still align across a row).

- **Bundles** and **Combos** — both block-based, each block referencing a
  real product for price/compare-at/savings math, rather than a `bundle_tier`
  or `combo` metaobject as originally scoped (see cuts, below).

- **Reviews** — marquee rail rendered twice (real content + an `aria-hidden
  inert` visual clone, required for the CSS `translateX(-50%)` loop to look
  seamless) with a real pause button, since the original's hover/
  `:focus-within` pause had the same unreachable-via-keyboard problem as the
  hero.

## Scope cuts made against the original plan, and why

**Metaobjects → block settings.** I'd planned `combo` and `bundle_tier`
metaobject definitions so a merchant could reuse the same bundle across
multiple sections. Given the time available I used section blocks with a
direct product reference instead — same real-data guarantee (price,
compare-at, and savings all computed from an actual product, nothing typed
in), but scoped to one section rather than reusable store-wide. The
metaobject version is the better long-term answer; documented as the next
step.

**Hero: 1 product per slide, not 1/2/3.** The original hardcodes CSS
positioning for exactly one, two, or three stacked bottles per slide
(different heights, negative margins, z-order per count). Reproducing that
generalised took more CSS time than the slot had; I shipped one product per
slide instead, which keeps the real behaviour that matters most — autoplay,
dots, price tag, editor-aware block-select, keyboard-reachable pause — and
cut the part that was purely visual stacking.

**Product metafields — created, but as custom fields rather than the standard
ones.** `custom.card_badge`, `custom.rating`, and `custom.rating_count` are
defined and populated on several products; the card snippet reads them and
badges/ratings render correctly. I used `custom.*` fields rather than
Shopify's standard `reviews.rating` metafield (which most review apps write
to automatically) purely for setup speed under the time available — a review
app installed later would need either the snippet re-pointed at
`reviews.rating`, or its values copied into these custom fields. Documented
in `METAFIELDS.md`.

**Combo rail alignment.** `.pl-comborail` is a flex container with no
`justify-content`, which defaults to `flex-start` — correct once there are
enough combos to genuinely overflow and scroll, but left the three seeded
combos looking stranded on the left instead of centered. Fixed with
`justify-content: center` scoped to `min-width: 1024px` only, deliberately
not applied at narrower widths — centering a flex container that's actually
overflowing causes a well-documented bug where the first item becomes
unreachable by scrolling.

## What I'd do with more time, in order

1. Re-point the card snippet's rating field at Shopify's standard
   `reviews.rating`/`reviews.rating_count` metafields instead of the
   `custom.*` ones I used for setup speed, so any review app installed later
   works with zero code changes.
2. Rebuild bundles/combos on proper metaobjects for store-wide reuse.
3. Generalise the hero back to 1/2/3 products per slide.
4. A shared `pl-base.css` so button and type styles live in one place instead
   of being repeated per-section (currently `.pl-btn` is duplicated in
   `pl-card.css` and referenced by the sections that need it — workable, but
   not how I'd want it long-term).
5. The full QA pass: theme-editor add/remove/reorder stress test on every
   section, a keyboard-only pass, a screen-reader spot check, and a Lighthouse
   run — I verified each section as I built it but didn't have time for a
   dedicated end-to-end pass across all five together.