# IntelliSpace — Design Overhaul Handoff

This document is context for a **new Claude conversation** continuing a UI/design-system
overhaul of an existing codebase. Read this fully before doing anything. Attachment
instructions are at the bottom.

## Who I am / what this project is

I (the user) am a backend/3D-leaning developer, not a UI specialist. IntelliSpace is my
final-year project: an AI-assisted interior decor and home visualization platform.
Users create a room, place/arrange furniture in 3D (drag, rotate, scale, collision), and
get AI-assisted decor suggestions. Audience: homeowners, renters, interior designers.

I'm working with a 4-person team. I own the 3D canvas. Om owns UI/state architecture.
Praveen does full-stack integration. Samarth owns the Spring Boot backend. The lighting/
camera feature work currently on the branch (see below) is mine, done intentionally.

**Original ask:** make the UI market-ready, premium, "wow in 5 seconds," while staying
realistic for me to demo/defend — without becoming unreviewable for my teammates.

## Stack

Vite + React 19, Tailwind v4 (CSS-first `@theme` config in `src/index.css`), Zustand,
`@react-three/fiber` + `@react-three/drei` + three.js, framer-motion, lucide-react,
Supabase client. No new npm dependencies have been added anywhere in this project —
everything uses what was already in `package.json`.

## HARD CONSTRAINTS (do not violate these)

1. **Presentation layer only.** Never touch Zustand store files (`src/store/`), API
   calls, props contracts, or anything under `src/components/canvas/` (R3F/Three.js:
   drag/rotate/scale/collision logic). This is non-negotiable — a teammate (Om) owns
   state architecture.
2. **No new npm dependencies** unless clearly worth it, and justified in one line if so.
3. **Keep diffs small, reviewable, easy to merge.** One screen per round. Stop after
   each round and wait for explicit "go" before continuing.
4. The 3D canvas is the hero in the editor — panels float over/beside it, never cover it.
5. Responsive, WCAG AA contrast, visible focus states, keyboard navigable, respect
   `prefers-reduced-motion`.
6. Avoid generic AI-looking design: no purple-gradient clichés, no neon, no overused
   fonts (e.g. Playfair Display), no emoji as icons — use lucide-react.
7. Motion: 150–250ms, purposeful, transform/opacity only.

## My workflow with v0 (IMPORTANT — read this)

I don't paste code directly to Claude. The flow is:
1. Claude writes/edits files directly in its own sandbox and gives me the changed files.
2. I hand those files + a strict merge prompt to **v0** (a different AI tool), along
   with my actual project zip.
3. v0 merges the files into my real repo and gives me back a zip + a text summary of
   what it did.
4. **I do not trust v0's summary at face value.** I re-upload the zip v0 produces back
   to Claude, and Claude extracts + diffs it line-by-line against what it originally
   gave me, to confirm v0 actually did a clean merge and didn't silently touch
   unrelated files.

This caught real problems twice already:
- Once, v0 merged onto a *different, newer branch* than my original zip (one with
  unrelated lighting/camera feature work already on it, which turned out to be mine/
  intentional) and silently dropped two files (`WorkspaceManager.jsx`,
  `useWorkspaceStore.js`) — confirmed intentional removal, but it could have been a
  real regression if I hadn't checked.
- Once, v0's summary claimed "merged, 0 errors" but had actually touched `App.jsx`,
  `Navbar.jsx`, and the store on top of unrelated changes.

**Please keep doing this verification step** every time I upload a zip claiming to be
a merge: extract it, diff every file you expect to have changed against what you gave
me, and diff everything else against the previous known-good baseline to confirm
nothing else moved. Don't just trust a natural-language merge summary.

My current working branch is `v0/editor-lighting-quality` (this already includes my own
unrelated lighting/camera feature work, on top of which the design-system changes below
are layered).

## The actual codebase reality (discovered during Phase 1 audit — don't assume otherwise)

- `src/App.jsx` is a large monolith (~350+ lines) containing both `ConfigurationPanel`
  (the right-side Layout/Walls/Flooring/Ceiling/Windows/Lighting/Environment/Furniture/
  Engineering panel — matches the screenshots) and `WorkspaceOverlay` (the floating
  view-tabs/tool-rail/bottom-dock/zoom controls over the 3D canvas — also matches the
  screenshots). These are NOT in separate component files.
