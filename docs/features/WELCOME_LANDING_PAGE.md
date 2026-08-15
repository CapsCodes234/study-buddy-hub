# Study Buddy Hub — Welcome Landing Page

**Status:** Ready for implementation  
**Feature branch:** `feat/welcome-landing-page`  
**Last updated:** 2026-08-15  
**Audience:** Public visitors, primarily senior-secondary and Cambridge International AS & A Level students  
**Implementation posture:** Add a public entry point without relocating or rewriting the authenticated application

## 1. Problem / opportunity

The root URL is currently an authentication boundary, not a public product entry point. An unauthenticated visitor to `/` is redirected to `/login`, so the product has no place to explain its purpose, show its study-progress approach, or offer a deliberate choice between signing in and creating an account.

Study Buddy Hub needs a polished public welcome page that makes the product understandable before registration while preserving every authenticated route, guard, onboarding step, and data boundary already in place.

## 2. User outcome

A visitor can understand that Study Buddy Hub helps them organise subjects, see their syllabus and practice status, and choose what to focus on next. They can then create an account or sign in through the existing authentication flows.

An authenticated user opening `/` still reaches the existing application dashboard without seeing public marketing content first.

## 3. Repository findings

### 3.1 Current routing and authentication behavior

`src/App.tsx` currently defines:

| Visitor state | Route | Current behavior |
| --- | --- | --- |
| Unauthenticated | `/` | `ProtectedRoute` waits for session restoration, then redirects to `/login` with `state.from` set to `/`. |
| Authenticated | `/` | `ProtectedRoute` renders `Index` inside `SubjectThemeProvider`; `Index` resolves onboarding, subject selection, and dashboard state. |
| Unauthenticated | `/login` or `/signup` | `GuestOnlyRoute` renders the existing `AuthPage` mode. |
| Authenticated | `/login` or `/signup` | `GuestOnlyRoute` redirects to `state.from` when present, otherwise `/`. |
| Unauthenticated | protected deep link | The visitor is redirected to `/login`; after sign-in, `AuthPage` returns them to the original pathname, query, and hash. |
| Any visitor | `/auth` | Redirects to `/login`; guest-only behavior then applies. |

`AuthProvider` restores the Supabase session asynchronously with `supabase.auth.getSession()`, listens for auth changes, loads a profile only for an authenticated user, and removes prior-user subject-query caches on logout or account change. `AuthLoadingScreen` already provides a visible full-screen session-restoration state rather than returning `null`.

The main application remains route-driven through `Index`: `/`, `/settings`, `/exams`, `/:subjectId`, `/:subjectId/syllabus`, and `/:subjectId/papers`. There is no architectural reason to move these routes under `/app` for this feature.

### 3.2 Current authenticated experience

For an authenticated root visit, `Index`:

1. loads local compatibility study state;
2. resolves the cloud-authoritative subject selection;
3. shows onboarding when the database profile is incomplete;
4. shows the subject-selection gate after onboarding when the user has no active subjects;
5. otherwise renders the existing dashboard.

Those decisions must remain inside the authenticated flow. The public landing page must not duplicate or bypass onboarding, subject selection, profile loading, local-data compatibility, or query-cache isolation.

### 3.3 Current visual language and reusable capabilities

The application already has a coherent foundation suitable for the landing page:

- Tailwind CSS with shadcn/Radix-style primitives, including `Button`, `Card`, `Badge`, `Progress`, `Tabs`, and accessible focus behavior.
- Lucide icons, avoiding the need for external icon assets.
- A navy/slate academic palette with teal accents, restrained status colors, soft borders, rounded cards, glass/elevated-card treatments, and light/dark variants.
- Responsive container, grid, stacking, and horizontal-scroll patterns from mobile through `2xl`.
- Existing `light`, `dark`, and `system` theme support, plus user-controlled high contrast and reduced motion.
- Existing CSS/Tailwind animation primitives: fade, slide, scale, progress fill, accordion transitions, stagger delays, and subject-specific pattern motion.
- Recharts is installed for the authenticated analytics UI, but it is unnecessary for a decorative landing preview.

