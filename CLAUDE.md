# Keyi Website

A static portfolio website for artist Keyi, showcasing artworks, exhibition history, and contact details.

## Tech Stack

- Plain HTML, CSS, JavaScript — no frameworks or build tools
- Single shared stylesheet (`css/style.css`) and script (`js/main.js`)
- Artwork and media stored in `assets/images/`

## Structure

- `index.html` — **Pre-landing splash page** (the entry point; visitors must click through to enter the site)
- `home.html` — Actual home / landing page (reached after clicking through the splash)
- `works.html` — Artwork gallery
- `exhibitions.html` — Exhibition history
- `contact.html` — Contact information

## Pre-landing page

`index.html` is a full-screen animated splash page, not the main site. It displays 范可怡 (Fan Keyi) in large interactive Chinese typography with:
- Warm cream (`#EDE0C8`) background; characters in red, green, and gold from the `templates/2.jpg` colour scheme
- Each character split into 4 independently animated quadrants (clip-path fragments) plus ghost echo layers
- Idle sine-wave drift on load; transitions to mouse-tracking on cursor movement
- "Fan Keyi" in small text anchored below the bottom-right corner of the character block
- Click anywhere fades out and navigates to `home.html`
- Uses GSAP 3 (CDN) and Noto Serif SC (Google Fonts)

## Conventions

- All pages share the same nav, footer, and linked CSS/JS
- Keep styles in one file unless complexity demands splitting
- Use semantic HTML elements
- Site must be responsive (mobile + desktop)
- Images should use descriptive alt text for accessibility
- Keep page load lightweight — optimize images, minimal JS
