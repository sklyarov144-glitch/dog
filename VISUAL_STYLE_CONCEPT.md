# Surf Dog Rush — Visual Style & Art Direction (Yandex Games)

## 1) Creative Vision
**Surf Dog Rush** is a bright, premium-looking stylized 3D endless runner for browser and mobile web (WebGL) with a mascot-first identity.

Core emotional pillars:
- **Joy**: every frame should feel sunny, playful, and rewarding.
- **Readability**: obstacles, lanes, and collectibles must be recognized instantly at high speed.
- **Collectibility**: skins and boards should look desirable, “toy-like”, and worth grinding for.

Target quality bar:
- stylized, polished, casual-hit look;
- kid-safe and family-friendly;
- optimized geometry and materials for smooth performance on mid/low devices.

---

## 2) Art Pillars

### A. Mascot-Driven Identity
- Hero is always the visual center.
- Large head, short limbs, rounded silhouette, strong facial readability.
- Expressions should communicate gameplay state within <0.3 sec.

### B. “Sunset Sugar Rush” Color Language
- Warm golden highlights + cool turquoise water contrast.
- High saturation accents for hazards and boosters.
- Soft global lighting, punchy local glow.

### C. 3-Lane Gameplay Clarity
- Lane borders visible from camera without UI overlays.
- Obstacle silhouettes distinct by shape category (vertical block, low barrier, moving hazard).
- Collectibles positioned with strong rhythm patterns (arc/line/zigzag).

### D. Mobile Commercial Finish
- Rounded geometry, no noisy micro-details.
- Controlled bloom/sparkles (reward moments only).
- “Screenshot-friendly” scenes for store conversion.

---

## 3) Character Concept — Surf Dog

### Base Character (Default Skin)
- **Breed vibe**: French bulldog puppy.
- **Body proportions**: head 45–50% of total body mass, short paws, compact torso.
- **Face**: big glossy eyes, soft muzzle, tiny nose, smiling mouth with expressive corners.
- **Material**:
  - white fur with subtle warm occlusion in folds;
  - very soft roughness variation (not photoreal fur strands);
  - wetness layer on paws/board contact zones.

### Animation Personality
- Bouncy idle motion while surfing.
- Ear flop/jiggle on lane-switch and jump landing.
- Tiny tail wiggle when collecting coin chains.
- Brief “oh no!” face when near collision.

### Rig Recommendations
- Lightweight runtime rig:
  - root + spine + head + jaw + ears + limbs + tail;
  - optional facial blendshapes: smile, surprise, blink, squint, panic.
- Keep deformation stylized and exaggerated over anatomically correct.

---

## 4) Camera & Framing (Third-Person Runner)

- Camera placement: behind and slightly above character.
- Hero position on screen: lower center (~35–40% from bottom).
- FOV: 58–65 (desktop), 62–70 (mobile portrait adaptation).
- Lane readability priority: horizon + three lanes always visible.
- Add mild wave bob (very low amplitude/frequency) to sell ocean motion without harming control precision.

**Camera behavior states**:
1. **Run**: stable follow with gentle spring damping.
2. **Lane switch**: short lateral lead to emphasize speed.
3. **Jump**: slight upward lag + landing settle.
4. **Near miss**: subtle shake impulse (<=120 ms).
5. **Crash**: cinematic tilt + splash close-out.

---

## 5) Environment & Track Design

### World Setting
- Tropical ocean at sunset:
  - pink-orange sky gradient;
  - golden sun rim light;
  - turquoise transparent water;
  - distant palms/islands silhouettes.
- Background life:
  - occasional dolphin jumps;
  - distant seagulls;
  - spark particles over crests.

### Track System (3 Lanes)
- Infinite forward motion.
- Lanes read via:
  - foam streaks;
  - color-tinted wave ridges;
  - floating plank strips/platform hints.
- Segment variety:
  - calm wave sections;
  - obstacle clusters;
  - reward corridors with coin arcs.

### Obstacles (Readable at Speed)
Use color/shape coding:
- **Solid blockers**: wooden crates, small rocks.
- **Soft round hazards**: beach balls, buoys.
- **Creature hazards**: crabs, jumping dolphins crossing lane.
- **Low/high profile**: seaweed bands (jump), wave bars (duck).

Silhouette rule: no two adjacent hazard types should share same dominant shape+height profile.

---

## 6) Collectibles & Boosters

### Gold Bone Coins
- Thick chunky bone silhouette (readable from distance).
- PBR-lite metallic shader + rim glow + spin.
- Placement patterns:
  - arcs (jump guidance);
  - straight lines (lane commitment);
  - zigzags (risk/reward lane changes).

### Boosters (Large, Glowing, Iconic)
1. **Bone Magnet** — bone + magnetic aura.
2. **Bubble Shield** — transparent sphere with caustic highlights.
3. **Rainbow Wave Boost** — colored wake trail + speed lines.
4. **x2 Coins** — floating “x2” badge with coin halo.
5. **Super Jump** — spring/paw icon + vertical burst effect.

All boosters should telegraph function within one glance using iconography + color identity.

---

## 7) UI / UX Visual System