The public page should refine this language rather than introduce a separate neon or generic SaaS identity. Recommended visual ingredients are deep navy surfaces, teal/sky accents, fine academic-grid or orbital-line details, generous whitespace, strong type hierarchy, and UI-inspired cards with purposeful status labels.

### 3.4 Product capability and claim boundary

Current, supportable product concepts include:

- Supabase authentication, profiles, onboarding, and cloud-authoritative subject selection;
- official catalogue and custom-subject selection, with up to seven active subjects;
- local syllabus bullets, status/confidence tracking, notes, and CSV import;
- local past-paper attempt tracking and derived performance analytics;
- a personal dashboard with readiness, progress, subject-health, weakness, momentum, and next-action calculations;
- basic chapter deadlines and exam scheduling;
- local reminders, streaks, milestones, weekly reflections, themes, accessibility settings, and backup compatibility;
- a deterministic AI mock for local development only.

The landing page must not imply that all of those domains are cloud-synchronised. At present, authenticated subject selection is cloud-authoritative, while syllabus progress, notes, paper attempts, reflections, reminders, and much other study data remain in browser compatibility storage during migration. Production AI, protected AI document processing, durable offline conflict handling, encrypted exports, full notification orchestration, collaboration, multi-board support, and calendar integration are not implemented product claims.

The existing signup support text in `src/pages/Auth.tsx` says, “Start syncing your subjects, progress and paper attempts.” That sentence overstates the current migration status. The implementation should replace only that supporting sentence with accurate copy; the authentication form and behavior should remain unchanged.

### 3.5 First-paint and white-flash diagnosis

The brief light flash has an identifiable initialization gap:

1. `index.html` has no inline first-paint background for `html`, `body`, or `#root`.
2. The document starts without a `light` or `dark` class.
3. `ThemeProvider` reads `study-tracker:theme` synchronously during React state initialization, but applies the resolved class to `<html>` in a post-render `useEffect`.
4. Until the stylesheet is available, React mounts, and that effect runs, the browser can paint its default white canvas. Once CSS is available but before the effect, `:root` also exposes the light palette by default, so a dark/system-dark visitor can see a light frame.
5. `AuthLoadingScreen` has an appropriate `bg-background` once React and CSS are active, but the root is empty before mount.
6. `index.html` has one static blue `theme-color` and no `color-scheme` declaration. `ThemeProvider` sets `colorScheme`, but again only after React commits.

Font loading is not the primary cause: the app uses system fallbacks and the remote Inter request can swap later without requiring a white canvas. Route-level `Suspense` fallbacks in `Index` are also visible rather than blank. The core issue is the missing pre-hydration theme/background contract.

The HTML also contains placeholder TODO comments, generic metadata, and an Open Graph reference to `/og-image.png`, but no such asset currently exists in `public/`.

## 4. Product and UX direction

### 4.1 Core message

Recommended hero message:

> **Know where you stand. Focus on what moves you forward.**
>
> Bring your subjects, syllabus confidence, and past-paper practice into one clear view—so the next study decision is easier.

Supporting eyebrow:

> Built for focused AS & A Level study

This wording explains the outcome without promising universal cloud sync, AI, collaboration, or fabricated results.

### 4.2 Tone

The page should feel modern, energetic, academically credible, and student-focused. “Premium” should come from composition, type, spacing, and polish—not glossy corporate stock art, excessive gradients, or constant motion.

Avoid:

- generic browser-window-on-a-gradient SaaS compositions;
- childish school illustrations, floating emojis, or gamification overload;
- fake student counts, percentages, testimonials, ratings, results, or institution logos;
- screenshots that imply data or features the app does not have;
- AI, cloud, offline, notification, or collaboration claims beyond the current implementation boundary.

### 4.3 Visual concept

