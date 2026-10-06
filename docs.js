"use strict";
/* ===================== PROCESS BOOK Y POLÍTICA DE RR.HH. =====================
   Un mismo motor para los dos: una biblioteca de fichas con buscador, cada
   ficha con sus pasos (que se pueden ir marcando en el móvil mientras se
   hacen) o sus puntos clave, a quién acudir y la referencia.

   El contenido base viene en docs_base.js. RR.HH. puede editarlo desde la
   propia plataforma: la versión editada se guarda en la tabla "documentos"
   (una fila por libro) y pasa a ser la que ve toda la red. Siempre se puede
   volver a la versión base.
   ============================================================================= */
const DOCS_TIPOS = ["process", "politica"];
/* Qué libro se está mirando: lo dice la pestaña del apartado */
function docTipo() { return DOCS_TIPOS.includes(S.tab) ? S.tab : "process"; }

function docsEstado() {
  S.docs = S.docs || { sel: null, busca: "", edit: null };
  return S.docs;
}
/* El libro que se muestra: el editado por RR.HH. si existe, si no el base */
function libro(tipo) {
  const base = DOCS_BASE[tipo];
  const fila = (S.documentos || {})[tipo];
  if (fila && fila.items && fila.items.length) return Object.assign({}, base, fila, { editado: true });
  return Object.assign({}, base, { editado: false });
}
async function cargarDocumentos() {
  S.documentos = {};
  const { data, error } = await sb.from("documentos").select("*");
  if (error) return;   // sin tabla todavía: se usa la versión base
  (data || []).forEach(r => { S.documentos[r.clave] = Object.assign({}, r.cuerpo || {}, { actualizado: r.actualizado }); });
}
async function guardarDocumento(tipo, cuerpo) {
  const existe = !!(S.documentos || {})[tipo];
  const r = existe
    ? await sb.from("documentos").update({ cuerpo }).eq("clave", tipo).select()
    : await sb.from("documentos").insert({ clave: tipo, cuerpo }).select();
  if (r.error) { alert("No se ha podido guardar: " + traducirError(r.error)); return false; }
  S.documentos = S.documentos || {};
  S.documentos[tipo] = cuerpo ? Object.assign({}, cuerpo, { actualizado: new Date().toISOString() }) : null;
  if (!cuerpo) delete S.documentos[tipo];
  return true;
}

/* ---------- Marcas de la lista de pasos: viven en este navegador y caducan cada día ---------- */
function claveChecks(tipo, id) { return `sc-check-${tipo}-${id}-${new Date().toISOString().slice(0, 10)}-${S.me ? S.me.id : "x"}`; }
function checksDe(tipo, id) { try { return JSON.parse(localStorage.getItem(claveChecks(tipo, id))) || []; } catch (e) { return []; } }
function guardarChecks(tipo, id, lista) { try { localStorage.setItem(claveChecks(tipo, id), JSON.stringify(lista)); } catch (e) {} }

/* ---------- Vistas ---------- */
function pintarDocs(tipo) {
  const st = docsEstado(), L = libro(tipo);
  if (st.edit) return pintarDocEditor(tipo);
  if (st.sel && L.items.some(x => x.id === st.sel)) return pintarDocFicha(tipo, L);
  st.sel = null;
  const q = (st.busca || "").trim().toLowerCase();
  const coincide = x => !q || [x.t, x.resumen, x.grupo, x.quien, ...(x.pasos || []), ...(x.puntos || []), ...(x.claves || [])].join(" ").toLowerCase().includes(q);
  const items = L.items.filter(coincide);
  const grupos = L.grupos.filter(g => items.some(x => x.grupo === g)).concat([...new Set(items.map(x => x.grupo))].filter(g => !L.grupos.includes(g)));
  let h = `<div class="page docs">
    <div class="page-h"><div><h1>${esc(L.titulo)}</h1><p class="lead" style="margin:6px 0 0">${esc(L.intro)}</p></div>
      ${esAdmin() ? `<span class="docs-acc"><button class="btn small" data-action="docNuevo">Nueva ficha</button>
        ${L.editado ? `<button class="btn small ghost" data-action="docRestaurar" title="Vuelve al contenido base de la plataforma">Restaurar versión base</button>` : ""}</span>` : ""}</div>
    ${L.aviso ? `<p class="hint aviso">${esc(L.aviso)}</p>` : ""}
    <div class="docs-top"><input id="docsBusca" class="busca" placeholder="Busca: caja, vacaciones, inventario, permiso…" value="${esc(st.busca || "")}" autocomplete="off">
      <span class="muted num">${items.length} ${items.length === 1 ? "ficha" : "fichas"}${L.editado ? ` · editado por RR.HH.${L.actualizado ? " el " + fechaES(L.actualizado) : ""}` : " · versión base"}</span></div>`;
  if (!items.length) h += `<div class="empty big"><p>Nada coincide con «${esc(st.busca)}».</p></div>`;
  grupos.forEach(g => {
    h += `<h2 class="grupo">${esc(g)}</h2><div class="cards docs-cards">${items.filter(x => x.grupo === g).map(x => {
      const n = (x.pasos || []).length, hechos = n ? checksDe(tipo, x.id).length : 0;
      return `<button class="mod doc" data-action="docAbrir" data-id="${esc(x.id)}">
        <span class="mod-t">${esc(x.t)}</span>
        <span class="mod-d">${esc(x.resumen)}</span>
        <span class="curso-meta">${esc(x.quien || "")}${x.cuando ? " · " + esc(x.cuando) : ""}</span>
        <span class="mod-f">${n ? `${n} pasos${hechos ? ` · ${hechos} marcados hoy` : ""}` : `${(x.puntos || []).length} puntos`}</span></button>`;
    }).join("")}</div>`;
  });
  $("vista").innerHTML = h + `</div>`;
}

