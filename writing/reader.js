// Reading progress on articles, and the 18+ door on the index.
(() => {
  const bar = document.querySelector('.progress span');
  const body = document.querySelector('.body');
  if (bar && body) {
    const update = () => {
      const r = body.getBoundingClientRect();
      const total = r.height - innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      bar.style.transform = `scaleX(${p})`;
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  const gate = document.getElementById('gate');
  if (gate) {
    const go = document.getElementById('gate-go');
    document.querySelectorAll('[data-gate]').forEach(a => a.addEventListener('click', e => {
      if (typeof gate.showModal !== 'function') return; // very old browsers just follow the link
      e.preventDefault();
      go.href = a.href;
      gate.showModal();
    }));
    go.addEventListener('click', () => gate.close());
    gate.addEventListener('click', e => { if (e.target === gate) gate.close(); });
  }
})();
