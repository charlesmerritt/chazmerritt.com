/* Main JS: overlay, routing by page, and data rendering */
const page = document.body.getAttribute('data-page');
const byId = (id) => document.getElementById(id);
const root = document.documentElement;

/* Theme handling */
function getPreferredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/* (Removed) Page fade transitions */

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.48 0l1.79-1.79 1.41 1.41-1.8 1.79-1.4-1.41zM12 4V1h-0v3h0zm0 19v-3h0v3h0zm8-8h3v0h-3v0zM1 12h3v0H1v0zm2.34 6.66l1.41-1.41 1.8 1.79-1.41 1.41-1.8-1.79zm15.32 0l-1.41-1.41-1.79 1.8 1.41 1.41 1.79-1.8zM12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>';
    const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    const label = theme === 'light' ? 'Light' : 'Dark';
    const icon = theme === 'light' ? sun : moon;
    btn.innerHTML = icon + '<span>' + label + '</span>';
  }
}

function initThemeToggle() {
  const initial = getPreferredTheme();
  applyTheme(initial);
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    // Suppress lingering transitions briefly for a snappier switch
    document.body.classList.add('theme-switching');
    applyTheme(next);
    window.setTimeout(() => {
      document.body.classList.remove('theme-switching');
    }, 180);
  });
}

/* Cursor orb tracking */
function initCursorOrb() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  let ticking = false;
  let x = -100, y = -100;
  function update() {
    ticking = false;
    root.style.setProperty('--cursor-x', x + 'px');
    root.style.setProperty('--cursor-y', y + 'px');
  }
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

function updateFooterLinks(links) {
  const footer = document.getElementById('footer-links');
  if (!footer) return;
  const parts = [];
  if (links.email) parts.push(`<a href="mailto:${links.email}">Email</a>`);
  if (links.github) parts.push(`<a href="${links.github}" target="_blank" rel="noopener">GitHub</a>`);
  if (links.linkedin) parts.push(`<a href="${links.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`);
  footer.innerHTML = parts.join(' · ');
}

async function loadJSON(path, fallback = null) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    return fallback;
  }
}

async function loadText(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.statusText);
    return await res.text();
  } catch (e) {
    return null;
  }
}