Use an original, code-built “study command view” in the hero. It should be recognizably derived from the application without being a fabricated screenshot:

- one subject strip using real product concepts such as Mathematics, Physics, and Information Technology;
- a syllabus-focus card with qualitative labels such as “Needs attention”, “In progress”, and “Confident”;
- a past-paper practice tile and a next-action tile;
- progress lines or rings used decoratively without invented numerical results;
- a small label such as “Illustrative dashboard preview” when the composition could be mistaken for live user data.

Build the composition with semantic HTML, CSS, existing icons, and optional inline SVG. Keep it `aria-hidden` when the same meaning is present in nearby copy; do not expose a noisy tree of decorative pseudo-controls to assistive technology.

Use existing design tokens rather than hard-coded component colors wherever possible. Feature-specific gradients, grid lines, and glows may live in a small landing stylesheet, with full light and dark variants.

## 5. Recommended page structure and copy

### A. Public navigation

- Brand mark and full “Study Buddy Hub” name, linking to `/`.
- Optional desktop anchors: “What it helps with” (`#features`) and “How it works” (`#how-it-works`).
- Existing `ThemeToggle`, with its accessible label retained or made more descriptive for the public header.
- “Log in” link to `/login`.
- Primary “Get started” link to `/signup`.

On small screens, keep the brand, theme control, and two auth actions usable without horizontal scrolling. Anchor links may disappear below the desktop breakpoint; a menu is not needed for only two optional anchors.

### B. Hero

- Eyebrow: “Built for focused AS & A Level study”.
- H1: “Know where you stand. Focus on what moves you forward.”
- Supporting sentence from section 4.1.
- Primary CTA: “Create your account” → `/signup`.
- Secondary CTA: “Log in” → `/login`.
- UI-inspired study command view described in section 4.3.

Do not add a waitlist, social-proof row, fake metric, or autoplay media.

### C. Product value / feature showcase

Section heading:

> More than a list of tasks. A clearer picture of your study.

Recommended four-card content:

1. **Keep subjects organised**  
   Bring official catalogue subjects and your own custom subjects into one study space.
2. **See syllabus confidence clearly**  
   Track topics by status, add notes, and spot the areas that need attention.
3. **Learn from past-paper practice**  
   Record attempts and use the dashboard’s progress views to notice patterns over time.
4. **Choose the next useful action**  
   Turn subject status, deadlines, and practice history into a more focused next step.

“Over time” describes local historical analysis, not cloud synchronization. Avoid saying the product automatically creates a study plan; it currently calculates and displays next-action guidance.

### D. How it works

Section heading: “From setup to a clearer next step.”

1. **Add your subjects** — Choose from the available catalogue or create a custom subject.
2. **Track what you know and practise** — Update syllabus status, keep notes, and log past-paper attempts.
3. **Focus where it matters** — Use progress, subject-health, and next-action views to decide what deserves attention.

This should be a compact three-step sequence, not a second dense feature grid.

### E. Product spotlight

Use a wide UI-inspired composition to connect the four value cards:

- “Needs attention” topic list;
- subject health/status chips with both text and color;
- next-action panel;
- past-paper trend treatment without fabricated scores;
- a short explanation: “Your study dashboard brings syllabus status and practice history together, so weak spots are easier to notice.”

This section is illustrative. It must not present fake live data, imply production AI, or use an external screenshot.

### F. Final CTA

Heading: “Make your next study session more deliberate.”

Copy: “Create an account to choose your subjects and start building your study dashboard.”

- Primary: “Create account” → `/signup`.
- Secondary: “Log in” → `/login`.

### G. Footer

- Study Buddy Hub name and one concise descriptor: “Focused study tracking for AS & A Level students.”
- Links to `/login` and `/signup`.
- Current year rendered without a dependency.
- No placeholder legal, social, support, or company links.

## 6. Routing contract

### 6.1 Required behavior