- `src/components/layout/Toolbar.jsx` is a separate **bottom bar** (transform modes,
  clipboard, history, snap settings, export/import/reset) — distinct from, and
  partially redundant with, `WorkspaceOverlay`.
- `src/components/layout/Navbar.jsx` is the top bar (logo, template picker, live price
  metrics, grid/snap/minimap/measurement toggles, undo/redo, save indicator).
- `src/components/layout/Sidebar.jsx` (~312 lines) and `Inspector.jsx` (~31 lines, mostly
  a stub) exist but have NOT been touched yet.
- **Known pre-existing bug found and partially fixed:** `src/index.css` had a large,
  ungated grayscale override block (`:root{...}body{background:#050505}...`) silently
  fighting the intended warm-amber palette, forcing most of the UI toward flat
  black/gray. The part of this block affecting the navbar/toolbar/viewport-overlay has
  been removed. **The same block still has leftover rules affecting the furniture grid
  and the `ConfigurationPanel`/config-nav/tabs — NOT yet cleaned up.** Deal with this
  when working on those screens (Phase 3.1b/3.1c below).
- **Known pre-existing redundancy, not fixed (not mine to decide):** undo/redo exists
  in three places — `Navbar.jsx`, `Toolbar.jsx`, and `WorkspaceOverlay` — all wired to
  the same two store actions. This is a real product decision for the team, flagged but
  left alone.
- **Known pre-existing dead UI, preserved as-is:** the zoom +/− buttons, "Fit to
  Screen," and the 2D toggle in `WorkspaceOverlay` have no `onClick` handlers — they
  were non-functional before this redesign too. They were restyled faithfully, not
  wired up (that would be a logic change outside scope).
- 504 unique hex colors were counted across the original codebase before Phase 2 (near-
  duplicate ambers/grays everywhere) — evidence of ad-hoc, unsystematic styling that the
  design system (below) now replaces for the screens touched so far.

## What's been done so far (all verified, built, and merged into the live repo)

### Phase 1 — Audit (no files changed)
Full written critique of stack + all editor screens. Key finding: emoji-as-icons
everywhere despite lucide-react already being installed and imported; light-mode
Tailwind classes hardcoded into a dark app, papered over with `!important` CSS hacks;
zero shared UI primitives; one font (Outfit) for everything, no numeric/mono treatment.

### Phase 2 — Design system (merged ✅)
**Files:** `src/index.css` (full token rewrite), `index.html` (font swap),
`src/components/ui/{Button,Input,Tabs,Card,Badge,Tooltip,Slider,Modal,Toast,Skeleton,
Kbd,index}.{jsx,js}` (11 new files, all additive).

- **Tokens:** layered dark backgrounds (`--color-bg-0` → `--color-bg-1` →
  `--color-surface` → `--color-surface-raised` → `--color-surface-overlay`), 3 text
  levels (`--color-text-primary/secondary/tertiary`), a terracotta-amber accent scale
  (`--color-accent-200` through `700`, primary `#C97A44`, with dark text on accent
  fills for ~6:1 contrast instead of the generic white-on-saturated-color look),
  semantic success/warning/danger/info, a radius scale, a warm shadow scale, and a
  `.glass-panel` recipe (translucent + blur, used for all floating panels).
- **Fonts:** Fraunces (headings — warm soft-serif, not the Playfair cliché), Inter (UI
  text — also matches the landing page, so editor + landing now share a voice),
  JetBrains Mono (numeric values — prices, dimensions, transform fields — via a
  `.tabular` utility class, so digits stop jittering).
- **Primitives:** all 11 are keyboard-navigable, have visible focus states, and respect
  `prefers-reduced-motion` (a global CSS kill-switch in `index.css` plus explicit
  `useReducedMotion()` checks in `Button`/`Modal`/`Toast`).
- Nothing visually changed in this phase — tokens/primitives were unused until Phase 3.1.

