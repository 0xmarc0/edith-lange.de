(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  // Suchtext vereinheitlichen. Zwei Varianten, damit sowohl "Göpel" als auch
  // "Goepel" und "Gopel" treffen: Akzente weglassen (ö -> o) oder ausschreiben (ö -> oe).
  const strip = (s) =>
    (s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/\p{M}/gu, '');
  const spell = (s) =>
    (s || '').toLowerCase().replace(/ß/g, 'ss')
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .normalize('NFD').replace(/\p{M}/gu, '');
  const norm = strip;

  const ALLE = 'Alle';
  const state = { q: '', cat: ALLE };
  let data = null;

  const grid = $('#raster');
  const chipBox = $('#chips');
  const count = $('#anzahl');
  const empty = $('#leer');
  const search = $('#suche');
  const dlg = $('#player');
  const stage = $('#buehne');

  /* ---------- Embed-URLs je Anbieter ---------- */
  function embedUrl(v) {
    const id = encodeURIComponent(v.videoId || '');
    switch (v.provider) {
      case 'bunny':
        return `https://player.mediadelivery.net/embed/${encodeURIComponent(data.settings.bunnyLibraryId)}/${id}?autoplay=true`;
      case 'cloudflare':
        return `https://iframe.cloudflarestream.com/${id}?autoplay=true`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
      case 'youtube':
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      default:
        return null;
    }
  }

  function buildPlayer(v) {
    if (!v.videoId) {
      return el('p', 'hinweis', 'Dieses Video ist noch nicht verknüpft. Trage die Video-ID in data/videos.json ein.');
    }
    if (v.provider === 'mp4') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.controlsList = 'nodownload noremoteplayback'; // blendet den Download-Eintrag im Player aus
      video.disablePictureInPicture = true;
      video.addEventListener('contextmenu', (e) => e.preventDefault()); // kein „Video speichern unter“
      video.src = v.videoId; // bei "mp4" steht hier die Datei-URL
      return video;
    }
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(v);
    iframe.title = v.title;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    return iframe;
  }

  /* ---------- Player-Dialog (Video wird erst nach Klick geladen) ---------- */
  function openFilm(v) {
    $('#player-titel').textContent = v.title;
    $('#player-meta').textContent = v.meta || '';
    $('#player-text').textContent = v.description || '';
    stage.replaceChildren(buildPlayer(v));
    if (!dlg.open) dlg.showModal();
    history.replaceState(null, '', '#film=' + v.id);
  }

  dlg.addEventListener('close', () => {
    stage.replaceChildren(); // entfernt iframe und stoppt die Wiedergabe
    history.replaceState(null, '', location.pathname + location.search);
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('#schliessen').addEventListener('click', () => dlg.close());

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-film]');
    if (!btn) return;
    const v = data.videos.find((x) => x.id === btn.dataset.film);
    if (v) openFilm(v);
  });

  /* ---------- Rendering ---------- */
  const PLAY_SVG =
    '<svg viewBox="0 0 24 24" focusable="false"><path d="M8 5l11 7-11 7z"/></svg>';

  // Kachel: Thumbnail als Hintergrund, darüber Titel, Laufzeit und „Video abspielen“
  function card(v) {
    const li = el('li');
    const btn = el('button', 'kachel');
    btn.type = 'button';
    btn.dataset.film = v.id;

    if (v.poster) {
      const img = document.createElement('img');
      img.src = v.poster;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      btn.append(img);
    }

    const text = el('span', 'kachel-text');
    const titel = el('span', 'kachel-titel', v.title);
    if (v.duration) titel.append(' ', el('span', 'kachel-dauer', '/ ' + v.duration));
    const play = el('span', 'kachel-play');
    const kreis = el('span', 'play-kreis');
    kreis.setAttribute('aria-hidden', 'true');
    kreis.innerHTML = PLAY_SVG; // statische Konstante, keine Nutzerdaten
    play.append(kreis, el('span', '', 'Video abspielen'));
    text.append(titel, play);
    btn.append(text);
    li.append(btn);
    return li;
  }

  function render() {
    const terms = state.q.trim().split(/\s+/).filter(Boolean);
    const list = data.videos.filter(
      (v) =>
        (state.cat === ALLE || v.category === state.cat) &&
        terms.every((t) => v._hay.includes(strip(t)) || v._hay.includes(spell(t)))
    );
    grid.replaceChildren(...list.map(card));
    empty.hidden = list.length > 0;
    count.textContent = list.length ? `${list.length} ${list.length === 1 ? 'Film' : 'Filme'}` : '';
    chipBox.querySelectorAll('.chip').forEach((c) =>
      c.setAttribute('aria-pressed', String(c.dataset.cat === state.cat))
    );
  }

  function buildChips() {
    const films = data.videos;
    const make = (cat, n) => {
      const b = el('button', 'chip', cat);
      b.type = 'button';
      b.dataset.cat = cat;
      b.append(el('small', '', String(n)));
      b.addEventListener('click', () => { state.cat = cat; render(); });
      return b;
    };
    chipBox.replaceChildren(
      make(ALLE, films.length),
      ...data.categories.map((c) => make(c, films.filter((v) => v.category === c).length))
    );
  }

  search.addEventListener('input', () => { state.q = search.value; render(); });
  $('#zuruecksetzen').addEventListener('click', () => {
    state.q = '';
    state.cat = ALLE;
    search.value = '';
    render();
    search.focus();
  });

  // Direktlinks wie index.html#film=trailer öffnen den Player (auch bei Hash-Wechsel im selben Tab)
  function openFromHash() {
    const m = location.hash.match(/^#film=(.+)$/);
    if (!m) return;
    const v = data.videos.find((x) => x.id === decodeURIComponent(m[1]));
    if (v && !(dlg.open && $('#player-titel').textContent === v.title)) openFilm(v);
  }

  /* ---------- Start ---------- */
  fetch('data/videos.json')
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then((json) => {
      data = json;
      data.videos.forEach((v) => {
        const text = [v.title, v.category, v.description, (v.tags || []).join(' ')].join(' ');
        v._hay = strip(text) + ' ' + spell(text);
      });
      buildChips();
      render();
      openFromHash();
      window.addEventListener('hashchange', openFromHash);
    })
    .catch(() => {
      count.textContent = 'Die Filmliste konnte nicht geladen werden. Lade die Seite neu.';
    });
})();
