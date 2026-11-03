// Emplacements photo : silhouettes de flacons (aucune vraie photo disponible).
// Chaque produit garde la couleur réelle de son emballage, pour juger l'effet « le contenu porte la couleur ».
const PRODUITS = [
  { nom: 'Gel douche Hydra Fresh', marque: 'Marque A', cont: '250 ml', prix: '3,49 €', forme: 'flacon', c1: '#1F5FA8', c2: '#7FB2E5', bouchon: '#0E2A4A' },
  { nom: 'Eau de toilette Intense', marque: 'Marque C', cont: '100 ml', prix: '54,90 €', forme: 'parfum', c1: '#3A2A18', c2: '#9A7642', bouchon: '#C9A45C' },
  { nom: 'Déodorant bille peau sensible', marque: 'Marque B', cont: '50 ml', prix: '2,95 €', forme: 'bille', c1: '#C9D1D6', c2: '#F4F6F7', bouchon: '#5A6872' },
  { nom: 'Exfoliant corps abricot', marque: '', cont: '200 ml', prix: '7,90 €', forme: 'tube', c1: '#E2763A', c2: '#F5B25A', bouchon: '#7A3B12' },
  { nom: 'Shampoing doux avoine', marque: 'Marque A', cont: '300 ml', prix: '4,20 €', forme: 'flacon', c1: '#BFA678', c2: '#E8DCC0', bouchon: '#6B5A3A' },
];
function flacon(p, { w = 80, h = 110, niveau = 1, fond = 'none', creux = false } = {}) {
  const id = Math.random().toString(36).slice(2);
  const corps = {
    flacon: '<rect x="30" y="34" width="40" height="70" rx="9"/>',
    parfum: '<rect x="26" y="44" width="48" height="60" rx="6"/>',
    bille: '<rect x="34" y="30" width="32" height="74" rx="14"/>',
    tube: '<path d="M30 22h40l-6 82H36z"/>',
  }[p.forme];
  const bouchon = { flacon: '<rect x="40" y="20" width="20" height="16" rx="3"/>', parfum: '<rect x="38" y="24" width="24" height="22" rx="3"/>', bille: '<rect x="38" y="14" width="24" height="18" rx="9"/>', tube: '<rect x="36" y="104" width="28" height="8" rx="2"/>' }[p.forme];
  if (creux) return `<svg viewBox="0 0 100 116" width="${w}" height="${h}" aria-hidden="true"><g fill="rgba(0,0,0,.16)">${corps}${bouchon}</g><g fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1">${corps}${bouchon}</g></svg>`;
  const y = 104 - 70 * niveau;
  return `<svg viewBox="0 0 100 116" width="${w}" height="${h}" aria-hidden="true">
    <defs><linearGradient id="g${id}" x1="0" x2="1"><stop offset="0" stop-color="${p.c1}"/><stop offset=".55" stop-color="${p.c2}"/><stop offset="1" stop-color="${p.c1}"/></linearGradient>
    <clipPath id="k${id}">${corps}</clipPath></defs>
    <rect width="100" height="116" fill="${fond}"/>
    <g fill="url(#g${id})">${corps}</g><g fill="${p.bouchon}">${bouchon}</g>
    <rect x="38" y="62" width="24" height="16" fill="rgba(255,255,255,.85)"/>
    ${niveau < 1 ? `<g clip-path="url(#k${id})"><rect x="0" y="0" width="100" height="${y}" fill="rgba(255,255,255,.55)"/></g>` : ''}
  </svg>`;
}