| Visitor state | Route | Required behavior |
| --- | --- | --- |
| Auth loading | `/` | Show the themed, branded session-restoration screen; show neither the landing page nor dashboard until the session decision is known. |
| Unauthenticated | `/` | Render the public landing page. |
| Authenticated | `/` | Render the current `Index` flow inside `SubjectThemeProvider`. |
| Unauthenticated | `/login` | Render the current login experience. |
| Unauthenticated | `/signup` | Render the current signup experience. |
| Authenticated | `/login` or `/signup` | Preserve `GuestOnlyRoute`: redirect to the remembered destination or `/`. |
| Unauthenticated | any private route | Preserve `ProtectedRoute`: redirect to `/login` and retain the complete destination. |
| Authenticated | any private route | Preserve the current authenticated page and provider behavior. |

### 6.2 Recommended implementation

Add a small session-aware home boundary for `/`:

```text
GET /
  ├─ auth loading ─────────→ AuthLoadingScreen
  ├─ authenticated ────────→ SubjectThemeProvider → Index
  └─ unauthenticated ──────→ Landing
```

The boundary should consume `useAuth()` only. It must not fetch a profile or study data itself, redirect the guest to `/login`, or infer authentication from local storage.

Recommended shape:

- `SessionAwareHomeRoute` receives or renders the guest and authenticated elements.
- Remove only `/` from the existing `ProtectedRoute` group.
- Keep `/settings`, `/exams`, subject routes, `/theme-demo`, and the protected wildcard where they are.
- Keep `/login` and `/signup` under `GuestOnlyRoute`.
- Keep `/auth` redirecting to `/login`.
- Do not move the authenticated application to `/app`.

If `Index` is lazy-loaded at the route boundary, use the same nonblank themed loading shell as the fallback. Avoid a route change that first renders the landing page and then swaps to the dashboard for an authenticated user.

`ScrollToTop` should use an immediate scroll reset on pathname changes or explicitly honor the app’s reduced-motion setting. Smooth scrolling remains appropriate for same-page landing anchors, but a forced smooth scroll on every route transition can animate old content during navigation and does not currently consult the manual `.reduce-motion` preference.

## 7. First-paint and theme initialization plan

### 7.1 Recommended fix

Add a minimal, blocking bootstrap in the `<head>` of `index.html`, before application scripts and generated styles can produce a mismatched paint:

1. Read `study-tracker:theme` inside `try/catch`.
2. Accept only `light`, `dark`, or `system`; treat an invalid or inaccessible value as `system`.
3. Resolve `system` with `matchMedia('(prefers-color-scheme: dark)')`.
4. Add exactly one `light` or `dark` class to `document.documentElement`.
5. Set `document.documentElement.style.colorScheme` to the resolved value.
6. Update the document `theme-color` to a matching surface value if a single mutable meta element is used.

Also include tiny critical CSS in `index.html`:

```css
html,
body,
#root {
  min-height: 100%;
  margin: 0;
}

html,
body,
#root {
  background: hsl(220 20% 97%);
}

html.dark,
html.dark body,
html.dark #root {
  background: hsl(222 47% 7%);
}
```

The exact values should match the current `--background` tokens. Add `<meta name="color-scheme" content="light dark">` as a browser hint, while the resolved inline value remains authoritative for the current paint.

`ThemeProvider` should then reconcile the same storage value and remain responsible for live changes, system preference updates, high contrast, and reduced motion. Its initial effect should be idempotent because the correct class already exists. Keep the bootstrap storage key and validation behavior explicitly synchronized with `ThemeProvider`; add a code comment and a testable helper if that avoids future drift.

### 7.2 Loading and transition requirements

- Retain a visible `AuthLoadingScreen` while `AuthProvider` restores the session.
- Restyle that screen only if needed to share the landing/auth visual tone; do not replace it with `null` or a splash delay.
- Ensure `html`, `body`, and `#root` retain a themed minimum-height background after the critical CSS hands off to `src/index.css`.
- Do not animate theme properties on the initial bootstrap frame. Theme transitions may apply only after initialization, or the early class must make the first and React-resolved states identical.
- Test fresh load, hard reload, service-worker-controlled reload, and route navigation in explicit light, explicit dark, and system modes.

