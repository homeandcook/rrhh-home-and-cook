"use strict";
/* ===================== ENCUESTAS DE CLIMA (desde 0.32) =====================
   Dos tipos de encuesta, siempre anónimas:
   - De colectivo (tiendas, comerciales de campo, oficinas, demostradores):
     15 afirmaciones comunes + 2 propias + global + eNPS + 1 abierta que se
     adapta a lo que ha contestado cada persona.
   - Tipo Great Place To Work: 60 afirmaciones en 5 dimensiones y 15
     apartados, global y 2 abiertas. La estructura es la de su modelo; las
     frases son propias (las suyas están protegidas).
   Las dos pueden llevar la parte 2, evaluación al responsable directo, si
   RR.HH. la activa al crearla. Quien responde no elige nada.

   Datos:
   - campanas.config: { version: 2, encuesta, colectivo, parte2, cierre,
     pendientes: [{e, t, g, r}], enviadosA: [correos] }. Guarda a quién se ha
     invitado, nunca qué código recibió cada persona.
   - invitaciones: sin nombre ni correo; tienda_id o grupo, y responsable
     (a quién evalúa la parte 2).
   Pantallas de RR.HH.: pestañas del apartado (clnueva, clcurso,
   clanteriores, clresultados, clmodelos). La de quien responde, en
   clima_inv.js.
   ============================================================================ */
const CL = {
  MIN: 5,
  ESCALA: ["Casi nunca", "Pocas veces", "A veces", "A menudo", "Casi siempre"],
  DIMS: ["Credibilidad", "Respeto", "Imparcialidad", "Orgullo", "Compañerismo"],
  COLECTIVOS: {
    tiendas: { n: "Tiendas", eq: "tienda", resp: "Store Manager",
      propias: [["Respeto", "Conozco mis turnos con antelación suficiente."], ["Respeto", "Me siento seguro en la tienda, también con clientes difíciles."]] },
    campo: { n: "Comerciales de campo", eq: "zona", resp: "Responsable de zona",
      propias: [["Compañerismo", "Aunque pase casi todo el tiempo fuera, me siento parte del equipo."], ["Respeto", "El número de visitas y kilómetros es razonable."]] },
    oficinas: { n: "Oficinas", eq: "departamento", resp: "Responsable de departamento",
      propias: [["Respeto", "Puedo desconectar fuera de mi horario."], ["Compañerismo", "Los departamentos colaboramos bien entre nosotros."]] },
    demo: { n: "Demostradores en córner", eq: "córner", resp: "Coordinación de demostradores",
      propias: [["Orgullo", "Aunque trabaje en el espacio de otra empresa, me siento parte de la nuestra."], ["Respeto", "Recibo a tiempo la información y la formación de los productos que presento."]] }
  },
  CORTA: [
    ["Credibilidad", "La dirección nos cuenta con claridad hacia dónde va la empresa."],
    ["Credibilidad", "Puedo hacer preguntas a la dirección y recibo respuestas sinceras."],
    ["Credibilidad", "Lo que dice la dirección coincide con lo que hace."],
    ["Respeto", "Tengo los medios y la formación que necesito para hacer bien mi trabajo."],
    ["Respeto", "Cuando hago un buen trabajo, se reconoce."],
    ["Respeto", "Puedo compaginar el trabajo con mi vida personal."],
    ["Imparcialidad", "Me pagan de forma justa por el trabajo que hago."],
    ["Imparcialidad", "Las promociones van a quien más se las merece."],
    ["Imparcialidad", "Aquí no hay favoritismos."],
    ["Orgullo", "Mi trabajo tiene sentido para mí."],
    ["Orgullo", "Me siento orgulloso de decir dónde trabajo."],
    ["Orgullo", "Me veo trabajando aquí dentro de un año."],
    ["Compañerismo", "Puedo ser yo mismo en el trabajo."],
    ["Compañerismo", "Las personas nuevas se sienten bienvenidas."],
    ["Compañerismo", "En mi {eq} nos ayudamos cuando hay mucho trabajo."]
  ],
  GPTW: [
    ["Credibilidad", "Comunicación", ["Me entero por la dirección, y no por rumores, de los cambios importantes.", "Sé qué espera la dirección de mi trabajo.", "Cuando pregunto algo a la dirección, recibo una respuesta clara.", "Puedo dirigirme a la dirección sin pasar por filtros."]],
    ["Credibilidad", "Competencia", ["La dirección toma buenas decisiones para el negocio.", "El trabajo está bien organizado: cada persona sabe qué le toca.", "La dirección me deja hacer mi trabajo con autonomía.", "Entiendo el plan de la empresa para los próximos años."]],
    ["Credibilidad", "Integridad", ["Cuando la dirección se compromete a algo, lo cumple.", "La dirección se comporta como pide que nos comportemos.", "La dirección actúa con ética, también cuando nadie mira.", "La dirección cuenta las malas noticias con la misma transparencia que las buenas."]],
    ["Respeto", "Apoyo", ["He recibido la formación que necesito para hacer bien mi trabajo.", "Tengo las herramientas y el material para trabajar bien.", "Cuando hago un buen trabajo, alguien me lo dice.", "Si cometo un error de buena fe, se busca la solución, no un culpable."]],
    ["Respeto", "Colaboración", ["Se piden nuestras ideas antes de cambiar cómo trabajamos.", "Mis propuestas se tienen en cuenta, aunque no siempre se acepten.", "Se me trata como una persona, no solo como un recurso.", "Puedo contar con otros departamentos cuando los necesito."]],
    ["Respeto", "Cuidado", ["Trabajo en un entorno físicamente seguro.", "El ambiente de trabajo no me genera un estrés excesivo.", "Puedo compaginar el trabajo con mi vida personal y familiar.", "Cuando necesito unas horas o un día por un asunto personal, me lo facilitan."]],
    ["Imparcialidad", "Equidad", ["Mi salario es justo para el trabajo que hago.", "Cualquiera puede recibir un reconocimiento, no siempre los mismos.", "Cuando a la empresa le va bien, también lo notamos los empleados.", "Las condiciones son justas para todos los puestos, no solo para algunos."]],
    ["Imparcialidad", "Sin favoritismos", ["Nadie recibe mejor trato por llevarse bien con quien manda.", "Las promociones se deciden por méritos.", "Para salir adelante no hace falta ganarse a nadie ni hablar mal de otros.", "Las decisiones sobre personas se explican y siguen criterios conocidos."]],
    ["Imparcialidad", "Justicia", ["Se trata a todos por igual, sea cual sea su edad.", "Se trata a todos por igual, sea cual sea su sexo u orientación sexual.", "Se trata a todos por igual, sea cual sea su origen o nacionalidad.", "Si sufro un trato injusto, tengo a quién acudir y se actúa."]],
    ["Orgullo", "Mi trabajo", ["Lo que hago aquí tiene un impacto real.", "Mi trabajo tiene sentido para mí.", "Me siento orgulloso de lo que hago cada día.", "Aquí puedo poner en práctica lo que sé hacer."]],
    ["Orgullo", "Mi equipo", ["En mi equipo cada persona da lo mejor de sí.", "Cuando hay mucho trabajo, mi equipo se vuelca.", "Me siento orgulloso de lo que consigue mi equipo.", "Nuestro trabajo tiene buena calidad."]],
    ["Orgullo", "La empresa", ["Me gusta decir dónde trabajo.", "Recomendaría nuestros productos o servicios a mi familia.", "La empresa tiene un impacto positivo en la sociedad y en su entorno.", "Me veo trabajando aquí dentro de varios años."]],
    ["Compañerismo", "Ser uno mismo", ["Aquí puedo mostrarme como soy.", "Hay buen humor en el día a día.", "Los compañeros se interesan por cómo estoy.", "Puedo dar una opinión distinta sin miedo."]],
    ["Compañerismo", "Acogida", ["Las personas nuevas reciben ayuda para integrarse desde el primer día.", "Quien cambia de equipo o de centro se siente bien recibido.", "Este es un sitio agradable para trabajar.", "Aquí se ayuda a quien lo necesita, aunque no sea de tu equipo."]],
    ["Compañerismo", "Comunidad", ["Sentimos que formamos parte de un mismo proyecto.", "Nos alegramos de los éxitos de otros equipos.", "Celebramos juntos los buenos momentos.", "Me fío de mis compañeros."]]
  ],
  P2: ["Me dice con claridad qué espera de mí.", "Me da su opinión sobre mi trabajo, lo bueno y lo que debo mejorar.", "Reconoce el buen trabajo.",
    "Reparte tareas, horarios y oportunidades de forma justa.", "Puedo plantearle un problema sin miedo.", "Me ayuda cuando lo necesito.",
    "Se preocupa por mi desarrollo.", "Cumple lo que dice.", "Nos mantiene informados de lo que nos afecta.", "Me gustaría seguir trabajando con esta persona."],
  FRASE: { Credibilidad: "la comunicación con la dirección", Respeto: "cómo se cuida a las personas", Imparcialidad: "la justicia en el trato y en el salario",
    Orgullo: "el orgullo de trabajar aquí", "Compañerismo": "el ambiente de equipo" }
};

