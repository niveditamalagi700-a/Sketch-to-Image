# Sketch → AI Image (with Marketing Landing Page)

> A production-quality web application that transforms rough hand-drawn sketches and descriptive text prompts into high-fidelity AI-generated images using the Black Forest Labs (BFL) FLUX model family, paired with a full-viewport marketing landing page.

---

## Architecture Diagram

```text
+-------------------------------------------------------------------------------------------------+
|                                           CLIENT BROWSER                                        |
|                                                                                                 |
|   +------------------------------------+             +--------------------------------------+   |
|   |         Landing Page (/)           |             |          Studio App (/studio)        |   |
|   | - Full-viewport looping video      |             | - HTML Canvas (Pointer events)       |   |
|   | - Pill Navbar + Hero copy          |             | - Drag & drop image upload zone      |   |
|   | - 3-Card dashboard preview & Gauge |             | - Prompt panel & style preset cards  |   |
|   | - CTA routing to /studio           |             | - Result preview, download & retry   |   |
|   +-----------------+------------------+             +-------------------+------------------+   |
|                     |                                                    |                      |
+---------------------|----------------------------------------------------|----------------------+
                      | (Route: /studio)                                   |
                      +----------------------------------------------------+
                                           |
                                           | HTTP multipart/form-data
                                           | (/generate, /regenerate)
                                           v
+-------------------------------------------------------------------------------------------------+
|                                          FASTAPI BACKEND                                        |
|                                                                                                 |
|   +-----------------------------------------------------------------------------------------+   |
|   | Middleware: CORS Lockdown (ALLOWED_ORIGINS) + In-memory Sliding Window IP Rate Limiter   |   |
|   +-----------------------------------------------------------------------------------------+   |
|                                              |                                                  |
|                                              v                                                  |
|   +----------------------+        +-----------------------+        +------------------------+   |
|   |  Validation Service  | -----> | Preprocessing Service | -----> |     Prompt Builder     |   |
|   | - Pillow magic bytes |        | - Transparency -> RGB |        | - Structured assembly  |   |
|   | - File size (<= 8MB) |        | - Alignment to 16px   |        | - 7 Style presets      |   |
|   | - 64-4096 px bounds  |        | - Auto-contrast / line|        | - Positive phrasing    |   |
|   | - Prompt sanitization|        |   thickening (opt)    |        | - Strength modulation  |   |
|   +----------------------+        +-----------------------+        +------------------------+   |
|                                                                                |                |
|                                                                                v                |
|                                                                   +-------------------------+   |
|                                                                   |  ImageProvider Protocol |   |
|                                                                   +------------+------------+   |
|                                                                                |                |
+--------------------------------------------------------------------------------|----------------+
                                                                                 |
                                                                                 v
                                                             +---------------------------------------+
                                                             |  Black Forest Labs (BFL) FLUX API     |
                                                             |                                       |
                                                             |  - Mode: reference (flux-2-pro)       |
                                                             |  - Mode: canny (flux-pro-1.0-canny)   |
                                                             |  - Async POST task -> Poll GET        |
                                                             +---------------------------------------+
```

---

## 1. Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm 9+

### Environment Configuration
Copy `.env.example` in both the project root and `backend/`:

```bash
cp .env.example backend/.env
```

#### Environment Variables Reference
| Variable | Default | Purpose |
|---|---|---|
| `FLUX_API_KEY` | `mock_flux_key_for_dev` | Your Black Forest Labs API key (`x-key`). |
| `FLUX_API_BASE_URL` | `https://api.bfl.ai/v1` | Official BFL base URL. |
| `FLUX_MODEL` | `flux-2-pro` | Default generation model. |
| `FLUX_MODE` | `reference` | Conditioning mode: `reference` (FLUX.2) or `canny` (FLUX.1 Canny). |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed CORS origins for the API. |
| `MAX_UPLOAD_MB` | `8` | Maximum allowed sketch file upload size in megabytes. |
| `REQUEST_TIMEOUT_S` | `90` | Hard deadline for generation polling in seconds. |
| `RATE_LIMIT_PER_MINUTE` | `10` | Maximum generation requests per client IP per minute. |
| `ENHANCE_FAINT_SKETCHES`| `false` | Enables auto-contrast and edge enhancement for light pencil drawings. |