### 7.3 Metadata cleanup

Update `index.html` as part of implementation:

- remove placeholder TODO comments;
- use an accurate description focused on organising subjects and understanding study progress;
- keep the product title and author accurate;
- either create a real, approved `public/og-image.png` or remove the broken Open Graph image reference until one exists;
- preserve the manifest and favicon links.

Do not add tracking scripts, remote videos, or a client-side head-management dependency for this feature.

## 8. Animation strategy

Use CSS and existing Tailwind animation capabilities. No new animation library is justified.

- Hero copy: one 300–450 ms fade/translate entrance.
- Hero preview: one 400–600 ms scale/fade entrance with short child staggering.
- Feature cards: optional reveal when first entering the viewport; use a small `IntersectionObserver` helper only if the effect materially improves the page.
- Decorative background: at most one or two slow, transform-only drifts. Disable continuous motion on mobile if it adds paint cost.
- Progress lines: one entrance fill; do not loop.
- Buttons/cards: 150–200 ms hover/focus transitions with small elevation or color changes, not bouncing.
- Same-page anchors: native/CSS smooth scrolling only when motion is allowed.

All landing motion must stop or become effectively instantaneous under both:

- `@media (prefers-reduced-motion: reduce)`; and
- the app’s manual `.reduce-motion` root class.

No animation may delay rendering, focus, clicking, or navigation. Avoid scroll listeners, JS parallax loops, animated blur, large moving shadows, canvas, WebGL, and autoplay media.

## 9. Responsive behavior

- **Mobile:** single-column hero; CTA links stack or wrap to full-width 44 px minimum targets; product preview simplifies to two or three layered cards with no offscreen transforms; optional nav anchors are hidden; no horizontal scrolling.
- **Tablet:** balanced single/two-column sections; feature cards use two columns; preview remains readable without tiny UI labels.
- **Laptop:** hero uses a roughly 45/55 text-to-preview split; content stays within the existing centered container.
- **Wide desktop:** increase whitespace, not text line length or card count; cap readable copy and preview widths.

Use `min-w-0`, bounded absolute positioning, `overflow-clip`/`overflow-hidden` only around decoration, and responsive grid/flex utilities. Verify at 320, 375, 768, 1024, 1440, and 1920 CSS pixels, including 200% text zoom.

## 10. Accessibility requirements

- One `<h1>` and a logical heading hierarchy.
- Semantic `<header>`, `<nav>`, `<main>`, labeled `<section>` elements, and `<footer>`.
- A visible-on-focus “Skip to main content” link using the existing `.skip-link` pattern.
- CTA actions implemented as real router links, optionally through `Button asChild`; no clickable `<div>` elements.
- Visible keyboard focus in light, dark, and high-contrast modes.
- At least 44 × 44 px touch targets for primary navigation and CTAs.
- Accessible contrast for body copy, muted labels, borders, focus rings, and gradient text fallbacks.
- Status meaning expressed with text/icon as well as color.
- Decorative UI compositions, SVG shapes, and background patterns hidden from screen readers.
- No information available only through animation, hover, or parallax.
- Reduced-motion behavior as specified in section 8.
- Anchor targets offset below the sticky public header.
- Keyboard order follows the visual reading order and does not enter decorative preview elements.

## 11. Performance requirements

- Do not add Framer Motion, a second icon set, a charting instance, WebGL, video, or a hero image download.
- Build the preview with HTML/CSS, existing Lucide icons, and compact inline SVG where helpful.
- Import a feature-specific stylesheet from `Landing.tsx` so Vite can keep landing-only styles scoped and, if the page module is lazy, route-associated.
- Avoid loading authenticated dashboard charts or PDF tooling solely to render the landing preview.
- Use system font fallbacks already configured; do not add another webfont.
- Animate only `transform` and `opacity` where practical.
- Give visual blocks intrinsic dimensions or stable aspect ratios to prevent layout shift.
- If the landing and authenticated page modules are route-lazy, every lazy boundary must use a themed, nonblank fallback.
- Compare the production bundle before and after implementation and investigate an unexpected main-entry increase.

