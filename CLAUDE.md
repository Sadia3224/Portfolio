# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio site for Sayeda Sadia Kawser. Plain static HTML/CSS/vanilla JS — no build step, no package manager, no tests, no framework. Deploy by uploading the folder as-is to any static host.

## Running locally

Open `index.html` directly in a browser, or serve the folder (e.g. `python -m http.server 8000`). Either way the site runs in **edit mode** (see below).

## Design system ("her code notebook")

Feminine + programmer: cream dot-grid paper, plum ink, editor-theme accents (rose, lavender, sage, honey); Fraunces (serif display, italic `<em>` in rose), JetBrains Mono (code/meta), Figtree (body) from Google Fonts. Recurring motifs: editor window bars (`.window-bar` + `.lights`), washi `.tape`, hard offset shadows (`box-shadow: 10px 10px 0 var(--*-soft)`), section labels as file names (`.sec-file`: `about.md`, `projects/`, …). Deliberately avoid glow/gradient-text/glassmorphism "AI template" styling.

All colors are CSS variables on `:root`; night mode overrides them under `:root[data-theme="dark"]`. An inline script in `<head>` sets `data-theme` before paint from `localStorage` `sadia_theme` (or system preference) and adds the `.js` class that enables `.reveal` animations.

## Architecture

- `index.html` — sections `#home`, `#about`, `#projects`, `#research`, `#certificates`, `#contact`, plus owner modals, lightbox, toast. All content (projects, paper, certificates) is hardcoded here. `<head>` has an inline SVG favicon and Open Graph tags (`og:image` is relative until the site has a domain).
- `script.js` — one `DOMContentLoaded` handler in commented blocks: theme, mobile menu, active nav tab (IntersectionObserver), typing prompt (`WORDS`), ribbon marquee (`TICKER_SPEED`; clones `.ticker-group` and slides exactly one group width for a seamless loop), reveal, contact form, edit mode, modals, lightbox, add publications/certificates.
- `style.css` — tokens → base → components in page order → responsive (1080 / 900 / 640px) → reduced motion. `main` uses `overflow-x: clip` because the tilted ribbon is wider than the viewport.
- `content.js` — defines `window.PORTFOLIO_CONTENT = { publications: [], certificates: [] }`; loaded before `script.js`. The only "data file".

### Edit mode (owner-only UI)

`editMode` is true when served from `file:`, `localhost`/`127.0.0.1`, or with `?edit` in the URL; it adds `body.edit-mode`, which reveals `.owner-only` elements ("+ add publication/certificate", delete). There is no backend:

- **Images** (`.media-slot img`): plain files in `images/` (hero photo `images/me.jpeg`). No in-page image upload by design. Images that fail to load get `is-missing` so the placeholder/cover shows (the paper card shows a designed `.paper-cover` unless `images/paper.jpg` exists).
- **Publications/certificates added in the browser**: kept in `localStorage` (`sadia_content_publications` / `sadia_content_certificates`, which take precedence over `content.js`); every add/delete downloads a regenerated `content.js` to replace the one in the folder. Files (≤2 MB) are embedded as data URLs. `renderItems` builds `.pub` / `.cert` cards with `data-dynamic` after the hardcoded ones — keep it in sync with the static markup and form fields.

### Contact form

Posts JSON to FormSubmit (`https://formsubmit.co/ajax/<CONTACT_EMAIL>`, constant in `script.js`); on failure it falls back to a `mailto:` link. FormSubmit needs a one-time activation click from the first email received. A `botcheck` honeypot silently drops spam.

## Assets

- `images/` — `me.jpeg` (hero), `certificate-1.jpg`, `certificate-2.jpg` (previews rendered from the PDFs); `paper.jpg` optional.
- `certificates/` — certificate PDFs linked from cards.
- `Sayeda-Sadia-Kawser-CV.pdf` — CV linked from the hero.
