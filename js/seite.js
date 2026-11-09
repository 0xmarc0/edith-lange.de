(() => {
  'use strict';

  // Menü-Knopf (nur Handy-Breite sichtbar): Navigation auf- und zuklappen
  const knopf = document.querySelector('.menue');
  const nav = document.getElementById('hauptnav');
  if (knopf && nav) {
    document.documentElement.classList.add('menue-js'); // erst jetzt wird die Navigation auf dem Handy eingeklappt
    const setze = (offen) => {
      knopf.setAttribute('aria-expanded', String(offen));
      knopf.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü');
      document.body.classList.toggle('menue-offen', offen);
    };
    knopf.addEventListener('click', () => setze(knopf.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setze(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setze(false); });
    window.matchMedia('(min-width: 40rem)').addEventListener('change', (e) => { if (e.matches) setze(false); });
  }

  // Jahreszahl im Footer immer aktuell (ohne JavaScript steht der eingetragene Wert)
  document.querySelectorAll('[data-jahr]').forEach((n) => { n.textContent = new Date().getFullYear(); });

  // Kopfleiste: über dem Video transparent, danach sandfarben und fixiert
  const hero = document.getElementById('top');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => document.body.classList.toggle('scroll', !e.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    ).observe(hero);
  }

  // Header-Video: bei „weniger Bewegung“ oder Datensparmodus nur das Standbild zeigen
  const video = document.getElementById('hero-video');
  if (video) {
    const still =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      (navigator.connection && navigator.connection.saveData);
    if (still) {
      video.removeAttribute('autoplay');
      video.preload = 'none';
      video.pause();
    }
  }
})();
