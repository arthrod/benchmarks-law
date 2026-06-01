#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools>=4.55", "httpx>=0.27", "loguru>=0.7", "typer>=0.12"]
# ///
"""Outline `b.law` from the Fraunces variable font into a self-contained SVG logo.

Instances the VF at given axes, converts glyph outlines to SVG paths (no font
dependency in the output), and color-splits the accent. Default axes are the
Cicero/benchmarks.law display values, NOT a measured read of the live masthead —
override with flags if you tune the title.
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

# jsDelivr + raw GitHub, google/fonts and the upstream undercasetype repo.
FONT_URLS = [
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf",
    "https://cdn.jsdelivr.net/gh/undercasetype/Fraunces@master/fonts/variable/Fraunces[SOFT,WONK,opsz,wght].ttf",
]

app = typer.Typer(add_completion=False)


def fetch_font() -> TTFont:
    last: Exception | None = None
    for url in FONT_URLS:
        try:
            logger.info("trying {}", url)
            r = httpx.get(url, follow_redirects=True, timeout=60)
            r.raise_for_status()
            if not r.content[:4] in (b"\x00\x01\x00\x00", b"OTTO", b"true", b"ttcf"):
                logger.warning("not a sfnt payload, skipping")
                continue
            logger.success("got font ({} KB) from {}", len(r.content) // 1024, url)
            return TTFont(io.BytesIO(r.content))
        except Exception as e:  # noqa: BLE001 - probe-and-continue is intentional
            logger.warning("failed: {}", e)
            last = e
    raise SystemExit(f"could not fetch Fraunces VF: {last}")


@app.command()
def main(
    text: str = "b.law",
    out: Path = Path("b-law.svg"),
    opsz: float = 144.0,
    wght: float = 600.0,
    soft: float = 0.0,
    wonk: float = 0.0,
    size: float = 64.0,
    tracking_px: float = -1.5,
    pad: float = 10.0,
    ink: str = "#1A1A1A",
    accent: str = "#00274C",
    accent_scope: str = typer.Option("dot", help="'dot' = only the period, 'law' = .law"),
) -> None:
    font = fetch_font()
    instantiateVariableFont(
        font, {"opsz": opsz, "wght": wght, "SOFT": soft, "WONK": wonk}, inplace=True
    )

    upm = font["head"].unitsPerEm
    scale = size / upm
    cmap = font.getBestCmap()
    gset = font.getGlyphSet()

    accent_idx: set[int] = set()
    if "." in text:
        d = text.index(".")
        accent_idx = {d} if accent_scope == "dot" else set(range(d, len(text)))

    cursor = 0.0
    tracking_units = tracking_px / scale
    pieces: list[str] = []
    for i, ch in enumerate(text):
        gname = cmap.get(ord(ch))
        if gname is None:
            raise SystemExit(f"no glyph for {ch!r}")
        pen = SVGPathPen(gset)
        gset[gname].draw(pen)
        dstr = pen.getCommands()
        color = accent if i in accent_idx else ink
        if dstr:
            pieces.append(
                f'<path transform="translate({cursor:.2f} 0)" '
                f'fill="{color}" d="{dstr}"/>'
            )
        cursor += gset[gname].width + tracking_units

    total_w_px = cursor * scale + pad * 2
    asc, desc = font["hhea"].ascent, font["hhea"].descent
    total_h_px = (asc - desc) * scale + pad * 2
    baseline = pad + asc * scale

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {total_w_px:.2f} {total_h_px:.2f}" '
        f'width="{total_w_px:.0f}" height="{total_h_px:.0f}" '
        f'role="img" aria-label="{text}">\n'
        f'  <g transform="matrix({scale:.5f} 0 0 {-scale:.5f} {pad:.2f} {baseline:.2f})">\n'
        f'    ' + "\n    ".join(pieces) + "\n"
        f"  </g>\n</svg>\n"
    )
    out.write_text(svg, encoding="utf-8")
    logger.success("wrote {} ({} bytes)", out, len(svg))


if __name__ == "__main__":
    app()
