/* Jos.IA · Marketing · interacciones básicas (sin dependencias) */
(() => {
  'use strict';
  window.__josia = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Header: fondo y sombra al hacer scroll ---------- */
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Menú móvil ---------- */
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const desktop = window.matchMedia('(min-width: 1101px)');

  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (header) header.classList.toggle('is-scrolled', open || window.scrollY > 8);
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) setOpen(false);
    });
    desktop.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  const items = document.querySelectorAll('[data-reveal]');
  if (items.length) {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      items.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Cifras: contador al entrar en pantalla ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduceMotion.matches && 'IntersectionObserver' in window) {
    const format = (el, value) => {
      el.textContent = (el.dataset.prefix || '') + Math.round(value) + (el.dataset.suffix || '');
    };
    const run = (el) => {
      const target = Number(el.dataset.count);
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        format(el, target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => { format(el, 0); co.observe(el); });
  }

  /* ---------- Gráfica de audiencia ----------
     El HTML trae la serie de 6 meses ya pintada (sin JS se ve igual). Con JS, el selector
     cambia el periodo y se redibuja el mismo SVG (viewBox 201 x 90, eje Y de 0 a 30K).
     Cada serie guarda sus valores en miles y qué puntos llevan etiqueta en el eje X. */
  const chart = document.querySelector('[data-chart]');
  const select = chart && chart.querySelector('[data-range]');
  const plot = chart && chart.querySelector('[data-plot]');
  const xaxis = chart && chart.querySelector('[data-xaxis]');
  const summary = chart && chart.querySelector('[data-summary]');

  if (chart && select && plot && xaxis) {
    const W = 201;
    const H = 90;
    const MAX = 30;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const SERIES = {
      3: {
        values: [19.8, 22.4, 24.3, 26.4, 28.6],
        labels: { 0: 'Abr', 2: 'May', 4: 'Jun' },
        text: 'En los últimos 3 meses la audiencia pasó de 19.8 mil a 28.6 mil personas.'
      },
      6: {
        values: [3.4, 6.4, 9.1, 11.7, 14.3, 17.2, 19.8, 22.4, 24.3, 26.4, 28.6],
        labels: { 0: 'Ene', 2: 'Feb', 4: 'Mar', 6: 'Abr', 8: 'May', 10: 'Jun' },
        text: 'En los últimos 6 meses la audiencia pasó de 3.4 mil a 28.6 mil personas.'
      },
      12: {
        values: [0.9, 1.3, 1.7, 2.2, 2.7, 3.0, 3.4, 9.1, 14.3, 19.8, 24.3, 28.6],
        labels: { 1: 'Ago', 3: 'Oct', 5: 'Dic', 7: 'Feb', 9: 'Abr', 11: 'Jun' },
        text: 'En los últimos 12 meses la audiencia pasó de 0.9 mil a 28.6 mil personas.'
      }
    };

    const el = (name, attrs) => {
      const node = document.createElementNS(SVG_NS, name);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      return node;
    };
    const fmt = (n) => (Math.round(n * 10) / 10).toString();

    /* Curva suave (Catmull-Rom convertida a Bézier) que pasa por todos los puntos */
    const smooth = (pts) => {
      let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
      }
      return d;
    };

    const render = (key) => {
      const { values, labels, text } = SERIES[key];
      const n = values.length;
      const pts = values.map((v, i) => [(i / (n - 1)) * W, H - (v / MAX) * H]);
      const line = smooth(pts);
      const labelled = Object.keys(labels).map(Number);

      plot.querySelectorAll('.plot__grid, .plot__area, .plot__line, .plot__dots').forEach((node) => node.remove());

      const grid = el('g', { class: 'plot__grid' });
      const gridPath = [0, 30, 60, 90].map((y) => `M0 ${y}H${W}`).join('')
        + labelled.map((i) => { const x = fmt((i / (n - 1)) * W); return `M${x} 0V${H}`; }).join('');
      grid.appendChild(el('path', { d: gridPath }));

      const area = el('path', { class: 'plot__area', d: `${line}L${W} ${H}L0 ${H}Z` });
      const stroke = el('path', { class: 'plot__line', pathLength: '1', d: line });
      const dots = el('g', { class: 'plot__dots' });
      pts.forEach(([x, y]) => dots.appendChild(el('circle', { cx: fmt(x), cy: fmt(y), r: '2.1' })));
      plot.append(grid, area, stroke, dots);

      xaxis.replaceChildren();
      labelled.forEach((i) => {
        const li = document.createElement('li');
        li.style.setProperty('--p', `${(i / (n - 1)) * 100}%`);
        li.textContent = labels[i];
        xaxis.appendChild(li);
      });

      if (summary) summary.textContent = text;
    };

    select.addEventListener('change', () => {
      const key = select.value;
      if (reduceMotion.matches) { render(key); return; }
      chart.classList.add('is-swapping');
      window.setTimeout(() => {
        render(key);
        chart.classList.remove('is-swapping');
      }, 200);
    });

    render(select.value);
  }
})();
