#!/usr/bin/env python3
"""md_to_pdf.py <src.md> <out.html> — markdown -> styled print HTML (front-matter stripped).
Then render with cached chromium: chrome --headless=new --print-to-pdf=out.pdf file:///out.html"""
import sys, re, markdown

src, out_html = sys.argv[1], sys.argv[2]
md = open(src, encoding="utf-8").read()
# strip leading YAML front matter (--- ... ---)
if md.startswith("---"):
    m = re.match(r"^---\r?\n.*?\r?\n---\r?\n", md, re.DOTALL)
    if m:
        md = md[m.end():]

body = markdown.markdown(md, extensions=["tables", "fenced_code", "sane_lists", "toc", "attr_list"])

CSS = """
@page { size: A4; margin: 1.8cm 2cm; }
* { box-sizing: border-box; }
body { font-family: 'Source Serif 4', Georgia, serif; font-size: 10pt; line-height: 1.5; color:#1a1a1a;
       -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1 { font-family:'Segoe UI',Arial,sans-serif; font-size:20pt; color:#1A1611; border-bottom:2.5px solid #C44B1A;
     padding-bottom:5pt; margin:0 0 8pt; }
h2 { font-family:'Segoe UI',Arial,sans-serif; font-size:14pt; color:#C44B1A; margin:18pt 0 5pt;
     padding-top:6pt; border-top:1px solid #ddd; page-break-after:avoid; }
h3 { font-family:'Segoe UI',Arial,sans-serif; font-size:11.5pt; color:#1A1611; margin:12pt 0 3pt; page-break-after:avoid; }
h4 { font-family:'Segoe UI',Arial,sans-serif; font-size:10.5pt; color:#48484A; margin:10pt 0 3pt; }
p,li { orphans:2; widows:2; }
strong { color:#1A1611; }
code { font-family:'JetBrains Mono',Consolas,monospace; font-size:8.5pt; background:#f5f0e8; padding:1px 3px;
       border-radius:2px; color:#C44B1A; }
pre { background:#1A1611; color:#f5f0e8; padding:10pt; border-radius:3px; overflow-x:auto; font-size:8pt;
      page-break-inside:avoid; }
pre code { background:none; color:#f5f0e8; padding:0; }
blockquote { border-left:3px solid #F4A623; margin:8pt 0; padding:4pt 12pt; color:#555; background:#fbf9f5; font-size:9.5pt; }
table { border-collapse:collapse; width:100%; margin:8pt 0; font-size:8pt; page-break-inside:avoid; }
th { background:#1A1611; color:#f5f0e8; text-align:left; padding:4pt 6pt; font-family:'Segoe UI',Arial,sans-serif; font-size:7.5pt; }
td { border-bottom:1px solid #ddd; padding:4pt 6pt; vertical-align:top; }
tr:nth-child(even) td { background:#fbf9f5; }
hr { border:none; border-top:2px solid #C44B1A; margin:18pt 0 0; }
a { color:#C44B1A; text-decoration:none; }
img { max-width:100%; }
"""
html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>"""
open(out_html, "w", encoding="utf-8").write(html)
print(out_html)
