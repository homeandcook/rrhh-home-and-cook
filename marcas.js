"use strict";
/* Símbolo de Pippole: dos personas que sostienen juntas una barra y forman
   una π, el «pi» con el que empieza el nombre. */
function simboloPippole(px) {
  const p = px || 32;
  return `<svg class="pp-simbolo" width="${p}" height="${p}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="15" cy="9" r="5" fill="var(--red)"></circle><circle cx="33" cy="9" r="5" fill="#B6A6FF"></circle><rect x="4" y="17" width="40" height="6.5" rx="3.25" fill="var(--red)"></rect><rect x="12" y="20" width="6.5" height="24" rx="3.25" fill="var(--red)"></rect><rect x="29.5" y="20" width="6.5" height="24" rx="3.25" fill="#B6A6FF"></rect></svg>`;
}
