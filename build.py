#!/usr/bin/env python3
import re, os, zipfile, pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

def minify_js(js: str) -> str:
    # Remove /* ... */ and //... comments, then collapse whitespace minimally
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
    js = re.sub(r'//[^\n]*', '', js)
    # Collapse newlines and multiple spaces (careful not to break strings—simple but fine here)
    lines = [l.strip() for l in js.splitlines() if l.strip()]
    js = ' '.join(lines)
    return js

def build():
    DIST.mkdir(exist_ok=True)
    with open(SRC / "index.html", "r", encoding="utf-8") as f:
        html = f.read()
    with open(SRC / "main.js", "r", encoding="utf-8") as f:
        js = f.read()
    js_min = minify_js(js)

    # inline into a fresh dist html based on a minimal template
    dist_html = f"""<!doctype html><html><head><meta charset=utf-8>
<title>Black Cat: 9 Lives</title>
<meta name=viewport content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  html,body{{margin:0;height:100%;background:#070016;overflow:hidden}}
  canvas{{display:block;margin:auto;image-rendering:pixelated;background:#000}}
  #ui{{position:fixed;left:8px;top:8px;color:#fff;font:14px/1.2 monospace;text-shadow:0 0 6px #000}}
</style>
</head><body>
<canvas id=c width=960 height=540></canvas>
<div id=ui></div>
<script>{js_min}</script>
</body></html>"""

    out_html = DIST / "index.html"
    with open(out_html, "w", encoding="utf-8") as f:
        f.write(dist_html)

    # zip it as game.zip
    zip_path = DIST / "game.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(out_html, arcname="index.html")

    print(f"Built: {out_html} ({out_html.stat().st_size} bytes)")
    print(f"Zipped: {zip_path} ({zip_path.stat().st_size} bytes)")

if __name__ == "__main__":
    build()
