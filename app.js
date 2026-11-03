// Necess : logique de l'application.
// Sources : docs/necess-essentiel-ux.md (besoins Bxx) et docs/direction/necess-direction-artistique.md.

/* ============================================================
   Stockage local fiable (B70, B71) : IndexedDB, photos en Blob
   ============================================================ */
const DB_NAME = 'necess';
const STORE = 'products';
let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const out = fn(store);
    t.oncomplete = () => resolve(out && 'result' in out ? out.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}
const dbAll = () => tx('readonly', s => s.getAll());
const dbPut = p => tx('readwrite', s => s.put(p));
const dbDelete = id => tx('readwrite', s => s.delete(id));
const dbClear = () => tx('readwrite', s => s.clear());

/* ============================================================
   État
   ============================================================ */
const state = {
  products: [],
  tab: 'liste',
  openId: null,
  query: '',
  onlyIncomplete: false,
  sort: 'name',
};
const photoUrls = new Map(); // id → objectURL

function photoUrl(p) {
  if (!p.photo) return null;
  const cached = photoUrls.get(p.id);
  if (cached && cached.blob === p.photo) return cached.url;
  if (cached) URL.revokeObjectURL(cached.url);
  const url = URL.createObjectURL(p.photo);
  photoUrls.set(p.id, { blob: p.photo, url });
  return url;
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const byId = id => state.products.find(p => p.id === id);
const listItems = () => state.products.filter(p => p.inList).sort((a, b) => (a.listOrder ?? 0) - (b.listOrder ?? 0));

function newProduct(fields = {}) {
  return {
    id: uid(), name: '', brand: '', size: null, unit: 'ml', category: '', note: '',
    photo: null, usualPrice: null, seen: null, // seen = { price, date }
    inList: false, qty: 1, bought: false, boughtAt: null, listOrder: Date.now(),
    history: [], createdAt: Date.now(), ...fields,
  };
}

async function save(p, { silent = false } = {}) {
  try {
    await dbPut(p);
    return true;
  } catch (err) {
    console.error(err);
    if (!silent) snackbar('La modification n\'a pas été enregistrée. Réessaie.', { error: true });
    return false;
  }
}

/* ============================================================
   Formatage (typographie française)
   ============================================================ */
const NBSP = ' ';
const euro = cents => (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + NBSP + '€';
const sizeText = p => (p.size ? `${String(p.size).replace('.', ',')}${NBSP}${p.unit}` : '');
const dateLong = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const dateShort = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const monthYear = ts => new Date(ts).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
const displayName = p => p.name || 'Produit sans nom';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function parsePrice(str) {
  const s = String(str).replace(/\s|€/g, '').replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

function missingFields(p) {
  const m = [];
  if (!p.photo) m.push('la photo');
  if (!p.name) m.push('le nom');
  if (!p.size) m.push('la contenance');
  if (!p.brand) m.push('la marque');
  if (p.usualPrice == null) m.push('le prix');
  return m;
}
const joinFr = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' et ' + arr.at(-1);

// B55 : fréquence estimée, seulement à partir de 3 achats
function rebuyText(p) {
  const d = p.history.map(h => h.date).sort((a, b) => a - b);
  if (d.length < 3) return null;
  const days = (d.at(-1) - d[0]) / 86400000 / (d.length - 1);
  if (days < 1.5) return 'plusieurs fois par semaine';
  if (days < 11) return `environ tous les ${Math.round(days)}${NBSP}jours`;
  if (days < 50) return `environ toutes les ${Math.round(days / 7)}${NBSP}semaines`;
  const months = Math.round(days / 30);
  return months <= 1 ? 'environ tous les mois' : `environ tous les ${months}${NBSP}mois`;
}

// B32, B33 : écart et ancienneté du prix
function priceGap(p) {
  if (!p.seen || p.usualPrice == null) return null;
  const diff = p.seen.price - p.usualPrice;
  if (diff === 0) return { text: 'identique', word: 'identique à ton prix habituel', sign: 0 };
  const sign = diff > 0 ? '+' : '−';
  return { text: `${sign}${euro(Math.abs(diff))}`, word: diff > 0 ? 'plus cher que d\'habitude' : 'moins cher que d\'habitude', sign: Math.sign(diff) };
}
const isOld = ts => Date.now() - ts > 1000 * 86400 * 120;

/* ============================================================
   Photos : réduites pour ne pas saturer l'appareil (B74)
   ============================================================ */
async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file));
  const max = 1200;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.82));
  if (!blob) throw new Error('compression');
  return blob;
}

/* ============================================================
   Rendu : rectos
   ============================================================ */
const $ = sel => document.querySelector(sel);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function rectoHtml(p, extraClass = '') {
  const url = photoUrl(p);
  // L'image est dans un bouton qui porte déjà le nom : alt vide pour éviter la répétition.
  return url
    ? `<span class="recto ${extraClass}"><img src="${url}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="recto recto-text ${extraClass}" aria-hidden="true">${esc(displayName(p))}</span>`;
}

function dataLine(p, { inList } = {}) {
  const parts = [];
  if (p.brand) parts.push(esc(p.brand));
  if (p.size) parts.push(sizeText(p));
  if (inList && p.qty > 1) parts.push(`×${p.qty}`);
  if (p.usualPrice != null) parts.push(euro(p.usualPrice));
  return parts.join(' · ');
}

