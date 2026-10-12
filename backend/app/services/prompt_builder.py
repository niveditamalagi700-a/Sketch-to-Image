import re
from typing import Dict, NamedTuple, Optional
from app.schemas import StylePreset


class StyleConfig(NamedTuple):
    style_clause: str
    quality_clause: str


STYLE_PRESETS: Dict[StylePreset, StyleConfig] = {
    StylePreset.PHOTOREALISTIC: StyleConfig(
        style_clause="Photorealistic photograph, natural lighting, realistic materials and textures, shallow depth of field.",
        quality_clause="Ultra-detailed, 8k resolution, crisp textures, lifelike depth."
    ),
    StylePreset.DIGITAL_ART: StyleConfig(
        style_clause="Polished digital illustration, clean shapes, rich color, detailed shading.",
        quality_clause="Smooth color transitions, masterwork concept art, vibrant and sharp."
    ),
    StylePreset.WATERCOLOR: StyleConfig(
        style_clause="Soft watercolor painting, visible paper texture, flowing pigment, gentle gradients.",
        quality_clause="Delicate brush strokes, authentic wet-on-wet watercolor technique, expressive color bleed."
    ),
    StylePreset.ANIME: StyleConfig(
        style_clause="Clean anime-style illustration, crisp line art, cel shading, vibrant palette.",
        quality_clause="Studio animation production art, vivid coloring, clean lines, expressive detailing."
    ),
    StylePreset.THREE_D_RENDER: StyleConfig(
        style_clause="High-quality 3D render, physically based materials, soft studio lighting.",
        quality_clause="Octane render quality, ray-traced reflections, ambient occlusion, immaculate finish."
    ),
    StylePreset.PENCIL_REALISTIC: StyleConfig(
        style_clause="Detailed graphite pencil drawing, fine hatching, realistic tonal range.",
        quality_clause="Rich graphite gradients, precise cross-hatching, authentic textured sketchbook paper."
    ),
    StylePreset.UI_MOCKUP: StyleConfig(
        style_clause="Clean modern UI design mockup, consistent spacing and alignment, flat vector style.",
        quality_clause="Pixel-perfect layout, modern typography, crisp interfaces, Figma design fidelity."
    ),
}

BASE_STRUCTURE_CLAUSE = (
    "Follow the composition, proportions and main shapes of the provided sketch.\n"
    "Do not add text, watermarks or signatures unless the user asked for them."
)


def sanitize_prompt(user_prompt: str) -> str:
    """
    Sanitizes user input:
    - Strips non-printable and control characters
    - Collapses multiple whitespace characters
    - Caps prompt length to 1000 characters
    """
    if not user_prompt:
        return ""
    # Remove control characters (\x00-\x1f and \x7f-\x9f)
    cleaned = re.sub(r"[\x00-\x1f\x7f-\x9f]", " ", user_prompt)
    # Collapse multiple spaces into single space
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:1000]


def get_structure_clause_for_strength(strength: Optional[float] = None) -> str:
    """
    Refines structural guidance based on the 'Sketch fidelity ↔ Creativity' strength slider:
    - Low strength (<= 0.4): High sketch fidelity / strict geometry adherence.
    - Balanced (0.4 - 0.75): Balanced interpretation following contours and shapes.
    - High strength (> 0.75): Creative freedom with structural alignment.
    """
    if strength is not None:
        if strength <= 0.4:
            return (
                "Strictly adhere to the exact line contours, silhouettes, and spatial layout of the provided sketch.\n"
                "Do not add text, watermarks or signatures unless the user asked for them."
            )
        elif strength > 0.75:
            return (
                "Use the sketch as a conceptual layout while using creative freedom for lighting, depth, and atmospheric detailing.\n"
                "Do not add text, watermarks or signatures unless the user asked for them."
            )

    return BASE_STRUCTURE_CLAUSE


def build_final_prompt(
    user_prompt: str,
    style: StylePreset,
    strength: Optional[float] = None
) -> str:
    """
    Assembles the structured model prompt per the MVP spec:
    {user_prompt}.
    {style_clause}
    Follow the composition, proportions and main shapes of the provided sketch.
    Do not add text, watermarks or signatures unless the user asked for them.
    {quality_clause}
    """
    clean_user = sanitize_prompt(user_prompt)
    if clean_user and not clean_user.endswith((".", "!", "?")):
        clean_user += "."

    preset = STYLE_PRESETS.get(style, STYLE_PRESETS[StylePreset.PHOTOREALISTIC])
    structure_clause = get_structure_clause_for_strength(strength)

    prompt_blocks = [
        clean_user,
        preset.style_clause,
        structure_clause,
        preset.quality_clause,
    ]

    return "\n".join(block for block in prompt_blocks if block)