No fixed kilobyte budget is imposed because the current chunk baseline should be measured during implementation, but the page should add no large binary asset or runtime dependency.

## 12. Security and privacy considerations

- The landing page is public and must not query profiles, subjects, or any other private product table.
- The only session dependency is the existing `AuthProvider` decision needed to choose the root experience.
- Do not embed real user data, secrets, environment values, private screenshots, analytics trackers, form collection, or third-party widgets.
- Preserve every existing private-route guard and Supabase/RLS boundary.
- Preserve old-user query-cache removal on sign-out/account change.
- Treat all UI preview content as static illustration; no fake account or user record should be created.
- Do not claim encryption, full cloud sync, production AI, collaboration, guaranteed grades, or support for unimplemented boards/qualifications.
- Any future analytics or cookie/consent work requires a separate privacy decision and is outside this feature.

## 13. Recommended component and file plan

Prefer small, content-oriented sections rather than one monolithic component.

### Create

```text
src/pages/Landing.tsx
src/components/landing/LandingNav.tsx
src/components/landing/HeroSection.tsx
src/components/landing/ProductPreview.tsx
src/components/landing/FeatureShowcase.tsx
src/components/landing/HowItWorks.tsx
src/components/landing/FinalCta.tsx
src/components/landing/LandingFooter.tsx
src/components/auth/SessionAwareHomeRoute.tsx
src/styles/landing.css
src/components/auth/__tests__/SessionAwareHomeRoute.test.tsx
src/pages/__tests__/Landing.test.tsx
```

`ProductPreview` may be shared between hero and spotlight only if the responsive compositions genuinely align; avoid over-abstracting simple presentational markup. A tiny landing content-data file is optional if it makes cards and steps easier to review.

### Modify

```text
src/App.tsx
src/pages/Auth.tsx
src/components/auth/AuthLoadingScreen.tsx        # only if visual continuity needs it
src/components/ui/ThemeProvider.tsx              # reconcile/validate bootstrap behavior if needed
src/index.css                                     # persistent root background and anchor offsets if not landing-scoped
index.html
```

Optional, only after design approval:

```text
public/og-image.png
```

Do not modify Supabase, migrations, seed data, environment files, Vercel configuration, CI, `package.json`, or `package-lock.json` for this feature. No new dependency is expected.

## 14. Implementation sequence

1. Add and test `SessionAwareHomeRoute` using the existing auth context and loading screen.
2. Restructure only the `/` route; verify guest-only and private-route behavior before styling work.
3. Add the pre-hydration theme bootstrap and root background; validate the flash fix in isolation.
4. Build `Landing` and its sections from content-first semantic markup.
5. Add landing-only visual treatments and responsive behavior using existing tokens.
6. Add restrained motion and both reduced-motion paths.
7. Correct the inaccurate signup supporting sentence without changing auth behavior.
8. Update metadata and either supply an approved Open Graph image or remove the missing reference.
9. Add routing and landing-page tests, then run the full repository validation suite.
10. Complete manual visual, accessibility, auth-regression, and first-paint QA.

## 15. Automated validation plan

### Routing and auth tests

- Loading `/` renders `AuthLoadingScreen` and neither root experience.
- Guest `/` renders the landing page and does not navigate to `/login`.
- Authenticated `/` renders the authenticated element.
- Guest `/login` and `/signup` render their correct existing modes.
- Authenticated `/login` and `/signup` preserve guest-only redirects.
- A guest private deep link still redirects to `/login` with pathname, query, and hash retained.
- Signing in from a retained destination still returns to that destination.

### Landing tests

