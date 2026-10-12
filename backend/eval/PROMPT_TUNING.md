# Prompt Engineering & Tuning Guide (Member 2)

This document describes how to run the evaluation harness, compare visual results across styles and strength levels, and tune the prompt presets in `backend/app/services/prompt_builder.py`.

---

## 1. Quickstart: Running the Eval Harness

### Step 1: Generate Standard Benchmark Sketches
The dataset includes 10 standardized hand-drawn test subjects (house, face, car, UI wireframe, cat, coffee mug, mountain, tree, chair, sailboat).

```powershell
cd backend
.\venv\Scripts\python .\eval\generate_sketches.py
```

### Step 2: Run Evaluation
To run the evaluation across all styles and fidelity levels:

```powershell
# Runs full benchmark suite (10 sketches x 7 styles x 2 fidelity levels = 140 outputs)
.\venv\Scripts\python .\eval\run_eval.py

# Or run a quick smoke test on the first 2 sketches (2 x 7 x 2 = 28 outputs):
.\venv\Scripts\python .\eval\run_eval.py 2
```

Outputs and `manifest.json` will be written to `backend/eval/outputs/`.

---

## 2. Evaluation Criteria & Scoring Rubric

Evaluate each result on a 1–5 scale across three dimensions:

| Dimension | Description | Target Score |
|---|---|---|
| **Structure Preservation (S)** | Does the output retain the silhouette, layout, and composition of the sketch? | $\ge 4/5$ |
| **Style Fidelity (F)** | Does the output authentically capture the requested art medium? | $\ge 4/5$ |
| **Artifact Cleanliness (C)** | Is the image free of accidental text, signatures, watermarks, or extra appendages? | $\ge 4.5/5$ |

### Strength Slider Calibration

- **`strength = 0.35` (High Sketch Fidelity)**:
  - Intended for architectural layouts, wireframes, and exact silhouette matching.
  - Activates clause: *"Strictly adhere to the exact line contours, silhouettes, and spatial layout of the provided sketch."*
- **`strength = 0.70 - 0.75` (Balanced / Creative Default)**:
  - Intended for character art, landscapes, and concept illustrations.
  - Activates clause: *"Follow the composition, proportions and main shapes of the provided sketch."*
- **`strength >= 0.80` (High Creativity)**:
  - Allows model to imagine rich backgrounds and lighting while referencing composition.

---

## 3. Style Presets Reference & Tuning

All presets live in a single unified dictionary inside [`backend/app/services/prompt_builder.py`](file:///C:/Users/Admin/.gemini/antigravity/scratch/sketch-to-image/backend/app/services/prompt_builder.py):

| Style | Style Clause | Quality Clause |
|---|---|---|
| `photorealistic` | Photorealistic photograph, natural lighting, realistic materials and textures, shallow depth of field. | Ultra-detailed, 8k resolution, crisp textures, lifelike depth. |
| `digital_art` | Polished digital illustration, clean shapes, rich color, detailed shading. | Smooth color transitions, masterwork concept art, vibrant and sharp. |
| `watercolor` | Soft watercolor painting, visible paper texture, flowing pigment, gentle gradients. | Delicate brush strokes, authentic wet-on-wet watercolor technique, expressive color bleed. |
| `anime` | Clean anime-style illustration, crisp line art, cel shading, vibrant palette. | Studio animation production art, vivid coloring, clean lines, expressive detailing. |
| `3d_render` | High-quality 3D render, physically based materials, soft studio lighting. | Octane render quality, ray-traced reflections, ambient occlusion, immaculate finish. |
| `pencil_realistic` | Detailed graphite pencil drawing, fine hatching, realistic tonal range. | Rich graphite gradients, precise cross-hatching, authentic textured sketchbook paper. |
| `ui_mockup` | Clean modern UI design mockup, consistent spacing and alignment, flat vector style. | Pixel-perfect layout, modern typography, crisp interfaces, Figma design fidelity. |

### Adding a New Style
To add a new preset (e.g. `pixel_art` or `claymation`):
1. Add the enum value to `StylePreset` in `schemas.py` and `frontend/src/lib/api.ts`.
2. Add a one-line entry in `STYLE_PRESETS` in `prompt_builder.py`:
   ```python
   StylePreset.PIXEL_ART: StyleConfig(
       style_clause="Charming 16-bit retro pixel art, crisp pixels, nostalgic palette.",
       quality_clause="Clean pixel grid, high-contrast sprites, authentic retro game aesthetic."
   ),
   ```

---

## 4. Best Practices for Structure Preservation in FLUX

1. **Keep prompt clauses positive**: FLUX models do not accept negative prompts. State what to render rather than what to avoid.
2. **Do not over-describe details that contradict the sketch**: If the user drew a sedan, prompt phrases describing a "convertible with an open roof" can cause structural confusion.
3. **Pencil sketch contrast**: If sketches are faint, toggle `ENHANCE_FAINT_SKETCHES=true` in `backend/.env` to auto-contrast faint graphite strokes before passing to the model.
