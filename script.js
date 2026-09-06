function toggleGroup(el) {
  const collapsed = el.parentElement.classList.toggle('collapsed');
  el.setAttribute('aria-expanded', String(!collapsed));
}

// Keyboard support for the nav group headers (they are divs, not buttons)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const toggle = e.target && e.target.closest && e.target.closest('.nav-group-toggle');
  if (!toggle) return;
  e.preventDefault();
  toggleGroup(toggle);
});
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}
/* ── SEARCH ──
   The sidebar search matches section titles AND the text of every tip inside
   each section, so a term like "sidechain" or "-14 LUFS" finds the sections
   that actually discuss it rather than only the ones with it in the heading.
   The index is built once, after the chapters load. */
let searchIndex = null;

function buildSearchIndex() {
  const index = new Map();
  document.querySelectorAll('.section-anchor').forEach(anchor => {
    const blocks = [];
    const tips = [];
    // Walk forward from the anchor collecting everything until the next section starts.
    for (let el = anchor.nextElementSibling; el; el = el.nextElementSibling) {
      if (el.classList && el.classList.contains('section-anchor')) break;
      blocks.push(el.textContent);
      // .seq-text is a numbered step; it counts as a tip for search and for the match badge.
      el.querySelectorAll('.tip-text, .seq-text').forEach(t => tips.push(t.textContent.toLowerCase()));
    }
    index.set(anchor.id, {
      text: blocks.join(' ').toLowerCase().replace(/\s+/g, ' '),
      tips: tips
    });
  });
  searchIndex = index;
}

function setNavCount(link, n) {
  let badge = link.querySelector('.nav-count');
  if (n === null) {
    if (badge) badge.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'nav-count';
    link.appendChild(badge);
  }
  badge.textContent = n;
}

function filterNav(query) {
  const q = query.toLowerCase().trim();
  const links = document.querySelectorAll('.nav-link');
  const groups = document.querySelectorAll('.nav-group');
  const empty = document.getElementById('nav-empty');

  if (!q) {
    links.forEach(l => { l.classList.remove('search-hidden'); setNavCount(l, null); });
    groups.forEach(g => { g.style.display = ''; g.classList.remove('collapsed'); });
    if (empty) empty.style.display = 'none';
    return;
  }

  let anyResults = false;
  groups.forEach(group => {
    let anyVisible = false;
    group.querySelectorAll('.nav-link').forEach(link => {
      const id = (link.getAttribute('href') || '').slice(1);
      const entry = searchIndex && searchIndex.get(id);

      const titleMatch = link.textContent.toLowerCase().includes(q);
      const tipHits = entry ? entry.tips.filter(t => t.includes(q)).length : 0;
      const bodyMatch = entry ? entry.text.includes(q) : false;
      const matches = titleMatch || bodyMatch;

      link.classList.toggle('search-hidden', !matches);
      // Show how many tips inside the section mention the term.
      setNavCount(link, matches && tipHits > 0 ? tipHits : null);
      if (matches) { anyVisible = true; anyResults = true; }
    });
    group.style.display = anyVisible ? '' : 'none';
    if (anyVisible) group.classList.remove('collapsed');
  });

  if (empty) empty.style.display = anyResults ? 'none' : 'block';
}

// Escape clears the search box.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const box = document.getElementById('nav-search');
  if (!box || document.activeElement !== box || !box.value) return;
  box.value = '';
  filterNav('');
});

let allTipsCollapsed = false;

function toggleAllTips() {
  allTipsCollapsed = !allTipsCollapsed;
  document.querySelectorAll('.tip, .seq-item').forEach(tip => {
    tip.classList.toggle('collapsed', allTipsCollapsed);
  });
  const btn = document.getElementById('tips-toggle');
  if (btn) btn.textContent = allTipsCollapsed ? 'EXPAND ALL TIPS' : 'COLLAPSE ALL TIPS';
}

const backBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backBtn.classList.toggle('visible', window.scrollY > 600);
}, { passive: true });

function initContent() {
  buildSearchIndex();
  // If someone typed while the chapters were still loading, re-run with the index.
  const box = document.getElementById('nav-search');
  if (box && box.value.trim()) filterNav(box.value);

  const anchors = document.querySelectorAll('.section-anchor');
  const navLinks = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-10% 0px -85% 0px' });
  anchors.forEach(a => observer.observe(a));
  navLinks.forEach(link => {
    link.addEventListener('click', () => { closeSidebar(); });
  });

  // Collapsible tips — click to toggle between expanded and condensed
  document.querySelectorAll('.tip, .seq-item').forEach(tip => {
    tip.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      // Don't collapse the tip the user is trying to select text in
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      tip.classList.toggle('collapsed');
    });
  });
}

function showLoadError(message) {
  const box = document.getElementById('load-error');
  if (!box) return;
  box.textContent = '⚠ ' + message;
  box.style.display = 'block';
}

async function loadContent() {
  const sections = [
    'sections/start-here.html',
    'sections/production.html',
    'sections/arrangement.html',
    'sections/mixing.html',
    'sections/vocals.html',
    'sections/exporting.html',
    'sections/theory.html',
    'sections/plugins.html',
    'sections/reference.html',
  ];
  const main = document.getElementById('main');
  const footer = main.querySelector('footer');

  // Fetch in parallel, then insert in order so the manual always reads top to bottom.
  const results = await Promise.all(sections.map(async (path) => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return { path, html: await res.text() };
    } catch (err) {
      console.error('Could not load ' + path, err);
      return { path, html: null };
    }
  }));

  const failed = [];
  for (const { path, html } of results) {
    if (html === null) { failed.push(path); continue; }
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    main.insertBefore(wrapper, footer);
  }

  // A file:// page can't fetch its own chapters — that failure needs its own explanation.
  if (failed.length === sections.length) {
    showLoadError(location.protocol === 'file:'
      ? 'This page has to be served over http:// — opening index.html straight from disk blocks it from loading its own chapters. Run a local server (for example: python -m http.server) and open the address it prints.'
      : 'None of the chapters could be loaded. Check that the sections/ folder is present alongside index.html.');
  } else if (failed.length) {
    showLoadError('Some chapters could not be loaded: ' + failed.join(', '));
  }

  initContent();
}

loadContent();