### Phase 3.1a — Navbar, Toolbar, WorkspaceOverlay (merged ✅, verified clean)
**Files:** `src/index.css` (further edits — dead-CSS removal, the grayscale-bug fix
described above), `src/App.jsx` (only the `WorkspaceOverlay` function + its imports —
nothing else in this large file touched), `src/components/layout/Navbar.jsx` (full
rewrite), `src/components/layout/Toolbar.jsx` (full rewrite).

- All emoji icons replaced with lucide-react icons.
- Transform-mode buttons (Move/Rotate/Scale) now use the `Tabs` primitive.
- All icon buttons use `Button` + `Tooltip` (with `Kbd` shortcut hints).
- Floating view-tabs/tool-rail/bottom-dock/undo-redo/sunlight toggle in
  `WorkspaceOverlay` rebuilt with `.glass-panel` + the primitives.
- Every single store hook and click handler was preserved exactly — this was a pure
  restyle, confirmed by diffing the merged zip against the original upload before and
  after.
- Build: `vite build` → 0 errors. Lint: 0 errors (pre-existing unused-import warnings
  only, not introduced by this work).

## What's next (in priority order — confirm with me before starting if anything is ambiguous)

**Phase 3.1b — `ConfigurationPanel`** (next up, not started)
The right-side panel in `src/App.jsx` (Layout/Walls/Flooring/Ceiling/Windows/Lighting/
Environment/Furniture/Engineering tabs — matches the UI screenshots I originally
provided). This is a large chunk of `App.jsx` (~200+ lines). While here, also clean up
the leftover grayscale-override CSS rules affecting `.intelli-config`/`.intelli-tabs`/
`.furniture-*` classes (see "known pre-existing bug" above) — but only the parts this
screen actually touches, same scoping discipline as before.

**Phase 3.1c — Furniture drawer + Inspector + AI panel + collision feedback**
`src/components/layout/Sidebar.jsx`, `src/components/layout/Inspector.jsx` (currently a
near-empty stub — real editing may be happening inside `ConfigurationPanel`'s Furniture
tab instead, confirm during this phase), plus: an AI-suggestions panel (does not exist
yet in the editor — only a marketing mockup exists on the landing page, in
`src/components/sections/IntelligenceOverlay.jsx`, as prior art/reference only),
collision-warning UI (the collision *detection* logic already exists in
`src/components/canvas/CollisionAdvisoryEngine.jsx` — do not touch that file, only
surface its output visually), and loading/empty states for the furniture grid (use the
`Skeleton` primitive).

**Phase 4 — Landing page**
Hero + strong headline + 3D room preview slot, how-it-works, feature bento, demo
section, CTA, scroll animations. Note: the landing page already uses Playfair Display +
Inter (`src/landing.css`) — decide whether to migrate it onto the Fraunces/Inter pairing
for full consistency with the editor, or leave it as its own identity. Not yet decided.

**Phase 5 — Login/Register**
Split layout, inline validation, loading/error states, social-login placeholders.

**Phase 6 — Dashboard/projects**
Cards, filters, empty + loading states.

**Phase 7 — Final polish**
Consistency audit, motion, accessibility, responsive pass across everything.

## Output format expected for each future phase

- Modify actual files in place / give complete files with exact paths — no pseudo-code,
  no "rest of code here."
- Before writing any code: diff/verify the current state of the repo (the new Claude
  should ask me to upload my current zip first if it doesn't already have it in
  context, then actually read the real files rather than assuming).
- After the code: a short "What changed and why" (max 5 bullets) and a "Files touched"
  list, so I can relay it to my team.
- State assumptions instead of asking questions, unless something would clearly go in
  the wrong direction.
- Verify builds (`vite build`) and ideally lint before handing files back, the same way
  this conversation did — don't just write code and assume it compiles.

## What to attach alongside this file in the new conversation

1. **This file** (`INTELLISPACE_HANDOFF.md`).
2. **My current project zip** — export fresh from the `v0/editor-lighting-quality`
   branch (the one that already has Phase 2 + Phase 3.1a merged in). This is the real
   current state; the new Claude should extract and read it directly rather than
   trusting any summary.
3. Optionally, the original UI screenshots (9 images of the Configuration panel —
   Layout/Walls/Flooring/Ceiling/Windows/Lighting/Environment/Furniture/Engineering tabs)
   if I still have them, since Phase 3.1b works directly on that screen and visual
   reference speeds things up.
