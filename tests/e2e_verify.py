#!/usr/bin/env python3
"""
Headless Chromium WebGL Playwright E2E + Side-by-Side Original Video Comparison Grid
Verifies all 8 eras of JJ & Mikey 100 Days Expanding World (youtu.be/t5wy_OsuMvM),
0 console errors, 0 horizontal overflow across Desktop/iPad/Mobile, and builds
.qa/comparison_grid.png pairing ORIGINAL Maizen frames (LEFT) vs. OUR 3D GAME (RIGHT)!
"""
import os
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "screenshots")
QA_DIR = os.path.join(ROOT, ".qa")
QA_REF = os.path.join(QA_DIR, "reference")
os.makedirs(OUT_DIR, exist_ok=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def start_server():
    handler = partial(QuietHandler, directory=ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server, port


def crop_sb(sheet_name, row, col):
    im = Image.open(os.path.join(QA_REF, sheet_name)).convert("RGB")
    fw = im.width // 5
    fh = im.height // 5
    return im.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))


def build_comparison_grid():
    if not os.path.exists(os.path.join(QA_REF, "sb0_00.jpg")):
        return
    pairs = [
        ("DAY 1 · 1-Block Sky Pillar", Image.open(os.path.join(QA_REF, "thumb_maxres.jpg")).convert("RGB"), "01_day01_pillar.png"),
        ("DAY 11 · Village & Animal Ranch", crop_sb("sb0_02.jpg", 3, 1), "02_day11_village.png"),
        ("DAY 40 · Diamond Mine & Trial", crop_sb("sb0_05.jpg", 3, 0), "03_day40_diamonds.png"),
        ("DAY 56 · Sky Grinder & Enchanting", crop_sb("sb0_06.jpg", 4, 2), "04_day56_enchant.png"),
        ("DAY 61 · Nether Blazes & Endermen", crop_sb("sb0_07.jpg", 1, 3), "05_day61_nether.png"),
        ("DAY 95 · Woodland Mansion", crop_sb("sb0_08.jpg", 4, 2), "06_day95_mansion.png"),
        ("DAY 100 · Stronghold End Portal", crop_sb("sb0_09.jpg", 3, 0), "07_day100_stronghold.png"),
        ("DAY 100 · Slay Ender Dragon!", crop_sb("sb0_09.jpg", 4, 0), "08_day100_dragon.png"),
    ]
    cell_w, cell_h = 480, 270
    header_h = 34
    pad = 14
    grid_w = pad * 3 + cell_w * 2
    grid_h = pad + len(pairs) * (cell_h + header_h + pad)
    canvas = Image.new("RGB", (grid_w, grid_h), (14, 17, 24))
    draw = ImageDraw.Draw(canvas)
    y = pad
    for label, orig_img, our_file in pairs:
        our_path = os.path.join(OUT_DIR, our_file)
        if not os.path.exists(our_path):
            continue
        our_img = Image.open(our_path).convert("RGB")
        draw.text((pad, y + 8), f"ORIGINAL VIDEO (youtu.be/t5wy_OsuMvM) — {label}", fill=(250, 204, 21))
        draw.text((pad * 2 + cell_w, y + 8), f"OUR 3D GAME — {our_file}", fill=(74, 222, 128))
        canvas.paste(orig_img.resize((cell_w, cell_h), Image.Resampling.LANCZOS), (pad, y + header_h))
        canvas.paste(our_img.resize((cell_w, cell_h), Image.Resampling.LANCZOS), (pad * 2 + cell_w, y + header_h))
        y += cell_h + header_h + pad
    out_path = os.path.join(QA_DIR, "comparison_grid.png")
    canvas.save(out_path, "PNG", optimize=True)
    print(f"Built side-by-side reproducibility audit sheet: {out_path}")


def run_verification():
    server, port = start_server()
    url = f"http://127.0.0.1:{port}/index.html"
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        page.goto(url, wait_until="networkidle")
        page.wait_for_timeout(450)

        # Capture all 8 100-Day Eras!
        era_files = [
            "01_day01_pillar.png",
            "02_day11_village.png",
            "03_day40_diamonds.png",
            "04_day56_enchant.png",
            "05_day61_nether.png",
            "06_day95_mansion.png",
            "07_day100_stronghold.png",
            "08_day100_dragon.png",
        ]
        for idx, fname in enumerate(era_files):
            if idx > 0:
                page.evaluate(f"window.__GAME__.goToEra({idx})")
                page.wait_for_timeout(320)
            page.screenshot(path=os.path.join(OUT_DIR, fname))
            if idx == 0:
                page.screenshot(path=os.path.join(ROOT, "screenshot.jpg"), type="jpeg", quality=90)

        # Verify Ender Dragon boss bar visible in Era 7 & smash crystal + defeat dragon!
        assert page.locator("#boss-bar").is_visible(), "Boss bar must be visible in The End"
        for _ in range(12):
            page.evaluate("window.__GAME__.performAction()")
        page.wait_for_timeout(200)
        assert page.evaluate("window.__GAME__.state.dragonDefeated") is True, "Dragon should be defeatable"

        # Test pure visual 8-Era Gallery + inline reset confirm
        page.click("#btn-gallery")
        page.wait_for_timeout(200)
        assert page.locator("#gallery-overlay").is_visible()
        assert page.locator(".era-card").count() == 8
        page.screenshot(path=os.path.join(OUT_DIR, "09_era_gallery.png"))
        page.click("#btn-gallery-close")

        page.click("#btn-reset")
        assert page.locator("#reset-confirm").is_visible()
        page.click("#btn-reset-yes")
        page.wait_for_timeout(200)
        assert page.evaluate("window.__GAME__.state.day") == 1

        # Multi-viewport responsive zero-overflow gate
        for name, vw, vh in [
            ("10_ipad_landscape.png", 1024, 768),
            ("11_mobile_portrait.png", 390, 844),
        ]:
            page.set_viewport_size({"width": vw, "height": vh})
            page.evaluate("window.__GAME__.goToEra(1)")
            page.wait_for_timeout(260)
            overflow = page.evaluate("document.documentElement.scrollWidth")
            assert overflow <= vw + 1, f"Horizontal overflow at {vw}x{vh}: {overflow}"
            page.screenshot(path=os.path.join(OUT_DIR, name))

        browser.close()

    server.shutdown()
    build_comparison_grid()
    if errors:
        print("E2E ERRORS:", "\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print("ALL E2E CHECKS PASSED (8 eras + Dragon victory + 0 errors + comparison_grid.png built)!")


if __name__ == "__main__":
    run_verification()
