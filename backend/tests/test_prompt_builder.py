import pytest
from app.schemas import StylePreset
from app.services.prompt_builder import (
    STYLE_PRESETS,
    build_final_prompt,
    sanitize_prompt,
    get_structure_clause_for_strength,
)


def test_each_style_produces_expected_clauses():
    """Verify that every supported StylePreset produces its designated style and quality clauses."""
    user_prompt = "A majestic deer standing in morning mist"

    for style_preset, config in STYLE_PRESETS.items():
        result = build_final_prompt(user_prompt, style_preset)

        # User prompt included
        assert user_prompt in result

        # Style clause included
        assert config.style_clause in result

        # Quality clause included
        assert config.quality_clause in result

        # Core structure directive included
        assert "Follow the composition, proportions and main shapes" in result


def test_overlong_prompt_truncation():
    """Verify that an overlong user prompt gets capped at 1000 characters."""
    giant_prompt = "A" * 2000
    cleaned = sanitize_prompt(giant_prompt)
    assert len(cleaned) == 1000

    built = build_final_prompt(giant_prompt, StylePreset.PHOTOREALISTIC)
    # The user portion inside built prompt should be at most 1001 chars (with trailing period)
    assert ("A" * 1000 + ".") in built
    assert ("A" * 1001) not in built


def test_odd_and_control_characters_stripped():
    """Verify that control characters, null bytes, and non-printable characters are stripped."""
    weird_input = "Stunning landscape\x00\x08\x0b\x1f with glowing\x7f\x80 crystal trees\r\n\t"
    cleaned = sanitize_prompt(weird_input)

    assert "\x00" not in cleaned
    assert "\x08" not in cleaned
    assert "\x0b" not in cleaned
    assert "\x1f" not in cleaned
    assert "\x7f" not in cleaned
    assert "Stunning landscape with glowing crystal trees" in cleaned


def test_fidelity_strength_modulation():
    """Verify that the fidelity strength slider appropriately adjusts structural instructions."""
    prompt = "A cozy wooden cabin"

    # Low strength (strict fidelity)
    low_str_result = build_final_prompt(prompt, StylePreset.WATERCOLOR, strength=0.3)
    assert "Strictly adhere to the exact line contours" in low_str_result

    # Default / balanced strength (0.7)
    balanced_result = build_final_prompt(prompt, StylePreset.WATERCOLOR, strength=0.7)
    assert "Follow the composition, proportions and main shapes" in balanced_result

    # High strength (creative freedom)
    high_str_result = build_final_prompt(prompt, StylePreset.WATERCOLOR, strength=0.85)
    assert "creative freedom" in high_str_result


def test_all_presets_exist():
    """Verify all 7 presets in the MVP spec exist in STYLE_PRESETS."""
    expected = {
        "photorealistic",
        "digital_art",
        "watercolor",
        "anime",
        "3d_render",
        "pencil_realistic",
        "ui_mockup",
    }
    actual = {preset.value for preset in STYLE_PRESETS.keys()}
    assert expected == actual