---

## 2. Running Both Servers

### Backend (Terminal 1)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Check: `http://127.0.0.1:8000/health`
- OpenAPI Documentation: `http://127.0.0.1:8000/docs`

### Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
- Landing Page: `http://localhost:5173/`
- Studio: `http://localhost:5173/studio`

---

## 3. API Reference

### `GET /health`
Returns system status and timestamp.
```json
{
  "status": "ok",
  "timestamp": "2026-10-11T14:20:00.000Z",
  "version": "1.0.0"
}
```

### `POST /generate` (multipart/form-data)
Submits a sketch and prompt for AI generation.

**Parameters:**
- `sketch` (File, required): Sketch file (PNG, JPG, WEBP). Max 8MB, 64–4096 px.
- `prompt` (String, required): Text description (3–1000 characters).
- `style` (String, optional): One of `photorealistic`, `digital_art`, `watercolor`, `anime`, `3d_render`, `pencil_realistic`, `ui_mockup`. Default: `photorealistic`.
- `strength` (Float, optional): Fidelity slider between `0.0` and `1.0`. Default: `0.7`.
- `seed` (Integer, optional): Random seed for reproducibility.
- `aspect_ratio` (String, optional): `1:1`, `4:3`, `3:4`, `16:9`, `9:16`. Default: `1:1`.

**Success Response (HTTP 200):**
```json
{
  "request_id": "req_84a1e94cf21b",
  "image_url": "https://delivery.bfl.ai/output_sample.png",
  "image_base64": null,
  "mime_type": "image/png",
  "seed": 42,
  "style": "photorealistic",
  "elapsed_ms": 1420
}
```

### `POST /regenerate` (multipart/form-data)
Re-runs generation with a fresh seed if none is explicitly provided.
Same parameters as `/generate`, with optional:
- `previous_request_id` (String, optional): ID of previous generation request.

**Error Response Format (Always User-Safe):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Prompt must be at least 3 characters long."
  }
}
```

---

## 4. How to Switch FLUX Mode (`reference` ↔ `canny`)

The application supports two structural conditioning pipelines via configuration:

1. **`reference` mode (Default)**:
   - Uses **FLUX.2** via the `/v1/flux-2-pro` endpoint.
   - Passes the preprocessed sketch as an `input_image` reference for image-to-image structural guidance.
   - Recommended for fluid drawing, artistic rendering, and general compositions.

2. **`canny` mode**:
   - Uses **FLUX.1 Canny** via the `/v1/flux-pro-1.0-canny` endpoint.
   - Treats the sketch as a strict edge control map (`control_image`).
   - Recommended when exact line preservation and strict geometric wireframes are required.

### To switch:
Open `backend/.env` and update:
```env
FLUX_MODE=canny
```
Restart uvicorn. No code changes are required.

---

## 5. Evaluation Harness & Prompt Tuning

Member 2 (AI & Prompts Engineer) can run the evaluation harness to benchmark presets across 10 standard test sketches.

```powershell
cd backend
# Generate the 10 benchmark sketches (house, face, car, wireframe, cat, mug, mountain, tree, chair, boat)
.\venv\Scripts\python .\eval\generate_sketches.py

# Run evaluation across all styles and fidelity levels (0.35 and 0.75)
.\venv\Scripts\python .\eval\run_eval.py

# Or run quick smoke test on first 2 sketches:
.\venv\Scripts\python .\eval\run_eval.py 2
```
Outputs and [`manifest.json`](file:///C:/Users/Admin/.gemini/antigravity/scratch/sketch-to-image/backend/eval/outputs/manifest.json) are saved to `backend/eval/outputs/`. See [`backend/eval/PROMPT_TUNING.md`](file:///C:/Users/Admin/.gemini/antigravity/scratch/sketch-to-image/backend/eval/PROMPT_TUNING.md) for tuning guidelines.

---

## 6. Test Suite & Verification Matrix

### Run Automated Tests
```powershell
# 1. Backend Pytest Suite (19 tests)
cd backend
.\venv\Scripts\pytest -v

# 2. Frontend Vitest Suite (6 tests)
cd ..\frontend
npm test

