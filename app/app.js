/* =========================================================
   Trousse : application (vanilla JS, sans dépendance)
   Données : localStorage (listes, produits, réglages)
             IndexedDB (photos compressées)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Constantes ---------- */
  var STORE_KEY = 'trousse:v1';
  var CURRENCIES = [
    ['EUR', 'Euro'], ['USD', 'Dollar américain'], ['GBP', 'Livre sterling'],
    ['CHF', 'Franc suisse'], ['CAD', 'Dollar canadien'], ['XOF', 'Franc CFA (BCEAO)'],
    ['XAF', 'Franc CFA (BEAC)'], ['MAD', 'Dirham marocain'], ['DZD', 'Dinar algérien'],
    ['TND', 'Dinar tunisien']
  ];
  var CATEGORIES = [
    'Visage', 'Corps', 'Cheveux', 'Dents et bouche', 'Maquillage',
    'Déodorant et parfum', 'Rasage et épilation', 'Hygiène intime', 'Bébé', 'Autre'
  ];
  var PRIORITIES = {
    1: { label: 'Urgent', icon: 'up' },
    2: { label: 'Normal', icon: 'flat' },
    3: { label: 'Plus tard', icon: 'down' }
  };
  var LIST_SUGGESTIONS = ['Courses du mois', 'Pharmacie', 'Voyage'];

  var ICONS = {
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    delete: 'M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    minus: 'M19 13H5v-2h14v2z',
    chevron: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    up: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z',
    down: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
    flat: 'M4 11h16v2H4z',
    photo: 'M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z',
    eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    archive: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z',
    warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    error: 'M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
    ok: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    list: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
    category: 'M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z',
    download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    upload: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
    reuse: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
    addList: 'M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z',
    cart: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
    unarchive: 'M20.55 5.22l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.15.55L3.46 5.22C3.17 5.57 3 6.01 3 6.5V19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.49-.17-.93-.45-1.28zM12 9.5l5.5 5.5H14v2h-4v-2H6.5L12 9.5zM5.12 5l.82-1h12l.93 1H5.12z'
  };

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONS[name] + '"/></svg>';
  }

  /* ---------- Utilitaires ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }
  function reducedMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function byName(a, b) { return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }); }
  function initial(name) { return h((String(name || '?').trim()[0] || '?').toUpperCase()); }
  function fmtDate(ts) {
    try { return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(ts)); }
    catch (e) { return ''; }
  }

  /* ---------- État et persistance ---------- */
  function defaults() {
    return {
      products: [],
      lists: [],
      settings: { theme: 'system', currency: 'EUR', rates: {}, groupBy: 'priority' }
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaults();
      return sanitize(JSON.parse(raw));
    } catch (e) { return defaults(); }
  }
  function sanitize(s) {
    var d = defaults();
    if (!s || typeof s !== 'object') return d;
    var settings = Object.assign({}, d.settings, s.settings || {});
    if (!settings.rates || typeof settings.rates !== 'object') settings.rates = {};
    return {
      products: Array.isArray(s.products) ? s.products.filter(function (p) { return p && p.id && p.name; }).map(function (p) {
        return {
          id: String(p.id), name: String(p.name), brand: p.brand || '', format: p.format || '',
          category: p.category || '', note: p.note || '',
          prices: Array.isArray(p.prices) ? p.prices.filter(function (x) { return x && isFinite(x.amount); }).map(function (x) {
            return { id: x.id || uid(), amount: Number(x.amount), currency: x.currency || settings.currency, shop: x.shop || '' };
          }) : [],
          createdAt: p.createdAt || Date.now(), updatedAt: p.updatedAt || Date.now()
        };
      }) : [],
      lists: Array.isArray(s.lists) ? s.lists.filter(function (l) { return l && l.id && l.name; }).map(function (l) {
        return {
          id: String(l.id), name: String(l.name), budget: isFinite(l.budget) && l.budget > 0 ? Number(l.budget) : null,
          archived: !!l.archived, archivedAt: l.archivedAt || null,
          items: Array.isArray(l.items) ? l.items.filter(function (it) { return it && it.productId; }).map(function (it) {
            return { productId: String(it.productId), qty: Math.max(1, parseInt(it.qty, 10) || 1), priority: PRIORITIES[it.priority] ? it.priority : 2, checked: !!it.checked };
          }) : [],
          createdAt: l.createdAt || Date.now(), updatedAt: l.updatedAt || Date.now()
        };
      }) : [],
      settings: settings
    };
  }

  var state = load();
  var saveFailed = false;
  var persistAsked = false;

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      saveFailed = false;
    } catch (e) {
      if (!saveFailed) snackbar('Enregistrement impossible : le stockage du navigateur est plein ou bloqué');
      saveFailed = true;
    }
    if (!persistAsked && (state.products.length || state.lists.length)) {
      persistAsked = true;
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}
    }
  }

  function getProduct(id) { return state.products.find(function (p) { return p.id === id; }); }
  function getList(id) { return state.lists.find(function (l) { return l.id === id; }); }
  function touch(list) { list.updatedAt = Date.now(); }

  /* ---------- Photos (IndexedDB) ---------- */
  var images = new Map(); // productId -> URL d'objet
  var dbPromise = null;

  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open('trousse-images', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('images'); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      } catch (e) { reject(e); }
    });
    return dbPromise;
  }
  function idb(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction('images', mode);
        var req = fn(tx.objectStore('images'));
        tx.oncomplete = function () { resolve(req && req.result); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }
  function setImageURL(id, blob) {
    var old = images.get(id);
    if (old) URL.revokeObjectURL(old);
    if (blob) images.set(id, URL.createObjectURL(blob)); else images.delete(id);
  }
  function loadImages() {
    return db().then(function (d) {
      return new Promise(function (resolve) {
        var req = d.transaction('images', 'readonly').objectStore('images').openCursor();
        req.onsuccess = function () {
          var c = req.result;
          if (c) { setImageURL(c.key, c.value); c.continue(); } else resolve();
        };
        req.onerror = function () { resolve(); };
      });
    }).catch(function () {});
  }
  function putImage(id, blob) {
    setImageURL(id, blob);
    return idb('readwrite', function (st) { return st.put(blob, id); })
      .catch(function () { snackbar("La photo n'a pas pu être enregistrée sur cet appareil"); });
  }
  function deleteImage(id) {
    setImageURL(id, null);
    return idb('readwrite', function (st) { return st.delete(id); }).catch(function () {});
  }
  function getImageBlob(id) {
    return idb('readonly', function (st) { return st.get(id); }).catch(function () { return null; });
  }
  function clearImages() {
    images.forEach(function (url) { URL.revokeObjectURL(url); });
    images.clear();
    return idb('readwrite', function (st) { return st.clear(); }).catch(function () {});
  }

  function compressImage(file) {
    var MAX = 1280;
    function fromImg() {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function () { resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
        img.src = url;
      });
    }
    var source = window.createImageBitmap ? createImageBitmap(file).catch(fromImg) : fromImg();
    return source.then(function (src) {
      var w = src.width || src.naturalWidth, hgt = src.height || src.naturalHeight;
      var scale = Math.min(1, MAX / Math.max(w, hgt));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(hgt * scale);
      canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
      return new Promise(function (resolve) {
        canvas.toBlob(function (b) { resolve(b || file); }, 'image/jpeg', 0.82);
      });
    }).catch(function () { return file; });
  }

  /* ---------- Argent ---------- */
  function fmt(amount, cur) {
    cur = cur || state.settings.currency;
    try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(amount); }
    catch (e) { return amount.toFixed(2).replace('.', ',') + ' ' + cur; }
  }
  function fmtRange(min, max) {
    if (min == null) return '';
    if (Math.abs(max - min) < 0.005) return fmt(min);
    return fmt(min) + ' – ' + fmt(max);
  }
  function fmtInput(n) {
    if (n == null || n === '') return '';
    return String(Math.round(n * 1e6) / 1e6).replace('.', ',');
  }
  /* Loi de Postel : accepte 4,5 · 4.50 · 1 200 */
  function parseAmount(str) {
    var s = String(str == null ? '' : str).replace(/[\s  ]/g, '').replace(',', '.');
    if (!s) return null;
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return parseFloat(s);
  }
  function convert(amount, from) {
    var main = state.settings.currency;
    if (from === main) return amount;
    var r = state.settings.rates[from];
    return r > 0 ? amount * r : null;
  }
  function productRange(p) {
    var vals = [], unconverted = [], cheapest = null;
    (p.prices || []).forEach(function (pr) {
      var v = convert(pr.amount, pr.currency);
      if (v == null) { if (unconverted.indexOf(pr.currency) < 0) unconverted.push(pr.currency); return; }
      vals.push(v);
      if (!cheapest || v < cheapest.value) cheapest = { value: v, shop: pr.shop };
    });
    if (!vals.length) return { min: null, max: null, cheapest: null, unconverted: unconverted };
    return { min: Math.min.apply(null, vals), max: Math.max.apply(null, vals), cheapest: cheapest, unconverted: unconverted };
  }
  function estimate(list) {
    var res = { min: 0, max: 0, priced: 0, noPrice: 0, unconverted: [], remaining: 0, total: 0, done: 0 };
    list.items.forEach(function (it) {
      var p = getProduct(it.productId);
      if (!p) return;
      res.total++;
      if (it.checked) { res.done++; return; }
      res.remaining++;
      var r = productRange(p);
      r.unconverted.forEach(function (c) { if (res.unconverted.indexOf(c) < 0) res.unconverted.push(c); });
      if (r.min == null) { res.noPrice++; return; }
      res.priced++;
      res.min += r.min * it.qty;
      res.max += r.max * it.qty;
    });
    return res;
  }
  function usedCurrencies() {
    var set = [];
    state.products.forEach(function (p) {
      p.prices.forEach(function (pr) { if (set.indexOf(pr.currency) < 0) set.push(pr.currency); });
    });
    return set;
  }
  /* Change la devise principale en recalculant les taux existants */
  function changeMainCurrency(next) {
    var s = state.settings, prev = s.currency;
    if (next === prev) return;
    var rates = s.rates, nextRate = rates[next]; // 1 next = nextRate prev
    var out = {};
    if (nextRate > 0) {
      Object.keys(rates).forEach(function (c) { if (c !== next) out[c] = rates[c] / nextRate; });
      out[prev] = 1 / nextRate;
    }
    s.rates = out;
    s.currency = next;
    save();
    snackbar(nextRate > 0 ? 'Devise principale : ' + next + '. Taux recalculés.' : 'Devise principale : ' + next + '. Indiquez les taux de conversion.');
  }

  /* ---------- Historique interne (sens des transitions, retour) ---------- */
  var routeStack = [];
  var scrollMemory = {};
  var afterRenderQueue = [];

  function currentPath() { return (location.hash.slice(1) || '/listes'); }
  function parseRoute() {
    var hash = currentPath();
    var q = hash.indexOf('?');
    var path = q >= 0 ? hash.slice(0, q) : hash;
    var params = new URLSearchParams(q >= 0 ? hash.slice(q + 1) : '');
    var parts = path.split('/').filter(Boolean);
    return { full: hash, path: path, parts: parts, params: params, view: parts[0] || 'listes' };
  }
  function depthOf(view) { return (view === 'liste' || view === 'produit') ? 1 : 0; }
  function goBack(fallback) {
    if (routeStack.length > 1) history.back();
    else location.replace('#' + fallback);
  }
  function go(path) { location.hash = '#' + path; }

  /* ---------- Rendu principal ---------- */
  var lastValues = {};
  var draft = null;
  var productQuery = '';
  var productCat = '';
  var installEvent = null;

  function render(anim) {
    var r = parseRoute();
    var html, detail = false, navKey = r.view, form = false;
    switch (r.view) {
      case 'listes': html = viewLists(); break;
      case 'liste': html = viewList(r.parts[1]); detail = true; navKey = 'listes'; break;
      case 'produits': html = viewProducts(); break;
      case 'produit': html = viewProduct(r.parts[1], r.params, r.full); detail = true; form = true; navKey = 'produits'; break;
      case 'reglages': html = viewSettings(); break;
      default: location.replace('#/listes'); return;
    }
    document.body.classList.toggle('is-detail', detail);
    document.body.classList.toggle('is-form', form);
    $all('.nav__item').forEach(function (a) {
      if (a.getAttribute('data-nav') === navKey) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var main = $('#main');
    var active = document.activeElement;
    var focusKey = active && main.contains(active) ? active.getAttribute('data-key') : null;
    main.innerHTML = html;

    if (anim) {
      main.classList.remove('anim-fade', 'anim-forward', 'anim-back', 'is-entering');
      void main.offsetWidth;
      if (!reducedMotion()) {
        main.classList.add('anim-' + anim, 'is-entering');
        setTimeout(function () { main.classList.remove('is-entering'); }, 700);
      }
      window.scrollTo(0, scrollMemory[r.full] && anim !== 'forward' ? scrollMemory[r.full] : 0);
      main.focus({ preventScroll: true });
    } else if (focusKey) {
      var el = main.querySelector('[data-key="' + focusKey.replace(/"/g, '') + '"]');
      if (el) el.focus({ preventScroll: true });
    }
    afterRender();
  }

  function afterRender() {
    updateTopbar();
    // Action secondaire : le montant défile vers sa nouvelle valeur
    $all('[data-tween]').forEach(function (el) {
      var key = el.getAttribute('data-tween');
      var min = parseFloat(el.getAttribute('data-min')), max = parseFloat(el.getAttribute('data-max'));
      var prev = lastValues[key];
      lastValues[key] = { min: min, max: max };
      if (!prev || (prev.min === min && prev.max === max) || reducedMotion()) return;
      var start = performance.now(), dur = 400;
      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        el.textContent = fmtRange(prev.min + (min - prev.min) * e, prev.max + (max - prev.max) * e);
        if (t < 1 && el.isConnected) requestAnimationFrame(step);
      })(start);
    });
    var q = afterRenderQueue.splice(0);
    q.forEach(function (fn) { fn(); });
  }

  function updateTopbar() {
    var bar = $('.topbar');
    if (bar) bar.classList.toggle('is-scrolled', window.scrollY > 4);
  }

  function emptyState(iconName, title, text, actionHtml) {
    return '<div class="empty"><div class="empty__mark">' + icon(iconName) + '</div>' +
      '<h2 class="t-title-l">' + title + '</h2><p class="t-body muted">' + text + '</p>' + (actionHtml || '') + '</div>';
  }

  function thumb(p, lg) {
    var url = images.get(p.id);
    return '<span class="thumb' + (lg ? ' thumb--lg' : '') + '" aria-hidden="true">' +
      (url ? '<img src="' + url + '" alt="" loading="lazy">' : initial(p.name)) + '</span>';
  }

  function notFound(text, fallback) {
    return '<header class="topbar"><button class="icon-btn" data-action="back" data-fallback="' + fallback + '" aria-label="Retour">' + icon('back') + '</button>' +
      '<h1 class="topbar__title t-title-l">Introuvable</h1></header>' +
      '<div class="page">' + emptyState('info', 'Élément introuvable', h(text), '<a class="btn btn--tonal" href="#' + fallback + '">Revenir</a>') + '</div>';
  }

  /* ===== Vue : Listes ===== */
  function viewLists() {
    var active = state.lists.filter(function (l) { return !l.archived; }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    var archived = state.lists.filter(function (l) { return l.archived; }).sort(function (a, b) { return (b.archivedAt || 0) - (a.archivedAt || 0); });
    var out = '<div class="page"><header class="page-head"><h1 class="t-headline">Mes listes</h1>' +
      (active.length ? '<p class="t-body muted">' + plural(active.length, 'liste en cours', 'listes en cours') + '</p>' : '') + '</header>';

    if (!state.lists.length) {
      out += emptyState('list', 'Aucune liste pour l\'instant',
        'Créez une liste, ajoutez vos produits et voyez combien prévoir avant d\'aller acheter.',
        '<button class="btn btn--filled" data-action="new-list">' + icon('add') + 'Créer ma première liste</button>');
      return out + '</div>';
    }

    if (active.length) {
      out += '<ul class="rows">' + active.map(function (l, i) {
        var e = estimate(l);
        var ratio = e.total ? e.done / e.total : 0;
        var sub = e.total ? plural(e.total, 'produit', 'produits') + ' · ' + e.done + ' dans le panier' : 'Vide';
        var price = e.priced ? '<span class="row__price"><span class="t-label num">' + fmtRange(e.min, e.max) + '</span><span class="t-body muted">à prévoir</span></span>' : '';
        return '<li style="--i:' + Math.min(i, 12) + '"><a class="row state" href="#/liste/' + l.id + '" data-key="list-' + l.id + '">' +
          '<span class="row__main"><span class="t-title-m">' + h(l.name) + '</span>' +
          '<span class="t-body muted">' + sub + '</span>' + price +
          (e.total ? '<span class="progress progress--mini" aria-hidden="true"><span class="progress__track" style="display:block;margin-top:6px"><span class="progress__fill" style="display:block;transform:scaleX(' + ratio + ')"></span></span></span>' : '') +
          '</span>' + icon('chevron', 'muted') + '</a></li>';
      }).join('') + '</ul>';
    } else {
      out += '<p class="t-body muted" style="padding:0 var(--margin)">Aucune liste en cours.</p>';
    }

    if (archived.length) {
      out += '<details class="archive"' + (active.length ? '' : ' open') + '><summary>' + icon('chevron') +
        '<span class="t-label">Terminées (' + archived.length + ')</span></summary><ul class="rows">' +
        archived.map(function (l) {
          return '<li><div class="row row--tight"><a class="row__btn state" href="#/liste/' + l.id + '" data-key="list-' + l.id + '"><span class="row__main"><span class="t-title-m">' + h(l.name) + '</span>' +
            '<span class="t-body muted">' + (l.archivedAt ? 'Terminée le ' + fmtDate(l.archivedAt) + ' · ' : '') + plural(l.items.length, 'produit', 'produits') + '</span></span></a>' +
            '<button class="btn btn--text" data-action="reuse-list" data-id="' + l.id + '" aria-label="Réutiliser « ' + h(l.name) + ' »">' + icon('reuse') + 'Réutiliser</button></div></li>';
        }).join('') + '</ul></details>';
    }
    out += '</div><button class="fab" data-action="new-list">' + icon('add') + 'Nouvelle liste</button>';
    return out;
  }

  /* ===== Vue : une liste ===== */
  function viewList(id) {
    var list = getList(id);
    if (!list) return notFound('Cette liste n\'existe plus.', '/listes');
    var entries = list.items.map(function (it) { return { it: it, p: getProduct(it.productId) }; }).filter(function (x) { return x.p; });
    var e = estimate(list);
    var groupBy = state.settings.groupBy;

    var out = '<header class="topbar"><button class="icon-btn" data-action="back" data-fallback="/listes" aria-label="Retour aux listes">' + icon('back') + '</button>' +
      '<h1 class="topbar__title t-title-l">' + h(list.name) + '</h1>' +
      '<button class="icon-btn" data-action="list-menu" data-id="' + list.id + '" aria-label="Plus d\'actions sur la liste" aria-haspopup="menu" data-key="list-menu">' + icon('more') + '</button></header><div class="page">';

    if (!entries.length) {
      out += emptyState('cart', 'Cette liste est vide', 'Ajoutez les produits à acheter. Seul le nom est obligatoire.',
        '<button class="btn btn--filled" data-action="add-items" data-id="' + list.id + '">' + icon('add') + 'Ajouter des produits</button>');
      return out + '</div>';
    }

    if (e.remaining === 0) {
      out += '<section class="done-card" role="status"><span class="done-card__mark">' + icon('check') + '</span>' +
        '<h2 class="t-title-l">Tout est dans le panier</h2>' +
        '<p class="t-body">' + plural(e.total, 'produit acheté', 'produits achetés') + '. Bonne fin de courses !</p>' +
        '<div class="done-card__actions">' +
        (list.archived ? '<button class="btn btn--filled" data-action="reuse-list" data-id="' + list.id + '">' + icon('reuse') + 'Réutiliser</button>'
          : '<button class="btn btn--filled" data-action="archive-list" data-id="' + list.id + '">' + icon('archive') + 'Terminer la liste</button>') +
        '<button class="btn btn--text" data-action="uncheck-all" data-id="' + list.id + '">Tout décocher</button></div></section>';
    } else {
      out += summary(list, e);
      out += '<div class="segmented" role="group" aria-label="Regrouper les produits par">' +
        segOpt('group', 'priority', 'Priorité', groupBy === 'priority') +
        segOpt('group', 'category', 'Catégorie', groupBy === 'category') + '</div>';

      var todo = entries.filter(function (x) { return !x.it.checked; });
      var groups = [];
      if (groupBy === 'category') {
        CATEGORIES.concat(['']).forEach(function (cat) {
          var g = todo.filter(function (x) { return (x.p.category || '') === cat; });
          if (g.length) groups.push({ title: cat || 'Sans catégorie', icon: null, items: g });
        });
      } else {
        [1, 2, 3].forEach(function (pr) {
          var g = todo.filter(function (x) { return x.it.priority === pr; });
          if (g.length) groups.push({ title: PRIORITIES[pr].label, icon: PRIORITIES[pr].icon, items: g });
        });
      }
      var idx = 0;
      groups.forEach(function (g) {
        out += '<h2 class="group-title t-label">' + (g.icon ? icon(g.icon) : '') + h(g.title) + ' <span>(' + g.items.length + ')</span></h2>' +
          '<ul class="rows">' + g.items.sort(function (a, b) { return byName(a.p, b.p); }).map(function (x) { return itemRow(list, x.it, x.p, idx++); }).join('') + '</ul>';
      });
    }

    var done = entries.filter(function (x) { return x.it.checked; });
    if (done.length) {
      out += '<h2 class="group-title t-label">' + icon('cart') + 'Dans le panier <span>(' + done.length + ')</span></h2>' +
        '<ul class="rows">' + done.sort(function (a, b) { return byName(a.p, b.p); }).map(function (x, i) { return itemRow(list, x.it, x.p, i); }).join('') + '</ul>';
    }
    out += '</div>';
    if (e.remaining > 0) out += '<button class="fab" data-action="add-items" data-id="' + list.id + '">' + icon('add') + 'Ajouter</button>';
    return out;
  }

  function segOpt(action, value, label, pressed) {
    return '<button class="segmented__opt" data-action="' + action + '" data-value="' + value + '" aria-pressed="' + pressed + '" data-key="' + action + '-' + value + '">' + icon('check') + label + '</button>';
  }

  function summary(list, e) {
    var notes = [];
    var cur = state.settings.currency;
    if (list.budget) {
      if (e.priced && e.min > list.budget) {
        notes.push('<p class="note-line note-line--error t-body">' + icon('warning') + 'Dépasse le budget de ' + fmt(e.min - list.budget) + ' (budget : ' + fmt(list.budget) + ')</p>');
      } else if (e.priced && e.max > list.budget) {
        notes.push('<p class="note-line note-line--error t-body">' + icon('warning') + 'Peut dépasser le budget de ' + fmt(list.budget) + ', jusqu\'à ' + fmt(e.max - list.budget) + ' de plus</p>');
      } else {
        notes.push('<p class="note-line t-body muted">' + icon('ok') + 'Dans le budget de ' + fmt(list.budget) + '</p>');
      }
    }
    if (e.noPrice) {
      notes.push('<p class="note-line t-body muted">' + icon('info') + plural(e.noPrice, 'produit sans prix, non compté', 'produits sans prix, non comptés') + '</p>');
    }
    if (e.unconverted.length) {
      notes.push('<p class="note-line note-line--error t-body">' + icon('error') + '<span>Prix en ' + h(e.unconverted.join(', ')) + ' non convertis en ' + cur + '. <a href="#/reglages">Ajouter un taux</a></span></p>');
    }
    var ratio = e.total ? e.done / e.total : 0;
    return '<section class="summary" aria-labelledby="est-title">' +
      '<h2 id="est-title" class="t-label muted">Estimation du reste à acheter</h2>' +
      (e.priced
        ? '<p class="t-headline summary__amount" data-tween="est-' + list.id + '" data-min="' + e.min + '" data-max="' + e.max + '">' + fmtRange(e.min, e.max) + '</p>'
        : '<p class="t-title-l muted">Pas encore de prix</p>') +
      (notes.length ? '<div class="summary__notes">' + notes.join('') + '</div>' : '') +
      '<div class="progress"><span class="t-body" id="prog-' + list.id + '">' + e.done + ' sur ' + e.total + ' dans le panier</span>' +
      '<div class="progress__track" role="progressbar" aria-labelledby="prog-' + list.id + '" aria-valuemin="0" aria-valuemax="' + e.total + '" aria-valuenow="' + e.done + '">' +
      '<div class="progress__fill" style="transform:scaleX(' + ratio + ')"></div></div></div></section>';
  }

  function itemRow(list, it, p, i) {
    var r = productRange(p);
    var meta = [];
    if (state.settings.groupBy === 'category' && !it.checked) meta.push(PRIORITIES[it.priority].label);
    if (p.brand) meta.push(h(p.brand));
    if (p.format) meta.push(h(p.format));
    var price = '<span class="row__price">' + (r.min != null
      ? '<span class="t-label num">' + fmtRange(r.min * it.qty, r.max * it.qty) + '</span>' +
        (it.qty > 1 ? '<span class="t-body muted num">' + fmtRange(r.min, r.max) + ' l\'unité</span>' : '')
      : '<span class="t-body muted">Sans prix</span>') + '</span>';
    var label = (it.qty > 1 ? it.qty + ' × ' : '') + h(p.name);
    return '<li style="--i:' + Math.min(i, 12) + '"><div class="row row--tight' + (it.checked ? ' is-done' : '') + '">' +
      '<label class="check"><input type="checkbox" data-change="toggle-item" data-list="' + list.id + '" data-product="' + p.id + '"' + (it.checked ? ' checked' : '') +
      ' data-key="chk-' + p.id + '" aria-label="' + h(p.name) + ' : dans le panier"></label>' +
      '<button class="row__btn state" data-action="item-sheet" data-list="' + list.id + '" data-product="' + p.id + '" data-key="item-' + p.id + '">' +
      thumb(p) + '<span class="row__main"><span class="t-title-m row__name">' + label + '</span>' +
      (meta.length ? '<span class="t-body muted">' + meta.join(' · ') + '</span>' : '') + price + '</span></button></div></li>';
  }

  /* ===== Vue : Produits (catalogue) ===== */
  function viewProducts() {
    var n = state.products.length;
    var out = '<div class="page"><header class="page-head"><h1 class="t-headline">Produits</h1>' +
      (n ? '<p class="t-body muted">' + plural(n, 'produit dans votre catalogue', 'produits dans votre catalogue') + '</p>' : '') + '</header>';
    if (!n) {
      out += emptyState('category', 'Aucun produit enregistré',
        'Ajoutez vos produits habituels une fois : vous les retrouverez à chaque nouvelle liste.',
        '<a class="btn btn--filled" href="#/produit/nouveau">' + icon('add') + 'Ajouter un produit</a>');
      return out + '</div>';
    }
    var cats = CATEGORIES.filter(function (c) { return state.products.some(function (p) { return p.category === c; }); });
    if (productCat && cats.indexOf(productCat) < 0) productCat = '';
    out += '<div class="search" role="search">' + icon('search') +
      '<input type="search" id="product-q" data-input="product-q" value="' + h(productQuery) + '" placeholder="Rechercher un produit" aria-label="Rechercher un produit" autocomplete="off" enterkeyhint="search">' +
      '<button class="icon-btn" data-action="clear-product-q" aria-label="Effacer la recherche"' + (productQuery ? '' : ' hidden') + '>' + icon('close') + '</button></div>';
    if (cats.length > 1) {
      out += '<div class="chips" role="group" aria-label="Filtrer par catégorie">' +
        chip('', 'Toutes', !productCat) + cats.map(function (c) { return chip(c, c, productCat === c); }).join('') + '</div>';
    }
    out += '<div id="product-results">' + productResults() + '</div></div>' +
      '<a class="fab" href="#/produit/nouveau">' + icon('add') + 'Nouveau produit</a>';
    return out;
  }

  function chip(value, label, pressed) {
    return '<button class="chip" data-action="product-cat" data-value="' + h(value) + '" aria-pressed="' + pressed + '">' + icon('check') + h(label) + '</button>';
  }

  function matches(p, q) {
    if (!q) return true;
    return norm([p.name, p.brand, p.format, p.note, p.category].join(' ')).indexOf(q) >= 0;
  }

  function productResults() {
    var q = norm(productQuery);
    var list = state.products.filter(function (p) { return (!productCat || p.category === productCat) && matches(p, q); }).sort(byName);
    if (!list.length) {
      return '<div class="empty"><p class="t-body muted">Aucun produit ne correspond à « ' + h(productQuery) + ' ».</p>' +
        (productQuery ? '<a class="btn btn--tonal" href="#/produit/nouveau?nom=' + encodeURIComponent(productQuery) + '">' + icon('add') + 'Créer « ' + h(productQuery) + ' »</a>' : '') + '</div>';
    }
    return '<ul class="rows" aria-label="Résultats">' + list.map(function (p, i) {
      var r = productRange(p);
      var meta = [p.brand, p.format].filter(Boolean).map(h);
      if (p.category && !productCat) meta.push(h(p.category));
      return '<li style="--i:' + Math.min(i, 12) + '"><a class="row state" href="#/produit/' + p.id + '" data-key="prod-' + p.id + '">' + thumb(p) +
        '<span class="row__main"><span class="t-title-m">' + h(p.name) + '</span>' +
        (meta.length ? '<span class="t-body muted">' + meta.join(' · ') + '</span>' : '') +
        '<span class="row__price">' + (r.min != null ? '<span class="t-label num">' + fmtRange(r.min, r.max) + '</span>' +
          (p.prices.length > 1 ? '<span class="t-body muted">' + p.prices.length + ' prix</span>' : '')
          : '<span class="t-body muted">' + (p.prices.length ? 'Taux manquant' : 'Sans prix') + '</span>') +
        '</span></span></a></li>';
    }).join('') + '</ul>';
  }

  /* ===== Vue : fiche produit ===== */
  function makeDraft(id, params, key) {
    var p = id && id !== 'nouveau' ? getProduct(id) : null;
    return {
      key: key,
      id: p ? p.id : null,
      name: p ? p.name : (params.get('nom') || ''),
      brand: p ? p.brand : '',
      format: p ? p.format : '',
      category: p ? p.category : '',
      note: p ? p.note : '',
      prices: p ? p.prices.map(function (x) { return { id: x.id, amount: fmtInput(x.amount), currency: x.currency, shop: x.shop }; }) : [],
      image: undefined, // undefined = inchangée · Blob = nouvelle · null = retirée
      imageURL: null,
      listId: params.get('liste') || null,
      errors: {},
      dirty: false
    };
  }

  function draftImageURL() {
    if (!draft) return null;
    if (draft.image === null) return null;
    if (draft.imageURL) return draft.imageURL;
    return draft.id ? images.get(draft.id) || null : null;
  }

  function viewProduct(id, params, key) {
    var isNew = !id || id === 'nouveau';
    if (!isNew && !getProduct(id)) return notFound('Ce produit n\'existe plus.', '/produits');
    if (!draft || draft.key !== key) draft = makeDraft(id, params, key);
    if (!draft.prices.length) draft.prices.push({ id: uid(), amount: '', currency: state.settings.currency, shop: '' });
    var d = draft, err = d.errors;
    var img = draftImageURL();

    var out = '<header class="topbar"><button class="icon-btn" data-action="product-back" aria-label="Retour">' + icon('back') + '</button>' +
      '<h1 class="topbar__title t-title-l">' + (isNew ? 'Nouveau produit' : 'Modifier le produit') + '</h1>' +
      (!isNew ? '<button class="icon-btn" data-action="product-menu" aria-label="Plus d\'actions sur le produit" aria-haspopup="menu" data-key="product-menu">' + icon('more') + '</button>' : '') +
      '</header><div class="page"><form class="form" id="product-form" novalidate>';

    // Photo (facultative)
    out += '<div class="field"><span class="field__label" id="photo-label">Photo (facultative)</span>';
    if (img) {
      out += '<div class="photo"><img src="' + img + '" alt="' + h(d.name || 'Produit') + '"></div>' +
        '<div class="photo__actions">' +
        '<button type="button" class="btn btn--tonal" data-action="show-draft">' + icon('eye') + 'Montrer en grand</button>' +
        '<label class="btn btn--outlined file-btn">' + icon('photo') + 'Changer<input type="file" accept="image/*" data-change="photo" aria-label="Changer la photo"></label>' +
        '<button type="button" class="btn btn--text btn--danger" data-action="remove-photo">Retirer</button></div>';
    } else {
      out += '<label class="photo-drop">' + icon('photo') +
        '<span class="t-title-m">Ajouter une photo</span>' +
        '<span class="t-body">Prenez le produit en photo pour le montrer au vendeur</span>' +
        '<input type="file" accept="image/*" data-change="photo" aria-labelledby="photo-label"></label>';
    }
    out += '</div>';

    out += textField('name', 'Nom', d.name, { required: true, error: err.name, placeholder: 'Ex. Shampooing doux', autocomplete: 'off' });
    out += textField('brand', 'Marque', d.brand, { placeholder: 'Facultatif' });
    out += textField('format', 'Format', d.format, { help: 'Contenance, teinte ou variante. Ex. 250 ml, teinte 102', placeholder: 'Facultatif' });

    out += '<div class="field"><label class="field__label" for="f-category">Catégorie</label>' +
      '<select class="select" id="f-category" data-input="field" data-field="category">' +
      '<option value="">Sans catégorie</option>' +
      CATEGORIES.map(function (c) { return '<option' + (c === d.category ? ' selected' : '') + '>' + h(c) + '</option>'; }).join('') +
      '</select></div>';

    // Prix
    out += '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="field__label" style="padding:0;margin-bottom:var(--s-1)">Prix</legend>' +
      '<p class="field__help" style="margin-bottom:var(--s-3)">Un prix par magasin ou par devise. L\'estimation utilise le moins cher et le plus cher.</p>' +
      '<div class="price-rows">' + d.prices.map(function (pr, i) { return priceRow(pr, i, err['price-' + i]); }).join('') + '</div>' +
      '<div style="margin-top:var(--s-3)"><button type="button" class="btn btn--tonal" data-action="add-price" data-key="add-price">' + icon('add') + 'Ajouter un prix</button></div></fieldset>';

    out += '<div class="field"><label class="field__label" for="f-note">Note</label>' +
      '<textarea class="textarea" id="f-note" data-input="field" data-field="note" placeholder="Ex. sans parfum, flacon bleu, rayon pharmacie" aria-describedby="f-note-help">' + h(d.note) + '</textarea>' +
      '<span class="field__help" id="f-note-help">Affichée quand vous montrez le produit au vendeur</span></div>';

    if (!isNew) out += '<div><button type="button" class="btn btn--text btn--danger" data-action="delete-product">' + icon('delete') + 'Supprimer le produit</button></div>';
    out += '</form></div>' +
      '<div class="action-bar"><button type="submit" form="product-form" class="btn btn--filled btn--block">' + icon('check') +
      (d.listId && isNew ? 'Enregistrer et ajouter à la liste' : 'Enregistrer') + '</button></div>';
    return out;
  }

  function textField(field, label, value, o) {
    var id = 'f-' + field;
    var described = [];
    if (o.error) described.push(id + '-err'); else if (o.help) described.push(id + '-help');
    return '<div class="field"><label class="field__label" for="' + id + '">' + label + (o.required ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' +
      '<input class="input" id="' + id + '" data-input="field" data-field="' + field + '" value="' + h(value) + '"' +
      (o.placeholder ? ' placeholder="' + h(o.placeholder) + '"' : '') + (o.required ? ' required aria-required="true"' : '') +
      (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') +
      (o.error ? ' aria-invalid="true"' : '') + (described.length ? ' aria-describedby="' + described.join(' ') + '"' : '') + ' data-key="' + id + '">' +
      (o.error ? '<span class="field__error" id="' + id + '-err">' + icon('error') + h(o.error) + '</span>'
        : (o.help ? '<span class="field__help" id="' + id + '-help">' + h(o.help) + '</span>' : '')) + '</div>';
  }

  function currencyOptions(selected) {
    return CURRENCIES.map(function (c) {
      return '<option value="' + c[0] + '"' + (c[0] === selected ? ' selected' : '') + '>' + c[0] + '</option>';
    }).join('');
  }

  function priceRow(pr, i, error) {
    var n = i + 1;
    return '<div class="price-row" role="group" aria-label="Prix ' + n + '">' +
      '<div class="field price-row__amount"><label class="field__label" for="pa-' + i + '">Montant</label>' +
      '<input class="input num" id="pa-' + i + '" inputmode="decimal" data-input="price" data-index="' + i + '" data-pf="amount" value="' + h(pr.amount) + '" placeholder="0,00"' +
      (error ? ' aria-invalid="true" aria-describedby="pa-' + i + '-err"' : '') + ' data-key="pa-' + pr.id + '">' +
      (error ? '<span class="field__error" id="pa-' + i + '-err">' + icon('error') + h(error) + '</span>' : '') + '</div>' +
      '<div class="field price-row__cur"><label class="field__label" for="pc-' + i + '">Devise</label>' +
      '<select class="select" id="pc-' + i + '" data-input="price" data-index="' + i + '" data-pf="currency">' + currencyOptions(pr.currency) + '</select></div>' +
      '<div class="field price-row__shop"><label class="field__label" for="ps-' + i + '">Magasin</label>' +
      '<input class="input" id="ps-' + i + '" data-input="price" data-index="' + i + '" data-pf="shop" value="' + h(pr.shop) + '" placeholder="Facultatif" data-key="ps-' + pr.id + '"></div>' +
      '<button type="button" class="icon-btn price-row__del" data-action="remove-price" data-index="' + i + '" aria-label="Retirer le prix ' + n + '">' + icon('delete') + '</button></div>';
  }

  /* ===== Vue : Réglages ===== */
  function viewSettings() {
    var s = state.settings;
    var used = usedCurrencies().filter(function (c) { return c !== s.currency; });
    var rated = Object.keys(s.rates).filter(function (c) { return c !== s.currency; });
    var shown = used.concat(rated.filter(function (c) { return used.indexOf(c) < 0; }));
    var addable = CURRENCIES.filter(function (c) { return c[0] !== s.currency && shown.indexOf(c[0]) < 0; });

    var out = '<div class="page"><header class="page-head"><h1 class="t-headline">Réglages</h1></header>';

    out += '<section class="section" aria-labelledby="set-theme"><h2 id="set-theme" class="section__title t-label">Apparence</h2><div class="section__body">' +
      '<div class="segmented segmented--flush" role="group" aria-label="Thème">' +
      segOpt('theme', 'system', 'Système', s.theme === 'system') + segOpt('theme', 'light', 'Jour', s.theme === 'light') + segOpt('theme', 'dark', 'Nuit', s.theme === 'dark') +
      '</div><p class="field__help">« Système » suit le réglage de votre téléphone.</p></div></section>';

    out += '<section class="section" aria-labelledby="set-cur"><h2 id="set-cur" class="section__title t-label">Devises</h2><div class="section__body">' +
      '<div class="field"><label class="field__label" for="main-cur">Devise principale</label>' +
      '<select class="select" id="main-cur" data-change="main-currency" aria-describedby="main-cur-help">' +
      CURRENCIES.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === s.currency ? ' selected' : '') + '>' + c[0] + ' · ' + c[1] + '</option>'; }).join('') +
      '</select><span class="field__help" id="main-cur-help">Les estimations sont affichées dans cette devise.</span></div>' +
      '<div><h3 class="t-title-m">Taux de conversion</h3><p class="t-body muted">Valeur d\'une unité de chaque devise en ' + s.currency + '.</p></div>';
    if (shown.length) {
      out += shown.map(function (c) {
        var missing = !(s.rates[c] > 0);
        return '<div class="field"><div class="rate-row"><label class="t-label" for="rate-' + c + '">1 ' + c + ' =</label>' +
          '<input class="input num" id="rate-' + c + '" inputmode="decimal" data-change="rate" data-cur="' + c + '" value="' + h(fmtInput(s.rates[c])) + '" placeholder="Ex. 0,92"' +
          (missing && used.indexOf(c) >= 0 ? ' aria-invalid="true" aria-describedby="rate-' + c + '-err"' : '') + '>' +
          '<span class="t-label">' + s.currency + '</span></div>' +
          (missing && used.indexOf(c) >= 0 ? '<span class="field__error" id="rate-' + c + '-err">' + icon('error') + 'Taux manquant : les prix en ' + c + ' ne sont pas comptés</span>' : '') + '</div>';
      }).join('');
    } else {
      out += '<p class="t-body muted">Tous vos prix sont en ' + s.currency + '. Rien à convertir.</p>';
    }
    if (addable.length) {
      out += '<div class="field"><label class="field__label" for="add-rate">Ajouter un taux</label><select class="select" id="add-rate" data-change="add-rate">' +
        '<option value="">Choisir une devise</option>' + addable.map(function (c) { return '<option value="' + c[0] + '">' + c[0] + ' · ' + c[1] + '</option>'; }).join('') + '</select></div>';
    }
    out += '</div></section>';

    out += '<section class="section" aria-labelledby="set-save"><h2 id="set-save" class="section__title t-label">Sauvegarde</h2><div class="section__body">' +
      '<p class="t-body muted">Vos données restent sur ce téléphone. Exportez une sauvegarde pour les garder ou les transférer, photos comprises.</p>' +
      '<div class="photo__actions" style="margin:0"><button class="btn btn--outlined" data-action="export">' + icon('download') + 'Exporter</button>' +
      '<label class="btn btn--outlined file-btn">' + icon('upload') + 'Importer<input type="file" accept="application/json,.json" data-change="import" aria-label="Importer une sauvegarde"></label></div></div></section>';

    out += '<section class="section" aria-labelledby="set-app"><h2 id="set-app" class="section__title t-label">Application</h2><div class="section__body">' +
      (installEvent ? '<div><button class="btn btn--tonal" data-action="install">' + icon('download') + 'Installer Trousse</button></div>'
        : '<p class="t-body muted">Pour un accès rapide, ouvrez le menu du navigateur puis choisissez « Ajouter à l\'écran d\'accueil ». Trousse fonctionne aussi hors ligne.</p>') +
      '<div><button class="btn btn--text btn--danger" data-action="clear-all">' + icon('delete') + 'Effacer toutes les données</button></div></div></section>';

    return out + '</div>';
  }

  /* ---------- Thème ---------- */
  function applyTheme() {
    var t = state.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--c-surface').trim() || '#FFFFFF');
  }

  /* =========================================================
     Superpositions : feuilles, dialogues, menus, plein écran
     ========================================================= */
  var overlays = [];
  var ignorePop = 0;
  var afterPop = [];

  function pushHistory(ov) {
    try { history.pushState({ trousseOverlay: true }, ''); ov.pushed = true; } catch (e) { ov.pushed = false; }
  }

  function focusables(root) {
    return $all('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  function closeOverlay(ov, opts) {
    opts = opts || {};
    var i = overlays.indexOf(ov);
    if (i < 0) { if (opts.then) opts.then(); return; }
    overlays.splice(i, 1);
    ov.teardown();
    if (ov.onClose) ov.onClose();
    var restore = ov.trigger;
    if (!opts.then && restore && document.contains(restore)) restore.focus({ preventScroll: true });
    else if (!opts.then && restore && restore.getAttribute && restore.getAttribute('data-key')) {
      var same = document.querySelector('[data-key="' + restore.getAttribute('data-key') + '"]');
      if (same) same.focus({ preventScroll: true });
    }
    if (ov.pushed && !opts.fromPop) {
      ignorePop++;
      if (opts.then) afterPop.push(opts.then);
      history.back();
    } else if (opts.then) {
      opts.then();
    }
  }
  function closeTop() { if (overlays.length) closeOverlay(overlays[overlays.length - 1]); }
  function topOverlay() { return overlays[overlays.length - 1]; }

  window.addEventListener('popstate', function () {
    if (ignorePop > 0) {
      ignorePop--;
      var fns = afterPop.splice(0);
      fns.forEach(function (fn) { fn(); });
      return;
    }
    if (overlays.length) closeOverlay(topOverlay(), { fromPop: true });
  });

  /* Feuille du bas (bottom sheet) */
  function openSheet(o) {
    var root = $('#overlay-root');
    var titleId = 'sheet-' + uid();
    var scrim = document.createElement('div');
    scrim.className = 'scrim';
    var el = document.createElement('div');
    el.className = 'sheet' + (o.full ? ' sheet--full' : '');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', titleId);
    el.tabIndex = -1;
    el.innerHTML = '<div class="sheet__handle" data-drag aria-hidden="true"></div><div class="sheet__content">' +
      '<div class="sheet__head"><h2 class="t-title-l" id="' + titleId + '"></h2>' +
      '<button class="icon-btn" data-action="close-overlay" aria-label="Fermer">' + icon('close') + '</button></div>' +
      (o.head ? '<div class="sheet__extra">' + o.head() + '</div>' : '') +
      '<div class="sheet__body"></div>' + (o.foot ? '<div class="sheet__foot"></div>' : '') + '</div>';
    root.appendChild(scrim);
    root.appendChild(el);

    var ov = {
      type: 'sheet', el: el, trigger: document.activeElement, ctx: o.ctx || {}, onClose: o.onClose,
      refresh: function () {
        var body = $('.sheet__body', el);
        var active = document.activeElement;
        var key = active && el.contains(active) ? active.getAttribute('data-key') : null;
        var scroll = body.scrollTop;
        $('#' + titleId, el).textContent = o.title();
        body.innerHTML = o.body();
        body.scrollTop = scroll;
        if (o.foot) $('.sheet__foot', el).innerHTML = o.foot();
        if (key) {
          var next = el.querySelector('[data-key="' + key + '"]');
          if (next) next.focus({ preventScroll: true });
          else el.focus({ preventScroll: true });
        }
      },
      teardown: function () {
        scrim.classList.remove('is-open');
        el.classList.add('is-closing');
        var done = function () { scrim.remove(); el.remove(); };
        if (reducedMotion()) done(); else setTimeout(done, 220);
      }
    };
    ov.refresh();
    overlays.push(ov);
    pushHistory(ov);
    scrim.addEventListener('click', function () { closeOverlay(ov); });
    enableDrag(ov);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrim.classList.add('is-open');
        el.classList.add('is-open');
      });
    });
    var first = o.initialFocus ? el.querySelector(o.initialFocus) : null;
    (first || el).focus({ preventScroll: true });
    return ov;
  }

  /* Glisser la poignée vers le bas pour fermer */
  function enableDrag(ov) {
    var handle = $('[data-drag]', ov.el);
    var startY = 0, dy = 0, dragging = false, t0 = 0;
    handle.addEventListener('pointerdown', function (e) {
      dragging = true; startY = e.clientY; dy = 0; t0 = performance.now();
      ov.el.style.transition = 'none';
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      ov.el.style.transform = 'translateY(' + dy + 'px)';
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      ov.el.style.transition = '';
      ov.el.style.transform = '';
      var velocity = dy / Math.max(1, performance.now() - t0);
      if (dy > 96 || velocity > 0.6) closeOverlay(ov);
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /* Dialogue de confirmation */
  function openDialog(o) {
    var root = $('#overlay-root');
    var id = 'dlg-' + uid();
    var scrim = document.createElement('div');
    scrim.className = 'scrim';
    var el = document.createElement('div');
    el.className = 'dialog';
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', id + '-t');
    el.setAttribute('aria-describedby', id + '-d');
    el.innerHTML = '<h2 class="t-headline" style="font-size:1.5rem;line-height:2rem" id="' + id + '-t">' + h(o.title) + '</h2>' +
      '<p class="t-body muted" id="' + id + '-d">' + h(o.text) + '</p>' +
      '<div class="dialog__actions"><button class="btn btn--text" data-dlg="cancel">' + h(o.cancel || 'Annuler') + '</button>' +
      '<button class="btn btn--text' + (o.danger ? ' btn--danger' : '') + '" data-dlg="ok">' + h(o.confirm) + '</button></div>';
    root.appendChild(scrim);
    root.appendChild(el);
    var ov = {
      type: 'dialog', el: el, trigger: document.activeElement,
      teardown: function () {
        scrim.classList.remove('is-open'); el.classList.remove('is-open');
        setTimeout(function () { scrim.remove(); el.remove(); }, reducedMotion() ? 0 : 200);
      }
    };
    overlays.push(ov);
    pushHistory(ov);
    scrim.addEventListener('click', function () { closeOverlay(ov); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dlg]');
      if (!b) return;
      if (b.getAttribute('data-dlg') === 'ok') closeOverlay(ov, { then: o.onConfirm });
      else closeOverlay(ov);
    });
    requestAnimationFrame(function () { scrim.classList.add('is-open'); el.classList.add('is-open'); });
    $('[data-dlg="cancel"]', el).focus();
    return ov;
  }

  /* Menu contextuel */
  function openMenu(anchor, items) {
    var root = $('#overlay-root');
    var catcher = document.createElement('div');
    catcher.className = 'menu-scrim';
    var el = document.createElement('div');
    el.className = 'menu';
    el.setAttribute('role', 'menu');
    el.innerHTML = items.map(function (it, i) {
      return '<button class="menu__item' + (it.danger ? ' menu__item--danger' : '') + '" role="menuitem" data-mi="' + i + '" tabindex="-1">' + icon(it.icon) + h(it.label) + '</button>';
    }).join('');
    root.appendChild(catcher);
    root.appendChild(el);
    var rect = anchor.getBoundingClientRect();
    el.style.top = Math.min(rect.bottom + 4, window.innerHeight - el.offsetHeight - 8) + 'px';
    el.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
    var ov = {
      type: 'menu', el: el, trigger: anchor,
      teardown: function () { catcher.remove(); el.remove(); }
    };
    overlays.push(ov);
    catcher.addEventListener('click', function () { closeOverlay(ov); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mi]');
      if (!b) return;
      var it = items[+b.getAttribute('data-mi')];
      closeOverlay(ov, { then: it.run });
    });
    el.addEventListener('keydown', function (e) {
      var btns = $all('.menu__item', el);
      var idx = btns.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); btns[(idx + 1) % btns.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); btns[(idx - 1 + btns.length) % btns.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); btns[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); btns[btns.length - 1].focus(); }
      else if (e.key === 'Tab') { e.preventDefault(); closeOverlay(ov); }
    });
    requestAnimationFrame(function () { el.classList.add('is-open'); });
    $('.menu__item', el).focus();
  }

  /* Plein écran : montrer au vendeur (transformation depuis la vignette) */
  function openViewer(p, imgURL, source) {
    var root = $('#overlay-root');
    var el = document.createElement('div');
    el.className = 'viewer';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Photo de ' + (p.name || 'produit'));
    var details = [p.brand, p.format].filter(Boolean).map(h).join(' · ');
    el.innerHTML = '<div class="viewer__bar"><button class="icon-btn" data-action="close-overlay" aria-label="Fermer">' + icon('close') + '</button></div>' +
      '<div class="viewer__stage">' + (imgURL ? '<img src="' + imgURL + '" alt="' + h(p.name) + '">' : '<div class="viewer__empty" aria-hidden="true">' + initial(p.name) + '</div>') + '</div>' +
      '<div class="viewer__caption"><p class="t-headline">' + h(p.name || 'Produit sans nom') + '</p>' +
      (details ? '<p>' + details + '</p>' : '') + (p.note ? '<p>' + h(p.note) + '</p>' : '') +
      (!imgURL ? '<p>Pas encore de photo pour ce produit.</p>' : '') + '</div>';
    root.appendChild(el);
    var ov = {
      type: 'viewer', el: el, trigger: document.activeElement,
      teardown: function () {
        el.classList.remove('is-open');
        setTimeout(function () { el.remove(); }, reducedMotion() ? 0 : 250);
      }
    };
    overlays.push(ov);
    pushHistory(ov);
    requestAnimationFrame(function () { el.classList.add('is-open'); });
    $('.icon-btn', el).focus();

    // Arcs : l'image part de la vignette pour rejoindre sa place
    var img = $('.viewer__stage img', el);
    var srcImg = source && source.querySelector ? source.querySelector('img') : null;
    if (img && srcImg && !reducedMotion()) {
      var go = function () {
        var a = srcImg.getBoundingClientRect(), b = img.getBoundingClientRect();
        if (!b.width || !a.width) return;
        img.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')';
        img.style.opacity = '.6';
        void img.offsetWidth;
        img.style.transition = 'transform 400ms cubic-bezier(.05,.7,.1,1), opacity 200ms linear';
        img.style.transform = 'none';
        img.style.opacity = '1';
      };
      if (img.decode) img.decode().then(go).catch(function () {}); else img.onload = go;
    }
  }

  /* ---------- Snackbar ---------- */
  var snackTimer = null;
  function snackbar(text, action) {
    var el = $('#snackbar');
    clearTimeout(snackTimer);
    el.classList.remove('is-open');
    el.innerHTML = '<span class="snackbar__text">' + h(text) + '</span>' +
      (action ? '<button class="btn btn--text" data-snack>' + h(action.label) + '</button>' : '');
    var btn = $('[data-snack]', el);
    if (btn) btn.addEventListener('click', function () { hideSnack(); action.run(); });
    requestAnimationFrame(function () { el.classList.add('is-open'); });
    snackTimer = setTimeout(hideSnack, action ? 8000 : 4000);
  }
  function hideSnack() {
    var el = $('#snackbar');
    el.classList.remove('is-open');
    setTimeout(function () { if (!el.classList.contains('is-open')) el.innerHTML = ''; }, 300);
  }

  /* =========================================================
     Feuilles métier
     ========================================================= */

  /* Créer ou renommer une liste */
  function openListSheet(list) {
    var isNew = !list;
    var form = { name: list ? list.name : '', budget: list && list.budget ? fmtInput(list.budget) : '', error: null, budgetError: null };
    var ov = openSheet({
      title: function () { return isNew ? 'Nouvelle liste' : 'Modifier la liste'; },
      body: function () {
        return '<div class="sheet__pad">' +
          '<div class="field"><label class="field__label" for="list-name">Nom de la liste <span class="req" aria-hidden="true">*</span></label>' +
          '<input class="input" id="list-name" data-input="list-form" data-field="name" value="' + h(form.name) + '" placeholder="Ex. Courses du mois" required aria-required="true" enterkeyhint="done" autocomplete="off" data-key="list-name"' +
          (form.error ? ' aria-invalid="true" aria-describedby="list-name-err"' : '') + '>' +
          (form.error ? '<span class="field__error" id="list-name-err">' + icon('error') + h(form.error) + '</span>' : '') + '</div>' +
          (isNew ? '<div class="chips chips--wrap" role="group" aria-label="Suggestions de nom">' + LIST_SUGGESTIONS.map(function (s) {
            return '<button class="chip" data-action="list-suggest" data-value="' + h(s) + '" aria-pressed="' + (form.name === s) + '">' + icon('check') + h(s) + '</button>';
          }).join('') + '</div>' : '') +
          '<div class="field"><label class="field__label" for="list-budget">Budget (facultatif)</label>' +
          '<div class="rate-row" style="grid-template-columns:minmax(0,1fr) auto"><input class="input num" id="list-budget" inputmode="decimal" data-input="list-form" data-field="budget" value="' + h(form.budget) + '" placeholder="Ex. 50" enterkeyhint="done" data-key="list-budget"' +
          (form.budgetError ? ' aria-invalid="true" aria-describedby="list-budget-err"' : ' aria-describedby="list-budget-help"') + '><span class="t-label">' + state.settings.currency + '</span></div>' +
          (form.budgetError ? '<span class="field__error" id="list-budget-err">' + icon('error') + h(form.budgetError) + '</span>'
            : '<span class="field__help" id="list-budget-help">L\'estimation vous prévient si elle le dépasse.</span>') + '</div></div>';
      },
      foot: function () {
        return '<button class="btn btn--text" data-action="close-overlay">Annuler</button>' +
          '<button class="btn btn--filled" data-action="submit-list">' + (isNew ? 'Créer' : 'Enregistrer') + '</button>';
      },
      initialFocus: '#list-name',
      ctx: { kind: 'list-form', form: form, list: list }
    });
    ov.ctx.submit = function () {
      var name = form.name.trim();
      var budget = parseAmount(form.budget);
      form.error = name ? null : 'Donnez un nom à la liste';
      form.budgetError = (budget !== null && (isNaN(budget) || budget <= 0)) ? 'Montant non valide. Exemple : 50 ou 49,90' : null;
      if (form.error || form.budgetError) {
        ov.refresh();
        var bad = $(form.error ? '#list-name' : '#list-budget', ov.el);
        if (bad) bad.focus();
        return;
      }
      if (isNew) {
        var l = { id: uid(), name: name, budget: budget || null, archived: false, archivedAt: null, items: [], createdAt: Date.now(), updatedAt: Date.now() };
        state.lists.push(l);
        save();
        closeOverlay(ov, {
          then: function () {
            afterRenderQueue.push(function () { openAddSheet(l.id); });
            go('/liste/' + l.id);
          }
        });
      } else {
        list.name = name;
        list.budget = budget || null;
        touch(list);
        save();
        closeOverlay(ov);
        render();
        snackbar('Liste modifiée');
      }
    };
  }

  /* Ajouter des produits à une liste (recherche + création rapide) */
  function openAddSheet(listId) {
    var list = getList(listId);
    if (!list) return;
    var ctx = { kind: 'add', listId: listId, q: '' };
    var ov = openSheet({
      full: true,
      title: function () { return 'Ajouter à « ' + list.name + ' »'; },
      head: function () {
        return '<div class="search" role="search">' + icon('search') +
          '<input type="search" id="add-q" data-input="add-q" placeholder="Rechercher ou créer un produit" aria-label="Rechercher ou créer un produit" autocomplete="off" enterkeyhint="done" data-key="add-q">' +
          '<button class="icon-btn" data-action="clear-add-q" aria-label="Effacer la recherche" hidden>' + icon('close') + '</button></div>';
      },
      body: function () { return addResults(list, ctx.q); },
      foot: function () {
        var n = list.items.length;
        return '<button class="btn btn--text" data-action="add-full-form">Fiche complète</button>' +
          '<button class="btn btn--filled" data-action="close-overlay">Terminé' + (n ? ' (' + n + ')' : '') + '</button>';
      },
      initialFocus: state.products.length > 6 ? null : '#add-q',
      ctx: ctx,
      onClose: function () { render(); }
    });
    return ov;
  }

  function addResults(list, q) {
    var nq = norm(q);
    var inList = {};
    list.items.forEach(function (it) { inList[it.productId] = it; });
    var found = state.products.filter(function (p) { return matches(p, nq); }).sort(function (a, b) {
      var ia = inList[a.id] ? 0 : 1, ib = inList[b.id] ? 0 : 1;
      return nq ? byName(a, b) : (ia - ib) || byName(a, b);
    });
    var exact = nq && state.products.some(function (p) { return norm(p.name) === nq; });
    var out = '<ul class="rows">';
    if (q.trim() && !exact) {
      out += '<li><button class="row state" data-action="quick-create" data-key="quick-create"><span class="thumb" aria-hidden="true">' + icon('add') + '</span>' +
        '<span class="row__main"><span class="t-title-m">Ajouter « ' + h(q.trim()) + ' »</span><span class="t-body muted">Nouveau produit, ajouté à la liste</span></span></button></li>';
    }
    out += found.map(function (p) {
      var it = inList[p.id];
      var r = productRange(p);
      var meta = [p.brand, p.format].filter(Boolean).map(h).join(' · ');
      var control = it
        ? '<span class="stepper" role="group" aria-label="Quantité de ' + h(p.name) + '">' +
          '<button class="icon-btn icon-btn--tonal" data-action="add-qty" data-product="' + p.id + '" data-delta="-1" aria-label="' + (it.qty > 1 ? 'Diminuer' : 'Retirer de la liste') + '" data-key="dec-' + p.id + '">' + icon(it.qty > 1 ? 'minus' : 'delete') + '</button>' +
          '<span class="stepper__value" aria-live="polite">' + it.qty + '</span>' +
          '<button class="icon-btn icon-btn--tonal" data-action="add-qty" data-product="' + p.id + '" data-delta="1" aria-label="Augmenter" data-key="inc-' + p.id + '">' + icon('add') + '</button></span>'
        : '<button class="icon-btn icon-btn--tonal" data-action="add-product" data-product="' + p.id + '" aria-label="Ajouter « ' + h(p.name) + ' » à la liste" data-key="addp-' + p.id + '">' + icon('add') + '</button>';
      return '<li><div class="row">' + thumb(p) +
        '<span class="row__main"><span class="t-title-m">' + h(p.name) + '</span><span class="t-body muted">' +
        (it ? 'Dans la liste' + (meta ? ' · ' : '') : '') + meta + (r.min != null ? (meta || it ? ' · ' : '') + '<span class="num">' + fmtRange(r.min, r.max) + '</span>' : '') +
        '</span></span>' + control + '</div></li>';
    }).join('');
    out += '</ul>';
    if (!state.products.length && !q.trim()) {
      out += '<div class="empty"><p class="t-body muted">Votre catalogue est vide. Tapez le nom d\'un produit pour le créer et l\'ajouter.</p></div>';
    }
    return out;
  }

  /* Détail d'une ligne de liste */
  function openItemSheet(listId, productId) {
    var list = getList(listId), p = getProduct(productId);
    if (!list || !p) return;
    var ctx = { kind: 'item', listId: listId, productId: productId };
    openSheet({
      title: function () { return p.name; },
      body: function () {
        var it = list.items.find(function (x) { return x.productId === productId; });
        if (!it) return '';
        var r = productRange(p);
        var meta = [p.brand, p.format, p.category].filter(Boolean).map(h).join(' · ');
        var prices = p.prices.length
          ? '<ul class="rows">' + p.prices.slice().sort(function (a, b) {
            var va = convert(a.amount, a.currency), vb = convert(b.amount, b.currency);
            return (va == null ? Infinity : va) - (vb == null ? Infinity : vb);
          }).map(function (pr) {
            var v = convert(pr.amount, pr.currency);
            var isCheapest = r.cheapest && v != null && Math.abs(v - r.cheapest.value) < 0.005 && p.prices.length > 1;
            return '<li class="row" style="min-height:56px;padding-inline:0"><span class="row__main"><span class="t-title-m num">' + fmt(pr.amount, pr.currency) +
              (pr.currency !== state.settings.currency && v != null ? ' <span class="t-body muted">≈ ' + fmt(v) + '</span>' : '') + '</span>' +
              '<span class="t-body muted">' + (pr.shop ? h(pr.shop) : 'Magasin non précisé') + (v == null ? ' · taux manquant' : '') + '</span></span>' +
              (isCheapest ? '<span class="t-label-m" style="color:var(--c-primary)">Le moins cher</span>' : '') + '</li>';
          }).join('') + '</ul>'
          : '<p class="t-body muted">Aucun prix enregistré. Ajoutez-en depuis la fiche du produit pour l\'inclure dans l\'estimation.</p>';
        return '<div class="sheet__pad">' +
          '<div style="display:flex;gap:var(--s-4);align-items:center">' +
          '<button class="state" data-action="show-product" data-product="' + p.id + '" aria-label="Montrer la photo de ' + h(p.name) + '" style="border:0;padding:0;background:none;border-radius:var(--r-lg)" data-key="item-thumb">' + thumb(p, true) + '</button>' +
          '<div class="row__main">' + (meta ? '<span class="t-body muted">' + meta + '</span>' : '') +
          (p.note ? '<span class="t-body">' + h(p.note) + '</span>' : '') + '</div></div>' +
          '<div class="field"><span class="field__label" id="qty-l">Quantité</span>' +
          '<span class="stepper" role="group" aria-labelledby="qty-l">' +
          '<button class="icon-btn icon-btn--tonal" data-action="item-qty" data-delta="-1" aria-label="Diminuer la quantité"' + (it.qty <= 1 ? ' disabled' : '') + ' data-key="iq-dec">' + icon('minus') + '</button>' +
          '<span class="stepper__value" aria-live="polite">' + it.qty + '</span>' +
          '<button class="icon-btn icon-btn--tonal" data-action="item-qty" data-delta="1" aria-label="Augmenter la quantité" data-key="iq-inc">' + icon('add') + '</button></span></div>' +
          '<div class="field"><span class="field__label" id="prio-l">Priorité</span>' +
          '<div class="segmented segmented--flush" role="group" aria-labelledby="prio-l">' +
          [1, 2, 3].map(function (pr) { return segOpt('item-prio', String(pr), PRIORITIES[pr].label, it.priority === pr); }).join('') + '</div></div>' +
          '<div class="field"><span class="field__label">Prix' + (it.qty > 1 && r.min != null ? ' · total ' + fmtRange(r.min * it.qty, r.max * it.qty) : '') + '</span>' + prices + '</div>' +
          '<div class="photo__actions" style="margin:0">' +
          '<button class="btn btn--tonal" data-action="show-product" data-product="' + p.id + '">' + icon('eye') + 'Montrer au vendeur</button>' +
          '<button class="btn btn--outlined" data-action="edit-product" data-product="' + p.id + '">' + icon('edit') + 'Modifier le produit</button></div>' +
          '<div><button class="btn btn--text btn--danger" data-action="item-remove">' + icon('delete') + 'Retirer de la liste</button></div></div>';
      },
      ctx: ctx
    });
  }

  /* Ajouter un produit enregistré à une ou plusieurs listes */
  function openToListSheet(productId) {
    var p = getProduct(productId);
    if (!p) return;
    openSheet({
      title: function () { return 'Ajouter à une liste'; },
      body: function () {
        var lists = state.lists.filter(function (l) { return !l.archived; }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
        if (!lists.length) return '<div class="empty"><p class="t-body muted">Aucune liste en cours.</p></div>';
        return '<ul class="rows">' + lists.map(function (l) {
          var inside = l.items.some(function (it) { return it.productId === productId; });
          return '<li><button class="row state" data-action="toggle-in-list" data-id="' + l.id + '" aria-pressed="' + inside + '" data-key="tl-' + l.id + '">' +
            '<span class="row__main"><span class="t-title-m">' + h(l.name) + '</span><span class="t-body muted">' + (inside ? 'Déjà dans cette liste' : plural(l.items.length, 'produit', 'produits')) + '</span></span>' +
            (inside ? '<span style="color:var(--c-primary)">' + icon('check') + '</span>' : '<span class="muted">' + icon('add') + '</span>') + '</button></li>';
        }).join('') + '</ul>';
      },
      foot: function () { return '<button class="btn btn--text" data-action="new-list">Nouvelle liste</button><button class="btn btn--filled" data-action="close-overlay">Terminé</button>'; },
      ctx: { kind: 'to-list', productId: productId }
    });
  }

  /* =========================================================
     Actions
     ========================================================= */
  function sheetCtx() { var o = topOverlay(); return o && o.ctx ? o.ctx : {}; }

  function addToList(list, productId) {
    if (list.items.some(function (it) { return it.productId === productId; })) return;
    list.items.push({ productId: productId, qty: 1, priority: 2, checked: false });
    touch(list);
  }

  function snapshot() { return JSON.stringify({ products: state.products, lists: state.lists }); }
  function restore(snap) {
    var s = JSON.parse(snap);
    state.products = s.products;
    state.lists = s.lists;
    save();
  }

  function deleteList(list) {
    var snap = snapshot();
    state.lists = state.lists.filter(function (l) { return l.id !== list.id; });
    save();
    var onList = parseRoute().view === 'liste';
    if (onList) goBack('/listes'); else render();
    snackbar('Liste « ' + list.name + ' » supprimée', { label: 'Annuler', run: function () { restore(snap); render(); } });
  }

  function duplicateList(list, opts) {
    var copy = {
      id: uid(), name: opts && opts.reuse ? list.name : list.name + ' (copie)', budget: list.budget, archived: false, archivedAt: null,
      items: list.items.filter(function (it) { return getProduct(it.productId); }).map(function (it) { return { productId: it.productId, qty: it.qty, priority: it.priority, checked: false }; }),
      createdAt: Date.now(), updatedAt: Date.now()
    };
    state.lists.push(copy);
    save();
    go('/liste/' + copy.id);
    snackbar(opts && opts.reuse ? 'Liste prête à être réutilisée' : 'Liste dupliquée');
  }

  function listAsText(list) {
    var e = estimate(list);
    var lines = [list.name];
    list.items.forEach(function (it) {
      var p = getProduct(it.productId);
      if (!p) return;
      var r = productRange(p);
      lines.push((it.checked ? '[x] ' : '[ ] ') + (it.qty > 1 ? it.qty + ' × ' : '') + p.name +
        (p.brand ? ' (' + p.brand + ')' : '') + (r.min != null ? ' : ' + fmtRange(r.min * it.qty, r.max * it.qty) : ''));
    });
    if (e.priced) lines.push('', 'Estimation : ' + fmtRange(e.min, e.max));
    return lines.join('\n');
  }

  function shareList(list) {
    var text = listAsText(list);
    if (navigator.share) {
      navigator.share({ title: list.name, text: text }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { snackbar('Liste copiée dans le presse-papiers'); },
        function () { snackbar('Copie impossible sur ce navigateur'); });
    } else {
      snackbar('Partage non disponible sur ce navigateur');
    }
  }

  function deleteProduct(id) {
    var p = getProduct(id);
    if (!p) return;
    var snap = snapshot();
    getImageBlob(id).then(function (blob) {
      state.products = state.products.filter(function (x) { return x.id !== id; });
      state.lists.forEach(function (l) { l.items = l.items.filter(function (it) { return it.productId !== id; }); });
      save();
      deleteImage(id);
      draft = null;
      goBack('/produits');
      snackbar('« ' + p.name + ' » supprimé', {
        label: 'Annuler', run: function () {
          restore(snap);
          if (blob) putImage(id, blob);
          render();
        }
      });
    });
  }

  function saveProduct() {
    var d = draft;
    if (!d) return;
    d.errors = {};
    var name = d.name.trim();
    if (!name) d.errors.name = 'Indiquez le nom du produit';
    var prices = [];
    d.prices.forEach(function (pr, i) {
      var amount = parseAmount(pr.amount);
      if (amount === null) {
        if (pr.shop.trim()) d.errors['price-' + i] = 'Indiquez un montant';
        return;
      }
      if (isNaN(amount)) { d.errors['price-' + i] = 'Montant non valide. Exemple : 4,50'; return; }
      prices.push({ id: pr.id, amount: amount, currency: pr.currency, shop: pr.shop.trim() });
    });
    if (Object.keys(d.errors).length) {
      render();
      var first = $('[aria-invalid="true"]', $('#main'));
      if (first) first.focus();
      return;
    }
    var isNew = !d.id;
    var p = isNew ? { id: uid(), createdAt: Date.now() } : getProduct(d.id);
    if (!p) return;
    p.name = name;
    p.brand = d.brand.trim();
    p.format = d.format.trim();
    p.category = d.category;
    p.note = d.note.trim();
    p.prices = prices;
    p.updatedAt = Date.now();
    if (isNew) state.products.push(p);
    if (d.image instanceof Blob) putImage(p.id, d.image);
    else if (d.image === null) deleteImage(p.id);
    var list = d.listId ? getList(d.listId) : null;
    if (isNew && list) addToList(list, p.id);
    save();
    if (d.imageURL) URL.revokeObjectURL(d.imageURL);
    draft = null;
    if (isNew && list) {
      goBack('/liste/' + list.id);
      snackbar('« ' + p.name + ' » ajouté à la liste');
    } else {
      goBack('/produits');
      snackbar(isNew ? 'Produit enregistré' : 'Modifications enregistrées');
    }
  }

  var actions = {
    'back': function (el) { goBack(el.getAttribute('data-fallback') || '/listes'); },
    'close-overlay': function () { closeTop(); },
    'new-list': function () {
      var o = topOverlay();
      if (o && o.ctx && o.ctx.kind === 'to-list') closeOverlay(o, { then: function () { openListSheet(null); } });
      else openListSheet(null);
    },
    'submit-list': function () { var c = sheetCtx(); if (c.submit) c.submit(); },
    'list-suggest': function (el) {
      var c = sheetCtx();
      if (c.form) { c.form.name = el.getAttribute('data-value'); c.form.error = null; topOverlay().refresh(); var i = $('#list-name'); if (i) i.focus(); }
    },
    'list-menu': function (el) {
      var list = getList(el.getAttribute('data-id'));
      if (!list) return;
      openMenu(el, [
        { label: 'Modifier le nom ou le budget', icon: 'edit', run: function () { openListSheet(list); } },
        { label: 'Dupliquer', icon: 'copy', run: function () { duplicateList(list); } },
        { label: 'Partager en texte', icon: 'share', run: function () { shareList(list); } },
        list.archived
          ? { label: 'Remettre en cours', icon: 'unarchive', run: function () { list.archived = false; list.archivedAt = null; touch(list); save(); render(); snackbar('Liste remise en cours'); } }
          : { label: 'Terminer la liste', icon: 'archive', run: function () { actions['archive-list'](el); } },
        { label: 'Supprimer', icon: 'delete', danger: true, run: function () { deleteList(list); } }
      ]);
    },
    'archive-list': function (el) {
      var list = getList(el.getAttribute('data-id'));
      if (!list) return;
      list.archived = true;
      list.archivedAt = Date.now();
      save();
      goBack('/listes');
      snackbar('Liste terminée. Retrouvez-la dans « Terminées ».', {
        label: 'Annuler', run: function () { list.archived = false; list.archivedAt = null; save(); render(); }
      });
    },
    'reuse-list': function (el) { var l = getList(el.getAttribute('data-id')); if (l) duplicateList(l, { reuse: true }); },
    'uncheck-all': function (el) {
      var list = getList(el.getAttribute('data-id'));
      if (!list) return;
      list.items.forEach(function (it) { it.checked = false; });
      touch(list); save(); render();
    },
    'group': function (el) { state.settings.groupBy = el.getAttribute('data-value'); save(); render(); },
    'add-items': function (el) { openAddSheet(el.getAttribute('data-id')); },
    'item-sheet': function (el) { openItemSheet(el.getAttribute('data-list'), el.getAttribute('data-product')); },
    'item-qty': function (el) {
      var c = sheetCtx(), list = getList(c.listId);
      var it = list && list.items.find(function (x) { return x.productId === c.productId; });
      if (!it) return;
      it.qty = Math.max(1, it.qty + parseInt(el.getAttribute('data-delta'), 10));
      touch(list); save(); topOverlay().refresh(); render();
    },
    'item-prio': function (el) {
      var c = sheetCtx(), list = getList(c.listId);
      var it = list && list.items.find(function (x) { return x.productId === c.productId; });
      if (!it) return;
      it.priority = parseInt(el.getAttribute('data-value'), 10);
      touch(list); save(); topOverlay().refresh(); render();
    },
    'item-remove': function () {
      var c = sheetCtx(), list = getList(c.listId), p = getProduct(c.productId);
      if (!list) return;
      var snap = snapshot();
      list.items = list.items.filter(function (x) { return x.productId !== c.productId; });
      touch(list); save();
      closeTop();
      render();
      snackbar('« ' + (p ? p.name : 'Produit') + ' » retiré de la liste', { label: 'Annuler', run: function () { restore(snap); render(); } });
    },
    'edit-product': function (el) {
      var id = el.getAttribute('data-product');
      closeOverlay(topOverlay(), { then: function () { go('/produit/' + id); } });
    },
    'show-product': function (el) {
      var p = getProduct(el.getAttribute('data-product'));
      if (p) openViewer(p, images.get(p.id), $('.thumb', topOverlay() ? topOverlay().el : document));
    },
    'show-draft': function () {
      if (!draft) return;
      openViewer({ name: draft.name, brand: draft.brand, format: draft.format, note: draft.note }, draftImageURL(), $('.photo', $('#main')));
    },
    'add-product': function (el) {
      var list = getList(sheetCtx().listId);
      if (!list) return;
      addToList(list, el.getAttribute('data-product'));
      save();
      topOverlay().refresh();
      render();
    },
    'add-qty': function (el) {
      var list = getList(sheetCtx().listId), id = el.getAttribute('data-product');
      if (!list) return;
      var it = list.items.find(function (x) { return x.productId === id; });
      if (!it) return;
      var next = it.qty + parseInt(el.getAttribute('data-delta'), 10);
      if (next < 1) {
        list.items = list.items.filter(function (x) { return x !== it; });
        var target = $('[data-key="dec-' + id + '"]');
        if (target) target.setAttribute('data-key', 'addp-' + id); // garde le focus sur la ligne
      } else it.qty = next;
      touch(list); save(); topOverlay().refresh(); render();
    },
    'quick-create': function () {
      var c = sheetCtx(), list = getList(c.listId);
      var name = (c.q || '').trim();
      if (!list || !name) return;
      var p = { id: uid(), name: name, brand: '', format: '', category: '', note: '', prices: [], createdAt: Date.now(), updatedAt: Date.now() };
      state.products.push(p);
      addToList(list, p.id);
      save();
      c.q = '';
      var input = $('#add-q');
      if (input) { input.value = ''; input.focus(); }
      var clear = $('[data-action="clear-add-q"]', topOverlay().el);
      if (clear) clear.hidden = true;
      topOverlay().refresh();
      render();
      snackbar('« ' + name + ' » ajouté. Ajoutez son prix en touchant la ligne.');
    },
    'clear-add-q': function (el) {
      var c = sheetCtx();
      c.q = '';
      var input = $('#add-q');
      if (input) { input.value = ''; input.focus(); }
      el.hidden = true;
      topOverlay().refresh();
    },
    'add-full-form': function () {
      var c = sheetCtx();
      var q = (c.q || '').trim();
      closeOverlay(topOverlay(), { then: function () { go('/produit/nouveau?liste=' + c.listId + (q ? '&nom=' + encodeURIComponent(q) : '')); } });
    },
    'toggle-in-list': function (el) {
      var c = sheetCtx(), list = getList(el.getAttribute('data-id'));
      if (!list) return;
      if (list.items.some(function (it) { return it.productId === c.productId; })) {
        list.items = list.items.filter(function (it) { return it.productId !== c.productId; });
      } else addToList(list, c.productId);
      touch(list); save(); topOverlay().refresh();
    },
    'product-cat': function (el) {
      productCat = el.getAttribute('data-value');
      render();
    },
    'clear-product-q': function () {
      productQuery = '';
      render();
      var i = $('#product-q');
      if (i) i.focus();
    },
    'product-back': function () {
      if (draft && draft.dirty) {
        openDialog({
          title: 'Abandonner les modifications ?', text: 'Les changements apportés à ce produit ne seront pas enregistrés.',
          confirm: 'Abandonner', cancel: 'Continuer la saisie', danger: true,
          onConfirm: function () { draft = null; goBack('/produits'); }
        });
      } else { draft = null; goBack('/produits'); }
    },
    'product-menu': function (el) {
      if (!draft || !draft.id) return;
      var id = draft.id;
      openMenu(el, [
        { label: 'Ajouter à une liste', icon: 'addList', run: function () { openToListSheet(id); } },
        { label: 'Supprimer le produit', icon: 'delete', danger: true, run: function () { deleteProduct(id); } }
      ]);
    },
    'delete-product': function () { if (draft && draft.id) deleteProduct(draft.id); },
    'add-price': function () {
      if (!draft) return;
      var last = draft.prices[draft.prices.length - 1];
      draft.prices.push({ id: uid(), amount: '', currency: last ? last.currency : state.settings.currency, shop: '' });
      draft.dirty = true;
      var id = draft.prices[draft.prices.length - 1].id;
      render();
      var input = $('[data-key="pa-' + id + '"]');
      if (input) input.focus();
    },
    'remove-price': function (el) {
      if (!draft) return;
      draft.prices.splice(+el.getAttribute('data-index'), 1);
      draft.errors = {};
      draft.dirty = true;
      render();
      var btn = $('[data-key="add-price"]');
      if (btn) btn.focus();
    },
    'remove-photo': function () {
      if (!draft) return;
      if (draft.imageURL) URL.revokeObjectURL(draft.imageURL);
      draft.imageURL = null;
      draft.image = null;
      draft.dirty = true;
      render();
    },
    'theme': function (el) {
      state.settings.theme = el.getAttribute('data-value');
      save(); applyTheme(); render();
    },
    'export': function () { exportData(); },
    'install': function () {
      if (!installEvent) return;
      installEvent.prompt();
      installEvent.userChoice.finally(function () { installEvent = null; render(); });
    },
    'clear-all': function () {
      openDialog({
        title: 'Effacer toutes les données ?',
        text: 'Toutes vos listes, vos produits et leurs photos seront supprimés de ce téléphone. Exportez une sauvegarde avant si vous voulez les garder.',
        confirm: 'Tout effacer', danger: true,
        onConfirm: function () {
          var theme = state.settings.theme;
          state = defaults();
          state.settings.theme = theme;
          save();
          clearImages();
          render();
          snackbar('Toutes les données ont été effacées');
        }
      });
    }
  };

  /* Changements (cases, fichiers, sélecteurs) */
  var toggleTimer = null;
  var changes = {
    'toggle-item': function (el) {
      var list = getList(el.getAttribute('data-list'));
      var it = list && list.items.find(function (x) { return x.productId === el.getAttribute('data-product'); });
      if (!it) return;
      it.checked = el.checked;
      if (el.checked) el.classList.add('pop');
      touch(list); save();
      clearTimeout(toggleTimer);
      // Laisse la case s'écraser puis rebondir avant de déplacer la ligne
      toggleTimer = setTimeout(function () { render(); }, reducedMotion() ? 0 : 320);
    },
    'photo': function (el) {
      var file = el.files && el.files[0];
      if (!file || !draft) return;
      if (!/^image\//.test(file.type)) { snackbar('Ce fichier n\'est pas une image'); return; }
      var d = draft;
      compressImage(file).then(function (blob) {
        if (draft !== d) return;
        if (d.imageURL) URL.revokeObjectURL(d.imageURL);
        d.image = blob;
        d.imageURL = URL.createObjectURL(blob);
        d.dirty = true;
        render();
      });
    },
    'main-currency': function (el) { changeMainCurrency(el.value); render(); },
    'rate': function (el) {
      var cur = el.getAttribute('data-cur');
      var v = parseAmount(el.value);
      if (v === null) delete state.settings.rates[cur];
      else if (isNaN(v) || v <= 0) { snackbar('Taux non valide. Exemple : 0,92'); el.focus(); return; }
      else state.settings.rates[cur] = v;
      save(); render();
    },
    'add-rate': function (el) {
      var cur = el.value;
      if (!cur) return;
      state.settings.rates[cur] = state.settings.rates[cur] || 0;
      render();
      var i = $('#rate-' + cur);
      if (i) i.focus();
    },
    'import': function (el) {
      var file = el.files && el.files[0];
      if (!file) return;
      file.text().then(function (txt) {
        var data;
        try { data = JSON.parse(txt); } catch (e) { snackbar('Fichier illisible : ce n\'est pas une sauvegarde Trousse'); return; }
        if (!data || data.app !== 'trousse' || !data.data) { snackbar('Ce fichier n\'est pas une sauvegarde Trousse'); return; }
        openDialog({
          title: 'Remplacer vos données ?',
          text: 'L\'import remplace toutes les listes et tous les produits actuels par ceux de la sauvegarde.',
          confirm: 'Importer',
          onConfirm: function () { importData(data); }
        });
      });
      el.value = '';
    }
  };

  /* Saisies en direct */
  var inputs = {
    'field': function (el) {
      if (!draft) return;
      draft[el.getAttribute('data-field')] = el.value;
      draft.dirty = true;
      if (el.getAttribute('data-field') === 'name' && draft.errors.name && el.value.trim()) {
        delete draft.errors.name;
        el.removeAttribute('aria-invalid');
        var err = $('#f-name-err');
        if (err) err.remove();
      }
    },
    'price': function (el) {
      if (!draft) return;
      var pr = draft.prices[+el.getAttribute('data-index')];
      if (!pr) return;
      pr[el.getAttribute('data-pf')] = el.value;
      draft.dirty = true;
    },
    'product-q': function (el) {
      productQuery = el.value;
      var res = $('#product-results');
      if (res) res.innerHTML = productResults();
      var clear = $('[data-action="clear-product-q"]');
      if (clear) clear.hidden = !productQuery;
    },
    'add-q': function (el) {
      var c = sheetCtx();
      c.q = el.value;
      var clear = $('[data-action="clear-add-q"]', topOverlay().el);
      if (clear) clear.hidden = !el.value;
      topOverlay().refresh();
    },
    'list-form': function (el) {
      var c = sheetCtx();
      if (!c.form) return;
      c.form[el.getAttribute('data-field')] = el.value;
      if (el.getAttribute('data-field') === 'name') {
        $all('[data-action="list-suggest"]', topOverlay().el).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === el.value));
        });
      }
    }
  };

  /* ---------- Sauvegarde ---------- */
  function blobToDataURL(blob) {
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { resolve(null); };
      r.readAsDataURL(blob);
    });
  }
  function exportData() {
    var ids = state.products.map(function (p) { return p.id; });
    Promise.all(ids.map(function (id) {
      return getImageBlob(id).then(function (b) { return b ? blobToDataURL(b).then(function (u) { return [id, u]; }) : null; });
    })).then(function (pairs) {
      var imgs = {};
      pairs.forEach(function (p) { if (p && p[1]) imgs[p[0]] = p[1]; });
      var payload = { app: 'trousse', version: 1, exportedAt: new Date().toISOString(), data: state, images: imgs };
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'trousse-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      snackbar('Sauvegarde exportée');
    });
  }
  function importData(payload) {
    var theme = state.settings.theme;
    state = sanitize(payload.data);
    state.settings.theme = theme;
    save();
    clearImages().then(function () {
      var imgs = payload.images || {};
      return Promise.all(Object.keys(imgs).map(function (id) {
        return fetch(imgs[id]).then(function (r) { return r.blob(); }).then(function (b) { return putImage(id, b); }).catch(function () {});
      }));
    }).then(function () {
      render();
      snackbar('Sauvegarde importée : ' + plural(state.lists.length, 'liste', 'listes') + ', ' + plural(state.products.length, 'produit', 'produits'));
    });
  }

  /* =========================================================
     Écouteurs globaux
     ========================================================= */
  document.addEventListener('click', function (e) {
    var nav = e.target.closest('.nav__item');
    if (nav && nav.getAttribute('aria-current') === 'page' && depthOf(parseRoute().view) === 0) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
      return;
    }
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var fn = actions[el.getAttribute('data-action')];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-change]');
    if (!el) return;
    var fn = changes[el.getAttribute('data-change')];
    if (fn) fn(el, e);
  });

  document.addEventListener('input', function (e) {
    var el = e.target.closest('[data-input]');
    if (!el) return;
    var fn = inputs[el.getAttribute('data-input')];
    if (fn) fn(el, e);
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id === 'product-form') { e.preventDefault(); saveProduct(); }
  });

  document.addEventListener('keydown', function (e) {
    var ov = topOverlay();
    if (e.key === 'Escape' && ov) { e.preventDefault(); closeOverlay(ov); return; }
    if (e.key === 'Enter') {
      var t = e.target;
      if (t.matches && t.matches('[data-input="list-form"]')) { e.preventDefault(); actions['submit-list'](); return; }
      if (t.id === 'add-q') {
        e.preventDefault();
        var quick = ov && $('[data-action="quick-create"]', ov.el);
        if (quick) actions['quick-create']();
        else t.blur();
        return;
      }
    }
    // Piège à focus dans la superposition du dessus
    if (e.key === 'Tab' && ov && ov.type !== 'menu') {
      var f = focusables(ov.el);
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !ov.el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !ov.el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('scroll', updateTopbar, { passive: true });

  window.addEventListener('hashchange', function () {
    // Ferme les superpositions éventuellement restées ouvertes
    while (overlays.length) { var ov = overlays.pop(); ov.teardown(); }
    var r = parseRoute();
    var prev = routeStack[routeStack.length - 1];
    var isBack = routeStack.length > 1 && routeStack[routeStack.length - 2].full === r.full;
    if (prev) scrollMemory[prev.full] = window.scrollY;
    if (isBack) routeStack.pop(); else routeStack.push(r);
    if (prev && prev.view === 'produit' && r.view !== 'produit') draft = null;
    var anim = 'fade';
    if (prev) {
      var dp = depthOf(prev.view), dn = depthOf(r.view);
      if (dn > dp) anim = 'forward';
      else if (dn < dp || isBack) anim = 'back';
    }
    if (!isBack && anim === 'forward') delete scrollMemory[r.full];
    render(anim);
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvent = e;
    if (parseRoute().view === 'reglages') render();
  });

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { applyTheme(); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);
  }

  /* ---------- Démarrage ---------- */
  applyTheme();
  routeStack.push(parseRoute());
  render('fade');
  loadImages().then(function () { if (images.size) render(); });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