function pintarDocFicha(tipo, L) {
  const st = docsEstado(), x = L.items.find(y => y.id === st.sel);
  const checks = checksDe(tipo, x.id), n = (x.pasos || []).length;
  const idx = L.items.indexOf(x), ant = L.items[idx - 1], sig = L.items[idx + 1];
  $("vista").innerHTML = `<div class="page docs">
    <div class="page-h"><div><button class="btn small ghost" data-action="docVolver">← ${esc(L.titulo)}</button>
      <h1>${esc(x.t)}</h1><p class="muted" style="margin:4px 0 0">${esc(x.grupo)}${x.quien ? " · " + esc(x.quien) : ""}${x.cuando ? " · " + esc(x.cuando) : ""}</p></div>
      <span class="docs-acc">${esAdmin() ? `<button class="btn small" data-action="docEditar" data-id="${esc(x.id)}">Editar</button>` : ""}
        <button class="btn small ghost" data-action="docImprimir">Imprimir</button></span></div>
    <section class="card doc-ficha">
      <p class="idea">${esc(x.resumen)}</p>
      ${n ? `<div class="check-h"><h2>Paso a paso</h2><span class="muted num">${checks.length} de ${n}</span>
          ${checks.length ? `<button class="btn small ghost" data-action="docDesmarcar">Reiniciar</button>` : ""}</div>
        <i class="prog mini" aria-hidden="true"><span style="width:${Math.round(checks.length / n * 100)}%"></span></i>
        <ol class="checklist">${x.pasos.map((p, i) => `<li class="${checks.includes(i) ? "ok" : ""}"><button type="button" data-action="docCheck" data-i="${i}" role="checkbox" aria-checked="${checks.includes(i)}"><span class="cb">${checks.includes(i) ? "✓" : i + 1}</span><span>${esc(p)}</span></button></li>`).join("")}</ol>
        ${checks.length === n ? `<p class="check-fin">Hecho. La lista se reinicia mañana sola.</p>` : `<p class="hint">Las marcas se guardan en este dispositivo y se borran cada día.</p>`}` : ""}
      ${(x.puntos || []).length ? `<h2 style="margin-top:${n ? 18 : 0}px">${n ? "Además" : "Lo que hay que saber"}</h2><ul class="lista puntos">${x.puntos.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${(x.claves || []).length ? `<div class="claves"><h3>Claves</h3><ul class="lista">${x.claves.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>` : ""}
      <div class="doc-pie">
        ${x.quienAcudir ? `<div><small>A quién acudir</small><b>${esc(x.quienAcudir)}</b></div>` : ""}
        ${x.quien ? `<div><small>Quién</small><b>${esc(x.quien)}</b></div>` : ""}
        ${x.cuando ? `<div><small>Cuándo</small><b>${esc(x.cuando)}</b></div>` : ""}
        ${x.ref ? `<div><small>Referencia</small><b>${esc(x.ref)}</b></div>` : ""}
      </div>
    </section>
    <div class="paso-nav">
      ${ant ? `<button class="btn" data-action="docAbrir" data-id="${esc(ant.id)}">← ${esc(ant.t)}</button>` : "<span></span>"}
      ${sig ? `<button class="btn" data-action="docAbrir" data-id="${esc(sig.id)}">${esc(sig.t)} →</button>` : "<span></span>"}
    </div></div>`;
}

function informeDoc(tipo) {
  const L = libro(tipo), x = L.items.find(y => y.id === docsEstado().sel);
  return `<div class="pr-head">${logo(56)}<div><h1>${esc(x.t)}</h1><p class="meta">${esc(L.titulo)} · RRHH x Home&Cook, Groupe SEB</p>
    <p class="meta">${esc(x.quien || "")}${x.cuando ? " · " + esc(x.cuando) : ""}</p></div></div>
    <p><b>${esc(x.resumen)}</b></p>
    ${(x.pasos || []).length ? `<h2>Paso a paso</h2><ol>${x.pasos.map(p => `<li>☐ ${esc(p)}</li>`).join("")}</ol>` : ""}
    ${(x.puntos || []).length ? `<h2>Lo que hay que saber</h2><ul>${x.puntos.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    ${(x.claves || []).length ? `<h2>Claves</h2><ul>${x.claves.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    ${x.quienAcudir ? `<p><b>A quién acudir:</b> ${esc(x.quienAcudir)}</p>` : ""}${x.ref ? `<p class="meta">${esc(x.ref)}</p>` : ""}`;
}

/* ---------- Editor (RR.HH.) ---------- */
function pintarDocEditor(tipo) {
  const st = docsEstado(), L = libro(tipo), e = st.edit;
  const lineas = a => (a || []).join("\n");
  $("vista").innerHTML = `<div class="page docs">
    <div class="page-h"><div><button class="btn small ghost" data-action="docEditCancelar">← Cancelar</button>
      <h1>${e.nuevo ? "Nueva ficha" : "Editar ficha"}</h1></div></div>
    <form class="card doc-editor" id="formDoc">
      <div class="grid2">
        <label>Título<input name="t" required value="${esc(e.t || "")}"></label>
        <label>Grupo<input name="grupo" list="docGrupos" required value="${esc(e.grupo || L.grupos[0])}"><datalist id="docGrupos">${L.grupos.map(g => `<option>${esc(g)}</option>`).join("")}</datalist></label>
        <label>Quién<input name="quien" value="${esc(e.quien || "")}" placeholder="Quién lo hace o a quién aplica"></label>
        <label>Cuándo<input name="cuando" value="${esc(e.cuando || "")}" placeholder="Opcional"></label>
        <label class="span2">Resumen (una o dos frases)<textarea name="resumen" rows="2" required>${esc(e.resumen || "")}</textarea></label>
        <label class="span2">Paso a paso <small>una línea por paso; déjalo vacío si la ficha no es una lista</small><textarea name="pasos" rows="8">${esc(lineas(e.pasos))}</textarea></label>
        <label class="span2">Puntos clave <small>una línea por punto</small><textarea name="puntos" rows="6">${esc(lineas(e.puntos))}</textarea></label>
        <label class="span2">Claves o avisos <small>una línea por aviso</small><textarea name="claves" rows="3">${esc(lineas(e.claves))}</textarea></label>
        <label>A quién acudir<input name="quienAcudir" value="${esc(e.quienAcudir || "")}"></label>
        <label>Referencia<input name="ref" value="${esc(e.ref || "")}" placeholder="Norma, política o documento"></label>
      </div>
      <div class="actions">
        ${e.nuevo ? "" : `<button type="button" class="btn ghost danger" data-action="docBorrar">Eliminar ficha</button><span class="spacer"></span>
          <button type="button" class="btn" data-action="docMover" data-d="-1">Subir</button><button type="button" class="btn" data-action="docMover" data-d="1">Bajar</button>`}
        <button class="btn primary" type="submit">Guardar</button></div>
      <p class="hint">Lo que guardes lo ve toda la red al momento. La versión base de la plataforma se conserva y se puede restaurar desde el listado.</p>
    </form></div>`;
  $("formDoc").addEventListener("submit", ev => { ev.preventDefault(); docGuardarFicha(tipo); });
}
function cuerpoEditable(tipo) {
  const L = libro(tipo);
  return { titulo: L.titulo, intro: L.intro, aviso: L.aviso, grupos: L.grupos.slice(), items: JSON.parse(JSON.stringify(L.items)) };
}
async function docGuardarFicha(tipo) {
  const st = docsEstado(), f = Object.fromEntries(new FormData($("formDoc")));
  const lista = s => String(s || "").split("\n").map(x => x.trim()).filter(Boolean);
  const cuerpo = cuerpoEditable(tipo);
  const ficha = { id: st.edit.id, t: f.t.trim(), grupo: f.grupo.trim(), quien: f.quien.trim(), cuando: f.cuando.trim(), resumen: f.resumen.trim(),
    pasos: lista(f.pasos), puntos: lista(f.puntos), claves: lista(f.claves), quienAcudir: f.quienAcudir.trim(), ref: f.ref.trim() };
  if (!ficha.pasos.length) delete ficha.pasos;
  if (!ficha.puntos.length) delete ficha.puntos;
  if (!ficha.claves.length) delete ficha.claves;
  if (!cuerpo.grupos.includes(ficha.grupo)) cuerpo.grupos.push(ficha.grupo);
  const i = cuerpo.items.findIndex(x => x.id === ficha.id);
  if (i >= 0) cuerpo.items[i] = ficha; else cuerpo.items.push(ficha);
  if (!(await guardarDocumento(tipo, cuerpo))) return;
  log(`${DOCS_BASE[tipo].titulo}: ficha «${ficha.t}» ${i >= 0 ? "editada" : "creada"}`);
  toast("Ficha guardada"); st.edit = null; st.sel = ficha.id; pintar();
}

const ACCIONES_DOCS = {
  docAbrir(b) { docsEstado().sel = b.dataset.id; window.scrollTo(0, 0); },
  docVolver() { docsEstado().sel = null; },
  docCheck(b) {
    const st = docsEstado(), i = Number(b.dataset.i), lista = checksDe(docTipo(), st.sel);
    const k = lista.indexOf(i); if (k >= 0) lista.splice(k, 1); else lista.push(i);
    guardarChecks(docTipo(), st.sel, lista);
  },
  docDesmarcar() { guardarChecks(docTipo(), docsEstado().sel, []); },
  docImprimir() { $("print").innerHTML = informeDoc(docTipo()); window.print(); return false; },
  docNuevo() { if (!esAdmin()) return false; docsEstado().edit = { nuevo: true, id: "d" + Date.now().toString(36) }; window.scrollTo(0, 0); },
  docEditar(b) { if (!esAdmin()) return false; const L = libro(docTipo()), x = L.items.find(y => y.id === b.dataset.id); docsEstado().edit = JSON.parse(JSON.stringify(x)); window.scrollTo(0, 0); },
  docEditCancelar() { docsEstado().edit = null; },
  async docBorrar() {
    const st = docsEstado(), cuerpo = cuerpoEditable(docTipo()), x = cuerpo.items.find(y => y.id === st.edit.id);
    if (!confirm(`¿Eliminar la ficha «${x.t}»? Se puede recuperar restaurando la versión base.`)) return false;
    cuerpo.items = cuerpo.items.filter(y => y.id !== x.id);
    if (!(await guardarDocumento(docTipo(), cuerpo))) return false;
    log(`${DOCS_BASE[docTipo()].titulo}: ficha «${x.t}» eliminada`); st.edit = null; st.sel = null;
  },
  async docMover(b) {
    const st = docsEstado(), cuerpo = cuerpoEditable(docTipo()), d = Number(b.dataset.d);
    const i = cuerpo.items.findIndex(y => y.id === st.edit.id), j = i + d;
    if (i < 0 || j < 0 || j >= cuerpo.items.length) return false;
    [cuerpo.items[i], cuerpo.items[j]] = [cuerpo.items[j], cuerpo.items[i]];
    if (!(await guardarDocumento(docTipo(), cuerpo))) return false;
    toast("Orden guardado"); return false;
  },
  async docRestaurar() {
    if (!confirm("Se descartan todas las ediciones de RR.HH. y vuelve el contenido base de la plataforma. ¿Seguimos?")) return false;
    const r = await sb.from("documentos").delete().eq("clave", docTipo());
    if (r.error) { alert(traducirError(r.error)); return false; }
    delete S.documentos[docTipo()]; log(`${DOCS_BASE[docTipo()].titulo}: restaurada la versión base`); toast("Versión base restaurada");
  }
};
document.addEventListener("input", e => {
  if (e.target.id !== "docsBusca") return;
  docsEstado().busca = e.target.value; const foco = e.target.selectionStart;
  pintarDocs(docTipo());
  const n = $("docsBusca"); if (n) { n.focus(); n.setSelectionRange(foco, foco); }
});
