# Noesis App — UI Kit (Quant Terminal)

A click-through recreation of the **Noesis equity-valuation web app** in the chosen Quant Terminal direction — Bloomberg + Linear + Vercel. The only product in the system.

## Run it

Open `index.html` directly — no build step. React 18 + Babel-standalone from CDN, `colors_and_type.css` from two levels up.

## What you see

1. **Login** — centered card on the dot-grid backdrop. Any non-empty username/password signs you in.
2. **App shell** — `Header` (brand lockup + UserMenu) + `TickerTape` (ambient 60s scroll) + `SearchBar` (with `⌘K` focus shortcut).
3. **Analyze** — `AAPL` and `NVDA` have fully mocked financials. Other tickers cleanly error.
4. **Verdict screen** — `HeroVerdict` + `DecisionBox` + `InvestmentProfile` render in sequence.
5. **Tab content** — `Overview` / `Valuation` (live DCF sliders) / `Financials` / `Analysis` / `Documents` + `⚙ Advanced` drawer.

## Files

Each `.jsx` file ends with `Object.assign(window, …)` because separate `<script type="text/babel">` files don't share scope under Babel-standalone.

| File | Renders |
|---|---|
| `Header.jsx` | `BrandLockup`, `UserMenu` (mono rows), `TickerTape`, `Header` shell |
| `Login.jsx` | Centered login card + `Field` primitive |
| `SearchBar.jsx` | Search input with `⌘K` hint kbd + Analyze button |
| `HeroVerdict.jsx` | Verdict card with rail · ticker · logo · price · badges · AI insight strip |
| `DecisionBox.jsx` | BUY/HOLD/REDUCE/AVOID action + conviction + Why/Action columns + price-levels meter |
| `InvestmentProfile.jsx` | 4-up KPI grid (Fair Value / Implied Δ / FCF / Confidence) with sparkline + gap warning |
| `TabBar.jsx` | Main tabs + Advanced drawer |
| `Tabs.jsx` | `OverviewTab`, `ValuationTab` (live DCF), `KeyMultiples`, `FinancialsTab`, `AnalysisTab`, `DocumentsTab`, `PlaceholderChart` |
| `NoesisApp.jsx` | Top-level shell. Owns user, theme, ticker, data, tab state. |
| `mockData.js` | `window.NOESIS_MOCK = { AAPL, NVDA }` — realistic-ish numbers |
| `format.js` | `fmt`, `fmtB`, `fmtPct`, `fmtPrice`, `fmtMktCap` — lifted verbatim from the source |

## Patterns to follow when extending

- **Section headers** use `.t-eyebrow` (mono · 10px · 500 · UPPERCASE · `letter-spacing: 0.16em`). Every label. Always.
- **Every number** uses `className="num"` or the `.t-num-*` classes.
- **Verdict-tinted cards** use `.verdict-card.buy/.hold/.reduce/.avoid` — never a coloured background.
- **Status badges** use `.badge` + `.buy/.up/.down/.hold/.reduce/.avoid/.ghost` — color comes from the glowing 6×6 square dot, not the pill fill.
- **Tabs** use `.tab-bar` + `.tab` + `.tab.active` (cyan underline with glow).
- **Cards** use `.card` (10px radius + 8% blue-alpha border + top-edge highlight). Add `.glow` or `.glow-green` for emphasis.
- **Inputs and buttons** are 36–42px tall. `.btn-brand` is mono UPPERCASE with a cyan border that glows on hover — **not a filled gradient**.
- **The brand dot is never replaced** with an SVG icon. It's the brand.

## What's intentionally cut

- The production app calls a Railway-hosted Express API + an AI insight endpoint. Both stubbed.
- `PriceChart`, `FinancialsChart`, `PeerComparison`, `ForwardView`, `MarketHeatmap` use `recharts` in production — the kit uses `<PlaceholderChart>` boxes to stay dependency-free.
- The bilingual (English/Hebrew) translation table is omitted; the demo is English-only.
- Excel export is omitted.
- The Advanced tabs (`Gordon`, `Value Models`, etc.) show a "not stubbed" notice. The originals live in `frontend/src/components/`.

## Iterating

When adding a new screen or component:
1. Read its analogue in `/projects/<this>/frontend/src/components/`.
2. Reproduce structure faithfully — don't redesign.
3. Use existing primitives (`.card`, `.verdict-card`, `.badge`, `.t-eyebrow`, `.t-num-hero`, `MenuRow`, `Field`) before inventing wrappers.
4. New numbers always get `.num`. New section labels always get `.t-eyebrow`.
5. Verdict rails come from the `VERDICT_TO_CLASS` map in `HeroVerdict.jsx`. Don't introduce new tints.
