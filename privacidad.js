/* Pippole · página de privacidad.
   Rellena los huecos con APP_CONFIG.legal (config.js) si existe:
   legal: { responsable, encargado, contacto, conservacion, fecha, validado }
   Si «validado» es true, se quita el aviso de texto pendiente. */
(function () {
  var L = (window.APP_CONFIG && window.APP_CONFIG.legal) || {};
  document.querySelectorAll("[data-legal]").forEach(function (el) {
    var v = L[el.getAttribute("data-legal")];
    if (typeof v === "string" && v.trim()) { el.textContent = v; el.classList.remove("hueco"); }
  });
  if (L.validado === true) { var a = document.getElementById("avisoBorrador"); if (a) a.remove(); }
})();