function renderListe() {
  const items = listItems();
  const rows = $('#liste-rows');
  const empty = $('#liste-empty');
  const left = items.filter(p => !p.bought).length;
  const bought = items.length - left;

  const status = $('#liste-status');
  if (!items.length) status.textContent = '';
  else if (!left) status.innerHTML = '<strong>Tout est pris.</strong> Tu peux retirer les produits achetés.';
  else status.innerHTML = `<strong>${left} sur ${items.length}</strong> ${left > 1 ? 'restent' : 'reste'} à prendre`;

  rows.replaceChildren(...items.map(p => {
    const missing = missingFields(p).filter(f => f !== 'le prix');
    const li = el(`
      <li class="row${p.bought ? ' is-bought' : ''}${state.openId === p.id ? ' is-open' : ''}" data-id="${p.id}">
        <button class="row-main" data-open="${p.id}" aria-describedby="d-${p.id}">
          ${rectoHtml(p)}
          <span class="row-text">
            <span class="row-name">${esc(displayName(p))}</span>
            <span class="row-data" id="d-${p.id}">${dataLine(p, { inList: true })}${missing.length ? `<span class="row-flag">à compléter</span>` : ''}${p.bought ? '<span class="visually-hidden">, acheté</span>' : ''}</span>
          </span>
        </button>
        <span class="row-trail">
          <label class="check">
            <input type="checkbox" data-check="${p.id}" ${p.bought ? 'checked' : ''} aria-label="Marquer « ${esc(displayName(p))} » comme acheté">
            <span class="check-box" aria-hidden="true"><svg class="ic"><use href="#i-check"/></svg></span>
          </label>
        </span>
      </li>`);
    return li;
  }));

  empty.hidden = items.length > 0;
  if (!items.length) {
    empty.innerHTML = state.products.length
      ? `<h2 class="empty-title">Rien à racheter.</h2><p>Ton nécessaire est complet.</p>`
      : `<h2 class="empty-title">Ton nécessaire est vide.</h2><p>Ajoute un premier produit à racheter : un nom suffit, la photo peut attendre.</p>`;
  }
  const close = $('#close-trip');
  close.hidden = bought === 0;
  $('#close-trip-btn').textContent = bought === 1 ? 'Retirer le produit acheté' : `Retirer les ${bought} produits achetés`;
}

