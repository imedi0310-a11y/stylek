# Stylek AI

**Your Style. Your Confidence.**

Stylek AI helps people who feel unsure at the barber or salon to discover hairstyles, compare ideas with their own photo, and show a clear **Barber Card** to their stylist. Available in Arabic (RTL), English and French. No account, no paid services, and photos never leave the device.

## Features

| Area | What it does |
| --- | --- |
| Catalogue (`/styles`) | 38 hairstyles (19 men, 19 women) with search in all three languages and filters for collection, length, texture, style and maintenance. Filters are kept in the URL. |
| Style Finder (`/finder`) | A 7-step questionnaire with Back, Next, Skip and Reset. It ranks styles with a **transparent, rule-based points system** (not AI) and explains each suggestion. |
| Detail (`/styles/[slug]`) | Reference image, textures, length, maintenance, styling steps, what to ask for, face-shape guidance (with a disclaimer), and related styles. |
| Barber Card (`/styles/[slug]/card`) | The request in a printable layout, plus a custom note, Copy, Print / Save as PDF, and Web Share (copies the text if sharing isn't available). Details the dataset doesn't specify are shown as "not specified" and never made up. |
| Try-On (`/try-on`) | Take a photo with the camera or choose one from the gallery, confirm it, choose a style, compare before and after, save, reset, and try another style. Details below. |
| Favorites (`/favorites`) | Saved in `localStorage` on this browser only. Invalid or corrupted data is ignored safely. |
| Privacy (`/privacy`) | Explains photo handling, the model download, local storage and the camera. |

## Virtual try-on: what it is and what it is not

Changing the haircut itself realistically would need a heavy generative model. That model can't run reliably in a phone browser without a paid GPU server, and it can alter facial features, so **this version does not do it and does not pretend to**. The try-on code is modular (`src/lib/tryon/engines.ts`), so a better engine can be added later without rewriting the UI.

| Mode | Type | What happens |
| --- | --- | --- |
| Side-by-side reference | reference | Shows your photo next to the style illustration. Your photo is not changed. |
| Hair colour preview | prototype, on-device | The MediaPipe hair segmenter finds hair pixels, and only those are tinted (shading is kept). Your haircut shape is not changed. |
| Shape guide overlay | prototype, on-device | The MediaPipe face detector places a translucent, dashed outline of the style around your head. It is clearly labelled as not realistic. |

**Face preservation:** both on-device modes compute a protected ellipse from the detected eyes, nose and mouth. Pixels inside it are copied back from the original photo at full opacity, so they stay pixel-identical, with a short feather just outside the ellipse. A unit test checks that protected pixels never change, even when the mask marks every pixel as hair. No beauty filters, face reshaping or smoothing are applied anywhere. Areas outside that ellipse (forehead, ears, jaw edges) can still be tinted if the segmenter mistakes them for hair, so the app doesn't claim perfect preservation there.

**Privacy:** photos are decoded into an in-memory canvas and processed in the browser. They are never uploaded or written to `localStorage`, and their object URLs are revoked when no longer needed. The MediaPipe WebAssembly runtime is copied from `node_modules` and served by this site. The two small model files (about 1 MB in total, Apache-2.0) download from Google's public storage the first time you use a beta mode. That request contains no photo.

## Images

Catalogue images are **built-in vector illustrations** (`src/lib/illustration.ts`), so the app never depends on unlicensed or broken photo URLs. Each illustration is labelled as one. To add real photos, set the optional `photo` field (with `credit`, `license` and `sourceUrl`) on a style in `src/data/`, and only use photos whose licence allows it. If a photo fails to load, the illustration is shown instead.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript 6 · Tailwind CSS 4 · lucide-react · @mediapipe/tasks-vision · Vitest + Testing Library · Playwright.

## Scripts

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm test             # unit tests (Vitest)
npm run build
npm start            # production server, honours $PORT
npm run test:e2e     # Playwright smoke tests (needs `npm run build` first)
```

## Deploy to Render (free)

The repo includes `render.yaml`, which defines a free Node web service:

- Build: `npm ci && npm run build`
- Start: `npm start` (Next.js reads Render's `PORT`)
- Node: 22

**From an Android phone:**

1. Open <https://dashboard.render.com> in Chrome and sign in with GitHub.
2. Tap **New +**, choose **Blueprint**, and pick the `imedi0310-a11y/stylek` repository and the branch you want to deploy (for example `main`).
3. Render reads `render.yaml`. Tap **Apply**. If it asks for `NEXT_PUBLIC_SITE_URL`, you can leave it empty for now.
4. Wait until the deploy shows **Live**, then open the `https://<name>.onrender.com` URL. HTTPS is automatic, and the camera needs it.
5. Optional: set `NEXT_PUBLIC_SITE_URL` to that URL under **Environment** so the sitemap and Open Graph links use it. Render also provides `RENDER_EXTERNAL_URL` automatically.

Free Render services sleep after inactivity, so the first request after a pause can take up to about a minute.

## Project structure

```
src/app/            routes (home, styles, styles/[slug], styles/[slug]/card, finder, try-on, favorites, privacy)
src/components/     shared UI (header, cards, illustration, favorites button…)
src/data/           hairstyle dataset (men / women)
src/i18n/           en / fr / ar dictionaries, provider, locale detection
src/lib/            search, recommendation, favorites, barber card, illustration geometry
src/lib/tryon/      image validation, camera errors, face geometry, hair tint, MediaPipe engines
tests/unit, tests/e2e
```

## Known limitations

- There is no realistic haircut transfer (see above).
- The shape guide depends on the face detector. It refuses to run if no face is found, and it works best on front-facing photos.
- Favorites and language are stored per browser and are not synced across devices.
- The web app manifest and icons are included, but no service worker is shipped, so offline use and installability are not claimed.
