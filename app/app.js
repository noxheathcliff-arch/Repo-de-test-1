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
  category: null,
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
   Rendu
   ============================================================ */
const $ = sel => document.querySelector(sel);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const initials = p => (p.name || '?').split(/\s+/).filter(w => w.length > 2 || /^[A-ZÀ-Ý]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || (p.name || '?')[0].toUpperCase();

function thumbHtml(p, cls = 'thumb') {
  const url = photoUrl(p);
  // Dans un bouton qui porte déjà le nom : alt vide pour éviter la répétition.
  return url
    ? `<span class="${cls}" data-vt="${p.id}"><img src="${url}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="${cls} thumb-text" data-vt="${p.id}" aria-hidden="true">${esc(initials(p))}</span>`;
}

function subLine(p) {
  return [p.brand && esc(p.brand), sizeText(p)].filter(Boolean).join(' · ');
}

function itemHtml(p) {
  // Une case du coffret. À racheter : la case est en creux. Pris : le produit s'y cale.
  const missing = missingFields(p).filter(f => f !== 'le prix');
  const meta = [sizeText(p), p.usualPrice != null ? euro(p.usualPrice) : ''].filter(Boolean).join(' · ');
  return `
    <li class="casier${p.bought ? ' is-placed' : ''}${state.openId === p.id ? ' is-open' : ''}" data-id="${p.id}">
      <button class="casier-main sl" data-open="${p.id}">
        ${thumbHtml(p, 'casier-photo')}
        <span class="casier-name">${esc(displayName(p))}</span>
        <span class="casier-sub">${p.brand ? esc(p.brand) + '<br>' : ''}${meta}</span>
        <span class="casier-tags">${p.qty > 1 ? `<span class="tag">×${p.qty}</span>` : ''}${missing.length && !p.bought ? '<span class="tag tag-outline">à compléter</span>' : ''}</span>
      </button>
      <label class="cb casier-cb">
        <input type="checkbox" data-check="${p.id}" ${p.bought ? 'checked' : ''} aria-label="${p.bought ? 'Pris' : 'Marquer comme pris'} : ${esc(displayName(p))}">
        <span class="cb-box" aria-hidden="true"><svg class="ic"><use href="#i-check"/></svg></span>
      </label>
    </li>`;
}

function renderListe() {
  const items = listItems();
  const todo = items.filter(p => !p.bought);
  const done = items.filter(p => p.bought);

  const status = $('#liste-status');
  const prog = $('#liste-progress');
  if (!items.length) { status.textContent = state.products.length ? 'Rien à racheter pour l\'instant.' : ''; prog.hidden = true; }
  else {
    status.innerHTML = todo.length
      ? (done.length ? `<strong>${done.length}</strong> déjà ${done.length > 1 ? 'pris' : 'pris'} sur ${items.length}` : `${items.length} produit${items.length > 1 ? 's' : ''} sur ta liste`)
      : '<strong>Tout est pris.</strong> Chaque chose a retrouvé sa place.';
    prog.hidden = false;
    const pct = Math.round(done.length / items.length * 100);
    prog.style.setProperty('--p', `calc(${pct}% - ${pct > 0 && pct < 100 ? 2 : 0}px)`);
    prog.setAttribute('aria-valuemax', String(items.length));
    prog.setAttribute('aria-valuenow', String(done.length));
    prog.setAttribute('aria-valuetext', `${done.length} sur ${items.length} pris`);
    prog.toggleAttribute('data-full', pct === 100);
    prog.toggleAttribute('data-empty', pct === 0);
  }
  const head = todo.length ? `${todo.length > 1 ? todo.length + ' places attendent' : 'Une place attend'}` : (items.length ? 'Tout est pris' : 'Tout est à sa place');
  document.querySelector('#panel-liste [data-headline]').textContent = head;
  document.querySelector('#panel-liste .topbar-small').textContent = head;
  $('#badge-liste').textContent = todo.length ? String(todo.length) : '';
  $('#tab-liste').setAttribute('aria-label', todo.length ? `À racheter, ${todo.length} restant${todo.length > 1 ? 's' : ''}` : 'À racheter');

  $('#todo-rows').replaceChildren(...todo.map(p => el(itemHtml(p))));
  $('#todo-rows').hidden = !todo.length;
  $('#done-rows').replaceChildren(...done.map(p => el(itemHtml(p))));
  $('#done-section').hidden = !done.length;
  $('#close-trip-btn').textContent = done.length > 1 ? `Retirer les ${done.length}` : 'Retirer de la liste';
  $('#close-trip-btn').setAttribute('aria-label', done.length > 1 ? `Retirer les ${done.length} produits pris de la liste` : 'Retirer le produit pris de la liste');

  const empty = $('#liste-empty');
  empty.hidden = items.length > 0;
  if (!items.length) {
    empty.innerHTML = state.products.length
      ? `<div class="creux-vide" aria-hidden="true"><span></span><span></span><span></span></div><h2 class="empty-title">Rien ne manque.</h2><p>Quand un flacon se termine, remets-le dans la liste depuis ton nécessaire.</p><button class="btn btn-tonal" data-goto="necessaire">Ouvrir le nécessaire</button>`
      : `<div class="creux-vide" aria-hidden="true"><span></span><span></span><span></span></div><h2 class="empty-title">Ton nécessaire est vide.</h2><p>Un nom suffit pour réserver la première place. La photo peut attendre.</p>`;
  }
}

function matchesQuery(p, q) {
  if (!q) return true;
  const hay = norm([p.name, p.brand, p.category, p.note].join(' '));
  const words = norm(q).split(' ').filter(Boolean);
  // Tolérance : chaque mot doit apparaître, ou à une faute près pour les mots de 5 lettres et plus.
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

function renderChips() {
  const incomplete = state.products.filter(p => missingFields(p).length).length;
  const cats = [...new Set(state.products.map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  if (state.category && !cats.includes(state.category)) state.category = null;
  const chip = (label, pressed, attrs) => `<button class="chip sl" aria-pressed="${pressed}" ${attrs}>${pressed ? '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>' : ''}${label}</button>`;
  $('#chips').innerHTML = [
    `<label class="chip chip-select sl"><svg class="ic" aria-hidden="true"><use href="#i-sort"/></svg><span class="visually-hidden">Trier</span>
      <select id="sort" class="chip-select" style="border:0;background:none;font:inherit;color:inherit;min-height:30px">
        <option value="name" ${state.sort === 'name' ? 'selected' : ''}>Par nom</option>
        <option value="last" ${state.sort === 'last' ? 'selected' : ''}>Dernier acheté</option>
        <option value="freq" ${state.sort === 'freq' ? 'selected' : ''}>Les plus rachetés</option>
      </select></label>`,
    incomplete ? chip(`À compléter (${incomplete})`, state.onlyIncomplete, 'data-filter="incomplete"') : '',
    ...cats.map(c => chip(esc(c), state.category === c, `data-cat="${esc(c)}"`)),
  ].join('');
}

function renderNecessaire() {
  renderChips();
  if (!state.products.some(p => missingFields(p).length)) state.onlyIncomplete = false;
  let items = state.products.filter(p => matchesQuery(p, state.query)
    && (!state.onlyIncomplete || missingFields(p).length)
    && (!state.category || p.category === state.category));
  const last = p => p.history.at(-1)?.date ?? 0;
  if (state.sort === 'last') items.sort((a, b) => last(b) - last(a));
  else if (state.sort === 'freq') items.sort((a, b) => b.history.length - a.history.length || last(b) - last(a));
  else items.sort((a, b) => norm(displayName(a)).localeCompare(norm(displayName(b)), 'fr'));

  const n = state.products.length;
  const filtered = state.query || state.onlyIncomplete || state.category;
  $('#nec-status').textContent = !n ? '' : filtered
    ? `${items.length} sur ${n} produit${n > 1 ? 's' : ''}`
    : `${n} place${n > 1 ? 's' : ''} dans ton coffret`;

  $('#nec-grid').replaceChildren(...items.map(p => {
    const sub = [sizeText(p), p.usualPrice != null ? euro(p.usualPrice) : ''].filter(Boolean).join(' · ') || (missingFields(p).length ? 'Fiche à compléter' : '');
    const waiting = p.inList && !p.bought;
    return el(`
      <li class="casier${waiting ? '' : ' is-placed'}" data-id="${p.id}">
        <button class="casier-main sl" data-open="${p.id}">
          ${thumbHtml(p, 'casier-photo')}
          <span class="casier-name">${esc(displayName(p))}</span>
          ${sub ? `<span class="casier-sub">${sub}</span>` : ''}
          ${waiting ? '<span class="casier-tags"><span class="tag tag-accent">À racheter</span></span>' : ''}
        </button>
        ${p.inList ? '' : `<button class="casier-add icon-btn" data-relist="${p.id}" aria-label="Remettre « ${esc(displayName(p))} » dans la liste"><svg class="ic"><use href="#i-plus"/></svg></button>`}
      </li>`);
  }));

  const empty = $('#nec-empty');
  empty.hidden = items.length > 0;
  if (!items.length) {
    empty.innerHTML = !n
      ? `<h2 class="empty-title">Ton nécessaire est vide.</h2><p>Chaque produit ajouté y garde sa place. Tu le remets dans la liste en un geste.</p>`
      : state.query
        ? `<h2 class="empty-title">Aucun produit « ${esc(state.query)} ».</h2><p>Il n'est pas encore dans ton nécessaire.</p><button class="btn btn-tonal" data-create="${esc(state.query)}"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg>Le créer</button>`
        : `<h2 class="empty-title">Aucun produit avec ces filtres.</h2>`;
  }
}

/* ---------- Fiche produit ---------- */
function lineHtml({ key, label, value, missing, icon = '', aria }) {
  return `<li><button class="line sl" data-edit="${key}" aria-label="${esc(aria || `${label}, ${missing ? 'à compléter' : value.replace(/<[^>]+>/g, '')}. Modifier`)}">
    <span class="line-label">${icon}${label}</span>
    <span class="line-value${missing ? ' is-missing' : ''}">${missing ? 'à compléter' : value}<svg class="ic" aria-hidden="true"><use href="#i-edit"/></svg></span>
  </button></li>`;
}

function renderVerso() {
  const pane = $('#verso');
  const p = byId(state.openId);
  document.body.classList.toggle('detail-open', !!p);
  if (!p) { pane.hidden = true; pane.innerHTML = ''; return; }
  pane.hidden = false;

  const url = photoUrl(p);
  const name = displayName(p);
  const gap = priceGap(p);
  const rebuy = rebuyText(p);
  const usualLabel = p.usualPrice != null && p.usualSince && isOld(p.usualSince) ? `Prix de ${monthYear(p.usualSince)}` : 'Prix habituel';
  const unitWord = { ml: 'millilitres', g: 'grammes', unités: 'unités', cl: 'centilitres', l: 'litres', kg: 'kilos' }[p.unit] || p.unit;

  let actions;
  if (p.inList && !p.bought) actions = `<button class="btn btn-filled btn-lg" data-buy="${p.id}"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>Je l'ai pris</button>
    <button class="btn btn-outlined" data-toggle-list="${p.id}">Retirer de la liste</button>`;
  else if (p.inList) actions = `<button class="btn btn-tonal btn-lg" data-unbuy="${p.id}">Pas encore pris, finalement</button>`;
  else actions = `<button class="btn btn-filled btn-lg" data-toggle-list="${p.id}"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg>Remettre dans la liste</button>`;

  pane.innerHTML = `
    <div class="detail-bar">
      <button class="icon-btn icon-btn-tonal" id="verso-back" aria-label="Retour"><svg class="ic"><use href="#i-back"/></svg></button>
    </div>
    <figure class="hero${url ? '' : ' thumb-text'}" style="view-transition-name: product">
      ${url
        ? `<button class="hero-btn" id="verso-photo" aria-label="Voir la photo en grand"><img src="${url}" alt="Photo : ${esc(name)}${p.size ? ', ' + esc(sizeText(p)) : ''}"></button>`
        : `<span aria-hidden="true">${esc(initials(p))}</span>`}
      <span class="hero-photo-btn"><button class="icon-btn icon-btn-tonal" id="verso-photo-change" aria-label="${p.photo ? 'Changer la photo' : 'Ajouter une photo'}"><svg class="ic"><use href="#i-camera"/></svg></button></span>
    </figure>

    <div class="detail-body">
      <header>
        <p class="overline">${p.brand ? esc(p.brand) : 'Marque à compléter'}</p>
        <h2 class="detail-name" id="verso-name">${esc(name)}</h2>
        <div class="facts">
          ${p.size ? `<span class="fact"><svg class="ic" aria-hidden="true"><use href="#i-e"/></svg><span class="visually-hidden">Contenance </span>${sizeText(p)}</span>` : '<span class="fact fact-missing">Contenance à compléter</span>'}
          ${p.category ? `<span class="fact"><svg class="ic" aria-hidden="true"><use href="#i-tag"/></svg>${esc(p.category)}</span>` : ''}
          ${p.inList && p.qty > 1 ? `<span class="fact">×${p.qty} à prendre</span>` : ''}
          ${rebuy ? `<span class="fact">Racheté ${rebuy}</span>` : ''}
        </div>
      </header>

      <div class="detail-actions">${actions}</div>

      <section class="price-card" aria-labelledby="price-title">
        <div class="price-card-head">
          <div>
            <p class="price-label" id="price-title">${usualLabel}</p>
            <p class="price-big${p.usualPrice == null ? ' is-missing' : ''}">${p.usualPrice != null ? euro(p.usualPrice) : 'Pas encore noté'}</p>
          </div>
          <button class="icon-btn" data-edit="usualPrice" aria-label="Modifier le prix habituel"><svg class="ic"><use href="#i-edit"/></svg></button>
        </div>
        ${p.seen ? `<div class="price-seen">Vu le ${dateShort(p.seen.date)} : <span class="num">${euro(p.seen.price)}</span>
          ${gap && gap.sign !== 0 ? `<span class="tag ${gap.sign > 0 ? 'tag-accent' : ''}">${gap.text} · ${gap.sign > 0 ? 'plus cher' : 'moins cher'}</span>` : gap ? '<span class="tag">identique</span>' : ''}</div>` : ''}
        <div class="btn-row"><button class="btn btn-text" data-edit="seen"><svg class="ic" aria-hidden="true"><use href="#i-tag"/></svg>${p.seen ? 'Noter un nouveau prix vu' : 'Noter le prix vu en magasin'}</button></div>
      </section>

      <section class="label-card" aria-labelledby="label-title">
        <h3 id="label-title">Sa fiche</h3>
        <ul class="lines">
          ${lineHtml({ key: 'name', label: 'Nom exact', value: esc(p.name), missing: !p.name })}
          ${lineHtml({ key: 'brand', label: 'Marque', value: esc(p.brand), missing: !p.brand })}
          ${lineHtml({ key: 'size', label: 'Contenance', icon: '<svg class="ic" aria-hidden="true"><use href="#i-e"/></svg>', value: sizeText(p), missing: !p.size, aria: p.size ? `Contenance, ${String(p.size).replace('.', ',')} ${unitWord}. Modifier` : 'Contenance, à compléter' })}
          ${lineHtml({ key: 'category', label: 'Catégorie', value: esc(p.category), missing: !p.category })}
          ${p.inList ? lineHtml({ key: 'qty', label: 'Quantité', value: String(p.qty) }) : ''}
        </ul>
        <button class="note sl${p.note ? '' : ' is-missing'}" data-edit="note" aria-label="${p.note ? 'Note distinctive : ' + esc(p.note) + '. Modifier' : 'Ajouter une note distinctive'}">${p.note ? esc(p.note) : 'Ce qui le distingue des versions proches : « bouchon doré, pas la version bleue ».'}</button>
      </section>

      ${p.history.length ? `
      <section class="history" aria-labelledby="h-title">
        <h3 id="h-title">Historique d'achat</h3>
        <ol>${p.history.slice(-6).reverse().map(h => `<li><span>${dateLong(h.date)}</span><span class="${h.price != null ? '' : 'muted'}">${h.price != null ? euro(h.price) : 'prix non noté'}</span></li>`).join('')}</ol>
      </section>` : ''}

      <div class="danger-zone">
        <button class="btn btn-text btn-danger" id="verso-delete"><svg class="ic" aria-hidden="true"><use href="#i-trash"/></svg>Supprimer de ton nécessaire</button>
      </div>
    </div>`;
}

function renderAll() {
  renderListe();
  renderNecessaire();
  renderVerso();
}

/* ============================================================
   Navigation : sections et fiche (hash pour le bouton retour)
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
  if (!isTwoPane()) window.scrollTo(0, 0); else $('#main').scrollTo(0, 0);
}

let lastTrigger = null;
const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTwoPane = () => matchMedia('(min-width: 840px)').matches;
function quiet(t) { t.ready.catch(() => {}); t.finished.catch(() => {}); t.updateCallbackDone.catch(() => {}); return t; }
const vtSource = id => document.querySelector(`.panel:not([hidden]) [data-vt="${id}"]`);

function openVerso(id, trigger) {
  lastTrigger = trigger || document.activeElement;
  const focusBack = () => $('#verso-back')?.focus();
  const update = () => { state.openId = id; renderAll(); };
  if (!document.startViewTransition || prefersReduced()) { update(); focusBack(); }
  else {
    const src = vtSource(id);
    if (src) src.style.viewTransitionName = 'product';
    const t = quiet(document.startViewTransition(() => { if (src) src.style.viewTransitionName = ''; update(); }));
    t.updateCallbackDone.then(focusBack, focusBack);
  }
  if (location.hash !== `#produit/${id}`) history.pushState({ verso: id }, '', `#produit/${id}`);
}

function closeVerso({ fromPop = false } = {}) {
  if (!state.openId) return;
  const id = state.openId;
  const update = () => { state.openId = null; renderAll(); };
  const refocus = () => {
    const back = document.querySelector(`.panel:not([hidden]) [data-open="${id}"]`) || (lastTrigger?.isConnected ? lastTrigger : null);
    (back || $(`#tab-${state.tab}`)).focus({ preventScroll: false });
  };
  if (!document.startViewTransition || prefersReduced()) { update(); refocus(); }
  else {
    const t = quiet(document.startViewTransition(() => {
      update();
      const target = vtSource(id);
      if (target) target.style.viewTransitionName = 'product';
    }));
    t.updateCallbackDone.then(refocus, refocus);
    t.finished.then(() => { const s = vtSource(id); if (s) s.style.viewTransitionName = ''; }, () => {});
  }
  if (!fromPop && location.hash.startsWith('#produit/')) history.back();
}

window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#produit\/(.+)$/);
  if (m && byId(m[1])) { state.openId = m[1]; renderAll(); }
  else closeVerso({ fromPop: true });
});

/* Grand titre qui se réduit au scroll */
const topObserver = new IntersectionObserver(entries => {
  for (const e of entries) e.target.closest('.topbar').querySelector('.topbar-row').classList.toggle('is-scrolled', !e.isIntersecting);
}, { rootMargin: '-64px 0px 0px 0px' });
document.querySelectorAll('[data-headline]').forEach(h => topObserver.observe(h));

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
    snackbar(`${displayName(p)} : à sa place.`, { action: 'Annuler', onAction: undo });
    try { navigator.vibrate?.(12); } catch {}
    requestAnimationFrame(() => document.querySelector(`.panel:not([hidden]) .casier[data-id="${p.id}"]`)?.classList.add('just-placed'));
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
const ADD_PREVIEW_EMPTY = document.querySelector('#add-preview').innerHTML;
let suggestIndex = -1;

function resetAdd() {
  $('#add-form').reset();
  $('#add-inlist').checked = state.tab === 'liste';
  addPhotoBlob = null;
  $('#add-drop').classList.remove('has-photo');
  $('#add-preview').innerHTML = ADD_PREVIEW_EMPTY;
  setAddError('');
  renderSuggest();
}
function setAddError(msg) {
  const help = $('#add-name-help');
  const input = $('#add-name');
  if (msg) {
    help.textContent = msg; help.classList.add('is-error'); input.setAttribute('aria-invalid', 'true');
  } else {
    help.textContent = 'Avec la variante, par exemple « Eau de toilette Intense ».';
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
      ${thumbHtml(p)}
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
    $('#add-drop').classList.add('has-photo');
  } catch {
    addPhotoBlob = null;
    snackbar('La photo n\'a pas pu être rangée. Réessaie.', { error: true, action: 'Réessayer', onAction: () => $('#add-photo').click() });
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
    snackbar('La photo n\'a pas pu être rangée. Réessaie.', { error: true, action: 'Réessayer', onAction: () => $('#photo-file').click() });
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
    requestAnimationFrame(() => document.querySelector(`#nec-grid [data-open="${p.id}"]`)?.focus());
    return;
  }
  if (t.dataset.create) {
    resetAdd(); $('#add-name').value = t.dataset.create; $('#add-inlist').checked = false;
    openDialog($('#add-dialog'), t); renderSuggest(); $('#add-name').focus(); return;
  }
  if (t.dataset.edit) return openEdit(t.dataset.edit, t);
  if (t.dataset.buy || t.dataset.unbuy) {
    const p = byId(t.dataset.buy || t.dataset.unbuy);
    await setBought(p, !!t.dataset.buy);
    requestAnimationFrame(() => document.querySelector('#verso .detail-actions button')?.focus());
    return;
  }
  if (t.dataset.goto) return setTab(t.dataset.goto, { focus: true });
  if (t.dataset.filter === 'incomplete') { state.onlyIncomplete = !state.onlyIncomplete; renderNecessaire(); return document.querySelector('[data-filter="incomplete"]')?.focus(); }
  if (t.dataset.cat) { state.category = state.category === t.dataset.cat ? null : t.dataset.cat; renderNecessaire(); return document.querySelector(`[data-cat="${CSS.escape(t.dataset.cat)}"]`)?.focus(); }
  if (t.hasAttribute('data-menu-btn')) return toggleMenu(undefined, t);
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
  }
  if (t.dataset.action === 'export') { toggleMenu(false); return exportData(); }
  if (t.dataset.action === 'import') { toggleMenu(false); return $('#import-file').click(); }
});

document.addEventListener('change', e => {
  const id = e.target.dataset?.check;
  if (id) setBought(byId(id), e.target.checked);
});

$('#search').addEventListener('input', e => { state.query = e.target.value; renderNecessaire(); });
document.addEventListener('change', e => { if (e.target.id === 'sort') { state.sort = e.target.value; renderNecessaire(); $('#sort').focus(); } });

/* Onglets : flèches, Home, End (activation automatique) */
$('.toolbar').addEventListener('click', e => { const tab = e.target.closest('[role="tab"]'); if (tab) setTab(tab.id.replace('tab-', '')); });
$('.toolbar').addEventListener('keydown', e => {
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
let menuTrigger = null;
function toggleMenu(force, trigger) {
  const menu = $('#app-menu');
  const open = force ?? menu.hidden;
  if (trigger) menuTrigger = trigger;
  menu.hidden = !open;
  menuTrigger?.setAttribute('aria-expanded', String(open));
  if (open && menuTrigger) {
    const r = menuTrigger.getBoundingClientRect();
    menu.style.top = `${r.bottom + 4}px`;
    menu.style.right = `${Math.max(8, innerWidth - r.right)}px`;
    menu.querySelector('[role="menuitem"]').focus();
  }
}
$('#app-menu').addEventListener('keydown', e => {
  const items = [...$('#app-menu').querySelectorAll('[role="menuitem"]')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  if (e.key === 'Escape' || e.key === 'Tab') { toggleMenu(false); if (e.key === 'Escape') menuTrigger?.focus(); }
});
document.addEventListener('pointerdown', e => { if (!$('#app-menu').hidden && !e.target.closest('.menu-anchor') && !e.target.closest('#app-menu')) toggleMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.openId && !document.querySelector('dialog[open]') && document.activeElement?.closest('#verso')) closeVerso();
});

/* ============================================================
   Glisser pour retirer de la liste (alternative : verso)
   ============================================================ */
let swipe = null;
let swipeEndedAt = 0;
$('#todo-rows').addEventListener('pointerdown', e => {
  const row = e.target.closest('.casier');
  if (!row || e.pointerType === 'mouse' || e.target.closest('.cb')) return;
  swipe = { row, x: e.clientX, y: e.clientY, dx: 0, active: false, id: e.pointerId };
});
$('#todo-rows').addEventListener('pointermove', e => {
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
$('#todo-rows').addEventListener('pointerup', endSwipe);
$('#todo-rows').addEventListener('pointercancel', () => { if (swipe?.row) swipe.row.style.transform = ''; swipe = null; });

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
  // Photos d'exemple dessinées : un flacon sur fond teinté, lumière douce.
  const c = document.createElement('canvas'); c.width = 800; c.height = 800;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(400, 300, 60, 400, 400, 620);
  bg.addColorStop(0, colors[3] || '#f4f1ec'); bg.addColorStop(1, colors[4] || '#d9d4cc');
  g.fillStyle = bg; g.fillRect(0, 0, 800, 800);
  g.fillStyle = 'rgba(0,0,0,.10)'; g.beginPath(); g.ellipse(400, 690, 170, 26, 0, 0, Math.PI * 2); g.fill();
  const body = g.createLinearGradient(260, 0, 540, 0);
  body.addColorStop(0, colors[0]); body.addColorStop(.55, colors[1]); body.addColorStop(1, colors[0]);
  g.fillStyle = body; g.beginPath(); g.roundRect(270, 210, 260, 480, [70, 70, 36, 36]); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.roundRect(300, 240, 26, 400, 13); g.fill();
  g.fillStyle = colors[2]; g.beginPath(); g.roundRect(340, 120, 120, 100, 14); g.fill();
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(300, 390, 200, 150, 10); g.fill();
  g.fillStyle = '#20262b'; g.textAlign = 'center';
  g.font = '600 34px "IBM Plex Sans Condensed", sans-serif'; g.fillText(label, 400, 462);
  g.font = '400 20px "IBM Plex Sans Condensed", sans-serif'; g.fillText('EXEMPLE', 400, 500);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
}
async function seedDemo() {
  await document.fonts.ready;
  const day = 86400000, now = Date.now();
  const ex = [
    { name: 'Gel douche Hydra Fresh', brand: 'Marque exemple A', size: 250, unit: 'ml', category: 'Gel douche', usualPrice: 349, inList: true, colors: ['#1d4f8a', '#5f95d0', '#0f2a4a', '#eaf1f8', '#c9d8e8'], label: 'HYDRA', history: [now - 64 * day, now - 43 * day, now - 21 * day] },
    { name: 'Exfoliant corps abricot', brand: '', size: 200, unit: 'ml', category: 'Exfoliant', usualPrice: 790, inList: true, bought: true, colors: ['#e2763a', '#f5b25a', '#7a3b12', '#fbefe2', '#ecd2b8'], label: 'ABRICOT', history: [now - 90 * day] },
    { name: 'Déodorant bille peau sensible', brand: 'Marque exemple B', size: 50, unit: 'ml', category: 'Déodorant', usualPrice: 295, inList: true, qty: 2, colors: ['#c9d1d6', '#f4f6f7', '#5a6872', '#eef1f2', '#cfd6da'], label: 'SENSIBLE' },
    { name: 'Eau de toilette Intense', brand: 'Marque exemple C', size: 100, unit: 'ml', category: 'Parfum', usualPrice: 5490, seen: { price: 5790, date: now - 1 * day }, inList: true, note: 'Bouchon doré. Pas la version « Eau fraîche » au flacon bleu.', colors: ['#3a2c1c', '#8a6a3a', '#c9a45c', '#f2ece2', '#d6c9b4'], label: 'INTENSE', history: [now - 180 * day, now - 120 * day, now - 58 * day] },
    { name: 'Shampoing doux avoine', brand: 'Marque exemple A', size: null, unit: 'ml', category: 'Shampoing', inList: false, colors: ['#bfa678', '#e8dcc0', '#6b5a3a', '#f5f1e8', '#ddd3c0'], label: 'AVOINE' },
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
}
start();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