function matchesQuery(p, q) {
  if (!q) return true;
  const hay = norm([p.name, p.brand, p.category, p.note].join(' '));
  const words = norm(q).split(' ').filter(Boolean);
  // Tolérance légère : chaque mot doit apparaître, ou à une lettre près pour les mots de 5 lettres et plus.
  return words.every(w => hay.includes(w) || (w.length >= 5 && hay.split(' ').some(h => nearlyEqual(h, w))));
}
function nearlyEqual(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diff = [...a].map((c, i) => (c !== b[i] ? i : -1)).filter(i => i >= 0);
    if (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]) return true;
  }
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function renderNecessaire() {
  const incompleteCount = state.products.filter(p => missingFields(p).length).length;
  const chip = $('#filter-incomplete');
  chip.textContent = `À compléter (${incompleteCount})`;
  chip.setAttribute('aria-pressed', String(state.onlyIncomplete));

  let items = state.products.filter(p => matchesQuery(p, state.query) && (!state.onlyIncomplete || missingFields(p).length));
  const last = p => p.history.at(-1)?.date ?? 0;
  if (state.sort === 'last') items.sort((a, b) => last(b) - last(a));
  else if (state.sort === 'freq') items.sort((a, b) => b.history.length - a.history.length || last(b) - last(a));
  else items.sort((a, b) => norm(displayName(a)).localeCompare(norm(displayName(b)), 'fr'));

  const status = $('#nec-status');
  const n = state.products.length;
  status.textContent = !n ? '' : state.query || state.onlyIncomplete
    ? `${items.length} produit${items.length > 1 ? 's' : ''} sur ${n}`
    : `${n} produit${n > 1 ? 's' : ''}`;

  $('#nec-rows').replaceChildren(...items.map(p => {
    const missing = missingFields(p);
    return el(`
      <li class="row${state.openId === p.id ? ' is-open' : ''}" data-id="${p.id}">
        <button class="row-main" data-open="${p.id}">
          ${rectoHtml(p)}
          <span class="row-text">
            <span class="row-name">${esc(displayName(p))}</span>
            <span class="row-data">${dataLine(p)}</span>
            ${missing.length ? `<span class="row-flag">Il manque ${esc(joinFr(missing))}</span>` : ''}
          </span>
        </button>
        <span class="row-trail">
          ${p.inList
            ? `<span class="in-list-flag"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-check"/></svg>Dans la liste</span>`
            : `<button class="icon-btn" data-relist="${p.id}" aria-label="Remettre « ${esc(displayName(p))} » dans la liste"><svg class="ic"><use href="#i-list-add"/></svg></button>`}
        </span>
      </li>`);
  }));

  const empty = $('#nec-empty');
  empty.hidden = items.length > 0;
  if (!items.length) {
    empty.innerHTML = !n
      ? `<h2 class="empty-title">Ton nécessaire est vide.</h2><p>Chaque produit que tu ajoutes y reste, pour le remettre dans la liste en un geste.</p>`
      : state.query
        ? `<h2 class="empty-title">Aucun produit « ${esc(state.query)} » dans ton nécessaire.</h2><p><button class="btn btn-tonal" data-create="${esc(state.query)}">Le créer</button></p>`
        : `<h2 class="empty-title">Toutes tes fiches sont complètes.</h2>`;
  }
}

/* ============================================================
   Rendu : le verso (contre-étiquette)
   ============================================================ */
function lineHtml({ key, label, value, missing, icon = '', disabled = false, aria }) {
  return `<li><button class="line" ${disabled ? 'disabled' : `data-edit="${key}"`} ${aria ? `aria-label="${esc(aria)}"` : ''}>
    <span class="line-label">${icon}${label}</span>
    <span class="line-value${missing ? ' is-missing' : ''}">${missing ? '' : value}</span>
  </button></li>`;
}

function renderVerso() {
  const pane = $('#verso');
  const p = byId(state.openId);
  if (!p) { pane.hidden = true; pane.innerHTML = ''; document.body.classList.remove('verso-open'); return; }
  pane.hidden = false;
  document.body.classList.toggle('verso-open', true);

  const url = photoUrl(p);
  const gap = priceGap(p);
  const rebuy = rebuyText(p);
  const lastBuy = p.history.at(-1);
  const name = displayName(p);
  const sizeAria = p.size ? `Contenance, ${String(p.size).replace('.', ',')} ${{ ml: 'millilitres', g: 'grammes', unités: 'unités', cl: 'centilitres', l: 'litres', kg: 'kilos' }[p.unit] || p.unit}. Modifier` : 'Contenance, à compléter';

  const seenValue = p.seen
    ? `${gap && gap.sign !== 0 ? `<span class="ecart">${gap.text}</span> · ` : ''}${euro(p.seen.price)}`
    : '';
  const seenLabel = p.seen ? `Vu en magasin · ${dateShort(p.seen.date)}` : 'Vu en magasin';
  const usualLabel = p.usualPrice != null && p.usualSince && isOld(p.usualSince) ? `Prix de ${monthYear(p.usualSince)}` : 'Prix habituel';

  pane.innerHTML = `
    <div class="verso-bar">
      <button class="icon-btn on-secondary" id="verso-back" aria-label="Retour"><svg class="ic"><use href="#i-back"/></svg></button>
      <span class="verso-bar-title">${p.inList ? 'Dans la liste à racheter' : 'Dans ton nécessaire'}</span>
    </div>
    ${url
      ? `<button class="verso-photo" id="verso-photo" style="view-transition-name: recto" aria-label="Voir la photo en grand"><img src="${url}" alt="Photo : ${esc(name)}${p.size ? ', ' + esc(sizeText(p)) : ''}"></button>`
      : `<div class="verso-photo recto-text" style="view-transition-name: recto" aria-hidden="true">${esc(name)}</div>`}
    <div class="contre">
      <p class="contre-brand">${p.brand ? esc(p.brand) : '<span class="visually-hidden">Marque </span>[marque à compléter]'}</p>
      <h2 class="contre-name" id="verso-name">${esc(name)}</h2>
      <ul class="lines">
        ${lineHtml({ key: 'name', label: 'Nom exact', value: esc(p.name), missing: !p.name })}
        ${lineHtml({ key: 'brand', label: 'Marque', value: esc(p.brand), missing: !p.brand })}
        ${lineHtml({ key: 'size', label: 'Contenance', icon: '<svg class="ic ic-sm" aria-hidden="true"><use href="#i-e"/></svg>', value: sizeText(p), missing: !p.size, aria: sizeAria })}
        ${lineHtml({ key: 'category', label: 'Catégorie', value: esc(p.category), missing: !p.category })}
        ${p.inList ? lineHtml({ key: 'qty', label: 'Quantité à acheter', value: String(p.qty) }) : ''}
        ${lineHtml({ key: 'usualPrice', label: usualLabel, value: p.usualPrice != null ? euro(p.usualPrice) : '', missing: p.usualPrice == null })}
        ${lineHtml({ key: 'seen', label: seenLabel, value: seenValue, missing: !p.seen,
            aria: p.seen ? `Vu en magasin le ${dateLong(p.seen.date)}, ${euro(p.seen.price)}${gap ? ', ' + gap.word + (gap.sign ? ' de ' + euro(Math.abs(p.seen.price - p.usualPrice)) : '') : ''}. Modifier` : 'Noter le prix vu en magasin' })}
        ${lineHtml({ key: 'last', label: 'Dernier achat', value: lastBuy ? dateLong(lastBuy.date) : 'jamais', disabled: true })}
        ${rebuy ? lineHtml({ key: 'rebuy', label: 'Rachat', value: rebuy, disabled: true }) : ''}
      </ul>
      <button class="note${p.note ? '' : ' is-missing'}" data-edit="note" aria-label="${p.note ? 'Note distinctive : ' + esc(p.note) + '. Modifier' : 'Ajouter une note distinctive'}">${p.note ? esc(p.note) : 'Ajoute ce qui le distingue : « bouchon doré, pas la version bleue ».'}</button>

      <div class="verso-actions">
        ${p.inList
          ? `<button class="btn btn-outlined" data-toggle-list="${p.id}">Retirer de la liste</button>`
          : `<button class="btn btn-tonal" data-toggle-list="${p.id}"><svg class="ic" aria-hidden="true"><use href="#i-list-add"/></svg>Remettre dans la liste</button>`}
        <button class="btn btn-outlined" id="verso-photo-change"><svg class="ic" aria-hidden="true"><use href="#i-camera"/></svg>${p.photo ? 'Changer la photo' : 'Ajouter une photo'}</button>
      </div>

      ${p.history.length ? `
      <section class="history" aria-labelledby="h-title">
        <h3 id="h-title">Historique</h3>
        <ol>${p.history.slice(-6).reverse().map(h => `<li><span>${dateLong(h.date)}</span><span>${h.price != null ? euro(h.price) : '—'}</span></li>`).join('')}</ol>
      </section>` : ''}

      <div class="verso-delete">
        <button class="btn btn-text" id="verso-delete"><svg class="ic" aria-hidden="true"><use href="#i-trash"/></svg>Supprimer de ton nécessaire</button>
      </div>
    </div>`;
}

function renderAll() {
  renderListe();
  renderNecessaire();
  renderVerso();
}

/* ============================================================
   Navigation : onglets et verso (hash pour le bouton retour)
   ============================================================ */
function setTab(tab, { focus = false } = {}) {
  state.tab = tab;
  for (const t of ['liste', 'necessaire']) {
    const btn = $(`#tab-${t}`);
    const on = t === tab;
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
    $(`#panel-${t}`).hidden = !on;
  }
  if (focus) $(`#tab-${tab}`).focus();
  $('#add-inlist').checked = tab === 'liste';
}

let lastTrigger = null;
const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTwoPane = () => matchMedia('(min-width: 840px)').matches;

function quiet(t) { t.ready.catch(() => {}); t.finished.catch(() => {}); t.updateCallbackDone.catch(() => {}); return t; }

function withTransition(update, sourceRow, after) {
  if (!document.startViewTransition || prefersReduced()) { update(); after?.(); return; }
  const img = sourceRow?.querySelector('.recto');
  if (img) img.style.viewTransitionName = 'recto';
  const t = quiet(document.startViewTransition(() => {
    if (img) img.style.viewTransitionName = '';
    update();
  }));
  t.updateCallbackDone.then(() => after?.(), () => after?.());
}

function openVerso(id, trigger) {
  lastTrigger = trigger || document.activeElement;
  const row = trigger?.closest('.row');
  withTransition(() => {
    state.openId = id;
    renderAll();
  }, row, () => $('#verso-back')?.focus());
  if (location.hash !== `#produit/${id}`) history.pushState({ verso: id }, '', `#produit/${id}`);
}

function closeVerso({ fromPop = false } = {}) {
  if (!state.openId) return;
  const id = state.openId;
  const update = () => { state.openId = null; renderAll(); };
  const refocus = () => {
    const back = document.querySelector(`.panel:not([hidden]) [data-open="${id}"]`) || (lastTrigger?.isConnected ? lastTrigger : null);
    (back || $(`#tab-${state.tab}`)).focus();
  };
  if (!document.startViewTransition || prefersReduced()) { update(); refocus(); }
  else {
    const t = quiet(document.startViewTransition(() => {
      update();
      const target = document.querySelector(`.panel:not([hidden]) .row[data-id="${id}"] .recto`);
      if (target) target.style.viewTransitionName = 'recto';
    }));
    t.updateCallbackDone.then(refocus, refocus);
    t.finished.then(() => document.querySelectorAll('.recto').forEach(r => (r.style.viewTransitionName = '')), () => {});
  }
  if (!fromPop && location.hash.startsWith('#produit/')) history.back();
}

window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#produit\/(.+)$/);
  if (m && byId(m[1])) { state.openId = m[1]; renderAll(); }
  else closeVerso({ fromPop: true });
});

