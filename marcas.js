"use strict";
/* Símbolo de Pippole: un bocadillo con dos puntos (dos personas que hablan).
   Sustituye a los logos de marca anteriores: la interfaz no muestra ninguno. */
function simboloPippole(px, fondo) {
  const p = px || 32;
  return `<svg class="pp-simbolo" width="${p}" height="${p}" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 18a14 13 0 1 1 7 11.3L6 33l2.2-6.6A12.8 12.8 0 0 1 6 18z" fill="var(--red)"></path><circle cx="15" cy="18" r="2.4" fill="${fondo || "#FFFFFF"}"></circle><circle cx="25" cy="18" r="2.4" fill="${fondo || "#FFFFFF"}"></circle></svg>`;
}
/* Nombres antiguos, mantenidos para no tocar cada pantalla */
function logoSEB(alto) { return simboloPippole(alto || 34); }
function bandaMarcas() { return ""; }
