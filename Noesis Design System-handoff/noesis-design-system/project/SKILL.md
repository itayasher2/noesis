---
name: noesis-design
description: Use this skill to generate well-branded interfaces and assets for Noesis (equity valuation platform). The visual system is Quant Terminal — true-black surfaces, electric-cyan accent, monospace UI chrome, hairline borders, ambient ticker tape. Contains design guidelines, colors, type, fonts, assets, and a UI kit for prototyping anything in the Noesis brand.
user-invocable: true
---

Read `README.md` first — it covers the company context, voice, colours, type, iconography, and the Quant Terminal aesthetic.

After that:

- **`colors_and_type.css`** is the single drop-in stylesheet. It carries the full token set + semantic classes (`.t-eyebrow`, `.t-num-hero`, `.card`, `.verdict-card.buy/hold/reduce/avoid`, `.badge.buy/up/ghost/...`, `.tab.active`, `.ticker`, `.spark.up/.down`, `.btn-brand`). Dark-default; light fallback via `html.light`.
- **`assets/`** holds the brand lockups. The Noesis mark is **dot + Arial Black wordmark + italic tagline** — the lockup is the brand, not a single glyph. Don't substitute fonts.
- **`preview/`** is a catalogue of every visual primitive — open a card to see the exact spec for a colour, a chip, a card, the ticker tape, a verdict rail.
- **`ui_kits/noesis/`** is the clickable reference app. Open `index.html` to see the full Quant Terminal in motion; crib individual `.jsx` files (`HeroVerdict.jsx`, `DecisionBox.jsx`, `TabBar.jsx`, etc.) when you need a specific component.

---

## When creating visual artifacts (slides, mocks, throwaway prototypes, posters)

- Copy `colors_and_type.css` + the SVGs from `assets/` into your output and link them.
- Set `html.dark` (or just `html`) — dark is default.
- Every section header uses **`.t-eyebrow`** (mono, UPPERCASE, 10px, `letter-spacing: 0.16em`). It's the most identifiable Noesis typography.
- Every number that matters uses **`.num`** or the `.t-num-*` classes (JetBrains Mono, tabular).
- Section content sits in **`.card`** with a 10px radius and a hairline border.
- For verdicts, use **`.verdict-card.buy/.hold/.reduce/.avoid`** — a 2px coloured rail on the left. **Never** add a coloured background fill; the rail + badge does the work.
- For status chips, use **`.badge.buy/.up/.down/.hold/.reduce/.avoid/.ghost`** — mono, 9px, with a glowing 6×6 square dot.
- For navigation, use **`.tab-bar`** + **`.tab`** + **`.tab.active`** (cyan label + cyan underline with glow).
- For ambient motion, drop in the **`.ticker`** scrolling tape — the only animation in the system.
- For inline sparklines, use **`.spark.up`** / **`.spark.down`** SVGs (2px stroke, `currentColor`).

## When working on production code (extending the actual Noesis frontend)

- Match the existing `var(--…)` token system; don't introduce new colours.
- Light + dark are paired — never style only one mode.
- Numbers go through `frontend/src/utils/format.js` (`fmt`, `fmtB`, `fmtPct`, `fmtPrice`). Don't roll your own.
- Voice is **analyst with a strong opinion**. Verdicts are declarative ("BUY · Medium Conviction"), warnings are factual ("No dividend — Gordon model not applicable"), errors are terse ("No data found. Please check the ticker.").
- Section headers are **mono UPPERCASE with 0.16em letter-spacing** — apply via `.t-eyebrow` or directly in styles.
- The brand mark (green dot + NOESIS wordmark + tagline) is always the lockup, never one piece alone in a header.

## Iconography order

1. **Unicode glyphs** first — `▶ → ↗ ↑ ↓ ● ★ ▲ ▼ ⟳ ⌘K · ✕ ✓`. These are the default ornaments.
2. **Lucide** when SVG is genuinely needed. Stroke 1.5–2px, 16–20px, `currentColor`.
3. **Emoji very sparingly**, only for affect — `⚙️ ⚠️ 💡 🤖`. Never in primary CTAs, never in nav.

Don't introduce Heroicons, Phosphor, Tabler, or any other library. Don't draw custom SVG icons.

---

## If invoked with no further guidance, ask

1. **What are you building?** (deck slide, marketing landing, in-app screen, prototype variation, internal tool, …)
2. **Light or dark?** (Dark is default. Light is for print / accessibility.)
3. **Is there a specific Noesis feature this riffs on** — a verdict card, the DCF panel, the peer comparison — or is it standalone?
4. **What numbers and copy are real vs. placeholder?**

Then act as an expert Noesis designer who outputs HTML artifacts **or** production-shaped code, depending on the need. Prefer the design system's existing primitives over inventing new ones.

---

## Quick links

- `README.md` — full design system overview, content + visual + iconography foundations.
- `colors_and_type.css` — every token, every semantic class.
- `assets/logo-lockup.svg` / `logo-lockup-light.svg` / `wordmark.svg` / `logo-dot.svg` — brand marks.
- `ui_kits/noesis/index.html` — clickable Quant Terminal reference.
- `ui_kits/noesis/README.md` — component-by-component breakdown.
- `frontend/` — the original Noesis source (read-only).
- Source repo: [`itayasher2/noesis`](https://github.com/itayasher2/noesis).