/* ============================================================
   Actions de la liste
   ============================================================ */
let undoSnapshot = null;

async function setBought(p, bought) {
  const before = structuredClone({ ...p, photo: null });
  if (bought) {
    const now = Date.now();
    const seenToday = p.seen && new Date(p.seen.date).toDateString() === new Date(now).toDateString();
    p.bought = true;
    p.boughtAt = now;
    p.history.push({ date: now, price: seenToday ? p.seen.price : null }); // B53
    if (seenToday) { p.usualPrice = p.seen.price; p.usualSince = now; } // B54
  } else {
    p.bought = false;
    if (p.boughtAt) p.history = p.history.filter(h => h.date !== p.boughtAt);
    p.boughtAt = null;
  }
  const hadFocus = document.activeElement?.dataset?.check === p.id;
  await save(p);
  renderListe(); renderNecessaire(); if (state.openId === p.id) renderVerso();
  if (hadFocus) document.querySelector(`[data-check="${p.id}"]`)?.focus();
  if (bought) {
    undoSnapshot = [{ ...before, photo: p.photo }];
    snackbar(`${displayName(p)} : acheté.`, { action: 'Annuler', onAction: undo });
  }
}

async function removeFromList(ids, message) {
  const ps = ids.map(byId).filter(Boolean);
  undoSnapshot = ps.map(p => ({ ...structuredClone({ ...p, photo: null }), photo: p.photo }));
  for (const p of ps) { p.inList = false; p.bought = false; p.boughtAt = null; await save(p); }
  renderAll();
  snackbar(message, { action: 'Annuler', onAction: undo });
}

async function undo() {
  if (!undoSnapshot) return;
  for (const snap of undoSnapshot) {
    const i = state.products.findIndex(p => p.id === snap.id);
    if (i >= 0) state.products[i] = snap; else state.products.push(snap);
    await save(snap);
  }
  undoSnapshot = null;
  renderAll();
  snackbar('Action annulée.');
}

async function putInList(p, { qty } = {}) {
  p.inList = true; p.bought = false; p.boughtAt = null; p.listOrder = Date.now();
  if (qty) p.qty = qty;
  await save(p);
  renderAll();
}

/* ============================================================
   Snackbar (live region polie ; avec action, pas de fermeture auto)
   ============================================================ */
let snackTimer = null;
let snackHandler = null;
function snackbar(text, { action, onAction, error = false } = {}) {
  const bar = $('#snackbar');
  clearTimeout(snackTimer);
  $('#snackbar-text').textContent = text;
  const btn = $('#snackbar-action');
  btn.hidden = !action;
  btn.textContent = action || '';
  snackHandler = onAction || null;
  bar.classList.toggle('is-error', error);
  bar.hidden = false;
  if (!action) snackTimer = setTimeout(hideSnackbar, 6000);
}
function hideSnackbar() { $('#snackbar').hidden = true; snackHandler = null; }
$('#snackbar-action').addEventListener('click', () => { const h = snackHandler; hideSnackbar(); h?.(); });
$('#snackbar-close').addEventListener('click', hideSnackbar);
$('#snackbar').addEventListener('keydown', e => { if (e.key === 'Escape') hideSnackbar(); });
// Raccourci documenté pour atteindre l'action de la snackbar : Alt+G
document.addEventListener('keydown', e => {
  if (e.altKey && (e.key === 'g' || e.key === 'G') && !$('#snackbar').hidden) {
    e.preventDefault();
    (!$('#snackbar-action').hidden ? $('#snackbar-action') : $('#snackbar-close')).focus();
  }
});

/* ============================================================
   Dialogs
   ============================================================ */
function openDialog(dlg, trigger) {
  dlg._trigger = trigger || document.activeElement;
  dlg.showModal();
}
document.querySelectorAll('dialog').forEach(dlg => {
  dlg.addEventListener('close', () => { const t = dlg._trigger; if (t?.isConnected) t.focus(); });
  dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dlg.close('cancel')));
});

function confirmDialog({ title, text, ok }) {
  const dlg = $('#confirm-dialog');
  $('#confirm-title').textContent = title;
  $('#confirm-text').textContent = text;
  $('#confirm-ok').textContent = ok;
  dlg.returnValue = '';
  openDialog(dlg);
  $('#confirm-dialog [value="cancel"]').focus();
  return new Promise(resolve => dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true }));
}

/* ---------- Ajout rapide (B02, B40, B62) ---------- */
let addPhotoBlob = null;
let suggestIndex = -1;

