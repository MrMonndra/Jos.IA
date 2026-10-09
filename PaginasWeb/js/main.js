/* Jos.IA · Páginas Web · interacciones básicas (sin dependencias) */
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

  /* ---------- Métricas: contador al entrar en pantalla ---------- */
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

  /* ---------- Rotador de ejemplos ----------
     Las flechas giran las 6 tarjetas por los huecos del bento: las dos primeras del
     DOM ocupan los huecos grandes y las otras cuatro los pequeños (ver :nth-child en el CSS). */
  const gallery = document.querySelector('[data-gallery]');
  const prev = document.querySelector('[data-pager="prev"]');
  const next = document.querySelector('[data-pager="next"]');

  if (gallery && prev && next) {
    let busy = false;
    const rotate = (dir) => {
      if (busy) return;
      const apply = () => {
        if (dir > 0) gallery.append(gallery.firstElementChild);
        else gallery.prepend(gallery.lastElementChild);
      };
      if (reduceMotion.matches) { apply(); return; }
      busy = true;
      gallery.classList.add('is-swapping');
      window.setTimeout(() => {
        apply();
        gallery.classList.remove('is-swapping');
        busy = false;
      }, 220);
    };
    prev.addEventListener('click', () => rotate(-1));
    next.addEventListener('click', () => rotate(1));
  }
})();
