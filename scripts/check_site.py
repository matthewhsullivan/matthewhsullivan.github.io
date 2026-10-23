"""Pre-deploy test for the portfolio. Exits non-zero (blocking the deploy) if anything is wrong.

Checks, for every top-level .html page:
  - local links, images, videos, and the résumé point at files that exist
  - #anchors point at an id that exists on the target page
  - HTML tags are properly opened and closed, and no id is used twice on a page
  - every <img> has alt text, and every page has a <title> and lang attribute
  - no garbled HTML entities (e.g. "rsquo;" missing its "&")
Also checks:
  - files referenced by url(...) in the CSS exist
  - no published file is too large for GitHub Pages

Run from the repository root:  python3 scripts/check_site.py
JavaScript syntax is checked separately in the workflow with `node --check`.
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted(ROOT.glob("*.html"))
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
# Elements whose end tag HTML lets you omit; skip them in the open/close check.
OPTIONAL_END = {"p", "li", "dt", "dd", "option", "tr", "td", "th", "thead", "tbody", "html", "head", "body"}
MAX_FILE_MB = 50
ENTITY_NAMES = "rsquo|lsquo|ldquo|rdquo|middot|ndash|mdash|eacute|amp|rarr|larr|copy|nbsp|hellip"
GARBLED = re.compile(rf"(?<![&#\w])({ENTITY_NAMES});")


class Page(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name, self.refs, self.ids, self.stack, self.errors = name, [], [], [], []
        self.has_title = self.has_lang = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html" and a.get("lang"):
            self.has_lang = True
        if tag == "title":
            self.has_title = True
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "img" and not (a.get("alt") or "").strip() and a.get("id") != "lb-img":
            self.errors.append(f"<img src={a.get('src')}> has no alt text (line {self.getpos()[0]})")
        for key in ("href", "src", "poster"):
            if a.get(key):
                self.refs.append(a[key])
        if tag not in VOID and tag not in OPTIONAL_END:
            self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and tag not in OPTIONAL_END and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag in VOID or tag in OPTIONAL_END:
            return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
        else:
            expected = self.stack[-1] if self.stack else None
            self.errors.append(
                f"</{tag}> on line {self.getpos()[0]} doesn't match "
                + (f"<{expected[0]}> opened on line {expected[1]}" if expected else "anything open")
            )


def main():
    errors, pages = [], {}
    for path in PAGES:
        src = path.read_text(encoding="utf-8")
        p = Page(path.name)
        p.feed(src)
        p.close()
        pages[path.name] = p
        errors += [f"{path.name}: {e}" for e in p.errors]
        errors += [f"{path.name}: <{t}> opened on line {ln} is never closed" for t, ln in p.stack]
        dupes = sorted({i for i in p.ids if p.ids.count(i) > 1})
        if dupes:
            errors.append(f"{path.name}: id used more than once: {', '.join(dupes)}")
        if not p.has_title:
            errors.append(f"{path.name}: missing <title>")
        if not p.has_lang:
            errors.append(f"{path.name}: <html> is missing a lang attribute")
        for n, line in enumerate(src.splitlines(), 1):
            for m in GARBLED.finditer(line):
                errors.append(f"{path.name}: garbled text '{m.group(0)}' on line {n} (missing '&')")

    links = 0
    for name, p in pages.items():
        for ref in p.refs:
            u = urlparse(ref)
            if u.scheme in ("http", "https", "mailto", "tel", "data") or ref.startswith("//"):
                continue
            links += 1
            path = unquote(u.path)
            if path.startswith("/"):  # root-relative (used by 404.html)
                path = path.lstrip("/") or "index.html"
            target = path or name
            if not (ROOT / target).is_file():
                errors.append(f"{name}: links to missing file '{target}'")
                continue
            if u.fragment and target.endswith(".html") and target in pages and u.fragment not in pages[target].ids:
                errors.append(f"{name}: '{ref}' points to a section that doesn't exist")

    for css in ROOT.glob("assets/**/*.css"):
        for ref in re.findall(r"url\(\s*['\"]?([^'\")]+)", css.read_text(encoding="utf-8")):
            if ref.startswith(("data:", "http:", "https:", "//", "#")):
                continue
            if not (css.parent / ref).resolve().is_file():
                errors.append(f"{css.relative_to(ROOT)}: url({ref}) points to a missing file")

    for f in list(ROOT.glob("*.html")) + [p for p in (ROOT / "assets").rglob("*") if p.is_file()]:
        mb = f.stat().st_size / 1_048_576
        if mb > MAX_FILE_MB:
            errors.append(f"{f.relative_to(ROOT)} is {mb:.0f} MB; keep files under {MAX_FILE_MB} MB")

    if errors:
        print(f"Site check FAILED ({len(errors)} problem{'s' if len(errors) != 1 else ''}):")
        for e in errors:
            print("  - " + e)
        sys.exit(1)
    print(f"Site check passed: {len(pages)} pages, {links} local links and files, HTML structure, text, CSS, file sizes.")


if __name__ == "__main__":
    main()