function resetAdd() {
  $('#add-form').reset();
  $('#add-inlist').checked = state.tab === 'liste';
  addPhotoBlob = null;
  $('#add-preview').hidden = true;
  $('#add-preview').innerHTML = '';
  $('#add-photo-label').textContent = 'Prendre ou choisir une photo';
  setAddError('');
  renderSuggest();
}
function setAddError(msg) {
  const help = $('#add-name-help');
  const input = $('#add-name');
  if (msg) {
    help.textContent = msg; help.classList.add('is-error'); input.setAttribute('aria-invalid', 'true');
  } else {
    help.textContent = 'Avec la variante, par exemple « Eau de toilette Intense ». Un nom suffit, le reste peut attendre.';
    help.classList.remove('is-error'); input.removeAttribute('aria-invalid');
  }
}
function renderSuggest() {
  const q = $('#add-name').value.trim();
  const list = $('#add-suggest');
  const input = $('#add-name');
  const items = q.length < 2 ? [] : state.products.filter(p => matchesQuery(p, q)).slice(0, 5);
  suggestIndex = -1;
  input.removeAttribute('aria-activedescendant');
  list.hidden = !items.length;
  input.setAttribute('aria-expanded', String(items.length > 0));
  list.replaceChildren(...items.map((p, i) => el(`
    <li role="option" id="sg-${i}" data-pick="${p.id}" aria-selected="false">
      ${rectoHtml(p)}
      <span><span class="suggest-name">${esc(displayName(p))}</span>
      <span class="suggest-meta">${[p.brand && esc(p.brand), sizeText(p), p.inList ? 'déjà dans la liste' : 'dans ton nécessaire'].filter(Boolean).join(' · ')}</span></span>
    </li>`)));
}
async function pickSuggestion(id) {
  const p = byId(id);
  if (!p) return;
  $('#add-dialog').close();
  if (p.inList) { snackbar(`${displayName(p)} est déjà dans la liste.`); return; }
  await putInList(p);
  setTab('liste');
  snackbar(`${displayName(p)} remis dans la liste.`, { action: 'Annuler', onAction: () => removeFromList([p.id], `${displayName(p)} retiré de la liste.`) });
}

$('#add-btn').addEventListener('click', e => { resetAdd(); openDialog($('#add-dialog'), e.currentTarget); $('#add-name').focus(); });
$('#add-name').addEventListener('input', () => { setAddError(''); renderSuggest(); });
$('#add-name').addEventListener('keydown', e => {
  const opts = [...$('#add-suggest').querySelectorAll('[role="option"]')];
  if (!opts.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    suggestIndex = (suggestIndex + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === suggestIndex)));
    $('#add-name').setAttribute('aria-activedescendant', opts[suggestIndex].id);
  } else if (e.key === 'Enter' && suggestIndex >= 0) {
    e.preventDefault(); pickSuggestion(opts[suggestIndex].dataset.pick);
  } else if (e.key === 'Escape' && !$('#add-suggest').hidden) {
    e.preventDefault(); $('#add-suggest').hidden = true; $('#add-name').setAttribute('aria-expanded', 'false');
  }
});
$('#add-suggest').addEventListener('click', e => { const li = e.target.closest('[data-pick]'); if (li) pickSuggestion(li.dataset.pick); });
$('#add-photo').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    addPhotoBlob = await compressPhoto(file);
    const url = URL.createObjectURL(addPhotoBlob);
    $('#add-preview').innerHTML = `<img src="${url}" alt="Aperçu de la photo choisie">`;
    $('#add-preview').hidden = false;
    $('#add-photo-label').textContent = 'Changer la photo';
  } catch {
    addPhotoBlob = null;
    snackbar('La photo n\'a pas été enregistrée.', { error: true, action: 'Réessayer', onAction: () => $('#add-photo').click() });
  }
});
$('#add-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#add-name').value.trim();
  if (!name && !addPhotoBlob) { setAddError('Donne au moins un nom ou une photo.'); $('#add-name').focus(); return; }
  const inList = $('#add-inlist').checked;
  const same = name && state.products.find(p => norm(p.name) === norm(name));
  if (same) {
    if (same.inList && inList) { setAddError(`« ${displayName(same)} » est déjà dans la liste.`); return; }
    if (addPhotoBlob && !same.photo) { same.photo = addPhotoBlob; }
    if (inList) await putInList(same); else { await save(same); renderAll(); }
    $('#add-dialog').close();
    snackbar(inList ? `${displayName(same)} remis dans la liste.` : `${displayName(same)} est déjà dans ton nécessaire.`);
    return;
  }
  const p = newProduct({ name, photo: addPhotoBlob, inList });
  state.products.push(p);
  const ok = await save(p);
  if (ok) navigator.storage?.persist?.().catch(() => {});
  $('#add-dialog').close();
  renderAll();
  snackbar(`${displayName(p)} ajouté${inList ? ' à la liste' : ' à ton nécessaire'}.`, { action: 'Compléter', onAction: () => openVerso(p.id) });
});