/* Gallery data */
async function loadGalleryData() {
  return await loadJSON('data/gallery.json', []);
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/* Render CV from data/cv.json */
async function renderCV() {
  const cv = await loadJSON('data/cv.json', null);
  if (!cv) return;

  // Meta
  const meta = document.getElementById('cv-meta');
  if (meta) {
    const links = [];
    if (cv.contact?.email) links.push(`<a href="mailto:${cv.contact.email}">${cv.contact.email}</a>`);
    if (cv.contact?.location) links.push(`<span>${cv.contact.location}</span>`);

    // Try to load a profile avatar from gallery.json (item tagged 'profile' or id 'profile-headshot')
    let avatarHTML = '';
    let avatarData = null;
    try {
      const gallery = await loadGalleryData();
      const avatar = Array.isArray(gallery) ? gallery.find(g => (g.tags && g.tags.includes('profile')) || g.id === 'profile-headshot') : null;
      if (avatar && avatar.src) {
        avatarData = avatar;
        avatarHTML = `<img class="avatar" src="${avatar.src}" alt="${cv.name} avatar" width="96" height="96" data-avatar-id="${avatar.id || ''}">`;
        meta.classList.add('has-avatar');
      }
    } catch(_) {}

    meta.innerHTML = `
      ${avatarHTML ? `<div class="avatar-wrap">${avatarHTML}</div>` : ''}
      <div>
        <div class="name">${cv.name}</div>
        <div class="subtle">${cv.title || ''}</div>
      </div>
      <div class="subtle">${links.join(' ')}</div>
      <div class="cv-actions">
        <a href="assets/pdf/cv.pdf" target="_blank" rel="noopener">CV (PDF)</a>
      </div>
    `;

    // Wire up avatar lightbox behavior
    if (avatarData) {
      const wrap = meta.querySelector('.avatar-wrap');
      if (wrap) {
        // Ensure a single overlay element exists
        let overlay = document.querySelector('.avatar-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'avatar-overlay';
          overlay.innerHTML = `
            <div class="backdrop" data-close="1"></div>
            <button class="overlay-close" type="button" aria-label="Close">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.59 16.89 4.29z"/></svg>
            </button>
            <div class="avatar-modal" role="dialog" aria-modal="true" aria-label="Profile image">
              <img class="avatar-modal-img" src="${avatarData.src}" alt="${cv.name} large avatar">
            </div>
          `;
          document.body.appendChild(overlay);
        }

        const openOverlay = () => {
          // Clear any stale closing state
          overlay.classList.remove('closing');
          overlay.classList.add('open');
          // Prevent background scroll
          document.documentElement.style.overflow = 'hidden';
        };
        const closeOverlay = () => {
          if (!overlay.classList.contains('open')) return;
          // Start closing animation (fade + scale via CSS)
          overlay.classList.add('closing');
          // Wait for opacity transition to finish, then fully close
          const onEnd = (e) => {
            if (e && e.target !== overlay) return;
            overlay.removeEventListener('transitionend', onEnd);
            overlay.classList.remove('open');
            overlay.classList.remove('closing');
            document.documentElement.style.overflow = '';
          };
          overlay.addEventListener('transitionend', onEnd);
        };

        wrap.addEventListener('click', () => openOverlay());
        overlay.addEventListener('click', (e) => {
          const target = e.target;
          if (!(target instanceof Element)) return;
          // Click on backdrop closes
          if (target.matches('.backdrop')) {
            closeOverlay();
          }
        });
        // Close button
        const closeBtn = overlay.querySelector('.overlay-close');
        if (closeBtn) closeBtn.addEventListener('click', () => closeOverlay());
        // Clicking the image navigates to the gallery detail
        const modalImg = overlay.querySelector('.avatar-modal-img');
        if (modalImg) {
          modalImg.addEventListener('click', () => {
            const id = avatarData.id ? encodeURIComponent(avatarData.id) : '';
            const url = id ? `gallery.html?id=${id}` : 'gallery.html';
            window.location.href = url;
          });
        }
        // ESC to close
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeOverlay();
        }, { passive: true });
      }
    }

    updateFooterLinks({
      email: cv.contact?.email,
      github: cv.links?.github,
      linkedin: cv.links?.linkedin
    });
  }

  // Experience
  const expWrap = document.getElementById('cv-experience');
  if (expWrap && Array.isArray(cv.experience)) {
    expWrap.innerHTML = cv.experience.map(item => `
      <article class="item">
        <div class="role">${item.role}</div>
        <div class="where">${item.company} · <span class="when">${item.period}</span></div>
        ${item.location ? `<div class="subtle">${item.location}</div>` : ''}
        ${Array.isArray(item.highlights) ? `<ul class="list">${item.highlights.map(h => `<li>${h}</li>`).join('')}</ul>` : ''}
      </article>
    `).join('');
  }

  // Education
  const eduWrap = document.getElementById('cv-education');
  if (eduWrap && Array.isArray(cv.education)) {
    eduWrap.innerHTML = cv.education.map(item => `
      <article class="item">
        <div class="role">${item.degree}</div>
        <div class="where">${item.school} · <span class="when">${item.period}</span></div>
      </article>
    `).join('');
  }

  // Publications
  const pubList = document.getElementById('cv-publications');
  if (pubList && Array.isArray(cv.publications)) {
    pubList.classList.add('cards');
    pubList.classList.remove('list');
    pubList.innerHTML = cv.publications.map(p => {
      const title = p.link
        ? `<a href="${p.link}" target="_blank" rel="noopener">${p.title}</a>`
        : p.title;
      const meta = p.venue ? `${p.venue}${p.year ? ` (${p.year})` : ''}` : (p.year || '');
      return `
        <li class="card">
          <div class="title">${title}</div>
          ${meta ? `<div class="meta">${meta}</div>` : ''}
        </li>
      `;
    }).join('');
  }

  // Presentations
  const presentations = document.getElementById('cv-presentations');
  if (presentations && Array.isArray(cv.presentations)) {
    presentations.classList.add('cards');
    presentations.classList.remove('list');
    presentations.innerHTML = cv.presentations.map(p => {
      const title = p.link
        ? `<a href="${p.link}" target="_blank" rel="noopener">${p.title}</a>`
        : p.title;
      const meta = p.venue ? `${p.venue}${p.year ? ` (${p.year})` : ''}` : (p.year || '');
      return `
        <li class="card">
          <div class="title">${title}</div>
          ${meta ? `<div class="meta">${meta}</div>` : ''}
        </li>
      `;
    }).join('');
  }

  // Skills
  const skills = document.getElementById('cv-skills');
  if (skills && Array.isArray(cv.skills)) {
    skills.innerHTML = cv.skills.map(s => `<li>${s}</li>`).join('');
  }
}

