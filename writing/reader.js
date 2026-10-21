// Valerie - writing. Reading progress, contents, remembered place, and the 18+ door.
// The remembered place lives only in this browser (localStorage). Nothing is sent anywhere.
(() => {
  const KEY = 'valerie-reading';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (all) => {
    try {
      const keys = Object.keys(all);
      if (keys.length > 80) keys.sort((a, b) => all[a].t - all[b].t).slice(0, keys.length - 80).forEach(k => delete all[k]);
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) { /* private mode or storage off: just don't remember */ }
  };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- article
  const bar = document.querySelector('.progress span');
  const body = document.querySelector('.body');
  if (body) {
    const slug = body.dataset.slug;
    const blocks = [...body.children];
    const progress = () => {
      const r = body.getBoundingClientRect();
      const total = r.height - innerHeight * 0.6;
      return Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
    };

    // contents
    const toc = document.querySelector('.atoc');
    const links = toc ? [...toc.querySelectorAll('a')] : [];
    const heads = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (toc) {
      const det = toc.querySelector('details');
      const wide = matchMedia('(min-width: 1240px)');
      const fit = () => { det.open = wide.matches; };
      fit();
      wide.addEventListener ? wide.addEventListener('change', fit) : wide.addListener(fit);
      links.forEach(a => a.addEventListener('click', () => { if (!wide.matches) det.open = false; }));
    }
    let on = null;
    const markActive = () => {
      if (!heads.length) return;
      const line = innerHeight * 0.3;
      let cur = -1;
      heads.forEach((h, n) => { if (h.getBoundingClientRect().top < line) cur = n; });
      const next = cur >= 0 ? links[cur] : null;
      if (next !== on) {
        if (on) { on.classList.remove('is-on'); on.removeAttribute('aria-current'); }
        if (next) { next.classList.add('is-on'); next.setAttribute('aria-current', 'location'); }
        on = next;
      }
    };

    // remembered place
    let all = load();
    let entry = slug && all[slug];
    let holding = false; // don't overwrite the saved place while we're offering it
    let lastSave = 0;
    const remember = (force) => {
      if (!slug || holding) return;
      const now = Date.now();
      if (!force && now - lastSave < 800) { clearTimeout(remember.t); remember.t = setTimeout(() => remember(true), 900); return; }
      const p = progress();
      if (p < 0.03) return;
      const line = innerHeight * 0.2;
      let i = blocks.findIndex(b => b.getBoundingClientRect().bottom > line);
      if (i < 0) i = blocks.length - 1;
      all = load();
      const prev = all[slug] || {};
      all[slug] = { i, p: Math.round(p * 100), t: now, d: prev.d || p > 0.96 ? 1 : 0 };
      save(all);
      lastSave = now;
    };

    if (entry && !entry.d && entry.i >= 4 && entry.i < blocks.length && !location.hash && scrollY < 200) {
      holding = true;
      const box = document.createElement('div');
      box.className = 'resume';
      box.setAttribute('role', 'status');
      box.innerHTML = `<p>Welcome back. You were <em>${entry.p}%</em> in.</p>
        <button class="btn btn-red" type="button">Continue</button>
        <button class="x" type="button" aria-label="Start from the top">&times;</button>`;
      document.body.appendChild(box);
      requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('is-in')));
      let gone = false;
      const close = () => {
        if (gone) return; gone = true; holding = false;
        box.classList.remove('is-in');
        setTimeout(() => box.remove(), 700);
      };
      box.querySelector('.btn').addEventListener('click', () => {
        const el = blocks[entry.i];
        const top = el.getBoundingClientRect().top + scrollY - innerHeight * 0.18;
        scrollTo({ top, behavior: calm ? 'auto' : 'smooth' });
        close();
      });
      box.querySelector('.x').addEventListener('click', close);
      setTimeout(close, 20000);
      addEventListener('scroll', () => { if (scrollY > 900) close(); }, { passive: true });
    }

    const tick = () => {
      if (bar) bar.style.transform = `scaleX(${progress()})`;
      markActive();
      remember();
    };
    let queued = false;
    addEventListener('scroll', () => {
      if (queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; tick(); });
    }, { passive: true });
    addEventListener('resize', tick);
    addEventListener('pagehide', () => remember(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) remember(true); });
    tick();
  }

  // ---------------------------------------------------------------- index
  const cards = document.querySelectorAll('.card[data-slug]');
  if (cards.length) {
    const all = load();
    let best = null;
    cards.forEach(c => {
      const e = all[c.dataset.slug];
      if (!e) return;
      if (e.d) { c.classList.add('is-read'); return; }
      if (e.p >= 3) {
        c.dataset.p = e.p;
        c.style.setProperty('--p', e.p + '%');
        if (!best || e.t > best.e.t) best = { c, e };
      }
    });
    const cont = document.querySelector('.continue');
    if (cont && best) {
      const title = best.c.querySelector('.card-title').textContent;
      const m = best.c.querySelector('.card-meta').textContent.match(/(\d+) min/);
      const left = m ? Math.max(1, Math.ceil(+m[1] * (1 - best.e.p / 100))) : null;
      cont.href = best.c.getAttribute('href');
      cont.querySelector('.continue-title').textContent = title;
      cont.querySelector('.continue-bar i').style.width = best.e.p + '%';
      cont.querySelector('.continue-meta').textContent = `${best.e.p}% read` + (left ? `, about ${left} min left` : '');
      cont.hidden = false;
      cont.classList.add('is-on');
    }
  }

  // ---------------------------------------------------------------- a different line on every visit
  const wq = document.querySelector('.wquote[data-pool]');
  if (wq) {
    try {
      const pool = JSON.parse(wq.dataset.pool);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      wq.querySelector('p').textContent = pick.q;
      const a = wq.querySelector('figcaption a');
      a.textContent = pick.t; a.href = pick.s + '.html';
    } catch (e) { /* keep the line that's already there */ }
  }

  // ---------------------------------------------------------------- search
  const q = document.getElementById('q');
  const results = document.getElementById('results');
  if (q && results) {
    let data = null, loading = null;
    const fetchData = () => loading || (loading = fetch('search.json').then(r => r.json()).then(d => {
      data = d.map(x => ({ ...x, lt: x.t.toLowerCase(), lb: x.b.toLowerCase() }));
    }).catch(() => { loading = null; }));
    const esc = (t) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fold = (t) => t.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    const mark = (text, terms) => esc(text).replace(new RegExp('(' + terms.map(t => reEsc(esc(t))).join('|') + ')', 'gi'), '<mark>$1</mark>');
    const count = (hay, t) => { let n = 0, k = 0; while ((k = hay.indexOf(t, k)) !== -1 && n < 99) { n++; k += t.length; } return n; };
    const snippet = (x, terms) => {
      if (!x.b) return '';
      let at = -1;
      for (const t of terms) { const k = x.lb.indexOf(t); if (k !== -1 && (at === -1 || k < at)) at = k; }
      if (at === -1) return esc(x.b.slice(0, 160)) + '...';
      let a = Math.max(0, at - 70), z = Math.min(x.b.length, at + 150);
      if (a > 0) a = x.b.indexOf(' ', a) + 1;
      if (z < x.b.length) z = x.b.lastIndexOf(' ', z);
      return (a > 0 ? '...' : '') + mark(x.b.slice(a, z), terms) + (z < x.b.length ? '...' : '');
    };
    const run = () => {
      const raw = q.value.trim();
      const on = raw.length >= 2;
      document.body.classList.toggle('searching', on);
      if (!on) { results.innerHTML = ''; return; }
      if (!data) { fetchData().then(run); results.innerHTML = '<p class="results-count">Looking...</p>'; return; }
      const terms = [...new Set(fold(raw).split(/\s+/).filter(t => t.length > 1 || /\d/.test(t)))];
      if (!terms.length) return;
      const hits = [];
      for (const x of data) {
        let score = 0, total = 0, ok = true;
        for (const t of terms) {
          const inT = x.lt.includes(t), n = count(x.lb, t);
          if (!inT && !n) { ok = false; break; }
          score += (inT ? 40 : 0) + Math.min(n, 15); total += n;
        }
        if (ok) hits.push({ x, score, total });
      }
      hits.sort((a, b) => b.score - a.score);
      if (!hits.length) {
        results.innerHTML = `<p class="results-count">Nothing for "${esc(raw)}".</p><p class="no-hits">Not a word I've used yet. Try a smaller one, or a feeling.</p>`;
        return;
      }
      const words = hits.reduce((n, h) => n + h.total, 0);
      results.innerHTML = `<p class="results-count">${hits.length} ${hits.length === 1 ? 'piece' : 'pieces'}${words ? `, ${words}${words >= 99 ? '+' : ''} mentions` : ''}</p><ol>` +
        hits.slice(0, 40).map(({ x, total }) => x.u
          ? `<li><a class="hit hit-adult" href="${x.u}" data-gate><span class="hit-top"><span class="hit-title">${mark(x.t, terms)}</span><span class="hit-meta"><b>18+</b> on X</span></span></a></li>`
          : `<li><a class="hit" href="${x.s}.html"><span class="hit-top"><span class="hit-title">${mark(x.t, terms)}</span><span class="hit-meta"><b>${esc(x.x)}</b>, ${x.m} min${total ? `, ${total}${total >= 99 ? '+' : ''}&times;` : ''}</span></span><span class="hit-snip">${snippet(x, terms)}</span></a></li>`
        ).join('') + '</ol>';
    };
    let timer;
    q.addEventListener('focus', fetchData, { once: true });
    q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 120); });
    q.addEventListener('keydown', e => { if (e.key === 'Escape') { q.value = ''; run(); q.blur(); } });
    addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== q && !/input|textarea/i.test(document.activeElement.tagName)) {
        e.preventDefault(); q.focus(); q.select();
      }
    });
    if (q.value) run(); // back button restores the field
  }

  // ---------------------------------------------------------------- 18+ door
  const gate = document.getElementById('gate');
  if (gate) {
    const go = document.getElementById('gate-go');
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('[data-gate]');
      if (!a || typeof gate.showModal !== 'function') return; // very old browsers just follow the link
      e.preventDefault();
      go.href = a.href;
      gate.showModal();
    });
    go.addEventListener('click', () => gate.close());
    gate.addEventListener('click', e => { if (e.target === gate) gate.close(); });
  }
})();