/* ---------- Plantillas ---------- */
(function registrar() {
  const parte2 = () => CL.P2.map((t, k) => ({ id: "r" + k, tipo: "likert", t, dim: "Responsable", parte: 2 }));
  Object.entries(CL.COLECTIVOS).forEach(([id, c]) => {
    const qs = CL.CORTA.map((b, k) => ({ id: "b" + k, tipo: "likert", t: b[1].replace("{eq}", c.eq), dim: b[0], parte: 1 }))
      .concat(c.propias.map((b, k) => ({ id: "c" + k, tipo: "likert", t: b[1], dim: b[0], parte: 1, propia: true })))
      .concat([{ id: "glob", tipo: "likert", t: "En conjunto, estoy contento de trabajar aquí.", dim: "En conjunto", parte: 1 },
        { id: "nps", tipo: "nps", t: "¿Con qué probabilidad recomendarías a un amigo trabajar aquí?", dim: "Recomendación", parte: 1 }])
      .concat(parte2())
      .concat([{ id: "abierta", tipo: "texto", t: "¿Qué es lo que más valoras de trabajar aquí?", inteligente: true, parte: 3 }]);
    SC.CONFIG.plantillas.push({ id: "clima2-" + id, tipo: "clima", v2: true, anonima: true, colectivo: id, escala: CL.ESCALA,
      nombre: "Clima · " + c.n, preguntas: qs, intro: "", aviso: "" });
  });
  let n = 0;
  const qs = [];
  CL.GPTW.forEach(g => g[2].forEach(t => { n++; qs.push({ id: "g" + n, tipo: "likert", t, dim: g[0], apartado: g[1], parte: 1 }); }));
  qs.push({ id: "glob", tipo: "likert", t: "Si lo valoro todo en conjunto, este es un muy buen sitio para trabajar.", dim: "En conjunto", parte: 1 });
  parte2().forEach(q => qs.push(q));
  qs.push({ id: "a1", tipo: "texto", t: "¿Qué es lo que más te gusta de trabajar aquí? ¿Hay algo que lo haga distinto de otros sitios?", parte: 3 });
  qs.push({ id: "a2", tipo: "texto", t: "¿Qué cambiarías primero para que trabajar aquí fuera mejor?", parte: 3 });
  SC.CONFIG.plantillas.push({ id: "clima2-gptw", tipo: "clima", v2: true, anonima: true, gptw: true, escala: CL.ESCALA,
    nombre: "Clima tipo Great Place To Work", preguntas: qs, intro: "", aviso: "" });
})();

/* Preguntas que ve quien responde, según lo que decidió RR.HH. */
function clPreguntas(pl, cfg) { return pl.preguntas.filter(q => q.parte !== 2 || (cfg && cfg.parte2)); }
function clCfg(c) { return (c && c.config) || {}; }
function clEsV2(c) { const pl = c && SC.plantilla(c.plantilla); return !!(pl && pl.v2); }
function clNombreEncuesta(c) {
  const cfg = clCfg(c), pl = SC.plantilla(c.plantilla) || {};
  if (pl.gptw) return "Tipo Great Place To Work";
  return pl.colectivo ? CL.COLECTIVOS[pl.colectivo].n : "Formato anterior";
}
function clMinutos(pl, cfg) {
  const qs = clPreguntas(pl, cfg);
  return Math.max(2, Math.round((qs.filter(q => q.tipo !== "texto").length * 6 + qs.filter(q => q.tipo === "texto").length * 30) / 60));
}

/* ---------- Cálculo de resultados ---------- */
const clFav = vs => (vs.length ? vs.filter(v => v >= 3).length / vs.length : null);
function clDatos(c) {
  const pl = SC.plantilla(c.plantilla), cfg = clCfg(c);
  const misT = new Set(S.tiendas.map(t => t.id));
  const invs = invitacionesDe(c.id).filter(i => esAdmin() || misT.has(i.tienda_id));
  const resp = invs.filter(i => i.estado === "respondida");
  return { pl, cfg, invs, resp, qs: clPreguntas(pl, cfg) };
}
function clResumen(D, filtro) {
  const R = filtro ? D.resp.filter(filtro) : D.resp;
  const vals = q => R.map(i => (i.respuestas || {})[q.id]).filter(v => typeof v === "number");
  const likert = D.qs.filter(q => q.tipo === "likert" && q.parte === 1 && q.dim !== "En conjunto");
  const todos = likert.flatMap(vals);
  const npsQ = D.qs.find(q => q.tipo === "nps"), nps = npsQ ? vals(npsQ) : [];
  return {
    n: R.length, fav: clFav(todos),
    enps: nps.length ? Math.round((nps.filter(v => v >= 9).length - nps.filter(v => v <= 6).length) / nps.length * 100) : null,
    dims: CL.DIMS.map(d => ({ d, fav: clFav(likert.filter(q => q.dim === d).flatMap(vals)) })),
    glob: clFav(vals(D.qs.find(q => q.id === "glob") || {})),
    items: likert.map(q => ({ q, fav: clFav(vals(q)) })),
    p2: clFav(D.qs.filter(q => q.parte === 2).flatMap(vals)),
    R
  };
}
const clPct = v => (v == null ? "–" : Math.round(v * 100) + " %");
function clUnidad(i) { const t = tiendaDe(i.tienda_id) || (S.todas || []).find(x => x.id === i.tienda_id); return t ? t.nombre : (i.grupo || "Sin grupo"); }
function clDiasCierre(cfg) {
  if (!cfg.cierre) return "";
  const d = Math.ceil((new Date(cfg.cierre + "T23:59:59") - new Date()) / 864e5);
  return d < 0 ? "cierre previsto pasado" : d === 0 ? "cierra hoy" : d === 1 ? "cierra mañana" : `cierra en ${d} días`;
}

/* ---------- Pantallas de RR.HH. ---------- */
function pintarClima(tab) {
  const c = S.campana && (S.campanas || []).find(x => x.id === S.campana && x.tipo === "clima");
  if (c && !["clcurso", "clanteriores", "clresultados"].includes(tab)) { S.tab = tab = c.estado === "abierta" ? "clcurso" : "clanteriores"; pintar(); return; }
  if (c && !clEsV2(c) && tab !== "clresultados") return pintarPruebas("clima");
  const v = { clnueva: clNueva, clcurso: () => (c ? clDetalle(c) : clLista("abierta")), clanteriores: () => (c ? clDetalle(c) : clLista("cerrada")),
    clresultados: clResultados, clmodelos: clModelos }[tab] || (() => clLista("abierta"));
  $("vista").innerHTML = `<div class="page cl">${v()}</div>`;
  if (tab === "clnueva") clFiltrarPers();
}