# 3. Production Build Verification
npm run build
```

### Full Verification Matrix
| Item | Type | Verification Status |
|---|---|---|
| Sketch Canvas Drawing | Manual | Smooth pointer events, quadratic smoothing, pressure modulation, touch scrolling locked. |
| Image Upload | Automated + Manual | Tested PNG/JPG/WEBP with client & server validation; drag-and-drop functional. |
| Invalid File Type | Automated (`pytest`) | Rejected by Pillow magic number verification (`INVALID_IMAGE`). |
| Oversized File | Automated (`pytest`) | Rejected when exceeding `MAX_UPLOAD_MB` (`FILE_TOO_LARGE`). |
| Empty / Short Prompt | Automated (`pytest`) | Rejected when $< 3$ characters (`VALIDATION_ERROR`). |
| Style Selection | Automated + Manual | All 7 presets tested; UI cards highlight active selection. |
| Successful Generation | Automated (`pytest`) | Mock & live provider return valid `GenerateResponse`. |
| Provider 429 / Rate Limit | Automated (`pytest`) | Mapped to friendly `PROVIDER_BUSY` (HTTP 503). |
| Provider Timeout | Automated (`pytest`) | Mapped to `PROVIDER_TIMEOUT` (HTTP 504) after deadline. |
| Content Moderation | Automated (`pytest`) | Mapped to `MODERATION_REJECTED` (HTTP 400). |
| Request Cancellation | Automated + Manual | `AbortController` cleanly stops in-flight generation. |
| Regenerate Flow | Automated + Manual | Re-sends with new seed while keeping previous preview visible under scrim. |
| Download Result | Manual | Downloads client PNG named `sketch-to-image-{timestamp}.png`. |
| Responsive UI (375/768/1280) | Manual | Navbar collapses to hamburger; hero scales with `clamp()`; Studio two-column desktop / stacked mobile. |
| Secret Leaks | Automated (`grep`) | 0 occurrences of API keys or provider URLs in frontend build bundle. |
| CORS Lockdown | Automated (`pytest`) | Only origins in `ALLOWED_ORIGINS` receive CORS headers. |

---

## 7. Known Limitations

1. **No User Accounts or Persistent History**: Consistent with MVP scope, history is kept in memory during the active session.
2. **Third-Party API Dependency**: BFL FLUX generation requires a funded Black Forest Labs API key (`FLUX_API_KEY`). When run in development without a key, the harness and mock providers allow full interface testing.
3. **Single Image Generation**: The MVP generates one candidate per request rather than a multi-image grid.

---

## 8. Presentation Demo Script (2-Minute Walkthrough)

- **0:00 - 0:25 (Landing Page)**:
  1. Open `http://localhost:5173/`.
  2. Showcase the full-viewport hero section with the looping muted background video, typography (*"Shaping Agencies of tomorrow"* with italic serif accent), and the interactive 3-card dashboard preview with animated Gauges.
  3. Click the hero **"Get Started"** button or navbar **"Get early access"** to transition to `/studio`.

- **0:25 - 0:55 (Sketch & Prompt Creation)**:
  1. In the Studio left column, use the **Pen** tool on the **SketchCanvas** to draw a quick outline (e.g. A sports car or a mountain landscape).
  2. Demonstrate the **Undo** (`Ctrl+Z`), brush size slider, and color palette.
  3. Under the prompt panel, click the example chip: *"A futuristic electric sports car driving on city street at dusk"*.
  4. Notice the live character counter and validation badge.

- **0:55 - 1:25 (Style & Generation)**:
  1. Choose an artistic preset: click **"3D Render"** or **"Photorealistic"**.
  2. Point out the **"Sketch fidelity ↔ Creativity"** slider (set to `0.70`).
  3. Click **"Generate AI Image"**. Show the active progress spinner with the live elapsed-second timer.

- **1:25 - 2:00 (Result, Regenerate & Download)**:
  1. On generation complete, inspect the high-resolution output on the right with its seed and render time badges.
  2. Click the expand icon to inspect in the full-screen lightbox modal.
  3. Click **"Regenerate"** to show in-flight scrim overlay while the previous image stays visible.
  4. Click **"Download PNG"** to save `sketch-to-image-{timestamp}.png` locally.
