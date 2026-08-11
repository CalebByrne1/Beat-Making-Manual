# The Beat Making Manual
### By Byrne Beats

A free, no-fluff reference for FL Studio producers. Covers drum routing, 808 mixing, music theory, sound design, mixing, mastering, scales, chord progressions, plugin recommendations, and more — built from real production sessions, not textbooks.

Free to read and share. Please credit Byrne Beats if you reference or distribute this material.

## Running it locally

The manual loads its chapters from `sections/` with `fetch()`, which browsers block on `file://` URLs. **Double-clicking `index.html` will show an empty page.** Serve it over HTTP instead:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Any static server works (`npx serve`, VS Code Live Server, etc.), and hosting on GitHub Pages needs no extra setup.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Page shell, sidebar navigation, header, footer |
| `script.js` | Loads chapters, sidebar search, scrollspy, collapsible tips |
| `styles.css` | All styling, including print/PDF styles |
| `sections/*.html` | The chapters themselves, loaded in the order listed in `script.js` |

### Adding a section

1. Add the content to the relevant file in `sections/`, opening with:
   ```html
   <span class="section-anchor" id="your-id"></span>
   <div class="section-label">Your Section Name</div>
   ```
2. Add a matching `<a class="nav-link" href="#your-id">` to the correct nav group in `index.html`.

Keep the sidebar link order and the on-page order the same, and keep the nav label and the `.section-label` text identical — the two are meant to match.
