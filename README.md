# Matthew Sullivan — personal site

Source for my portfolio, live at **https://matthewhsullivan.github.io**.

Plain HTML, CSS, and a little JavaScript. No build step.

## How updates go live

Every push to `main` runs `.github/workflows/deploy.yml`, which:

1. Tests the site (`scripts/check_site.py`): links, images, videos, and the résumé exist; #section links resolve; HTML tags are balanced; no duplicate ids or missing alt text; no garbled text; CSS references exist; files fit GitHub's limits. JavaScript is syntax-checked with `node --check`.
2. Publishes the site to GitHub Pages.

If the check fails, nothing is published and the live site stays as it was. The URL never changes.
Each deploy also adds a version code to the CSS/JS links, so visitors always get the latest styling.
You can watch each deploy under the repo's **Actions** tab.

Repo setting this depends on: **Settings → Pages → Source = GitHub Actions**. (With "Deploy from a branch", GitHub would also publish every push without running the tests.)

## Editing

| What | Where |
|---|---|
| Homepage | `index.html` |
| Project write-ups | `work.html` (one `<article class="case">` per project) |
| Full résumé | `experience.html` |
| About | `about.html` |
| Colors, fonts, layout | `assets/css/site.css` (tokens at the top) |
| Photos / videos / résumé PDF | `assets/img`, `assets/video`, `assets/docs` |

To add a project, copy an existing `<article class="case">` block in `work.html`, give it a new `id`, and add a link to the list at the top of the page.

Keep videos under ~10 MB (720×1280 H.264 MP4 works well) so pages stay fast.