- Exactly one H1 is present.
- Primary and secondary hero CTAs point to `/signup` and `/login`.
- Final CTA links point to the same routes.
- Anchor targets and meaningful section headings exist.
- Decorative preview content is removed from the accessibility tree where intended.
- The page has no form, private-data request, or fabricated social proof.

### Theme/bootstrap tests

- Stored light, stored dark, system light, system dark, invalid storage, and unavailable storage resolve deterministically.
- Theme bootstrap and `ThemeProvider` use the same storage key and valid values.
- Manual reduced motion and system reduced motion disable landing animations.

### Repository gates

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

No database reset or remote Supabase operation is needed for this frontend feature.

## 16. Manual QA checklist

### Root and auth flow

- [ ] Signed-out `/` shows the landing page.
- [ ] Signed-in `/` shows the current onboarding, subject-selection, or dashboard state as appropriate.
- [ ] “Log in” reaches `/login`; successful login returns to `/` unless a private destination was retained.
- [ ] “Create account” and “Get started” reach `/signup`.
- [ ] Direct `/login` and `/signup` loads work after refresh.
- [ ] Authenticated visits to `/login` and `/signup` redirect as before.
- [ ] Direct refresh works on `/`, `/login`, `/signup`, `/settings`, `/exams`, and representative subject routes.
- [ ] `/auth` still resolves through `/login` correctly.
- [ ] Sign-out returns private routes to the existing guest flow without exposing prior-user data.

### Authenticated regression

- [ ] Profile and onboarding loading still work.
- [ ] Zero-subject users still see the subject-selection gate after onboarding.
- [ ] Dashboard, settings, exams, subject overview, syllabus, and papers still render.
- [ ] Local bullets, notes, papers, reminders, reflections, settings, and backups remain intact.
- [ ] Subject selection, archive/restore, custom subjects, and the seven-subject limit still work.
- [ ] Account switching does not show another user’s subjects or cached queries.

### Visual and responsive

- [ ] Layout is usable at 320, 375, 768, 1024, 1440, and 1920 px widths.
- [ ] No horizontal overflow appears, including in the hero preview and sticky navigation.
- [ ] CTAs remain at least 44 px high and do not truncate.
- [ ] Text remains readable at 200% zoom and with long translated-style strings simulated.
- [ ] Light, dark, and system themes all render the landing, auth pages, loading screen, and authenticated shell consistently.
- [ ] High-contrast mode retains clear boundaries and focus.

### First paint and motion

- [ ] Cold load and hard refresh show the resolved surface color before React renders.
- [ ] No white/light frame appears in dark or system-dark mode under network/CPU throttling.
- [ ] No blank root appears while auth restores or lazy modules load.
- [ ] Route changes among landing, login, signup, and the authenticated app have no abrupt background mismatch.
- [ ] System `prefers-reduced-motion` disables entrances, fills, drift, and smooth anchor scroll.
- [ ] The app’s manual reduced-motion setting does the same.
- [ ] Animation never blocks pointer or keyboard interaction.

### Accessibility and content

- [ ] Skip link, navigation, every CTA, and footer links are keyboard reachable in logical order.
- [ ] Focus is visible on all interactive elements in light and dark themes.
- [ ] Headings and landmarks form a sensible accessibility outline.
- [ ] Screen-reader output omits decorative preview noise.
- [ ] Status is never communicated by color alone.
- [ ] Copy contains no fake metrics, testimonials, counts, or unsupported product claims.

### Production-like behavior

- [ ] Production preview loads with the service worker enabled and updates cleanly from an older cached version.
- [ ] Browser console has no route, hydration, asset, or accessibility errors.
- [ ] Open Graph metadata references only assets that exist.
- [ ] Bundle output contains no new large dependency or unexpected main-chunk regression.

## 17. Acceptance criteria

