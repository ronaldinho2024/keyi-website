# Desktop-first stack spec (scroll-scrubbed image panes only)

## Scene + camera (desktop defaults)

- **Viewport target:** design for 1440–1920px wide, ~900–1080px tall canvas area (your screenshot is "medium desktop"; scale constants with clamp()).
- **Camera:** perspective (not orthographic). Start with FOV ~38–48 and camera positioned so the front pane fills roughly 55–70% of viewport height at rest.
- **Look-at:** camera aims at a point slightly above center so the diagonal stack reads clearly in the upper two-thirds.

---

## Pane geometry (each image plane)

- **Count:** 12–16 panes (12 is a good default; add more only if perf allows).
- **Mesh:** PlaneGeometry with portrait aspect:
  - Aspect: width:height ≈ 0.44–0.50 (taller/narrower reads closer to your screenshot).
  - World height (front): set so the front plane's projected screen height ≈ 0.62–0.72 × canvasCssHeight.
- **Materials:**
  - `transparent: true`
  - Opacity curve by index `i` from front→back: start 0.82–0.92, end around 0.55–0.70 (back planes must stay readable but clearly layered).
  - Keep planes non-zero thickness in depth (separate Z) to avoid z-fighting; don't rely on identical Z + alpha alone.

---

## Stack path (the "diagonal fan")

Define a param `t ∈ [0,1]` driven by scroll (see next section). Each pane `i` (0 = front) sits at:

- **Base parameter:** `p_i = t + i · δ` where δ ≈ 0.055–0.09 (smaller δ = tighter stack, larger δ = more spread).
- **Clamp per pane:** clamp `p_i` into a visible band (or wrap) so panes don't explode off-screen; simplest is `p_i = clamp(t + iδ, 0, 1)` or allow slight overshoot outside [0,1] for ±0.05 only.

Position each pane on a 3D line through the scene (world space), from front-bottom-left toward back-up-right:

```
x(i) = x0 + kx * p_i    (moves right as scrub advances / as index increases)
y(i) = y0 + ky * p_i    (moves up)
z(i) = z0 + kz * p_i    (recedes into the scene; kz is negative)
```

**Suggested starting ratios (desktop):**

- `kx : ky : |kz| ≈ 1.35 : 1.0 : 2.2` (diagonal reads clearly without flattening)
- Front anchor: `x0 ≈ -0.42..−0.30`, `y0 ≈ -0.22..−0.12`, `z0 ≈ 0` (exact numbers depend on your unit system; treat as relative offsets you normalise once).

---

## Rotation (fan twist)

Apply a small cumulative rotation so panes "fan" rather than slide perfectly parallel:

- **Yaw (primary):** `yaw(i) = yaw0 + i * (0.012–0.028 rad)` (pick sign to match desired lean)
- **Roll (optional micro):** `roll(i) = i * (0.004–0.010 rad)` (keep subtle)
- **Pitch:** keep near 0 unless you want a more "laying back" look.

---

## Scale (depth cue)

Use a gentle shrink with index and scrub:

```
scale(i) = lerp(1.00, 0.62, clamp01((i + t * N) / N))
```

where `N = paneCount`.

Optional polish: slightly lower saturation / lift blacks on deeper panes (shader/post), but opacity + scale already sells depth.

---

## Scroll scrub mapping (desktop interaction)

**Page scroll → t**

- Scroll container: full-page (document) is fine on desktop.
- Define a scrub "track" length: map ~900–1400px of scroll to traverse the full stack motion (shorter = snappier; longer = cinematic).
- Mapping:
  ```
  t = clamp01((scrollY - start) / (end - start))
  ```
- **Easing:** use linear mapping for true scrub. If it feels harsh at endpoints, apply only 2–4% ease-in/out at the ends (still reads as scrub).

**Scrub should move all panes coherently**

Interpret `t` as advancing the entire stack along the path vector:

- **Option A (simplest):** shift each pane's `p_i` by `t` (implemented above).
- **Option B (stronger "filmstrip" feel):** keep geometry fixed and move a parent Group along the path by `t`, plus a tiny per-index phase offset.

---

## Motion ranges (what changes as t goes 0→1)

Over the scrub, aim for these visible deltas on desktop:

- Front pane moves roughly **8–14% of canvas width** along +X and **5–9% of canvas height** along +Y (screen-space approx).
- Depth separation between adjacent panes should correspond to **~2–5% apparent size change** per step at mid-stack.

---

## Performance notes (desktop, many textures)

- Use powerOfTwo textures where possible; set `anisotropy` (8–16) for sharpness at shallow angles.
- Prefer one shared material with per-mesh uniforms or instancing if you grow pane count.
- Cap texture resolution per pane (e.g. max 1600px on the long edge) for smooth scrubbing.

---

> If you supply your chosen world unit convention (e.g. "scene fits in [-1,1] cube" vs "1 unit = 1 meter"), the x0/y0/kx/ky/kz block can be translated into a single concrete parameter set.
