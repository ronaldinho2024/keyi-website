# Gallery Accordion: Problem Log & Future Direction

**Session date:** 2026-04-19  
**File:** `gallery-demo.html`  
**Goal:** A horizontal image accordion where hovering an item expands it smoothly — fluid, no snapping, no jank when moving between items.

---

## What Was Built (Chronologically)

### Attempt 1 — CSS flex-grow + class toggle
- `.item.active { flex-grow: 3.2 }` driven by `mouseenter` per item
- **Problem:** switching items fires two CSS transitions simultaneously from rest values. The new item snaps to its "active" start state before expanding. The gap between `mouseleave` on old item and `mouseenter` on new item causes a brief full-reset flash.

### Attempt 2 — `has-active` container class
- Replaced `mouseenter`/`mouseleave` on items with a `.has-active` class on the container so siblings shrink via a single CSS rule
- Added `will-change: flex-grow, transform`
- Slowed easing from `cubic-bezier(0.77,0,0.175,1)` to `cubic-bezier(0.4,0,0.2,1)`, duration 0.65s → 0.9s
- **Problem:** still CSS-driven. Mid-transition switching still causes restart jank because CSS transitions reset to their declared start state when class changes.

### Attempt 3 — rAF lerp loop on `flex-basis`
- Replaced CSS flex transitions with a JS `requestAnimationFrame` loop
- `current[i] += (target[i] - current[i]) * 0.085` every frame
- Wrote `flexBasis` as a percentage of total each frame
- Inner `.card` wrapper added to separate clip from flex item (so `translateX` pull-out isn't cropped)
- `mouseenter` per item replaced with `mousemove` on container → integer index via `Math.floor`
- **Problem:** `Math.floor()` still produces a discrete index. Crossing an item boundary snaps the target array, which the lerp then chases — still visually jagged at transitions.

### Attempt 4 — Gaussian weights
- Replaced `Math.floor` with `gauss(t - (i + 0.5))` for each item
- Every item gets a continuous 0–1 weight based on distance from cursor in item-space
- `targetFlex[i] = MIN + (MAX - MIN) * weight`
- **Problem:** `flex-basis` was now continuous, but `.active` class still toggled on nearest item, firing CSS `transition: transform` and `transition: opacity` on `.card` and `img` — these transitions fired from their rest values when `.active` jumped to a new element. This was the remaining visible snap.

### Attempt 5 — All visuals moved to JS lerp (current state)
- Removed all CSS transitions from `.card`, `img`, `.card::after`
- Added `targetW[]` / `currentW[]` arrays — lerped Gaussian weights (0–1)
- Wrote every visual property from `currentW[i]` each frame:
  - `cards[i].style.transform` (translateX + scale)
  - `cards[i].style.boxShadow`
  - `imgs[i].style.transform` (counter-zoom)
  - `cards[i].style.setProperty('--dim', ...)` (overlay via CSS custom prop)
- Added `globalCurrent` lerp for hover enter/leave fade
- `.active` class retained only for `z-index`
- **Still unsatisfactory.** User confirmed.

---

## Root Cause Analysis

### The real problem: `flex-basis` causes layout reflow on every frame

Every time `flexBasis` is written in the rAF loop, the browser must re-run the **full flex layout algorithm** for the entire gallery — every frame, ~60 times per second. This is a **layout operation**, not a compositor operation. It:
- Blocks the main thread
- Can cause frame drops on mid-range hardware
- Creates subtle micro-stutters that feel "wrong" even when the math is smooth

All previous iterations have this problem. We optimised the *values* going into flex-basis but not the *property itself*.

### Why transforms don't have this problem

CSS `transform` (translateX, scaleX, opacity) run on the **compositor thread** — they never touch layout. This is why `will-change: transform` actually helps, but `will-change: flex-basis` cannot deliver the same benefit.

### Why CSS transitions also can't solve it

Even with perfect easing curves, CSS transitions on flex properties still go through layout. There is no way to animate flex-basis on the compositor.

---

## What Needs to Happen Next

### Option A — `scaleX` + counter-scale (compositor-only, zero reflow)

Each item is fixed width (`100% / N`). To "expand" an item, apply `scaleX(factor)` on the item and `scaleX(1 / factor)` on the image inside to prevent distortion. Recalculate cumulative `translateX` offsets each frame to keep items packed together.

```
item.style.transform = `translateX(${offset}px) scaleX(${scaleX})`
img.style.transform  = `scaleX(${1 / scaleX}) scale(${counterZoom})`
```

- ✅ Compositor-only — no layout
- ✅ Works with existing lerp loop
- ⚠️ Requires computing cumulative offsets each frame (simple arithmetic)
- ⚠️ `scaleX` distorts border-radius — needs `border-radius` counter-correction or a wrapper

### Option B — CSS Grid with `grid-template-columns` custom property

```css
.gallery { display: grid; grid-template-columns: var(--cols); }
```

JS writes `--cols: 20% 40% 15% 15% 10%` each frame from the lerped values.

- ✅ Cleaner to read than scaleX math
- ✅ Works with existing lerp values (just format as percentage string)
- ⚠️ Still causes layout reflow — same fundamental problem as flex-basis
- ❌ Not a meaningful improvement over current approach

### Option C — Absolute positioning with JS-calculated `left` + `width`

Remove flex entirely. Position all items `position: absolute`. Each frame compute each item's pixel `left` and `width` from the lerped values, write directly.

- ✅ Explicit control
- ⚠️ Still layout (width changes reflow)
- ❌ Not better than flex-basis in practice

### Recommendation: Option A (scaleX)

It is the only option that eliminates layout from the animation path entirely. The math is manageable. This is the architecture used by high-end interactive galleries.

---

## Key Numbers / Tunables (to preserve)

```js
const MAX   = 3.2;   // peak flex multiplier
const MIN   = 0.55;  // floor flex multiplier
const LERP  = 0.085; // interpolation speed (~6–9% per frame feels natural)
const SIGMA = 1.2;   // Gaussian spread in item-widths
```

Easing for any remaining CSS transitions: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## Architecture of Current `gallery-demo.html`

```
.gallery (flex container, mousemove listener)
  .item (flex child — flex-basis written by JS)
    .card (absolute fill, overflow:hidden, border-radius:14px)
            transform/shadow/--dim written by JS
      img   (object-fit:cover)
            scale written by JS
```

JS state arrays (all length N):
- `targetFlex[]` / `currentFlex[]` — drives `flexBasis`
- `targetW[]` / `currentW[]` — Gaussian weight, drives all visuals
- `globalTarget` / `globalCurrent` — hover enter/exit fade scalar

---

## References

- `gallery-demo.html` — current implementation
- `homepage.html` — uses WebGL (Three.js) for a 3D card stack; avoids this problem entirely by running on GPU