- [ ] An unauthenticated visit to `/` renders the complete public landing page without redirecting.
- [ ] An authenticated visit to `/` renders the existing authenticated `Index` flow without a public-page flash.
- [ ] Hero, navigation, and final login CTAs navigate to `/login`.
- [ ] Hero, navigation, and final signup/get-started CTAs navigate to `/signup`.
- [ ] Direct `/login` and `/signup` visits and refreshes preserve the existing forms and guest-only behavior.
- [ ] Private route redirects, retained destinations, session restoration, profile loading, onboarding, and subject-selection gating are unchanged.
- [ ] Dashboard, settings, exams, subject routes, SPA deep links, login/logout, and account-specific query-cache isolation do not regress.
- [ ] The landing page supports the existing light, dark, and system theme settings.
- [ ] The initial browser paint uses the resolved theme background; dark loads show no white/light flash.
- [ ] Auth and lazy-loading states are visible, themed, and nonblank.
- [ ] Mobile, tablet, laptop, and wide-desktop layouts have no horizontal overflow and preserve usable CTA targets.
- [ ] Keyboard navigation, skip navigation, semantic headings/landmarks, visible focus, contrast, and screen-reader treatment meet the requirements above.
- [ ] Both system and manual reduced-motion preferences disable nonessential landing motion.
- [ ] The page adds no large media, runtime animation dependency, private-data query, or tracking integration.
- [ ] Product copy is accurate to the current staged migration and makes no unsupported AI, sync, offline, collaboration, or catalogue claim.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## 18. Out of scope

- Moving the authenticated app to `/app`.
- Redesigning or replacing the login/signup forms or authentication methods.
- Changing Supabase schema, RLS, migrations, seed data, environment configuration, or hosted projects.
- Migrating additional study domains to the cloud.
- Implementing production AI, collaboration, analytics tracking, billing, notifications, calendar integration, or a CMS.
- Adding a new UI, icon, charting, font, or animation dependency.
- Fabricating testimonials, metrics, user counts, outcomes, or partner logos.
- Redesigning the authenticated dashboard beyond any tiny loading-background consistency adjustment required by this feature.

## 19. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Dual-purpose `/` regresses auth routing | High | Isolate the session-aware decision, preserve all other guards, and test guest/loading/authenticated states plus retained deep links. |
| Landing flashes before authenticated dashboard | High | Wait for `AuthProvider.loading` to resolve and render the existing themed loading screen; never optimistically render landing content. |
| Theme bootstrap drifts from `ThemeProvider` | Medium | Share documented valid values and the exact `study-tracker:theme` key; test all resolution cases and keep reconciliation idempotent. |
| Existing copy overstates cloud sync | Medium | Use the claim boundary in section 3.4 and correct the signup support sentence. |
| Decorative preview looks like fake data | Medium | Use qualitative, clearly illustrative content with no invented metrics or user identity. |
| Hero treatment causes mobile overflow or paint cost | Medium | Bound every layer, simplify on mobile, animate transforms/opacity only, and test narrow widths and zoom. |
| Service-worker cache masks routing or asset changes | Medium | Test production preview with an existing cache and a clean profile; preserve Vite’s SPA fallback. |
| Missing Open Graph image creates broken previews | Low | Create an approved local asset or remove the reference; never leave a nonexistent path. |
| Scope expands into dashboard/auth redesign | Medium | Limit authenticated changes to root selection, accurate support copy, and shared loading/first-paint continuity. |

## 20. Future extensions

- Approved real product screenshots after the UI and migration state are stable.
- Route-specific metadata or structured data after content is finalized.
- Privacy-reviewed, consent-aware product analytics.
- Public help, privacy, terms, or changelog pages when real content and ownership exist.
- Updated copy as cloud persistence, protected AI, catalogue coverage, and offline sync become production capabilities.

## Final implementation decision

The repository supports this feature through a low-risk, session-aware root route. The existing authenticated app, guards, theme system, UI primitives, and CSS animation capabilities can be retained. The first-paint issue has a specific pre-hydration fix, no new dependency is needed, and current product claims can be kept accurate.

**FINAL VERDICT: READY FOR LOVABLE IMPLEMENTATION**
