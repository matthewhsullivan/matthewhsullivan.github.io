# Matthew Sullivan — personal site

Source for my portfolio, live at **https://msullivanh06-byte.github.io**.

Plain HTML and CSS, no build step. GitHub Pages serves the `main` branch as is.

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
