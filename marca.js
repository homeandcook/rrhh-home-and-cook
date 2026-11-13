"use strict";
/* Logotipo: «pippole» en la tipografía de la plataforma */
function marcaSVG(modo, alto) {
  const tam = modo === "linea" ? (alto || 17) : (alto || 34);
  const fs = modo === "linea" ? `${tam}px` : `min(${tam}px, 6.6vw)`;
  return `<span class="marca ${modo === "linea" ? "chica" : "grande"}" style="font-size:${fs}" role="img" aria-label="Pippole"><span>pippole</span></span>`;
}