function clChips(c) {
  const cfg = clCfg(c), pl = SC.plantilla(c.plantilla) || {};
  return `<span class="cl-chip">${esc(clNombreEncuesta(c))}</span>${pl.v2 && cfg.parte2 ? `<span class="cl-chip">Con evaluación al responsable</span>` : ""}
    ${pl.anonima ? `<span class="cl-chip suave">Anónima</span>` : `<span class="cl-chip suave">Con nombre</span>`}`;
}
function clTarjeta(c) {
  const D = clDatos(c), n = D.invs.length, r = D.resp.length, p = n ? r / n : 0, cfg = D.cfg;
  const pend = (cfg.pendientes || []).length;
  return `<button class="cl-card" data-action="clAbrir" data-id="${c.id}">
    <span class="cl-card-h"><b>${esc(c.titulo)}</b><span class="cl-estado ${c.estado}">${c.estado === "abierta" ? "En curso" : "Cerrada"}</span></span>
    <span class="cl-chips">${clChips(c)}</span>
    <span class="cl-barra" aria-hidden="true"><i style="width:${Math.round(p * 100)}%"></i></span>
    <span class="cl-card-f"><span><b>${r}</b> de ${n} ${n === 1 ? "respuesta" : "respuestas"} · ${n ? Math.round(p * 100) : 0} % de participación</span>
      <span class="muted">${pend ? `${pend} por enviar · ` : ""}${c.estado === "abierta" ? esc(clDiasCierre(cfg) || "sin fecha de cierre") : "cerrada"}</span></span>
  </button>`;
}
function clLista(estado) {
  const cs = (S.campanas || []).filter(c => c.tipo === "clima" && c.estado === estado).sort((a, b) => (a.creado < b.creado ? 1 : -1));
  const tit = estado === "abierta" ? "En curso" : "Anteriores";
  const sub = estado === "abierta" ? "Encuestas abiertas: cómo va la participación y qué falta por enviar." : "Encuestas cerradas, con sus resultados.";
  return `<div class="page-h"><div><h1>${tit}</h1><p class="muted">${sub}</p></div>
    <div class="page-h-b">${esAdmin() ? `<button class="btn primary" data-action="tab" data-v="clnueva">Nueva encuesta</button>` : ""}</div></div>
    ${cs.length ? `<div class="cl-lista">${cs.map(clTarjeta).join("")}</div>`
      : `<div class="cl-vacio"><b>${estado === "abierta" ? "No hay ninguna encuesta en curso" : "Todavía no hay encuestas cerradas"}</b>
        <p>${estado === "abierta" ? (esAdmin() ? "Crea una en «Nueva encuesta»: eliges a quién va, si incluye la evaluación al responsable y se envía por correo." : "RR.HH. la lanzará cuando toque.") : "Cuando cierres una encuesta, aparecerá aquí con sus resultados."}</p>
        ${estado === "abierta" && esAdmin() ? `<button class="btn primary" data-action="tab" data-v="clnueva">Crear una encuesta</button>` : ""}</div>`}`;
}

/* ---------- Nueva encuesta: el asistente ---------- */
const CL_TIP = { tiendas: "tiendas", campo: "comerciales", oficinas: "oficinas", demo: "demostradores" };
function clN() {
  if (!S.cn) S.cn = { tipo: "colectivo", col: "tiendas", p2: true, usarB: true, usarL: false, tips: Object.keys(IMP_TIPOS), modoB: "todas", grupos: [], pers: [],
    imp: null, impNombre: "", titulo: "", cierre: "" };
  return S.cn;
}
const clMail = e => /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test((e || "").trim());
function clEsSM(x) { return /store\s*manager|encargad|gerente de tienda/i.test(x.puesto || "") && !/assist|asistente|adjunt|segund/i.test(x.puesto || ""); }
/* Grupo de resultados de una persona: su tienda, su departamento (oficinas)
   o su ubicación (zona, córner…) */
function clGrupoEmp(e) { return e.tipologia === "oficinas" ? (e.departamento || e.ubicacion || "Sin departamento") : (e.ubicacion || "Sin ubicación"); }
/* A quién evalúa en la parte 2: su responsable directo; si no lo tiene,
   en tiendas el Store Manager, y para el Store Manager su Regional Manager */