/* ---------- Modifier une ligne (B41) ---------- */
const UNITS = ['ml', 'cl', 'l', 'g', 'kg', 'unités'];
function editFields(key, p) {
  const v = s => esc(s ?? '');
  switch (key) {
    case 'name': return { title: 'Nom exact', html: `<div class="field"><label class="field-label" for="f-a">Nom exact, variante comprise</label><input class="field-input" id="f-a" value="${v(p.name)}" autocomplete="off"></div>` };
    case 'brand': return { title: 'Marque', html: `<div class="field"><label class="field-label" for="f-a">Marque</label><input class="field-input" id="f-a" value="${v(p.brand)}" autocomplete="off" list="brands"><datalist id="brands">${[...new Set(state.products.map(x => x.brand).filter(Boolean))].map(b => `<option value="${v(b)}">`).join('')}</datalist></div>` };
    case 'category': return { title: 'Catégorie', html: `<div class="field"><label class="field-label" for="f-a">Catégorie</label><input class="field-input" id="f-a" value="${v(p.category)}" autocomplete="off" list="cats" aria-describedby="f-help"><datalist id="cats">${[...new Set(['Parfum', 'Gel douche', 'Exfoliant', 'Déodorant', 'Shampoing', 'Soin visage', ...state.products.map(x => x.category).filter(Boolean)])].map(c => `<option value="${v(c)}">`).join('')}</datalist><p class="field-help" id="f-help">Par exemple : parfum, gel douche, exfoliant, déodorant.</p></div>` };
    case 'size': return { title: 'Contenance', html: `<div class="field-row"><div class="field"><label class="field-label" for="f-a">Quantité</label><input class="field-input" id="f-a" inputmode="decimal" value="${p.size ? String(p.size).replace('.', ',') : ''}" aria-describedby="f-help"></div><div class="field"><label class="field-label" for="f-b">Unité</label><select class="field-input" id="f-b">${UNITS.map(u => `<option ${u === p.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></div></div><p class="field-help" id="f-help">Telle qu'écrite sur l'emballage, par exemple 250 ml.</p>` };
    case 'qty': return { title: 'Quantité à acheter', html: `<div class="field"><label class="field-label" for="f-a">Nombre d'exemplaires</label><input class="field-input" id="f-a" type="number" min="1" max="99" inputmode="numeric" value="${p.qty}"></div>` };
    case 'usualPrice': return { title: 'Prix habituel', html: `<div class="field"><label class="field-label" for="f-a">Prix habituel, en euros</label><input class="field-input" id="f-a" inputmode="decimal" value="${p.usualPrice != null ? (p.usualPrice / 100).toFixed(2).replace('.', ',') : ''}" aria-describedby="f-help"><p class="field-help" id="f-help">Par exemple 12,90. Laisse vide si tu ne le connais pas.</p></div>` };
    case 'seen': return { title: 'Prix vu en magasin', html: `<div class="field"><label class="field-label" for="f-a">Prix affiché aujourd'hui, en euros</label><input class="field-input" id="f-a" inputmode="decimal" value="${p.seen ? (p.seen.price / 100).toFixed(2).replace('.', ',') : ''}" aria-describedby="f-help"><p class="field-help" id="f-help">La date est notée automatiquement. Si tu l'achètes aujourd'hui, ce prix devient ton prix habituel.</p></div>` };
    case 'note': return { title: 'Note distinctive', html: `<div class="field"><label class="field-label" for="f-a">Ce qui le distingue des versions proches</label><textarea class="field-input" id="f-a" aria-describedby="f-help">${v(p.note)}</textarea><p class="field-help" id="f-help">Par exemple : bouchon doré, pas la version « Eau fraîche » au flacon bleu.</p></div>` };
  }
}
let editing = null;
function openEdit(key, trigger) {
  const p = byId(state.openId);
  const f = p && editFields(key, p);
  if (!f) return;
  editing = { key, id: p.id };
  $('#edit-title').textContent = f.title;
  $('#edit-body').innerHTML = f.html;
  openDialog($('#edit-dialog'), trigger);
  const first = $('#edit-body').querySelector('input, textarea, select');
  first?.focus(); first?.select?.();
}
function fieldError(input, msg) {
  input.setAttribute('aria-invalid', 'true');
  let help = input.parentElement.querySelector('.field-help') || $('#edit-body .field-help');
  if (!help) { help = document.createElement('p'); help.className = 'field-help'; help.id = 'f-help'; input.parentElement.append(help); input.setAttribute('aria-describedby', 'f-help'); }
  help.textContent = msg; help.classList.add('is-error');
  input.focus();
}
$('#edit-form').addEventListener('submit', async e => {
  e.preventDefault();
  const p = byId(editing?.id);
  if (!p) return;
  const a = $('#f-a');
  const val = a?.value.trim();
  switch (editing.key) {
    case 'name': case 'brand': case 'category': case 'note':
      p[editing.key] = val; break;
    case 'size': {
      if (!val) { p.size = null; break; }
      const n = Number(val.replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0) return fieldError(a, 'Écris un nombre, par exemple 250.');
      p.size = n; p.unit = $('#f-b').value; break;
    }
    case 'qty': {
      const n = parseInt(val, 10);
      if (!(n >= 1 && n <= 99)) return fieldError(a, 'Choisis un nombre entre 1 et 99.');
      p.qty = n; break;
    }
    case 'usualPrice': case 'seen': {
      const c = parsePrice(val);
      if (Number.isNaN(c)) return fieldError(a, 'Écris un prix, par exemple 12,90.');
      if (editing.key === 'usualPrice') { p.usualPrice = c; p.usualSince = c == null ? null : Date.now(); }
      else p.seen = c == null ? null : { price: c, date: Date.now() };
      break;
    }
  }
  await save(p);
  $('#edit-dialog').close();
  renderAll();
  // Retour du focus sur la ligne modifiée (le DOM du verso a été recréé)
  requestAnimationFrame(() => document.querySelector(`#verso [data-edit="${editing.key}"]`)?.focus());
});

/* ---------- Photo du verso ---------- */
$('#photo-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  const p = byId(state.openId);
  if (!file || !p) return;
  try {
    p.photo = await compressPhoto(file);
    const ok = await save(p, { silent: true });
    if (!ok) throw new Error('save');
    renderAll();
    snackbar('Photo enregistrée.');
  } catch {
    snackbar('La photo n\'a pas été enregistrée.', { error: true, action: 'Réessayer', onAction: () => $('#photo-file').click() });
  }
});

/* ---------- Photo en grand (B16) ---------- */
function openViewer(trigger) {
  const p = byId(state.openId);
  const url = p && photoUrl(p);
  if (!url) return;
  const img = $('#viewer-img');
  img.src = url;
  img.alt = `Photo : ${displayName(p)}${p.size ? ', ' + sizeText(p) : ''}`;
  $('#viewer-scroll').classList.remove('is-zoomed');
  openDialog($('#viewer'), trigger);
}
$('#viewer-scroll').addEventListener('dblclick', e => {
  const sc = e.currentTarget;
  sc.classList.toggle('is-zoomed');
  if (sc.classList.contains('is-zoomed')) {
    const r = sc.getBoundingClientRect();
    sc.scrollTo({ left: (e.clientX - r.left) * 1.2, top: (e.clientY - r.top) * 1.2 });
  }
});

/* ============================================================
   Délégation d'événements
   ============================================================ */
document.addEventListener('click', async e => {
  const t = e.target.closest('button, [data-open]');
  if (!t) return;
  if (t.dataset.open) { if (Date.now() - swipeEndedAt < 400) return; return openVerso(t.dataset.open, t); }
  if (t.dataset.relist) {
    const p = byId(t.dataset.relist);
    await putInList(p);
    snackbar(`${displayName(p)} remis dans la liste.`, { action: 'Annuler', onAction: () => removeFromList([p.id], `${displayName(p)} retiré de la liste.`) });
    requestAnimationFrame(() => document.querySelector(`#nec-rows [data-open="${p.id}"]`)?.focus());
    return;
  }
  if (t.dataset.create) {
    resetAdd(); $('#add-name').value = t.dataset.create; $('#add-inlist').checked = false;
    openDialog($('#add-dialog'), t); renderSuggest(); $('#add-name').focus(); return;
  }
  if (t.dataset.edit) return openEdit(t.dataset.edit, t);
  if (t.dataset.toggleList) {
    const p = byId(t.dataset.toggleList);
    if (p.inList) await removeFromList([p.id], `${displayName(p)} retiré de la liste.`);
    else { await putInList(p); snackbar(`${displayName(p)} remis dans la liste.`); }
    requestAnimationFrame(() => document.querySelector('#verso [data-toggle-list]')?.focus());
    return;
  }
  switch (t.id) {
    case 'verso-back': return closeVerso();
    case 'verso-photo': return openViewer(t);
    case 'verso-photo-change': return $('#photo-file').click();
    case 'verso-delete': {
      const p = byId(state.openId);
      const ok = await confirmDialog({
        title: `Supprimer « ${displayName(p)} » de ton nécessaire ?`,
        text: 'Sa photo et son historique seront effacés. Cette action est définitive.',
        ok: 'Supprimer',
      });
      if (!ok) return;
      try { await dbDelete(p.id); } catch { return snackbar('La suppression a échoué. Réessaie.', { error: true }); }
      state.products = state.products.filter(x => x.id !== p.id);
      closeVerso();
      snackbar(`${displayName(p)} supprimé.`);
      return;
    }
    case 'close-trip-btn': {
      const ids = listItems().filter(p => p.bought).map(p => p.id);
      return removeFromList(ids, ids.length > 1 ? `${ids.length} produits retirés de la liste.` : 'Produit retiré de la liste.');
    }
    case 'filter-incomplete':
      state.onlyIncomplete = !state.onlyIncomplete; return renderNecessaire();
    case 'menu-btn': return toggleMenu();
  }
  if (t.dataset.action === 'export') { toggleMenu(false); return exportData(); }
  if (t.dataset.action === 'import') { toggleMenu(false); return $('#import-file').click(); }
});

document.addEventListener('change', e => {
  const id = e.target.dataset?.check;
  if (id) setBought(byId(id), e.target.checked);
});

$('#search').addEventListener('input', e => { state.query = e.target.value; renderNecessaire(); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderNecessaire(); });

/* Onglets : flèches, Home, End (activation automatique) */
$('.tabs').addEventListener('click', e => { const tab = e.target.closest('[role="tab"]'); if (tab) setTab(tab.id.replace('tab-', '')); });
$('.tabs').addEventListener('keydown', e => {
  const order = ['liste', 'necessaire'];
  let i = order.indexOf(state.tab);
  if (e.key === 'ArrowRight') i = (i + 1) % order.length;
  else if (e.key === 'ArrowLeft') i = (i - 1 + order.length) % order.length;
  else if (e.key === 'Home') i = 0;
  else if (e.key === 'End') i = order.length - 1;
  else return;
  e.preventDefault();
  setTab(order[i], { focus: true });
});

/* Menu d'options */
function toggleMenu(force) {
  const menu = $('#app-menu');
  const open = force ?? menu.hidden;
  menu.hidden = !open;
  $('#menu-btn').setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector('[role="menuitem"]').focus();
}
$('#app-menu').addEventListener('keydown', e => {
  const items = [...$('#app-menu').querySelectorAll('[role="menuitem"]')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  if (e.key === 'Escape' || e.key === 'Tab') { toggleMenu(false); if (e.key === 'Escape') $('#menu-btn').focus(); }
});
document.addEventListener('pointerdown', e => { if (!$('#app-menu').hidden && !e.target.closest('.menu-anchor')) toggleMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.openId && !document.querySelector('dialog[open]') && document.activeElement?.closest('#verso')) closeVerso();
});

/* ============================================================
   Glisser pour retirer de la liste (alternative : verso)
   ============================================================ */
let swipe = null;
let swipeEndedAt = 0;
$('#liste-rows').addEventListener('pointerdown', e => {
  const row = e.target.closest('.row');
  if (!row || e.pointerType === 'mouse' || e.target.closest('.check')) return;
  swipe = { row, x: e.clientX, y: e.clientY, dx: 0, active: false, id: e.pointerId };
});
$('#liste-rows').addEventListener('pointermove', e => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (!swipe.active) {
    if (Math.abs(dy) > 12) { swipe = null; return; }
    if (dx < -12) { swipe.active = true; swipe.row.classList.add('is-swiping'); swipe.row.setPointerCapture(e.pointerId); }
  }
  if (swipe.active) { swipe.dx = Math.min(0, dx); swipe.row.style.transform = `translateX(${swipe.dx}px)`; }
});
function endSwipe() {
  if (!swipe) return;
  const { row, dx, active } = swipe;
  swipe = null;
  if (!active) return;
  row.classList.remove('is-swiping');
  // Un clic suit souvent la fin du geste : on l'ignore pour ne pas ouvrir le verso.
  swipeEndedAt = Date.now();
  if (dx < -row.offsetWidth * 0.35) {
    row.classList.add('is-leaving');
    row.style.transform = `translateX(-100%)`;
    const p = byId(row.dataset.id);
    setTimeout(() => removeFromList([p.id], `${displayName(p)} retiré de la liste.`), 150);
  } else {
    row.style.transform = '';
  }
}
$('#liste-rows').addEventListener('pointerup', endSwipe);
$('#liste-rows').addEventListener('pointercancel', () => { if (swipe?.row) swipe.row.style.transform = ''; swipe = null; });

