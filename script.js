function toggleGroup(el) {
  el.parentElement.classList.toggle('collapsed');
}
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
    tip.addEventListener('click', () => tip.classList.toggle('collapsed'));
  });
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
  for (const path of sections) {
    const res = await fetch(path);
    const html = await res.text();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    main.insertBefore(wrapper, footer);
  }
  initContent();
}

loadContent();
