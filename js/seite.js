(() => {
  'use strict';

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
