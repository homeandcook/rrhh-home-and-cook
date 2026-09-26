"use strict";
/* Logotipo: tipografía del portal y X dibujada, proporcional al texto */
const WM_PREFIJO = { es: "RRHH", en: "HR", fr: "RH" };
const WM_X = '<path d="M 120 100 Q 500 480 880 900" stroke-linecap="round"/><path d="M 880 100 Q 500 480 120 900" stroke-linecap="round"/>';

function equisSVG(em) {
  return `<svg class="equis" viewBox="0 0 1000 1000" style="width:${em}em;height:${em}em" aria-hidden="true"
    fill="none" stroke="var(--red)" stroke-width="215">${WM_X}</svg>`;
}
function marcaSVG(modo, alto) {
  const pre = WM_PREFIJO[LANG] || WM_PREFIJO.es;
  const tam = modo === "linea" ? (alto || 17) : (alto || 34);
  const fs = modo === "linea" ? `${tam}px` : `min(${tam}px, 6.6vw)`;
  return `<span class="marca ${modo === "linea" ? "chica" : "grande"}" style="font-size:${fs}" role="img" aria-label="${pre} x Home&Cook">
    <span>${pre}</span>${equisSVG(0.78)}<span>Home&amp;Cook</span></span>`;
}
