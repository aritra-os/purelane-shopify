# AI workflow notes — Purelane

## What I delegated vs. kept

I used Claude to read and audit the 148 KB source file rather than skimming it
myself — specifically to find structural issues that are easy to miss reading
top-to-bottom: the two competing `:root` blocks, the duplicated 8-card grid
that's actually 4 products twice, the WCAG contrast failures (measured, not
guessed — computed against the actual composited background colours), and dead
CSS with no matching markup. That audit is what the build notes are based on.

I kept the actual architecture decisions myself: which parts of the original
JS were structurally unsound for the theme editor (the page-load IIFE that
queries the DOM once and never again), and how to restructure them as custom
elements instead. I had Claude implement that restructuring once the
architecture was decided, not invent it.

## Where it broke, or would have

Working through this, the failure modes I was watching for with any
Liquid-generating agent:

- **Confident invented settings/schema shapes.** Section schema has a strict,
  narrow set of valid setting types; an agent will confidently emit ones that
  don't exist or that belong to a different theme's block model.
- **Missing `"presets"` in schema** — a section with no presets block simply
  doesn't appear in the editor's "Add section" list, with no error anywhere.
  Silent failure, easy to miss until you go looking for the section and it
  isn't there.
- **Metafield paths for fields that were never defined.** It's easy to get
  `product.metafields.custom.card_badge.value` that reads perfectly and
  returns nothing, because the admin-side definition doesn't exist yet.
- **Theme-version drift.** Shopify replaced Dawn with Horizon as the default
  theme this year — my first `theme pull` silently grabbed Horizon instead of
  Dawn, which I only caught because the brief explicitly specifies Dawn and I
  checked the pulled section files against what Dawn's structure should look
  like before committing. An agent given "pull the default theme" would not
  have caught that on its own.

## What I'd systematise across twenty of these

A short context file fed to any agent before Liquid generation: the exact
setting-type list, the block/preset requirements, which globals are in scope
in a section versus a snippet (snippets are scope-isolated via `render`, which
is a common source of "why is this variable undefined" confusion). Alongside
that, `shopify theme check` run after every generated file, not just before
commit — it catches undefined objects and deprecated filters immediately
rather than at the end of a session.