/* ============================================================
   Export / import (B73)
   ============================================================ */
const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function exportData() {
  try {
    const products = await Promise.all(state.products.map(async p => ({ ...p, photo: p.photo ? await blobToDataUrl(p.photo) : null })));
    const blob = new Blob([JSON.stringify({ app: 'necess', version: 1, exportedAt: new Date().toISOString(), products })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `necess-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    snackbar(`${products.length} produit${products.length > 1 ? 's' : ''} exporté${products.length > 1 ? 's' : ''}. Garde le fichier ailleurs que sur ce téléphone.`);
  } catch (err) {
    console.error(err);
    snackbar('L\'export a échoué. Réessaie.', { error: true });
  }
}
$('#import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); if (data.app !== 'necess' || !Array.isArray(data.products)) throw 0; }
  catch { return snackbar('Ce fichier n\'est pas une sauvegarde Necess.', { error: true }); }
  if (state.products.length) {
    const ok = await confirmDialog({
      title: 'Remplacer ton nécessaire ?',
      text: `Tes ${state.products.length} produits actuels seront remplacés par les ${data.products.length} de la sauvegarde.`,
      ok: 'Remplacer',
    });
    if (!ok) return;
  }
  try {
    const products = await Promise.all(data.products.map(async p => ({ ...newProduct(), ...p, photo: p.photo ? await (await fetch(p.photo)).blob() : null })));
    await dbClear();
    for (const p of products) await dbPut(p);
    state.products = products;
    state.openId = null;
    renderAll();
    snackbar(`${products.length} produit${products.length > 1 ? 's' : ''} importé${products.length > 1 ? 's' : ''}.`);
  } catch (err) {
    console.error(err);
    snackbar('L\'import a échoué. Tes données actuelles n\'ont pas été modifiées.', { error: true });
  }
});

/* ============================================================
   Démo (?demo) : exemples clairement fictifs, pour essayer
   ============================================================ */
function demoPhoto(colors, label) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 600;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 600, 600);
  grd.addColorStop(0, colors[0]); grd.addColorStop(1, colors[1]);
  g.fillStyle = '#e9ecee'; g.fillRect(0, 0, 600, 600);
  g.fillStyle = grd; g.beginPath(); g.roundRect(190, 90, 220, 440, 28); g.fill();
  g.fillStyle = colors[2] || '#333'; g.fillRect(250, 40, 100, 60);
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(210, 260, 180, 110);
  g.fillStyle = '#222'; g.font = '600 26px sans-serif'; g.textAlign = 'center'; g.fillText(label, 300, 325);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
}
async function seedDemo() {
  const day = 86400000, now = Date.now();
  const ex = [
    { name: 'Gel douche Hydra Fresh', brand: 'Marque exemple A', size: 250, unit: 'ml', category: 'Gel douche', usualPrice: 349, inList: true, colors: ['#1d4f8a', '#8db6e0', '#0f2a4a'], label: 'HYDRA', history: [now - 64 * day, now - 43 * day, now - 21 * day] },
    { name: 'Exfoliant corps abricot', brand: '', size: 200, unit: 'ml', category: 'Exfoliant', usualPrice: 790, inList: true, bought: true, colors: ['#f2c14e', '#e2763a', '#7a3b12'], label: 'ABRICOT', history: [now - 90 * day] },
    { name: 'Déodorant bille peau sensible', brand: 'Marque exemple B', size: 50, unit: 'ml', category: 'Déodorant', usualPrice: 295, inList: true, qty: 2, colors: ['#ececec', '#b9c3c9', '#5a6872'], label: 'SENSIBLE' },
    { name: 'Eau de toilette Intense', brand: 'Marque exemple C', size: 100, unit: 'ml', category: 'Parfum', usualPrice: 5490, seen: { price: 5790, date: now - 1 * day }, inList: true, note: 'Bouchon doré. Pas la version « Eau fraîche » au flacon bleu.', colors: ['#2a2a2a', '#c9a45c', '#c9a45c'], label: 'INTENSE', history: [now - 180 * day, now - 120 * day, now - 58 * day] },
    { name: 'Shampoing doux avoine', brand: 'Marque exemple A', size: null, unit: 'ml', category: 'Shampoing', inList: false, colors: ['#e8dcc0', '#bfa678', '#6b5a3a'], label: 'AVOINE' },
    { name: 'Crème mains karité', brand: '', size: 75, unit: 'ml', category: 'Soin', inList: false, noPhoto: true },
  ];
  let order = now;
  for (const d of ex) {
    const p = newProduct({
      name: d.name, brand: d.brand, size: d.size, unit: d.unit, category: d.category, usualPrice: d.usualPrice ?? null,
      seen: d.seen || null, inList: d.inList, bought: !!d.bought, boughtAt: d.bought ? now : null, qty: d.qty || 1, note: d.note || '',
      listOrder: order++, history: [...(d.history || []).map(t => ({ date: t, price: d.usualPrice ?? null })), ...(d.bought ? [{ date: now, price: null }] : [])],
      photo: d.noPhoto ? null : await demoPhoto(d.colors, d.label),
    });
    state.products.push(p);
    await save(p, { silent: true });
  }
}

/* ============================================================
   Démarrage
   ============================================================ */
async function start() {
  try {
    state.products = await dbAll();
  } catch (err) {
    console.error(err);
    snackbar('Tes données n\'ont pas pu être chargées. Recharge la page.', { error: true });
  }
  const params = new URLSearchParams(location.search);
  if (params.has('demo') && !state.products.length) await seedDemo();
  if (params.get('tab') === 'necessaire') setTab('necessaire');
  const m = location.hash.match(/^#produit\/(.+)$/);
  if (m && byId(m[1])) state.openId = m[1];
  else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  renderAll();
  const setH = () => document.documentElement.style.setProperty('--appbar-h', $('.appbar').offsetHeight + 'px');
  setH(); addEventListener('resize', setH);
}
start();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