function clRespEmp(e) {
  const r = empPorId(e.responsable_id);
  if (r && r.activo) return `${empNombre(r)} (${r.puesto || "Responsable"})`;
  if (e.tipologia !== "tiendas" || !e.tienda_id) return null;
  const t = (S.todas || []).find(x => x.id === e.tienda_id), rm = t && perfil(t.rm_id);
  if (clEsSM(e)) return rm ? rm.nombre + " (Regional Manager)" : "Regional Manager";
  const sm = empActivos().find(x => x.tienda_id === e.tienda_id && clEsSM(x));
  return sm ? `${empNombre(sm)} (Store Manager)` : "Store Manager de la tienda";
}
/* Personas de la base que entran según tipología (sin el filtro de ubicación o persona) */
function clBase(N) {
  const tips = N.tipo === "gptw" ? N.tips : [CL_TIP[N.col]];
  return empActivos().filter(e => tips.includes(e.tipologia));
}
/* A quién va y a quién evalúa cada uno en la parte 2 */
function clDestinatarios(N) {
  const out = [], vistos = new Set();
  const meter = (e, x) => { if (e && vistos.has(e)) return; if (e) vistos.add(e); out.push(x); };
  if (N.usarB && Array.isArray(S.emp)) {
    let ps = clBase(N);
    if (N.modoB === "grupos") ps = ps.filter(e => N.grupos.includes(clGrupoEmp(e)));
    if (N.modoB === "personas") ps = ps.filter(e => N.pers.includes(e.id));
    ps.forEach(e => { const m = (e.correo || "").toLowerCase(); meter(m, { e: clMail(m) ? m : "", t: e.tienda_id || null, g: e.tienda_id ? null : clGrupoEmp(e), r: clRespEmp(e) }); });
  }
  if (N.usarL && N.imp) N.imp.forEach(x => { const m = (x.e || "").toLowerCase(); meter(m, { e: clMail(m) ? m : "", t: x.t || null, g: x.t ? null : x.g, r: x.r, err: !clMail(m) }); });
  return out;
}
function clQuien(N, gptw, col) {
  const radio = (accion, v, on, tit, des) => `<button type="button" class="cl-op ${on ? "on" : ""}" data-action="${accion}" data-v="${v}" aria-pressed="${on}"><b>${tit}</b>${des ? `<small>${des}</small>` : ""}</button>`;
  let h = `<div class="cl-ops dos">${radio("clUsar", "B", N.usarB, "Personas dadas de alta", Array.isArray(S.emp) ? `${empActivos().length} en Personas` : "Falta la migración 0.33")}${radio("clUsar", "L", N.usarL, "Subir un archivo", "Excel, CSV o Word solo para esta encuesta")}</div>`;
  if (N.usarB) {
    if (!Array.isArray(S.emp)) h += `<p class="hint warn">Para elegir de Personas hay que ejecutar <code>supabase/migracion_0.33.sql</code> en Supabase. Mientras tanto, sube un archivo.</p>`;
    else {
      const base = clBase(N);
      if (gptw) h += `<div class="cl-tips" role="group" aria-label="Tipologías">${Object.entries(IMP_TIPOS).map(([k, n]) => { const c = empActivos().filter(e => e.tipologia === k).length; return `<button type="button" class="cl-tip ${N.tips.includes(k) ? "on" : ""}" data-action="clTip" data-v="${k}" aria-pressed="${N.tips.includes(k)}">${n} <small>${c}</small></button>`; }).join("")}</div>`;
      else h += `<p class="hint">Va a las personas con tipología <b>${esc(IMP_TIPOS[CL_TIP[N.col]])}</b>: ${base.length} en Personas.</p>`;
      const grupos = [...base.reduce((m, e) => m.set(clGrupoEmp(e), (m.get(clGrupoEmp(e)) || 0) + 1), new Map())].sort((a, b) => a[0].localeCompare(b[0], "es"));
      const nG = base.filter(e => N.grupos.includes(clGrupoEmp(e))).length, nP = base.filter(e => N.pers.includes(e.id)).length;
      const etG = !gptw && N.col === "tiendas" ? "Elegir tiendas" : !gptw && N.col === "oficinas" ? "Elegir departamentos" : !gptw && N.col === "campo" ? "Elegir zonas" : !gptw && N.col === "demo" ? "Elegir córners" : "Elegir ubicaciones";
      h += `<div class="cl-ops tres">${radio("clModoB", "todas", N.modoB === "todas", "Todas", `${base.length} ${base.length === 1 ? "persona" : "personas"}`)}${radio("clModoB", "grupos", N.modoB === "grupos", etG, N.grupos.length ? `${N.grupos.length} marcadas · ${nG} personas` : "una o varias")}${radio("clModoB", "personas", N.modoB === "personas", "Persona a persona", N.pers.length ? `${nP} marcadas` : "buscar y marcar")}</div>`;
      if (N.modoB === "grupos") h += grupos.length ? `<div class="env-ts">${grupos.map(([g, n]) => `<label class="env-t"><input type="checkbox" class="chk" data-action="clGrupo" data-v="${esc(g)}" ${N.grupos.includes(g) ? "checked" : ""}><span>${esc(g)}</span><small>${n}</small></label>`).join("")}</div>` : `<p class="hint">No hay nadie con esa tipología.</p>`;
      if (N.modoB === "personas") h += `<div class="cl-pers"><input id="clBusca" type="search" placeholder="Buscar por nombre, puesto o ubicación" autocomplete="off" aria-label="Buscar personas">
        <div class="cl-pers-l">${base.map(e => `<label class="cl-per" data-q="${esc(impNorm([empNombre(e), e.puesto, e.ubicacion, e.departamento].join(" ")))}"><input type="checkbox" class="chk" data-action="clPers" data-id="${e.id}" ${N.pers.includes(e.id) ? "checked" : ""}><span><b>${esc(empNombre(e))}</b><small>${esc([e.puesto, clGrupoEmp(e)].filter(Boolean).join(" · "))}${e.correo ? "" : " · sin correo"}</small></span></label>`).join("") || `<p class="hint">No hay nadie con esa tipología.</p>`}</div></div>`;
      if (!base.length) h += `<p class="hint warn">No hay nadie con ${gptw ? "las tipologías elegidas" : `tipología ${esc(IMP_TIPOS[CL_TIP[N.col]])}`} en Personas. Dalos de alta allí o sube un archivo.</p>`;
    }
  }
  if (N.usarL) {
    if (N.imp) {
      const c = N.imp.filter(x => clMail(x.e)).length;
      h += `<div class="cl-arch"><span><b>${esc(N.impNombre || "Lista")}</b><small>${N.imp.length} ${N.imp.length === 1 ? "persona" : "personas"} · ${c} con correo · ${N.imp.length - c} papeleta</small></span>
        <button class="btn small" data-action="clImp">Cambiar</button><button class="btn small ghost" data-action="clImpQuitar">Quitar</button></div>`;
    } else h += `<button class="btn" data-action="clImp">Subir un archivo o pegar una lista</button>
      <p class="hint">Columnas que se usan: nombre, correo, ${gptw ? "grupo (ubicación o departamento)" : esc(col.eq)} y responsable. El nombre solo sirve para revisar: no se guarda.</p>`;
  }
  return h;
}
function clNueva() {
  if (!esAdmin()) return `<div class="cl-vacio"><b>Solo RR.HH. crea encuestas</b><p>Puedes seguir las de tus tiendas en «En curso».</p></div>`;
  const N = clN(), gptw = N.tipo === "gptw", col = CL.COLECTIVOS[N.col];
  const pl = SC.plantilla(gptw ? "clima2-gptw" : "clima2-" + N.col), cfg = { parte2: N.p2 };
  const qs = clPreguntas(pl, cfg), D = clDestinatarios(N);
  const conMail = D.filter(x => x.e).length, sinMail = D.length - conMail;
  const titulo = N.titulo || `Clima ${SC.CONFIG.anio} · ${gptw ? "Toda la empresa" : col.n}`;
  const radio = (accion, v, on, tit, des) => `<button type="button" class="cl-op ${on ? "on" : ""}" data-action="${accion}" data-v="${v}" aria-pressed="${on}"><b>${tit}</b>${des ? `<small>${des}</small>` : ""}</button>`;
  return `<div class="page-h"><div><h1>Nueva encuesta de clima</h1><p class="muted">Lo que elijas aquí decide qué encuesta recibe cada persona. Quien responde no elige nada.</p></div></div>
  <div class="cl-nueva">
    <div class="cl-form">
      <section class="cl-paso"><h2><span>1</span>Tipo de encuesta</h2>
        <div class="cl-ops dos">${radio("clTipo", "colectivo", !gptw, "De colectivo", "15 preguntas comunes y 2 propias del colectivo, valoración global y recomendación. Una abierta.")}
          ${radio("clTipo", "gptw", gptw, "Tipo Great Place To Work", "60 afirmaciones en 5 dimensiones y 15 apartados, valoración global y 2 abiertas.")}</div></section>
      ${gptw ? "" : `<section class="cl-paso"><h2><span>2</span>Colectivo</h2>
        <div class="cl-ops pastillas">${Object.entries(CL.COLECTIVOS).map(([id, x]) => radio("clCol", id, N.col === id, x.n)).join("")}</div>
        <p class="hint">${esc(col.n)} añade: «${esc(col.propias[0][1])}» y «${esc(col.propias[1][1])}».</p></section>`}
      <section class="cl-paso"><h2><span>${gptw ? 2 : 3}</span>Evaluación al responsable</h2>
        <button type="button" class="cl-switch ${N.p2 ? "on" : ""}" data-action="clP2" aria-pressed="${N.p2}">
          <span><b>Incluir 10 preguntas sobre el responsable directo</b><small>Cada persona evalúa a su responsable directo de Personas (o el de la columna «responsable» del archivo). En tiendas, sin responsable, al Store Manager, y al Regional Manager en el caso de los Store Managers. Solo se enseña con ${CL.MIN} respuestas o más.</small></span>
          <i aria-hidden="true"></i></button></section>
      <section class="cl-paso"><h2><span>${gptw ? 3 : 4}</span>A quién</h2>
        ${clQuien(N, gptw, col)}
        ${D.some(x => x.err) ? `<p class="hint warn">${D.filter(x => x.err).length} ${D.filter(x => x.err).length === 1 ? "persona del archivo no tiene" : "personas del archivo no tienen"} un correo válido: recibirán papeleta.</p>` : ""}
      </section>
      <section class="cl-paso"><h2><span>${gptw ? 4 : 5}</span>Nombre y cierre</h2>
        <div class="cl-campos"><label>Nombre de la encuesta<input data-cn="titulo" value="${esc(titulo)}"></label>
          <label>Cierre previsto<input type="date" data-cn="cierre" value="${esc(N.cierre)}"></label></div></section>
    </div>
    <aside class="cl-resumen">
      <b class="cl-res-t">Resumen</b>
      <dl><dt>Encuesta</dt><dd>${gptw ? "Tipo Great Place To Work" : "De colectivo · " + esc(col.n)}</dd>
        <dt>Parte 2</dt><dd>${N.p2 ? "Sí, al responsable directo" : "No"}</dd>
        <dt>Preguntas</dt><dd>${qs.length} · unos ${clMinutos(pl, cfg)} minutos</dd>
        <dt>Respuestas</dt><dd>Anónimas</dd></dl>
      <div class="cl-cifras"><div><b>${D.length}</b><small>personas</small></div><div class="on"><b>${conMail}</b><small>por correo</small></div><div><b>${sinMail}</b><small>papeleta</small></div></div>
      ${conMail > 100 ? `<p class="hint">Más de 100 correos: con el plan gratuito del proveedor de correo salen 100 al día y el resto queda pendiente para el día siguiente.</p>` : ""}
      ${sb.demo ? `<p class="hint">Demostración: no sale ningún correo.</p>` : ""}
      <button class="btn" data-action="clPrevia" data-pl="${pl.id}">Ver cómo la recibirán</button>
      <button class="btn primary" data-action="clCrear" data-enviar="1" ${D.length && envioDirecto() ? "" : "disabled"}>Crear y enviar ahora</button>
      <button class="btn ghost" data-action="clCrear" data-enviar="0" ${D.length ? "" : "disabled"}>Crear sin enviar</button>
      ${!D.length ? `<p class="hint">${N.usarB && N.modoB !== "todas" ? "Marca al menos una ubicación o una persona." : "No hay nadie todavía: elige de Personas o sube un archivo."}</p>` : ""}
    </aside>
  </div>`;
}