/* Projects */
async function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  const items = await loadJSON('data/projects.json', []);
  grid.innerHTML = items.map(p => {
    const tags = Array.isArray(p.tech) ? p.tech.slice(0, 5).map(t => `<span class="pill">${t}</span>`).join('') : '';
    const tagRow = tags ? `<div class="tags">${tags}</div>` : '';
    const meta = [p.year].filter(Boolean).join('');
    return `
      <a class="card" href="${p.link}" target="_blank" rel="noopener">
        <div class="title">${p.title}</div>
        <div class="meta">${meta}</div>
        <p class="desc">${p.description || ''}</p>
        ${tagRow}
      </a>
    `;
  }).join('');
}

/* Writings: index from data/writings.json, post bodies from posts/<slug>.md */
function formatPostDate(iso) {
  // Parse as local midnight so the date doesn't shift by a day west of UTC
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function renderWritings() {
  const index = document.getElementById('writings-index');
  const list = document.getElementById('writings-list');
  const article = document.getElementById('post');
  if (!index || !list || !article) return;

  // Swap views before any fetch so the index doesn't flash on post pages
  const slug = getQueryParam('post');
  index.hidden = Boolean(slug);
  article.hidden = !slug;

  const posts = await loadJSON('data/writings.json', []);
  if (slug) {
    await renderPost(article, posts.find(p => p.slug === slug));
    return;
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  list.innerHTML = posts.map(w => {
    const tags = Array.isArray(w.tags) ? w.tags.slice(0, 5).map(t => `<span class="pill">${t}</span>`).join('') : '';
    const tagRow = tags ? `<div class="tags">${tags}</div>` : '';
    return `
      <a class="card" href="/writings.html?post=${encodeURIComponent(w.slug)}">
        <div class="title">${w.title}</div>
        <div class="meta">${formatPostDate(w.date)}</div>
        <p class="desc">${w.summary || ''}</p>
        ${tagRow}
      </a>
    `;
  }).join('');
}

async function renderPost(article, post) {
  const back = '<a class="post-back" href="/writings.html">← All writings</a>';
  const md = post ? await loadText(`posts/${post.slug}.md`) : null;
  if (!md) {
    article.innerHTML = `
      ${back}
      <header class="post-header">
        <h1>Post not found</h1>
        <p class="post-subtitle">That post doesn't exist.</p>
      </header>
    `;
    return;
  }

  document.title = `${post.title} — Chaz Merritt`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', post.summary || '');
  article.innerHTML = `
    ${back}
    <header class="post-header">
      <h1>${post.title}</h1>
      ${post.summary ? `<p class="post-subtitle">${post.summary}</p>` : ''}
      <div class="meta">${formatPostDate(post.date)}</div>
    </header>
    <div class="post-body">${marked.parse(md)}</div>
  `;
}

/* Gallery */
async function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const detail = document.getElementById('gallery-detail');
  if (!grid) return;

  const items = await loadGalleryData();
  if (!Array.isArray(items)) return;

  const currentId = getQueryParam('id');
  const hiddenParam = (getQueryParam('hidden') || '').toLowerCase();
  const showHidden = hiddenParam === 'true' || hiddenParam === '1' || hiddenParam === 'yes';

  function cardHTML(item) {
    const tags = Array.isArray(item.tags) ? item.tags.slice(0, 6).map(t => `<span class="pill">${t}</span>`).join('') : '';
    const tagRow = tags ? `<div class="tags">${tags}</div>` : '';
    return `
      <article class="card gallery-card" data-id="${item.id}">
        <div class="gallery-thumb-wrap">
          <img class="gallery-thumb" src="${item.src}" alt="${item.title || ''}">
        </div>
        <div class="title">${item.title || ''}</div>
        ${item.caption ? `<div class="meta">${item.caption}</div>` : ''}
        ${tagRow}
      </article>
    `;
  }

  function renderGrid() {
    const list = items.filter(it => showHidden || !it.hidden);
    grid.innerHTML = list.map(cardHTML).join('');
    // Click to open lightbox
    grid.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (!id) return;
        const index = list.findIndex(i => i.id === id);
        if (index >= 0) openLightboxAt(index, list);
      });
    });
  }

  function renderDetail(id) {
    if (!detail) return;
    const item = items.find(i => i.id === id);
    if (!item) {
      detail.style.display = 'none';
      detail.innerHTML = '';
      return;
    }
    detail.style.display = '';
    const used = item.usedOn ? `<div class="meta">Used on: <a href="${item.usedOn}">${item.usedOn}</a></div>` : '';
    const tags = Array.isArray(item.tags) ? item.tags.map(t => `<span class="pill">${t}</span>`).join('') : '';
    const tagRow = tags ? `<div class="tags">${tags}</div>` : '';
    detail.innerHTML = `
      <article class="card gallery-detail-card">
        <img class="gallery-detail-img" src="${item.src}" alt="${item.title || ''}">
        <div class="title">${item.title || ''}</div>
        ${item.caption ? `<p class="desc">${item.caption}</p>` : ''}
        ${used}
        ${tagRow}
      </article>
    `;
    // Scroll into view for visibility
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Initial render
  renderGrid();

  // If deep-linked to an id, render detail
  if (currentId) {
    const visible = items.filter(it => showHidden || !it.hidden);
    const idx = visible.findIndex(i => i.id === currentId);
    if (idx >= 0) openLightboxAt(idx, visible);
  }

  // Lightbox overlay (reusable for gallery with arrows)
  function ensureLightbox() {
    let overlay = document.querySelector('.lightbox-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = `
        <div class="backdrop" data-close="1"></div>
        <button class="overlay-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.59 16.89 4.29z"/></svg>
        </button>
        <button class="overlay-arrow left" type="button" aria-label="Previous">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <button class="overlay-arrow right" type="button" aria-label="Next">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
        </button>
        <div class="lightbox-modal" role="dialog" aria-modal="true" aria-label="Gallery image">
          <img class="lightbox-modal-img" alt="">
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function openLightboxAt(startIndex, list) {
    const overlay = ensureLightbox();
    const img = overlay.querySelector('.lightbox-modal-img');
    const closeBtn = overlay.querySelector('.overlay-close');
    const prevBtn = overlay.querySelector('.overlay-arrow.left');
    const nextBtn = overlay.querySelector('.overlay-arrow.right');

    let current = startIndex;

    function updateImage(push = true) {
      const item = list[current];
      if (!item) return;
      if (img) {
        img.src = item.src;
        img.alt = item.title || '';
      }
      // Update URL id param, preserve hidden
      const url = new URL(window.location.href);
      url.searchParams.set('id', item.id);
      if (showHidden) url.searchParams.set('hidden', 'true'); else url.searchParams.delete('hidden');
      if (push) window.history.pushState({}, '', url.toString());
    }

    function open() {
      overlay.classList.remove('closing');
      overlay.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
      updateImage(false);
    }
    function close() {
      if (!overlay.classList.contains('open')) return;
      overlay.classList.add('closing');
      const onEnd = (e) => {
        if (e && e.target !== overlay) return;
        overlay.removeEventListener('transitionend', onEnd);
        overlay.classList.remove('open');
        overlay.classList.remove('closing');
        document.documentElement.style.overflow = '';
        // Remove id from URL but keep hidden param
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        if (showHidden) url.searchParams.set('hidden', 'true'); else url.searchParams.delete('hidden');
        window.history.pushState({}, '', url.toString());
      };
      overlay.addEventListener('transitionend', onEnd);
    }
    function prev() { current = (current - 1 + list.length) % list.length; updateImage(); }
    function next() { current = (current + 1) % list.length; updateImage(); }

    // Wire events
    overlay.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.matches('.backdrop')) close();
    });
    if (closeBtn) closeBtn.onclick = () => close();
    if (prevBtn) prevBtn.onclick = () => prev();
    if (nextBtn) nextBtn.onclick = () => next();
    const keyHandler = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', keyHandler, { passive: true });

    // Cleanup key handler when closing
    const cleanup = () => document.removeEventListener('keydown', keyHandler);
    const onClosed = (e) => {
      if (e && e.target !== overlay) return;
      overlay.removeEventListener('transitionend', onClosed);
      cleanup();
    };
    overlay.addEventListener('transitionend', onClosed);

    open();
  }
}

/* Init per page */
window.addEventListener('DOMContentLoaded', async () => {
  initThemeToggle();
  initCursorOrb();
  if (page === 'home') {
    await renderCV();
  }
  if (page === 'projects') {
    await renderProjects();
    const links = await loadJSON('data/cv.json', null);
    if (links) updateFooterLinks({ email: links.contact?.email, github: links.links?.github, linkedin: links.links?.linkedin });
  }
  if (page === 'writings') {
    await renderWritings();
    const links = await loadJSON('data/cv.json', null);
    if (links) updateFooterLinks({ email: links.contact?.email, github: links.links?.github, linkedin: links.links?.linkedin });
  }
  if (page === 'gallery') {
    await renderGallery();
    const links = await loadJSON('data/cv.json', null);
    if (links) updateFooterLinks({ email: links.contact?.email, github: links.links?.github, linkedin: links.links?.linkedin });
  }
});
