# Noesis Design System

> **Understand Value. Act Smarter.**

A design system for **Noesis** — an equity-valuation web app that turns raw company financials into an opinionated investment view (BUY / HOLD / REDUCE / AVOID) backed by DCF, Gordon, Residual Income, Graham Number, and a composite scoring model.

The visual system is **Quant Terminal** — Bloomberg + Linear + Vercel. True-black surfaces, electric-cyan accent, monospace UI chrome, hairline borders, an ambient ticker tape. A trading-desk product that respects the analyst on the other end of the screen.

---

## Sources

Built from a single source: the production Noesis codebase.

- **GitHub:** [`itayasher2/noesis`](https://github.com/itayasher2/noesis) — React 19 + Vite + Tailwind 4 SPA, Express backend serving Yahoo Finance + AI insights.

What we kept from the source: **the brand mark** (green dot + Arial Black NOESIS wordmark + italic tagline), **the analyst voice** (declarative verdicts, no hedging, mono numbers), **the structure** (verdict → decision → tabs), and **the data model**.

What we changed: the visual system. The source was a friendly emerald + slate SaaS; we pushed it to a dark-default, monospace-chromed trading desk.

> Read the original `frontend/` folder (imported read-only) for the legacy emerald aesthetic. The aesthetic discussion in `design-options.html` and `design-options-AB.html` documents the four candidates and the chosen direction.

---

## What Noesis is

A single-screen equity-valuation tool. The user types a ticker (`AAPL`, `TSLA`, `NVDA`...) and Noesis:

1. **Hero verdict** — Verdict-tinted rail card with ticker · sector · live price · status badges + AI key insight.
2. **Decision box** — Loud `BUY / HOLD / REDUCE / AVOID` action with conviction, reasons, action steps, and a four-zone price-levels meter.
3. **Investment profile** — 4-up KPI grid (Fair Value · Implied Δ · FCF · Confidence) with sparklines.
4. **Tabs** — Overview · Valuation (live DCF sliders) · Financials · Analysis · Documents, plus an `⚙ Advanced` drawer (Gordon · Value Models · Capital Allocation · Forward View · Market Expectations · Peers).

One product. No marketing site, mobile app, or docs site to model.

---

## Index — what's in this folder

| Path | What |
|---|---|
| `README.md` | This file. |
| `SKILL.md` | Skill manifest — drop in a Claude Skill / Claude Code to act as the Noesis brand expert. |
| `colors_and_type.css` | The full token set + semantic classes (`.t-eyebrow`, `.t-num-hero`, `.card`, `.verdict-card`, `.badge.buy`, `.tab.active`, `.ticker`, `.spark`). Dark-default; light fallback included. |
| `assets/` | Brand marks (light + dark lockups, wordmark, dot). |
| `preview/` | 28 self-contained HTML cards for the Design System tab — colour swatches, type, components. |
| `ui_kits/noesis/` | Pixel-faithful click-through recreation of the Noesis app in Quant Terminal. Open `index.html`. |
| `design-options.html` | Original 4-direction comparison (A · Quant Terminal · CHOSEN). |
| `design-options-AB.html` | Deep A-vs-B comparison + a third hybrid we considered. |
| `frontend/` | The imported source code from `itayasher2/noesis`. Read-only reference. |

---

## Content fundamentals

Noesis writes like a **senior equity analyst with a strong opinion** — confident, specific, light on hedging.

### Voice
- **Declarative, not exploratory.** The product *commits* to a verdict. "BUY · Medium Conviction", "Attractive". It does not say "you might consider".
- **You-implicit, not you-explicit.** Findings, not suggestions. "Consider initiating or adding position" — not "you should add to your position".
- **Analyst shorthand is welcome.** WACC, TGR, FCF, ROIC, EV/EBITDA appear unexplained — the audience is financially literate.
- **Bilingual capability.** The codebase ships English + Hebrew strings (`utils/translations.js`). All new copy is written English-first.

### Casing — under Quant Terminal
- **Eyebrow labels are mono + UPPERCASE + tracked.** `KEY INSIGHT`, `INVESTMENT VIEW`, `FAIR VALUE`, `WHY · ATTRACTIVE`. Every section header. The most identifiable typographic pattern.
- **Tab labels: Title Case** when shown to users (`Overview`, `Valuation`), but rendered through `.tab` which applies mono UPPERCASE for free.
- **Verdict word: ALL CAPS, Arial Black.** `BUY`, `HOLD`, `REDUCE`, `AVOID`. Treated as a stamped decision.
- **Company name in Arial Black ALL CAPS** inside the verdict card (`APPLE INC.`). Elsewhere Title Case is fine.
- **Numbers always tabular** via `.num` or the `.t-num-*` classes.

### Tone examples (lifted + updated)
- Verdicts: `Strong Opportunity` · `Attractive` · `Fairly Valued` · `High Expectations` · `Caution` · `Speculative`.
- Why bullets: *"Undervalued ~32% vs intrinsic value"*, *"Market pricing reasonable growth"*, *"High-quality fundamentals · 56% ROIC"*.
- Action steps: *"Consider initiating or adding position"*, *"Hold existing position"*, *"Wait for meaningful correction"*.
- Inline warnings: *"Market implies **18.2%** FCF growth vs **6.1%** historical — significant gap"*.
- Errors: *"No data found. Please check the ticker."* (terse, no apology).
- Confirmations: *"Analysis refreshed."* (factual).

### Punctuation
- The middle-dot `·` is everywhere. `AAPL · Consumer Tech`, `NASDAQ · 154K · USA`, `LAST · LIVE`, `DCF · BASE CASE`.
- Em-dashes for asides.
- Arrows in CTAs: `Analyze ▶`, `Sign in →`, links close with `↗`.
- AI-generated insights are quoted, italic, in body-secondary colour.

### Vibe
Analyst desk + Bloomberg terminal + a calm SaaS. Confident, dense, no fluff. The product respects the reader's intelligence; never explains a P/E ratio but always tells them what it means for the decision in front of them.

---

## Visual foundations

### Aesthetic

**Quant Terminal.** Dark-default. True-black surfaces (`#050608`, `#0a0d14`) with a fixed 24px blue-tinted dot grid behind everything. A subtle cyan halo radiates down from the top of the viewport. Hairline borders at 8% blue-alpha glow to 18% on hover and to electric-cyan on focus.

### Colors

| Token | Value | Role |
|---|---|---|
| `--bg-base` | `#050608` | App background |
| `--bg-card` | `#0a0d14` | Card surface |
| `--bg-subtle` | `#0f131c` | Sub-card / table hover |
| `--bg-elevated` | `#11151f` | Modal / popover |
| `--border` | `rgba(140,180,255,0.08)` | Default hairline |
| `--border-strong` | `rgba(140,180,255,0.18)` | Hover hairline |
| `--border-glow` | `rgba(0,212,255,0.35)` | Focus / emphasis |
| `--accent` | `#00d4ff` | Electric cyan — focus, active tab, button outline |
| `--brand-green` | `#3ddc84` | The dot, BUY states, positive prices |
| `--green` `--red` `--amber` `--orange` | `#3ddc84` `#ff5470` `#ffb547` `#ff9540` | Saturated semantic colours for dark |
| `--fg1` `--fg2` `--fg3` | `#e6ecf5` `#8593ab` `#4a5872` | Three text steps |

**Light mode** (`html.light`) is a fallback for print and exports. Same roles, lighter surfaces, deeper accent.

**Verdict colours** are role-bound and used as 2px vertical rails on cards plus glowing dots in badges. There is no pastel background pattern in this system. The colour does the work alone.

### Typography

- **Inter** (300 / 400 / 500 / 600 / 700) — body text, headings, anything prose-like.
- **JetBrains Mono** (400 / 500 / 600) — **all UI chrome**: eyebrow labels, badges, tabs, buttons, ticker text, plus every number that matters (`tabular-nums`, `letter-spacing: -0.03em`).
- **Arial Black** — exclusively for the `NOESIS` wordmark, company names inside the verdict card (`APPLE INC.`), and the verdict word (`BUY`, `REDUCE`).
- **Arial italic** — the tagline `Understand Value. Act Smarter.` only.

Semantic classes (in `colors_and_type.css`):

| Class | Use |
|---|---|
| `.t-display` 36px / 600 | Rare — for hero takeover moments |
| `.t-h1` 22px / 600 | Page-section headings |
| `.t-h2` 16px / 600 | Card headings (non-eyebrow) |
| `.t-body` 14px | Prose |
| `.t-body-sm` 13px | Secondary prose |
| `.t-caption` 11px | Captions |
| `.t-eyebrow` | **The chrome signature** — mono · 10px · 500 · UPPERCASE · `letter-spacing: 0.16em`. Used on every section header. |
| `.t-tab` | Tab labels — mono · 10px · UPPERCASE · `ls 0.12em` |
| `.t-badge` | Badge labels — mono · 9px · 600 · `ls 0.18em` |
| `.t-meta` | Inline meta — mono · 10px · 400 · `ls 0.04em` |
| `.t-num-hero` 48px | Hero prices, big upside numbers |
| `.t-num-lg` 22px | KPI cell values |
| `.t-num` / `.num` 13px | Inline tabular numbers |

### Spacing, geometry, radii
- **Radii are tight.** `--radius: 10px` for cards, `--radius-sm: 6px` for buttons / inputs / badges, `--radius-pill: 100px` for pill chips, full circle for the dot and avatars.
- **Buttons & inputs:** 36–42px tall. The brand button is **mono UPPERCASE with a cyan border and glow on hover**, not a filled gradient.
- **Tabular numbers everywhere** that's a number — `tabular-nums` + `letter-spacing: -0.02em`.
- **Container width:** `max-width: 1280px` for the app shell.

### Backgrounds, textures, gradients
- **Dot grid backdrop** on every screen — 1px circles at 6% blue-alpha on a 24×24 grid. The system's signature texture.
- **A subtle cyan radial halo** at the top of the viewport (`rgba(0,212,255,0.05)`).
- **Cards are flat** (`#0a0d14`) — texture lives behind them, not inside. A 2.5%-white top-edge highlight is added via the `.card::before` pseudo-element to suggest a screen rather than paint.
- **Gradient usage is restricted.** The brand gradient (cyan → blue) appears on: the user-menu avatar bubble, occasional emphasis text, and nowhere else. The `.btn-brand` is **not** a filled gradient — it's outlined.
- **Verdict cards never carry a tinted background.** A 2px coloured rail on the left + a mono badge with a glowing 6×6 square dot does all the work.

### Borders & cards
- Cards: `1px solid var(--border)` (8% blue-alpha) + `var(--shadow)` + `10px` radius + a 2.5%-white inner top-edge gradient. On hover the border darkens to `--border-strong` — **no transform, no shadow change**.
- The `.card.glow` modifier swaps the border to cyan and applies `--shadow-glow` (an outer cyan halo). Use for the focused / live card.
- The `.card.glow-green` modifier does the same in brand green — use for BUY emphasis.

### Shadows
Four steps:
- `--shadow` — default card. `0 1px 0 rgba(255,255,255,0.03)` top-edge + `0 4px 16px rgba(0,0,0,0.5)` outer drop.
- `--shadow-md` — modal / popover / login. Deeper drop.
- `--shadow-glow` — focus / emphasis. Cyan ring (`0 0 0 1px`) + cyan halo (`0 0 24px`).
- `--shadow-green-glow` — BUY signal. Same pattern in brand green.

### Hover & press states
- **Cards:** border 8% → 18% over 150ms. No lift.
- **Brand buttons:** background fills from transparent to `--accent-subtle` and gains `--shadow-glow`. On press, background goes full `--accent` and text inverts to bg-base.
- **Menu rows:** background flips to `--bg-subtle` over 100ms.
- **Tabs:** active tab gets a 1px cyan underline with a 0 0 8px cyan glow. Inactive tabs are `--text-muted`; hover moves to `--text-secondary` — no underline.
- **Inputs on focus:** border → `--accent` with `box-shadow: 0 0 0 1px var(--accent), 0 0 16px rgba(0,212,255,0.18)`.
- **Document cards:** border `--border` → `--border-glow` + `--shadow-glow` on hover.

### Animations
The system has **one** ambient motion: the **ticker tape** (60-second linear scroll loop). Everything else is restrained:
- 150–200ms `ease` transitions on colour and border.
- The loading state shows `⟳` Unicode.
- No spring physics, no bouncing, no scroll-triggered animation.

(`.fade-in` exists in CSS but the React kit doesn't use it — it was tripping screenshot captures.)

### Transparency & blur
- Verdict tinted backgrounds are kept to a thin alpha overlay (`accent + α 08`) for badges and inline strips.
- **No backdrop-blur.** Sharpness is part of the brand.

### Layout rules
- **Single-column app, max-width 1280px.** No sidebar, no left nav.
- **Header** sits at top: brand lockup left, user pill right.
- **Ticker tape** below the header, above the search bar.
- **Search bar** with `⌘K` shortcut hint inside the input.
- **Tabs** scroll horizontally on small viewports.
- **Mobile:** keep the grid; switch grids of 4 → 2 → 1 column at breakpoints.

### Imagery
- The Noesis app contains **no marketing imagery, no illustrations, no photography**. The only images that appear are **company logos** fetched from Yahoo Finance / clearbit (32px rounded squares with a 1px border, white-padding so they sit on dark).
- Charts (price, financials, peer comparison) use `recharts` in production — accent-cyan line + area, no gradient fills. The kit uses placeholder boxes with a single cyan sparkline.

---

## Iconography

Noesis has **almost no icons** as primary UI. The visual identity is type, colour, and the green dot.

### Order of preference
1. **Unicode** glyphs as the default ornaments — `▶` analyze, `→` action step, `↗` external link, `↑↓` deltas, `●` bullet, `★` highlight, `▲▼` chevrons, `⟳` loading, `⌘K` keyboard shortcut, `·` middle-dot separator, `✕ ✓` for error / success banners.
2. **Lucide** SVG icons when a glyph is genuinely needed (a chart, search, menu, etc.). The `lucide-react` package is in the source repo's `package.json`; use it. Stroke 1.5–2px, 16–20px, `currentColor`.
3. **Emoji** very sparingly, only for affect — `⚙️ ⚠️ 💡 🤖`. Never in primary CTAs. Never in navigation. Never food / animal / decorative.

### What we did *not* find
- No custom icon font in the source.
- No SVG sprite specific to Noesis. (The repo's `public/icons.svg` is unused Vite-template social glyphs — not brand.)
- No mascot, no 3D, no isometric art.
- The repo's `favicon.svg` and `assets/hero.png` are leftover Vite scaffolding — **not** part of this design system.

### Brand mark anatomy
The Noesis logo is a **lockup**, not a single glyph:

```
●  NOESIS                      ← 9px green dot + Arial Black 15px + 2px tracking
   Understand Value. Act Smarter.   ← Arial italic, 7px, ls 1.5px
```

Assets:
- `assets/logo-lockup.svg` — dark-mode lockup (default).
- `assets/logo-lockup-light.svg` — light-mode variant.
- `assets/wordmark.svg` — wordmark alone.
- `assets/logo-dot.svg` — the dot alone (favicon).

In dark mode (default) the dot glows. In light mode it sits flat. The wordmark is **always** Arial Black — Inter is too soft. Don't substitute.

---

## UI kits

| Kit | Path | Description |
|---|---|---|
| `noesis-app` | `ui_kits/noesis/` | The single product. Clickable demo with mocked AAPL + NVDA data. Login → search → verdict → decision → tabs. Open `index.html`. |

No separate marketing site, mobile app, or docs site to model.

---

## How to use

```html
<link rel="stylesheet" href="colors_and_type.css">
<html class="dark">
  <body>
    <div class="card" style="padding:16px">
      <div class="t-eyebrow" style="margin-bottom:8px">Fair Value</div>
      <div class="t-num-hero">$229.14</div>
      <div class="badge up" style="margin-top:10px">+24.3% upside</div>
    </div>
    <button class="btn-brand">Analyze ▶</button>
  </body>
</html>
```

For a full screen reference, open `ui_kits/noesis/index.html`. For a single primitive, browse `preview/`.

---

*See `SKILL.md` for the agent-facing entry point.*