/* Envía lo pendiente de una encuesta: crea un código anónimo por correo
   justo antes de enviarlo y lo empareja en memoria. Lo que no sale por el
   tope diario sigue en pendientes y su código se borra. */
async function clEnviarPendientes(c) {
  let cfg = Object.assign({}, clCfg(c));
  const pend = (cfg.pendientes || []).slice();
  if (!pend.length) return { bien: 0, fallos: [], tope: false, total: 0 };
  const info = { [c.id]: infoCampana(c) };
  let bien = 0, tope = false; const fallos = [];
  for (let i = 0; i < pend.length && !tope; i += LOTE) {
    const trozo = pend.slice(i, i + LOTE);
    if (pend.length > LOTE) toast(`Enviando: ${Math.min(i + LOTE, pend.length)} de ${pend.length}…`);
    const filas = trozo.map(p => ({ campana_id: c.id, tienda_id: p.t || null, grupo: p.g || null, responsable: cfg.parte2 ? (p.r || null) : null,
      codigo: SC.codigoInvitacion(), estado: "pendiente", respuestas: {} }));
    const ins = await sb.from("invitaciones").insert(filas).select();
    if (ins.error) { fallos.push({ motivo: traducirError(ins.error) }); break; }
    const pares = (ins.data || []).map((r, k) => ({ id: r.id, email: trozo[k].e }));
    let r;
    try { r = await enviarPorLaPlataforma(null, null, { anonimos: pares, info }); }
    catch (e) { r = { resultados: pares.map(p => ({ id: p.id, ok: false, motivo: e.message })) }; }
    const ok = new Set((r.resultados || []).filter(x => x.ok).map(x => x.id));
    const salen = pares.filter(p => ok.has(p.id)), noSalen = pares.filter(p => !ok.has(p.id));
    (r.resultados || []).filter(x => !x.ok).forEach(x => { if (x.motivo === "LIMITE_DIARIO") tope = true; fallos.push(x); });
    if (noSalen.length) await sb.from("invitaciones").delete().in("id", noSalen.map(p => p.id));
    bien += salen.length;
    const enviados = new Set(salen.map(p => p.email));
    cfg.enviadosA = [...new Set((cfg.enviadosA || []).concat([...enviados]))];
    cfg.pendientes = (cfg.pendientes || []).filter(p => !enviados.has(p.e));
    await sb.from("campanas").update({ config: cfg }).eq("id", c.id);
    c.config = cfg;
  }
  return { bien, fallos, tope, total: pend.length };
}
function clAvisoEnvio(res) {
  if (res.tope) alert(`Enviados ${res.bien} de ${res.total}.\n\nSe ha llegado al límite diario del proveedor de correo (100 al día en el plan gratuito). El resto queda pendiente: entra mañana en la encuesta y pulsa «Enviar los pendientes».`);
  else if (res.fallos.length) alert(`Enviados ${res.bien} de ${res.total}.\n\nNo han salido:\n` + res.fallos.slice(0, 10).map(x => motivoLegible(x.motivo)).join("\n"));
  else if (res.total) toast(res.bien === 1 ? "1 correo enviado" : res.bien + " correos enviados");
}

