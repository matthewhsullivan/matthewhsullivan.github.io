"""Fail if any page points at a local file or #anchor that doesn't exist.

Run from the repository root: python3 scripts/check_links.py
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted(p for p in ROOT.glob("*.html"))


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for key in ("href", "src", "poster"):
            if a.get(key):
                self.refs.append(a[key])


parsed = {}
for page in PAGES:
    c = Collector()
    c.feed(page.read_text(encoding="utf-8"))
    parsed[page.name] = c

errors = []
for name, c in parsed.items():
    for ref in c.refs:
        u = urlparse(ref)
        if u.scheme in ("http", "https", "mailto", "tel", "data") or ref.startswith("//"):
            continue
        if name == "404.html" and ref.startswith("/"):
            ref = ref.lstrip("/") or "index.html"
            u = urlparse(ref)
        target = name if not u.path else unquote(u.path)
        if not (ROOT / target).is_file():
            errors.append(f"{name}: missing file {target}")
            continue
        if u.fragment and target.endswith(".html") and u.fragment not in parsed[Path(target).name].ids:
            errors.append(f"{name}: {target} has no #{u.fragment}")

if errors:
    print("Broken links found:\n  " + "\n  ".join(errors))
    sys.exit(1)
print(f"OK: checked {sum(len(c.refs) for c in parsed.values())} links across {len(PAGES)} pages")
