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
function filterNav(query) {
  const q = query.toLowerCase().trim();
  const links = document.querySelectorAll('.nav-link');
  const groups = document.querySelectorAll('.nav-group');
  if (!q) {
    links.forEach(l => l.classList.remove('search-hidden'));
    groups.forEach(g => { g.style.display = ''; g.classList.remove('collapsed'); });
    return;
  }
  groups.forEach(group => {
    const groupLinks = group.querySelectorAll('.nav-link');
    let anyVisible = false;
    groupLinks.forEach(link => {
      const matches = link.textContent.toLowerCase().includes(q);
      link.classList.toggle('search-hidden', !matches);
      if (matches) anyVisible = true;
    });
    group.style.display = anyVisible ? '' : 'none';
    if (anyVisible) group.classList.remove('collapsed');
  });
}

let allTipsCollapsed = false;

function toggleAllTips() {
  allTipsCollapsed = !allTipsCollapsed;
  document.querySelectorAll('.tip').forEach(tip => {
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
  document.querySelectorAll('.tip').forEach(tip => {
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