### Style Language
- Big rounded buttons, soft shadows, glossy gradients.
- Icon set: bones, paws, boards, stars, trophies.
- Avoid thin strokes; use thick readable outlines for small screens.

### Main Menu
- Hero pedestal shot: puppy on board, ocean sunset background.
- Primary CTA hierarchy:
  1. Play (largest)
  2. Shop
  3. Missions
  4. Leaderboard
  5. Skins

### In-Run HUD
- Top-left: score.
- Top-center/right: coins.
- Top-right: pause.
- Active boosters row with radial timers.
- Keep HUD margins safe for mobile notches.

### Fail / Results Screen
- Show: run score, best score, coins gained.
- Rewarded actions emphasized:
  - **Watch Ad to Revive** (primary)
  - **Double Reward** (secondary)
  - Restart (tertiary)

---

## 8) Skin Economy Art Direction

### Puppy Skins
1. Classic White Pup (default)
2. Sunglasses Pup
3. Panama Pup
4. Golden Pup
5. Pirate Pup
6. Cyber Pup

### Surfboard Skins
1. Rainbow Board
2. Shark Board
3. Gold Board

Design principles:
- Each skin must be identifiable in 0.5 sec from gameplay camera.
- Keep base silhouette consistent for animation reuse.
- Differentiate through accent props, emissive trims, color blocks, and VFX trails.

---

## 9) Lighting, Materials, VFX

### Lighting
- One dominant warm directional light (sunset).
- Cool fill from sky/water.
- Contact AO baked where possible.

### Water
- Stylized smooth shader:
  - scrolling normals;
  - soft fresnel;
  - foam masks on crests and collisions.

### VFX Budget Priorities
- Coin pickup sparkles.
- Board wake foam.
- Jump/land splash rings.
- Crash splash burst.
- Booster activation pulse.

Use pooled particles and LOD switching for browser stability.

---

## 10) Technical Art Targets (WebGL-Friendly)

### Performance Budget (Guideline)
- Character: 6–12k tris (LOD0), 3–6k (LOD1).
- Obstacles: 300–2k tris each.
- Scene active triangle budget controlled by lane culling + distance fog.
- Texture set:
  - character: 1024–2048 (atlas-friendly);
  - props: 512–1024;
  - UI icons: crisp vector-to-texture pipeline.

### Rendering Strategy
- Favor baked details over runtime complexity.
- Minimal transparent overdraw in core lane path.
- Shared materials per prop families.
- Optional quality tiers: low/medium/high.

---

## 11) Motion & Feedback Matrix

- **Lane switch**: board carve + side spray + tiny camera lead.
- **Jump**: anticipation squash, airborne stretch, soft landing bounce.
- **Duck**: quick crouch with ear flatten.
- **Coin chain**: happy bark face + sparkle streak.
- **Near miss**: eyes widen + micro-shake + whoosh SFX cue.
- **Crash**: spin-out + splash + short pause for result readability.
- **Revive**: bubble pop-in + invuln shimmer.

---

## 12) Brand Consistency Rules

Do:
- keep silhouettes chunky and readable;
- maintain warm-vs-cool contrast;
- push emotional facial cues;
- prioritize clarity over realism.

Don’t:
- add visual clutter/noisy textures;
- use dark muddy palettes in gameplay core;
- hide lane readability with excessive post-processing.

---

## 13) Production Deliverables (Art Pack)

1. **Style Guide PDF** (palette, typography, UI kit, icon language).
2. **Character Turnaround** (front/side/back, expression sheet).
3. **Skin Sheet** (all puppy + board variants).
4. **Environment Kit** (modular obstacles/platforms/props).
5. **VFX Guide** (coin, boost, crash, water interactions).
6. **UI Screens** (menu, HUD, fail, shop, missions).
7. **Marketing Shots** (capsule art, thumbnail, vertical ad creatives).

---

## 14) Prompt Pack for Concept/Render Generation

### Key Art Prompt (RU)
«Премиальный stylized 3D key art для мобильной игры Surf Dog Rush: маленький белый щенок французского бульдога с большими блестящими глазами и радостной улыбкой катается на ярком радужном серфборде по бирюзовой океанской волне на закате, вокруг золотые брызги, тропические пальмы на горизонте, дельфины в прыжке, сочные розово-оранжевые облака, мягкий кинематографичный свет, высокий контраст, чистый коммерческий casual game look, без текста, без логотипов, без копирования известных персонажей».

### In-Game Camera Prompt (EN)
“Stylized 3D endless runner gameplay shot, third-person behind-the-character camera, cute white french bulldog puppy surfing forward on ocean lanes, clear left/center/right track readability, bright tropical sunset lighting, chunky obstacles, glowing bone coins in arcs, high clarity mobile game visuals, polished WebGL-friendly art direction.”

---

## 15) Why This Fits Yandex Games Monetization

- Fast readability supports short sessions and high replay loops.
- Mascot + collectible skins increase retention and cosmetic conversion.
- Booster spectacle creates natural rewarded-ad motivation.
- Bright polished screenshots improve CTR in catalog placements.

This visual direction is designed to be both **production-realistic for WebGL** and **commercially competitive** for casual runner audiences.
