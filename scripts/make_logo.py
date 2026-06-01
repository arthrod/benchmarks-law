#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools>=4.55", "httpx>=0.27", "loguru>=0.7", "typer>=0.12"]
# ///
"""Outline `b.law` from the Fraunces variable fonts into a self-contained SVG logo.

Renders the upright `b` from the roman VF and the `.law` accent from the italic
VF (matching the masthead's `.law { font-style: italic; font-weight: 400 }`),
converts glyph outlines to SVG paths (no font dependency in the output), and
color-splits the accent. Default axes are the benchmarks.law display values, NOT
a measured read of the live masthead — override with flags if you tune the title.
"""

from __future__ import annotations

import io
from pathlib import Path

import httpx
import typer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from loguru import logger

ROMAN_URLS = [
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf",
    "https://cdn.jsdelivr.net/gh/undercasetype/Fraunces@master/fonts/variable/Fraunces[SOFT,WONK,opsz,wght].ttf",
]
ITALIC_URLS = [
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/fraunces/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf",
    "https://cdn.jsdelivr.net/gh/undercasetype/Fraunces@master/fonts/variable/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf",
]

app = typer.Typer(add_completion=False)


def fetch_font(italic: bool = False) -> TTFont:
    urls = ITALIC_URLS if italic else ROMAN_URLS
    last: Exception | None = None
    for url in urls:
        try:
            logger.info("trying {}", url)
            r = httpx.get(url, follow_redirects=True, timeout=60)
            r.raise_for_status()
            if r.content[:4] not in (b"\x00\x01\x00\x00", b"OTTO", b"true", b"ttcf"):
                logger.warning("not a sfnt payload, skipping")
                continue
            logger.success(
                "got {} font ({} KB)", "italic" if italic else "roman", len(r.content) // 1024
            )
            return TTFont(io.BytesIO(r.content))
        except Exception as e:  # noqa: BLE001 - probe-and-continue is intentional
            logger.warning("failed: {}", e)
            last = e
    raise SystemExit(f"could not fetch Fraunces {'italic' if italic else 'roman'} VF: {last}")


def instance(font: TTFont, opsz: float, wght: float, soft: float, wonk: float) -> TTFont:
    instantiateVariableFont(
        font, {"opsz": opsz, "wght": wght, "SOFT": soft, "WONK": wonk}, inplace=True
    )
    return font


@app.command()
def main(
    text: str = "b.law",
    out: Path = Path("public/b-law.svg"),
    opsz: float = 144.0,
    wght_roman: float = 600.0,
    wght_italic: float = 400.0,
    soft: float = 0.0,
    wonk: float = 0.0,
    size: float = 64.0,
    tracking_px: float = -1.5,
    pad: float = 10.0,
    ink: str = "#15120C",
    accent: str = "#00274C",
    accent_scope: str = typer.Option("law", help="'dot' = only the period, 'law' = .law"),
) -> None:
    roman = instance(fetch_font(False), opsz, wght_roman, soft, wonk)
    italic = instance(fetch_font(True), opsz, wght_italic, soft, wonk)

    upm = roman["head"].unitsPerEm
    scale = size / upm
    tracking_units = tracking_px / scale

    # Index range that gets the italic accent treatment.
    accent_idx: set[int] = set()
    if "." in text:
        d = text.index(".")
        accent_idx = {d} if accent_scope == "dot" else set(range(d, len(text)))

    roman_cmap, roman_gset = roman.getBestCmap(), roman.getGlyphSet()
    ital_cmap, ital_gset = italic.getBestCmap(), italic.getGlyphSet()

    cursor = 0.0
    pieces: list[str] = []
    for i, ch in enumerate(text):
        is_accent = i in accent_idx
        cmap, gset = (ital_cmap, ital_gset) if is_accent else (roman_cmap, roman_gset)
        gname = cmap.get(ord(ch))
        if gname is None:
            raise SystemExit(f"no glyph for {ch!r} in {'italic' if is_accent else 'roman'} font")
        pen = SVGPathPen(gset)
        gset[gname].draw(pen)
        dstr = pen.getCommands()
        color = accent if is_accent else ink
        if dstr:
            pieces.append(
                f'<path transform="translate({cursor:.2f} 0)" fill="{color}" d="{dstr}"/>'
            )
        cursor += gset[gname].width + tracking_units

    total_w_px = cursor * scale + pad * 2
    asc, desc = roman["hhea"].ascent, roman["hhea"].descent
    total_h_px = (asc - desc) * scale + pad * 2
    baseline = pad + asc * scale

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {total_w_px:.2f} {total_h_px:.2f}" '
        f'width="{total_w_px:.0f}" height="{total_h_px:.0f}" '
        f'role="img" aria-label="{text}">\n'
        f'  <g transform="matrix({scale:.5f} 0 0 {-scale:.5f} {pad:.2f} {baseline:.2f})">\n'
        f"    " + "\n    ".join(pieces) + "\n"
        f"  </g>\n</svg>\n"
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg, encoding="utf-8")
    logger.success("wrote {} ({} bytes)", out, len(svg))


if __name__ == "__main__":
    app()
