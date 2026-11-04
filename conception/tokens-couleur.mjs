// Usage : npm i @material/material-color-utilities && node tokens-couleur.mjs > tokens.css
import { Hct, SchemeTonalSpot, MaterialDynamicColors as M, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
const src = Hct.fromInt(argbFromHex('#00696B'));
const roleMap = {primary:'primary','on-primary':'onPrimary','primary-container':'primaryContainer','on-primary-container':'onPrimaryContainer',secondary:'secondary','on-secondary':'onSecondary','secondary-container':'secondaryContainer','on-secondary-container':'onSecondaryContainer',error:'error','on-error':'onError','error-container':'errorContainer','on-error-container':'onErrorContainer',surface:'surface','on-surface':'onSurface','on-surface-variant':'onSurfaceVariant','surface-container-lowest':'surfaceContainerLowest','surface-container-low':'surfaceContainerLow','surface-container':'surfaceContainer','surface-container-high':'surfaceContainerHigh','surface-container-highest':'surfaceContainerHighest',outline:'outline','outline-variant':'outlineVariant','inverse-surface':'inverseSurface','inverse-on-surface':'inverseOnSurface','inverse-primary':'inversePrimary',scrim:'scrim',shadow:'shadow'};
const base = new SchemeTonalSpot(src, false, 0);
const pals = {p: base.primaryPalette, s: base.secondaryPalette, t: base.tertiaryPalette, n: base.neutralPalette, nv: base.neutralVariantPalette, e: base.errorPalette};
const refs = new Map();
function refFor(hex) {
  for (const [k, pal] of Object.entries(pals)) for (let t = 0; t <= 100; t++) {
    if (hexFromArgb(pal.tone(t)).toLowerCase() === hex.toLowerCase()) { const name = `--ref-${k}${t}`; refs.set(name, hex); return `var(${name})`; }
  }
  return hex;
}
function block(dark, c) {
  const s = new SchemeTonalSpot(src, dark, c);
  const lines = [];
  for (const [css, r] of Object.entries(roleMap)) {
    let hex = hexFromArgb(M[r].getArgb(s));
    // 60-30-10 : dominante blanc pur le jour, noir pur la nuit (exception documentée)
    if (r === 'surface' || r === 'surfaceContainerLowest') hex = dark ? '#000000' : '#ffffff';
    lines.push(`  --c-${css}: ${refFor(hex)};`);
  }
  return lines.join('\n');
}
const L0 = block(false, 0), D0 = block(true, 0), L1 = block(false, 1), D1 = block(true, 1);
const refCss = [...refs.entries()].sort().map(([k, v]) => `  ${k}: ${v};`).join('\n');
const out = `/* Généré par Material Color Utilities (SchemeTonalSpot, source #00696B) — conception/tokens-couleur.mjs */
:root {
  /* Référence : palettes tonales (tons utilisés) */
${refCss}
}
/* Système : rôles — clair, contraste standard */
:root {
  color-scheme: light;
${L0}
}
/* Système : rôles — sombre */
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  color-scheme: dark;
${D0}
} }
:root[data-theme="dark"] {
  color-scheme: dark;
${D0}
}
/* Contraste élevé (préférence système « plus de contraste ») */
@media (prefers-contrast: more) {
  :root {
${L1}
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
${D1}
  } }
  :root[data-theme="dark"] {
${D1}
  }
}
`;
process.stdout.write(out);