/* ---------- Detalle de una encuesta ---------- */
function clDetalle(c) {
  const D = clDatos(c), cfg = D.cfg, A = clResumen(D), n = D.invs.length;
  const papeletas = D.invs.filter(i => !i.enviado && i.estado !== "respondida");
  const pend = (cfg.pendientes || []).length, enviadosA = (cfg.enviadosA || []).length;
  const unidades = {};
  D.invs.forEach(i => { const u = clUnidad(i); (unidades[u] = unidades[u] || { n: 0, r: 0 }).n++; if (i.estado === "respondida") unidades[u].r++; });
  const volver = c.estado === "abierta" ? "En curso" : "Anteriores";
  return `<button class="cl-volver" data-action="clVolver">← ${volver}</button>
  <div class="page-h"><div><h1>${esc(c.titulo)}</h1><div class="cl-chips">${clChips(c)}<span class="cl-estado ${c.estado}">${c.estado === "abierta" ? "En curso" : "Cerrada"}</span>${cfg.cierre ? `<span class="muted">${esc(clDiasCierre(cfg))} · ${esc(new Date(cfg.cierre + "T12:00:00").toLocaleDateString("es-ES"))}</span>` : ""}</div></div>
    <div class="page-h-b"><button class="btn" data-action="actualizarPruebas">Actualizar</button>
      <button class="btn primary" data-action="clVerResultados" data-id="${c.id}">Ver resultados</button></div></div>
  <div class="cl-kpis">
    <div class="oscuro"><small>Participación</small><b>${n ? Math.round(D.resp.length / n * 100) + " %" : "–"}</b><small>${D.resp.length} de ${n} ${n === 1 ? "código" : "códigos"}</small></div>
    <div><small>Clima favorable</small><b>${A.n >= CL.MIN ? clPct(A.fav) : "–"}</b><small>${A.n >= CL.MIN ? "«A menudo» o «Casi siempre»" : `se ve con ${CL.MIN} respuestas`}</small></div>
    ${D.qs.some(q => q.tipo === "nps") ? `<div><small>eNPS</small><b>${A.n >= CL.MIN && A.enps != null ? (A.enps > 0 ? "+" : "") + A.enps : "–"}</b><small>de −100 a +100</small></div>` : ""}
    <div><small>Preguntas</small><b>${D.qs.length}</b><small>unos ${clMinutos(D.pl, cfg)} minutos</small></div>
  </div>
  ${c.estado === "abierta" && esAdmin() ? `<section class="card"><div class="card-h"><h2>Envío</h2><span class="muted">por correo, desde no-responder@pippole.es</span></div>
    <div class="cl-envio">
      <div><b>${enviadosA}</b><small>personas invitadas por correo</small></div>
      <div class="${pend ? "warn" : ""}"><b>${pend}</b><small>pendientes de enviar</small>${pend ? `<button class="btn small primary" data-action="clEnviarPend" ${envioDirecto() ? "" : "disabled"}>Enviar los pendientes</button>` : ""}</div>
      <div><b>${papeletas.length}</b><small>códigos en papeleta, sin usar</small>${papeletas.length ? `<button class="btn small" data-action="clPapeletas">Imprimir papeletas</button>` : ""}</div>
      <div><b>${enviadosA}</b><small>recibirían un recordatorio</small>${enviadosA ? `<button class="btn small" data-action="clRecordar">Recordatorio general</button>` : ""}</div>
    </div>
    <p class="hint">Es anónima: los códigos no llevan nombre y la plataforma no guarda qué código recibió cada persona. Por eso el recordatorio va a todas las personas invitadas, sin código.</p></section>` : ""}
  <section class="card"><div class="card-h"><h2>Participación por ${D.pl.colectivo && D.pl.colectivo !== "tiendas" ? esc(CL.COLECTIVOS[D.pl.colectivo].eq) : "tienda o grupo"}</h2><span class="muted">solo cuántos han respondido, nunca quién</span></div>
    ${Object.keys(unidades).length ? `<div class="tablewrap"><table class="cl-t"><thead><tr><th>Unidad</th><th class="num">Códigos</th><th class="num">Respuestas</th><th>Participación</th></tr></thead><tbody>
      ${Object.entries(unidades).sort((a, b) => a[0].localeCompare(b[0])).map(([u, x]) => `<tr><td>${esc(u)}</td><td class="num">${x.n}</td><td class="num">${x.r}</td>
        <td><span class="cl-barra mini"><i style="width:${Math.round(x.r / x.n * 100)}%"></i></span> ${Math.round(x.r / x.n * 100)} %</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="muted">Todavía no hay códigos.${pend ? " Envía los pendientes para empezar." : ""}</p>`}</section>
  ${esAdmin() ? `<div class="cl-pie"><button class="btn" data-action="clEstado">${c.estado === "abierta" ? "Cerrar la encuesta" : "Reabrir la encuesta"}</button>
    <button class="btn peligro-g" data-action="clBorrar">Borrar la encuesta</button></div>` : ""}`;
}

/* ---------- Resultados ---------- */
function clResultados() {
  const cs = (S.campanas || []).filter(c => c.tipo === "clima" && clEsV2(c)).sort((a, b) => (a.creado < b.creado ? 1 : -1));
  if (!cs.length) return `<div class="page-h"><div><h1>Resultados</h1></div></div><div class="cl-vacio"><b>Todavía no hay resultados</b><p>Aparecerán aquí en cuanto una encuesta reúna ${CL.MIN} respuestas.</p></div>`;
  const c = cs.find(x => x.id === S.clRes) || cs.find(x => clDatos(x).resp.length) || cs[0];
  S.clRes = c.id;
  const D = clDatos(c), A = clResumen(D);
  const sel = `<select data-clres="1" aria-label="Encuesta">${cs.map(x => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.titulo)}</option>`).join("")}</select>`;
  let h = `<div class="page-h"><div><h1>Resultados</h1><p class="muted">Porcentaje favorable: quien contesta «A menudo» o «Casi siempre». Ningún grupo se enseña con menos de ${CL.MIN} respuestas.</p></div><div class="page-h-b">${sel}</div></div>`;
  if (A.n < CL.MIN) return h + `<div class="cl-vacio"><b>${A.n} ${A.n === 1 ? "respuesta" : "respuestas"} de ${D.invs.length}</b><p>Los resultados se ven a partir de ${CL.MIN} respuestas, para que nadie pueda ser reconocido.</p></div>`;
  const barra = (t, v, extra) => `<div class="cl-br"><span>${esc(t)}</span><div><i style="width:${v == null ? 0 : Math.round(v * 100)}%"></i></div><b>${clPct(v)}</b>${extra || ""}</div>`;
  h += `<div class="cl-kpis"><div class="oscuro"><small>Clima favorable</small><b>${clPct(A.fav)}</b><small>${A.n} respuestas · ${Math.round(A.n / D.invs.length * 100)} % de participación</small></div>
    <div><small>Valoración global</small><b>${clPct(A.glob)}</b><small>«${esc((D.qs.find(q => q.id === "glob") || {}).t || "")}»</small></div>
    ${A.enps != null ? `<div><small>eNPS</small><b>${(A.enps > 0 ? "+" : "") + A.enps}</b><small>de −100 a +100</small></div>` : ""}
    ${D.cfg.parte2 ? `<div><small>Responsables</small><b>${clPct(A.p2)}</b><small>favorable en la parte 2</small></div>` : ""}</div>`;
  h += `<div class="cl-dos"><section class="card"><div class="card-h"><h2>Por dimensión</h2></div><div class="cl-barras">${A.dims.map(x => barra(x.d, x.fav)).join("")}</div></section>`;
  const orden = A.items.filter(x => x.fav != null).sort((a, b) => b.fav - a.fav);
  h += `<section class="card"><div class="card-h"><h2>Lo mejor y lo peor valorado</h2></div>
    <ol class="cl-top">${orden.slice(0, 3).map(x => `<li class="ok"><b>${clPct(x.fav)}</b>${esc(x.q.t)}</li>`).join("")}</ol>
    <ol class="cl-top">${orden.slice(-3).reverse().map(x => `<li class="ko"><b>${clPct(x.fav)}</b>${esc(x.q.t)}</li>`).join("")}</ol></section></div>`;
  if (D.pl.gptw) {
    const apart = CL.GPTW.map(g => ({ d: g[0], a: g[1], fav: clFav(D.qs.filter(q => q.apartado === g[1]).flatMap(q => A.R.map(i => (i.respuestas || {})[q.id]).filter(v => typeof v === "number"))) }));
    h += `<section class="card"><div class="card-h"><h2>Por apartado</h2></div><div class="cl-barras tres">${apart.map(x => barra(x.a, x.fav, `<small>${esc(x.d)}</small>`)).join("")}</div></section>`;
  }
  // Por unidad, con el mínimo de respuestas
  const grupos = {};
  A.R.forEach(i => { (grupos[clUnidad(i)] = grupos[clUnidad(i)] || []).push(i); });
  h += `<section class="card"><div class="card-h"><h2>Por ${D.pl.colectivo && D.pl.colectivo !== "tiendas" ? esc(CL.COLECTIVOS[D.pl.colectivo].eq) : "tienda o grupo"}</h2></div><div class="tablewrap"><table class="cl-t"><thead><tr><th>Unidad</th><th class="num">Respuestas</th>${CL.DIMS.map(d => `<th class="num">${esc(d)}</th>`).join("")}<th class="num">Total</th></tr></thead><tbody>
    ${Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0])).map(([u, rs]) => {
      if (rs.length < CL.MIN) return `<tr><td>${esc(u)}</td><td class="num">${rs.length}</td><td colspan="${CL.DIMS.length + 1}" class="muted">Menos de ${CL.MIN} respuestas: cuenta en el total, no se enseña aparte</td></tr>`;
      const X = clResumen(D, i => rs.includes(i));
      return `<tr><td>${esc(u)}</td><td class="num">${rs.length}</td>${X.dims.map(x => `<td class="num ${x.fav != null && x.fav < 0.5 ? "bajo" : ""}">${clPct(x.fav)}</td>`).join("")}<td class="num"><b>${clPct(X.fav)}</b></td></tr>`;
    }).join("")}</tbody></table></div></section>`;
  if (D.cfg.parte2) {
    const porResp = {};
    A.R.forEach(i => { const r = i.responsable || "Sin responsable indicado"; (porResp[r] = porResp[r] || []).push(i); });
    const p2 = D.qs.filter(q => q.parte === 2);
    h += `<section class="card"><div class="card-h"><h2>Parte 2 · Responsables</h2><span class="muted">cada responsable, solo con ${CL.MIN} respuestas o más</span></div><div class="tablewrap"><table class="cl-t"><thead><tr><th>Responsable</th><th class="num">Respuestas</th><th class="num">Favorable</th><th>Su punto más fuerte</th><th>Su punto a mejorar</th></tr></thead><tbody>
      ${Object.entries(porResp).sort((a, b) => a[0].localeCompare(b[0])).map(([r, rs]) => {
        if (rs.length < CL.MIN) return `<tr><td>${esc(r)}</td><td class="num">${rs.length}</td><td colspan="3" class="muted">Menos de ${CL.MIN} respuestas: no se enseña</td></tr>`;
        const its = p2.map(q => ({ q, fav: clFav(rs.map(i => (i.respuestas || {})[q.id]).filter(v => typeof v === "number")) })).filter(x => x.fav != null).sort((a, b) => b.fav - a.fav);
        const tot = clFav(p2.flatMap(q => rs.map(i => (i.respuestas || {})[q.id]).filter(v => typeof v === "number")));
        return `<tr><td>${esc(r)}</td><td class="num">${rs.length}</td><td class="num"><b>${clPct(tot)}</b></td><td>${its[0] ? esc(its[0].q.t) : "–"}</td><td>${its.length ? esc(its[its.length - 1].q.t) : "–"}</td></tr>`;
      }).join("")}</tbody></table></div></section>`;
  }
  // Comentarios
  const textos = D.qs.filter(q => q.tipo === "texto");
  const coments = [];
  A.R.forEach(i => textos.forEach(q => { const v = (i.respuestas || {})[q.id]; if (typeof v === "string" && v.trim()) coments.push({ q, v: v.trim(), dim: (i.respuestas || {})[q.id + "_dim"] || null }); }));
  if (coments.length) {
    const grupo = x => (x.q.inteligente ? (x.dim ? "Sobre " + CL.FRASE[x.dim] : "Lo que más valoran") : x.q.t);
    const G = {}; coments.forEach(x => (G[grupo(x)] = G[grupo(x)] || []).push(x.v));
    h += `<section class="card"><div class="card-h"><h2>Comentarios</h2><span class="muted">${coments.length} · tal como los escribieron, sin datos de quién</span></div>
      ${Object.entries(G).map(([g, vs]) => `<h3 class="cl-h3">${esc(g)} <small>${vs.length}</small></h3><ul class="cl-com">${vs.map(v => `<li>${esc(v)}</li>`).join("")}</ul>`).join("")}</section>`;
  }
  return h;
}

/* ---------- Modelos ---------- */
function clModelos() {
  const ids = Object.keys(CL.COLECTIVOS).map(k => "clima2-" + k).concat(["clima2-gptw"]);
  const sel = S.clModelo;
  const tarjeta = id => {
    const pl = SC.plantilla(id), base = clPreguntas(pl, { parte2: false });
    return `<button class="cl-card ${sel === id ? "on" : ""}" data-action="clModelo" data-id="${id}">
      <span class="cl-card-h"><b>${esc(pl.gptw ? "Tipo Great Place To Work" : CL.COLECTIVOS[pl.colectivo].n)}</b></span>
      <span class="muted">${pl.gptw ? "60 afirmaciones en 5 dimensiones y 15 apartados · 2 abiertas" : "15 comunes + 2 propias · global · eNPS · 1 abierta"}</span>
      <span class="cl-card-f"><span>${base.length} preguntas · unos ${clMinutos(pl, { parte2: false })} min</span><span class="muted">+10 con la parte 2</span></span></button>`;
  };
  let h = `<div class="page-h"><div><h1>Modelos de encuesta</h1><p class="muted">Las preguntas de cada encuesta, tal como las verá quien responda.</p></div></div>
    <div class="cl-lista tres">${ids.map(tarjeta).join("")}</div>`;
  if (sel) {
    const pl = SC.plantilla(sel), qs = pl.preguntas;
    let ult = "";
    h += `<section class="card"><div class="card-h"><h2>${esc(pl.nombre)}</h2><div class="page-h-b"><button class="btn primary" data-action="clPrevia" data-pl="${pl.id}">Probarla como empleado</button></div></div>
      <ol class="cl-preg">${qs.map(q => {
        const cab = q.parte === 2 ? "Parte 2 · Responsable directo" : q.parte === 3 ? "Abiertas · opcionales" : pl.gptw ? q.dim + " · " + (q.apartado || "Global") : (q.dim || "");
        const s = cab !== ult ? `<li class="cab">${esc(cab)}</li>` : ""; ult = cab;
        return s + `<li><span>${esc(q.inteligente ? "Abierta que se adapta: pregunta por lo que la persona ha valorado más bajo («Si pudieras cambiar una sola cosa…») o, si todo va bien, qué es lo que más valora." : q.t)}</span><small>${q.tipo === "nps" ? "0 a 10" : q.tipo === "texto" ? "Texto libre" : "Casi nunca → Casi siempre"}${q.propia ? " · propia del colectivo" : ""}</small></li>`;
      }).join("")}</ol></section>`;
  }
  return h;
}

/* ---------- Acciones ---------- */
const ACCIONES_CLIMA = {
  clAbrir(b) { S.campana = b.dataset.id; window.scrollTo(0, 0); },
  clVolver() { S.campana = null; },
  clTipo(b) { const N = clN(); N.tipo = b.dataset.v; N.grupos = []; N.pers = []; N.modoB = "todas"; },
  clCol(b) { const N = clN(); N.col = b.dataset.v; N.grupos = []; N.pers = []; N.modoB = "todas"; },
  clP2() { const N = clN(); N.p2 = !N.p2; },
  clUsar(b) { const N = clN(); if (b.dataset.v === "B") N.usarB = !N.usarB; else { N.usarL = !N.usarL; if (N.usarL && !N.imp) return ACCIONES_CLIMA.clImp(); } },
  clTip(b) { const N = clN(), k = b.dataset.v; N.tips = N.tips.includes(k) ? N.tips.filter(x => x !== k) : N.tips.concat(k); N.grupos = []; N.pers = []; N.modoB = "todas"; },
  clModoB(b) { clN().modoB = b.dataset.v; },
  clGrupo(b) { const N = clN(), v = b.dataset.v; N.grupos = b.checked ? [...new Set(N.grupos.concat(v))] : N.grupos.filter(x => x !== v); },
  clPers(b) {
    const N = clN(), id = b.dataset.id; N.pers = b.checked ? [...new Set(N.pers.concat(id))] : N.pers.filter(x => x !== id);
    const l = document.querySelector(".cl-pers-l"), y = l ? l.scrollTop : 0, wy = window.scrollY;
    pintar(); window.scrollTo(0, wy);
    const l2 = document.querySelector(".cl-pers-l"); if (l2) l2.scrollTop = y;
    clFiltrarPers(); return false;
  },
  clImp() { abrirImportador("encuesta", { alUsar: (lista, nombre) => { const N = clN(); N.imp = lista; N.impNombre = nombre; N.usarL = true; pintar(); } }); return false; },
  clImpQuitar() { const N = clN(); N.imp = null; N.impNombre = ""; },
  clModelo(b) { S.clModelo = S.clModelo === b.dataset.id ? null : b.dataset.id; },
  clVerResultados(b) { S.clRes = b.dataset.id; S.campana = null; S.tab = "clresultados"; window.scrollTo(0, 0); },
  clPrevia(b) { if (typeof clPrevia === "function") clPrevia(b.dataset.pl, { parte2: b.dataset.pl && S.tab === "clnueva" ? clN().p2 : true }); return false; },
  async clCrear(b) {
    const N = clN(), gptw = N.tipo === "gptw", enviar = b.dataset.enviar === "1";
    const plId = gptw ? "clima2-gptw" : "clima2-" + N.col, D = clDestinatarios(N);
    const titulo = (N.titulo || `Clima ${SC.CONFIG.anio} · ${gptw ? "Toda la empresa" : CL.COLECTIVOS[N.col].n}`).trim();
    if (!D.length) return false;
    const conMail = D.filter(x => x.e), sinMail = D.filter(x => !x.e);
    const ok = await confirmar({ titulo: enviar ? `Crear y enviar «${titulo}»` : `Crear «${titulo}»`, ok: enviar ? "Crear y enviar" : "Crear",
      texto: `${conMail.length} ${conMail.length === 1 ? "persona recibirá" : "personas recibirán"} su código por correo${enviar ? " ahora" : " cuando pulses «Enviar los pendientes»"}${sinMail.length ? ` y se generarán ${sinMail.length} ${sinMail.length === 1 ? "papeleta" : "papeletas"} para quien no tiene correo` : ""}. Es anónima.` });
    if (!ok) return false;
    b.disabled = true; b.textContent = "Creando…";
    const cfg = { version: 2, encuesta: gptw ? "gptw" : N.col, colectivo: gptw ? null : N.col, parte2: !!N.p2, cierre: N.cierre || null,
      pendientes: conMail.map(x => ({ e: x.e, t: x.t, g: x.g, r: x.r })), enviadosA: [] };
    const ins = await sb.from("campanas").insert({ tipo: "clima", plantilla: plId, titulo, anio: SC.CONFIG.anio, estado: "abierta", creado_por: yoReal().id, config: cfg }).select().single();
    if (ins.error) {
      const falta = /config/.test(ins.error.message || "");
      alert(falta ? "Falta un cambio en la base de datos: ejecuta supabase/migracion_0.32.sql en el SQL Editor de Supabase y vuelve a intentarlo." : "No se ha podido crear la encuesta: " + traducirError(ins.error));
      await recargarPruebas(); pintar(); return false;
    }
    const c = ins.data;
    if (sinMail.length) {
      const filas = sinMail.map(p => ({ campana_id: c.id, tienda_id: p.t || null, grupo: p.g || null, responsable: cfg.parte2 ? (p.r || null) : null, codigo: SC.codigoInvitacion(), estado: "pendiente", respuestas: {} }));
      const r2 = await sb.from("invitaciones").insert(filas);
      if (r2.error) alert("La encuesta está creada, pero no se han podido generar las papeletas: " + traducirError(r2.error));
    }
    let res = null;
    if (enviar && conMail.length) res = await clEnviarPendientes(c);
    log(`Encuesta de clima creada: ${titulo}`);
    S.cn = null; S.campana = c.id; S.tab = "clcurso";
    await recargarPruebas(); pintar();
    if (res) clAvisoEnvio(res); else toast("Encuesta creada");
    return false;
  },
  async clEnviarPend(b) {
    const c = S.campanas.find(x => x.id === S.campana), n = (clCfg(c).pendientes || []).length;
    const ok = await confirmar({ titulo: `Enviar ${n} ${n === 1 ? "correo" : "correos"}`, ok: "Enviar ahora", texto: "Cada persona recibe un código anónimo. El correo sale y no se puede deshacer." });
    if (!ok) return false;
    b.disabled = true; b.textContent = "Enviando…";
    const res = await clEnviarPendientes(c);
    log(`${res.bien} correos enviados de ${c.titulo}`);
    await recargarPruebas(); pintar(); clAvisoEnvio(res); return false;
  },
  async clRecordar(b) {
    const c = S.campanas.find(x => x.id === S.campana), mails = clCfg(c).enviadosA || [];
    const ok = await confirmar({ titulo: `Recordatorio a ${mails.length} ${mails.length === 1 ? "persona" : "personas"}`, ok: "Enviar recordatorio",
      texto: "Como es anónima, no se sabe quién ha respondido: el recordatorio llega a todas las personas invitadas, sin código. Quien ya respondió puede ignorarlo." });
    if (!ok) return false;
    b.disabled = true; b.textContent = "Enviando…";
    const lotes = [];
    for (let i = 0; i < mails.length; i += LOTE) { const t = mails.slice(i, i + LOTE); lotes.push(() => enviarPorLaPlataforma(null, null, { recordatorio: { campana_id: c.id, emails: t } })); }
    const res = await enviarEnLotes(lotes, "Enviando recordatorios");
    log(`${res.bien} recordatorios de ${c.titulo}`);
    pintar(); clAvisoEnvio(Object.assign(res, { total: mails.length })); return false;
  },
  clPapeletas() {
    const c = S.campanas.find(x => x.id === S.campana), D = clDatos(c);
    const ps = D.invs.filter(i => !i.enviado && i.estado !== "respondida");
    const url = (location.origin + location.pathname).replace(/^https?:\/\//, "");
    const html = `<div class="cl-papeletas">${ps.map(i => `<div class="cl-pap"><b>${esc(c.titulo)}</b><span>${esc(clUnidad(i))}</span>
      <p>Entra en <b>${esc(url)}</b>, pulsa «Entrar con un código de invitación» y escribe:</p><code>${esc(i.codigo)}</code><small>Anónima · sirve una sola vez</small></div>`).join("")}</div>`;
    trImprimir(html); return false;
  },
  async clEstado() {
    const c = S.campanas.find(x => x.id === S.campana), nuevo = c.estado === "abierta" ? "cerrada" : "abierta";
    const { error } = await sb.from("campanas").update({ estado: nuevo }).eq("id", c.id);
    if (error) { alert(traducirError(error)); return false; }
    S.tab = nuevo === "abierta" ? "clcurso" : "clanteriores";
    await recargarPruebas(); toast(nuevo === "cerrada" ? "Encuesta cerrada" : "Encuesta reabierta");
  },
  async clBorrar() {
    const c = S.campanas.find(x => x.id === S.campana);
    const ok = await confirmar({ titulo: "Borrar la encuesta", texto: `Se borran «${c.titulo}», sus códigos y todas sus respuestas. No se puede deshacer.`, ok: "Borrar", peligro: true, escribe: "BORRAR" });
    if (!ok) return false;
    const { error } = await sb.from("campanas").delete().eq("id", c.id);
    if (error) { alert(traducirError(error)); return false; }
    S.campana = null; await recargarPruebas(); toast("Encuesta borrada");
  }
};
/* Buscador de «Persona a persona»: filtra sin repintar */
function clFiltrarPers() {
  const i = document.getElementById("clBusca"); if (!i) return;
  if (i.value !== (clN().busca || "")) i.value = clN().busca || "";
  const q = impNorm(i.value);
  document.querySelectorAll(".cl-per").forEach(l => { l.hidden = !!q && !l.dataset.q.includes(q); });
}
document.addEventListener("input", e => { if (e.target.id !== "clBusca") return; clN().busca = e.target.value; clFiltrarPers(); });
/* Campos de texto del asistente: se guardan sin repintar */
document.addEventListener("input", e => {
  const k = e.target && e.target.dataset && e.target.dataset.cn;
  if (!k || !S.cn) return;
  S.cn[k] = e.target.value;
});
document.addEventListener("change", e => {
  const b = e.target;
  if (b && b.dataset && b.dataset.clres) { S.clRes = b.value; pintar(); }
});

/* Línea de resumen de cada tarjeta en la portada del apartado */
function clResumenTab(id) {
  const cs = (S.campanas || []).filter(c => c.tipo === "clima");
  const abiertas = cs.filter(c => c.estado === "abierta"), cerradas = cs.filter(c => c.estado === "cerrada");
  if (id === "clnueva") return "Por colectivo o tipo Great Place To Work";
  if (id === "clcurso") {
    if (!abiertas.length) return "Ninguna abierta ahora mismo";
    const D = abiertas.map(clDatos), n = D.reduce((a, x) => a + x.invs.length, 0), r = D.reduce((a, x) => a + x.resp.length, 0);
    return `${abiertas.length} ${abiertas.length === 1 ? "abierta" : "abiertas"}${n ? ` · ${Math.round(r / n * 100)} % de participación` : ""}`;
  }
  if (id === "clanteriores") return cerradas.length ? `${cerradas.length} ${cerradas.length === 1 ? "cerrada" : "cerradas"}` : "Ninguna cerrada todavía";
  if (id === "clresultados") {
    const c = cs.filter(clEsV2).sort((a, b) => (a.creado < b.creado ? 1 : -1)).find(x => clDatos(x).resp.length >= CL.MIN);
    return c ? `${c.titulo}: ${clPct(clResumen(clDatos(c)).fav)} favorable` : `Se ven a partir de ${CL.MIN} respuestas`;
  }
  if (id === "clmodelos") return "4 de colectivo y 1 tipo Great Place To Work";
  return "";
}
