"use strict";
/* =====================================================================
   SCORECARD RETAIL – PARÁMETROS
   Todo lo que define el cálculo está aquí. RR.HH. cambia estos valores
   y regenera los ficheros; los Regional Managers no los ven editables.
   ===================================================================== */
const CONFIG = {
  version: "2026.1",
  anio: 2026,

  pesoCualitativo: 0.30,
  pesoCuantitativo: 0.70,
  // Mínimos por bloque (puntos ponderados). Por debajo, ese bloque no genera bonus.
  umbralCualitativo: 0.27,   // = valoración media 0,9 x 30%
  umbralCuantitativo: 0.63,  // = factor medio 0,9 x 70%
  multiplicadorNota: 3,      // nota = (puntos cualitativos + cuantitativos) x 3
  puntuacionMaxima: 2,

  // "maximo": el importe se alcanza con puntuación 2 en todo (100% = mitad del importe).
  // "objetivo": el importe se alcanza con puntuación 1 (en línea) y puede llegar al doble.
  referenciaBonus: "maximo",
  bonus: {
    SM:  { nombre: "Store Manager",           importe: 1000 },
    ASM: { nombre: "Assistant Store Manager", importe: 500 }
  },

  escala: [
    { v: 0,   t: "Muy por debajo de las expectativas" },
    { v: 0.5, t: "Por debajo de las expectativas" },
    { v: 1,   t: "En línea con las expectativas" },
    { v: 1.5, t: "Por encima de las expectativas" },
    { v: 2,   t: "Excepcional" }
  ],

  bloques: [
    { id: "conoc", nombre: "Conocimientos del equipo", items: [
      { id: "q01", peso: 0.05, nombre: "Formación de producto (SEB Academy)", guia: "" },
      { id: "q02", peso: 0.05, nombre: "Participación del equipo en Atrivity", guia: "¿Cuál ha sido la participación de tu equipo en Atrivity?" },
      { id: "q03", peso: 0.05, nombre: "Uso del manual de ventas", guia: "¿Cuántos miembros del equipo utilizan el manual de ventas?" }
    ]},
    { id: "func", nombre: "Funciones", items: [
      { id: "q04", peso: 0.10, nombre: "Escaparate alineado con el plan comercial (foco GMG)", guia: "¿Cómo decides qué productos poner en tu escaparate una vez comunicado el plan comercial?" },
      { id: "q05", peso: 0.05, nombre: "Organización y limpieza (sala de venta y almacén) y gastos Lyreco", guia: "" }
    ]},
    { id: "gest", nombre: "Gestión", items: [
      { id: "q06", peso: 0.06, nombre: "Adaptación de la plantilla al tráfico y envío del horario en fecha", guia: "" },
      { id: "q07", peso: 0.06, nombre: "Bolsa de horas del equipo", guia: "¿Cuál es la bolsa de horas actual de tu equipo?" },
      { id: "q08", peso: 0.06, nombre: "Acciones para elevar el margen", guia: "¿Qué acciones concretas has tomado para elevar el margen?" },
      { id: "q09", peso: 0.06, nombre: "Gestión de caja sin errores", guia: "Si ha habido errores, ¿cómo se han producido y cómo se han gestionado?" },
      { id: "q10", peso: 0.06, nombre: "Gestión de stock", guia: "" }
    ]},
    { id: "comp", nombre: "Competencias y liderazgo", items: [
      { id: "q11", peso: 0.05, nombre: "Capacidad analítica", guia: "" },
      { id: "q12", peso: 0.15, nombre: "Motivación del equipo y ambiente laboral", guia: "¿Qué acciones tomas para motivar a tu equipo y fomentar un buen ambiente laboral?" },
      { id: "q13", peso: 0.10, nombre: "Demos en tienda", guia: "¿Cuántas demos realizas al mes? ¿Son una herramienta imprescindible en tu equipo?" },
      { id: "q14", peso: 0.10, nombre: "Capacidad estratégica", guia: "Action plans realizados y focos trabajados (KPIs, reseñas…)." }
    ]}
  ],

  kpis: [
    { id: "top10",  peso: 0.30, tipo: "ratio", nombre: "Top 10 ventas con +% margen", ayuda: "Objetivo y resultado en la misma unidad." },
    { id: "cr",     peso: 0.30, tipo: "ratio", nombre: "Conversion rate", ayuda: "En %, por ejemplo 10,6." },
    { id: "margen", peso: 0.30, tipo: "ratio", nombre: "Std. Marge + Prov.", ayuda: "En %, por ejemplo 60." },
    { id: "inv",    peso: 0.10, tipo: "inventario", nombre: "Inventario", ayuda: "Falta de inventario sobre venta del periodo. Escala fija." }
  ],

  // % de consecución (conseguido / objetivo) -> factor. Se aplica el último tramo alcanzado.
  escaladoKPI: [
    [0, 0], [0.90, 0.125], [0.91, 0.25], [0.92, 0.375], [0.93, 0.5], [0.94, 0.6],
    [0.95, 0.7], [0.96, 0.8], [0.97, 0.9], [0.98, 1], [1.01, 1.125], [1.02, 1.25],
    [1.03, 1.375], [1.04, 1.5], [1.05, 1.6], [1.06, 1.7], [1.07, 1.8], [1.08, 1.9], [1.09, 2]
  ],
  // Falta de inventario / venta -> factor (menos falta, mejor)
  escaladoInventario: [
    [0, 2], [0.0006, 1.5], [0.0009, 1], [0.0012, 0.5], [0.002, 0]
  ],

  valoracionGlobal: [
    { id: "insuf",  t: "Resultados insuficientes", d: "Se necesita establecer un plan de acción para conseguir los resultados." },
    { id: "mejora", t: "Necesita mejorar", d: "Debe desarrollar sus conocimientos de la función." },
    { id: "optimo", t: "Resultados óptimos", d: "Ha realizado el 100% de las tareas asociadas a su función." },
    { id: "encima", t: "Por encima de expectativas", d: "Ha sobrepasado los objetivos fijados." },
    { id: "excep",  t: "Resultados excepcionales", d: "El resultado ha sido muy por encima de las expectativas." }
  ],

  periodos: {
    s1: { nombre: "Seguimiento 6 meses", corto: "6 meses", bonus: "Bonus indicativo" },
    fy: { nombre: "Cierre anual", corto: "Anual", bonus: "Bonus a liquidar" }
  },

  // Opcional: URL de un flujo de Power Automate (HTTP POST) para enviar la copia a RR.HH.
  envioURL: ""
};

const SC = (function () {
  function r10(x) { return Math.round(x * 1e10) / 1e10; }
  function r2(x) { return Math.round(r10(x * 100)) / 100; }

  // Acepta "10,6", "10.6", "10,6 %", "1.680.000", "1.680.000,50", números.
  function num(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    let s = String(v).trim().replace(/[\s€%]/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    if (!/^-?\d*\.?\d+$/.test(s)) return null;
    const n = Number(s);
    return isFinite(n) ? n : null;
  }

  function lookup(tabla, x) {
    let res = null;
    for (const [lim, val] of tabla) { if (x >= lim - 1e-12) res = val; else break; }
    return res;
  }

  function items() {
    return CONFIG.bloques.flatMap(b => b.items.map(i => Object.assign({ bloque: b.nombre }, i)));
  }

  function nivel(v) {
    const e = CONFIG.escala.find(x => Math.abs(x.v - v) < 1e-9);
    return e ? e.t : "";
  }

  function calcKPI(k, obj, res) {
    obj = obj || {}; res = res || {};
    if (k.tipo === "inventario") {
      const falta = num(res.invFalta), venta = num(res.invVenta);
      if (falta == null || venta == null) return { completo: false };
      if (venta <= 0 || falta < 0) return { completo: false, error: "Revisa los importes de inventario: la venta debe ser mayor que 0." };
      const pct = r10(falta / venta);
      return { completo: true, pct, factor: lookup(CONFIG.escaladoInventario, pct) };
    }
    const o = num(obj[k.id]), c = num(res[k.id]);
    if (o == null || c == null) return { completo: false, sinObjetivo: o == null };
    if (o <= 0) return { completo: false, error: k.nombre + ": el objetivo debe ser mayor que 0." };
    if (c < 0) return { completo: false, error: k.nombre + ": el resultado no puede ser negativo." };
    const pct = r10(c / o);
    return { completo: true, pct, factor: lookup(CONFIG.escaladoKPI, pct) };
  }

  function baseBonus(persona) {
    const b = CONFIG.bonus[persona.puesto];
    if (!b) return 0;
    const pr = num(persona.prorrata);
    const f = pr == null ? 1 : Math.min(Math.max(pr, 0), 100) / 100;
    return b.importe / (CONFIG.referenciaBonus === "maximo" ? CONFIG.puntuacionMaxima : 1) * f;
  }

  function calcular(tienda, persona, per) {
    const obj = (tienda.objetivos || {})[per] || {};
    const res = (tienda.resultados || {})[per] || {};
    const kpis = CONFIG.kpis.map(k => Object.assign({ kpi: k }, calcKPI(k, obj, res)));
    const cuantCompleto = kpis.every(x => x.completo);
    const sumCuant = r10(kpis.reduce((s, x) => s + (x.completo ? x.kpi.peso * x.factor : 0), 0));
    const ptsCuant = r10(CONFIG.pesoCuantitativo * sumCuant);

    const ev = (persona.evals || {})[per] || {};
    const val = ev.val || {};
    const evid = ev.evid || {};
    const its = items();
    const nValorados = its.filter(i => typeof val[i.id] === "number").length;
    const cualCompleto = nValorados === its.length;
    const sumCual = r10(its.reduce((s, i) => s + (typeof val[i.id] === "number" ? i.peso * val[i.id] : 0), 0));
    const ptsCual = r10(CONFIG.pesoCualitativo * sumCual);

    const base = baseBonus(persona);
    const bonusCual = cualCompleto ? (ptsCual < CONFIG.umbralCualitativo - 1e-12 ? 0 : r2(base * ptsCual)) : null;
    const bonusCuant = cuantCompleto ? (ptsCuant < CONFIG.umbralCuantitativo - 1e-12 ? 0 : r2(base * ptsCuant)) : null;
    const completo = cualCompleto && cuantCompleto;
    const bonus = completo ? r2(bonusCual + bonusCuant) : null;
    const nota = completo ? r10((ptsCual + ptsCuant) * CONFIG.multiplicadorNota) : null;

    const alertas = [];
    kpis.forEach(x => { if (x.error) alertas.push({ tipo: "error", t: x.error }); });
    if (kpis.some(x => x.sinObjetivo)) alertas.push({ tipo: "aviso", t: "Faltan objetivos de tienda para este periodo." });
    if (cualCompleto && ptsCual < CONFIG.umbralCualitativo - 1e-12)
      alertas.push({ tipo: "aviso", t: "El bloque cualitativo no llega al mínimo y no genera bonus." });
    if (cuantCompleto && ptsCuant < CONFIG.umbralCuantitativo - 1e-12)
      alertas.push({ tipo: "aviso", t: "El bloque cuantitativo no llega al mínimo y no genera bonus." });
    const extremosSinEv = its.filter(i => (val[i.id] === 0 || val[i.id] === 2) && !(evid[i.id] || "").trim());
    if (extremosSinEv.length)
      alertas.push({ tipo: "aviso", t: extremosSinEv.length + (extremosSinEv.length === 1 ? " valoración extrema (0 o 2) sin evidencia." : " valoraciones extremas (0 o 2) sin evidencia.") });
    if (!CONFIG.bonus[persona.puesto]) alertas.push({ tipo: "error", t: "Puesto sin bonus configurado." });

    let estado = "pendiente";
    if (ev.cerrado) estado = "cerrado";
    else if (completo) estado = "completo";
    else if (nValorados > 0 || kpis.some(x => x.completo)) estado = "en curso";

    return {
      per, kpis, cuantCompleto, sumCuant, ptsCuant,
      nValorados, nItems: its.length, cualCompleto, sumCual, ptsCual,
      base, bonusCual, bonusCuant, bonus, nota, completo, alertas, estado,
      notaMax: CONFIG.puntuacionMaxima * CONFIG.multiplicadorNota,
      maxCual: CONFIG.pesoCualitativo * CONFIG.puntuacionMaxima,
      maxCuant: CONFIG.pesoCuantitativo * CONFIG.puntuacionMaxima,
      modificadoTrasCierre: !!(ev.cerrado && ev.cerrado.bonus != null && bonus != null && Math.abs(ev.cerrado.bonus - bonus) > 0.004)
    };
  }

  const nf = (d) => { try { return new Intl.NumberFormat("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }); } catch (e) { return new Intl.NumberFormat("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); } };
  function fmt(x, d) { return x == null || isNaN(x) ? "–" : nf(d == null ? 2 : d).format(x); }
  function eur(x, d) { return x == null || isNaN(x) ? "–" : nf(d == null ? 2 : d).format(x) + " €"; }
  function pct(x, d) { return x == null || isNaN(x) ? "–" : nf(d == null ? 1 : d).format(x * 100) + " %"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function slug(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase(); }
  function uid() { return Math.random().toString(36).slice(2, 10); }

  return { CONFIG, num, lookup, items, nivel, calcKPI, calcular, baseBonus, r2, r10, fmt, eur, pct, esc, slug, uid };
})();


/* =====================================================================
   TALENT MATRIX: parámetros y cálculo, adaptados al perfil de tienda
   ===================================================================== */
CONFIG.talent = {
  // El desempeño se propone desde la nota del Scorecard anual (0 a 6)
  bandasDesempeno: [
    { id: "bajo",   t: "Por debajo de lo esperado", hasta: 2.7 },
    { id: "solido", t: "Sólido",                    hasta: 4.2 },
    { id: "alto",   t: "Destacado",                 hasta: 99 }
  ],
  potencial: [
    { id: "consolida", t: "Se consolida en el puesto", d: "Su reto hoy es dominar la tienda que lleva." },
    { id: "crece",     t: "Puede asumir más",          d: "Podría llevar una tienda mayor o proyectos de zona." },
    { id: "salto",     t: "Puede dar el salto",        d: "Recorrido hacia un rol multitienda o de Regional Manager." }
  ],
  // índice = potencial * 3 + desempeño
  segmentos: [
    { t: "Riesgo / bajo desempeño", n: "Plan de mejora con plazo y seguimiento cercano." },
    { t: "Contribuidor efectivo",   n: "Sostiene la tienda. Reconocer y mantener." },
    { t: "Experto de tienda",       n: "Referencia operativa. Darle visibilidad como formador de otros." },
    { t: "Rendimiento inconsistente", n: "Entender qué bloquea el resultado antes de planificar crecimiento." },
    { t: "Profesional sólido",      n: "El núcleo de la red. Desarrollo continuo dentro del puesto." },
    { t: "Alto rendimiento",        n: "Candidato a tienda de mayor volumen o a proyectos de zona." },
    { t: "Dilema",                  n: "Potencial sin resultados: revisar encaje de tienda o de equipo." },
    { t: "Futuro líder",            n: "Preparar con mentoring y responsabilidades de zona." },
    { t: "Estrella",                n: "Prioridad de retención y plan de sucesión hacia Regional Manager." }
  ],
  competencias: [
    { id: "venta",     t: "Venta y cierre en tienda",           obj: "Elevar la conversión del equipo",        acc: "Coaching en sala" },
    { id: "equipo",    t: "Gestión y motivación del equipo",    obj: "Clima y compromiso del equipo",          acc: "Mentoring" },
    { id: "formacion", t: "Formación del equipo",               obj: "Autonomía del equipo en producto",       acc: "Formación" },
    { id: "operativa", t: "Operativa, stock e inventario",      obj: "Fiabilidad del inventario",              acc: "Acompañamiento operativo" },
    { id: "cliente",   t: "Experiencia de cliente y reseñas",   obj: "Satisfacción y reseñas de la tienda",    acc: "Proyecto de tienda" },
    { id: "kpis",      t: "Análisis de KPIs y plan de acción",  obj: "Lectura de KPIs y plan de acción",       acc: "Coaching en sala" },
    { id: "margen",    t: "Gestión del margen y del surtido",   obj: "Mejora del margen",                      acc: "Formación" },
    { id: "procesos",  t: "Procedimientos, caja y cumplimiento", obj: "Rigor en procedimientos",               acc: "Acompañamiento operativo" }
  ],
  acciones: ["Coaching en sala", "Mentoring", "Formación", "Acompañamiento operativo", "Proyecto de tienda", "Sustitución temporal en otra tienda", "Visita a tienda referente"],
  niveles: ["Bajo", "Medio", "Alto"],
  // prioridad[riesgo][impacto]
  prioridad: [
    ["Seguimiento normal", "Seguimiento normal", "Vigilar"],
    ["Seguimiento normal", "Vigilar", "Actuar ya"],
    ["Vigilar", "Actuar ya", "Actuar ya"]
  ],
  movilidad: ["No de momento", "A una tienda de mayor volumen", "A un rol de zona o multitienda", "A otra tienda del mismo nivel"],
  readiness: ["Ahora", "6-12 meses", "1-2 años", "Más de 2 años"],
  plazos: ["3 meses", "6 meses", "12 meses"],
  // referencia de distribución (alto / medio / bajo desempeño)
  guardarrailes: { alto: 0.20, solido: 0.70, bajo: 0.10 },
  minEvidencia: 40
};

Object.assign(SC, {
  bandaDesempeno(nota) {
    if (nota == null) return null;
    const b = CONFIG.talent.bandasDesempeno;
    for (let i = 0; i < b.length; i++) if (nota < b[i].hasta) return i;
    return b.length - 1;
  },
  idxPotencial(id) { return CONFIG.talent.potencial.findIndex(p => p.id === id); },
  idxBanda(id) { return CONFIG.talent.bandasDesempeno.findIndex(b => b.id === id); },
  segmento(perfIdx, potIdx) {
    if (perfIdx == null || perfIdx < 0 || potIdx == null || potIdx < 0) return null;
    return Object.assign({ idx: potIdx * 3 + perfIdx }, CONFIG.talent.segmentos[potIdx * 3 + perfIdx]);
  },
  prioridadRetencion(riesgo, impacto) {
    const r = CONFIG.talent.niveles.indexOf(riesgo), i = CONFIG.talent.niveles.indexOf(impacto);
    return r < 0 || i < 0 ? null : CONFIG.talent.prioridad[r][i];
  },
  // Estado de una ficha de talento: qué falta para poder cerrarla
  talent(tienda, persona) {
    const tal = persona.talent || {};
    const sc = SC.calcular(tienda, persona, "fy");
    const propuesta = SC.bandaDesempeno(sc.nota);
    const perfIdx = tal.desempeno ? SC.idxBanda(tal.desempeno) : propuesta;
    const potIdx = SC.idxPotencial(tal.potencial);
    const seg = SC.segmento(perfIdx, potIdx);
    const falta = [];
    if (perfIdx == null || perfIdx < 0) falta.push("la banda de desempeño");
    if (potIdx < 0) falta.push("el potencial");
    if ((tal.evidencia || "").trim().length < CONFIG.talent.minEvidencia) falta.push("las evidencias del potencial");
    if (!tal.estrella) falta.push("la competencia estrella");
    if (!(tal.mejoras || []).length) falta.push("al menos un área de mejora");
    if (!tal.riesgo || !tal.impacto) falta.push("riesgo e impacto de salida");
    if (!tal.sucesor) falta.push("si hay sucesor/a para la tienda");
    if (!tal.objetivo || !(tal.resultado || "").trim()) falta.push("el plan de desarrollo con su resultado esperado");
    return {
      tal, notaScorecard: sc.nota, propuesta, perfIdx, potIdx, seg,
      ajustado: propuesta != null && perfIdx !== propuesta,
      prioridad: SC.prioridadRetencion(tal.riesgo, tal.impacto),
      falta, completo: !falta.length, cerrado: !!tal.cerrado,
      estado: tal.cerrado ? "cerrado" : (!falta.length ? "completo" : (potIdx >= 0 || tal.estrella ? "en curso" : "pendiente"))
    };
  }
});


/* =====================================================================
   PRUEBAS E INVITACIONES: cuestionarios que se envían con un código
   ===================================================================== */
CONFIG.plantillas = [
  {
    id: "sjt-retail", tipo: "psico", nombre: "Prueba situacional de tienda",
    intro: "No hay respuestas tramposas ni preguntas con truco. Son situaciones reales de tienda: elige lo que harías tú. Se tarda unos 10 minutos y no se puede repetir.",
    aviso: "Es una prueba de criterio profesional, no de personalidad. El resultado lo ve RR.HH. y tu Regional Manager, y se usa para orientar tu desarrollo.",
    preguntas: [
      { id: "s1", t: "Sábado de campaña, dos personas en sala y cola en caja. Entra un cliente que quiere una demo de una batidora de gama alta. ¿Qué haces?", o: [
        { t: "Atiendes tú la demo y dejas la caja a tu compañero", v: 2 },
        { t: "Pides al cliente que espere a que baje la cola", v: 1 },
        { t: "Le das el folleto y le invitas a volver entre semana", v: 0 },
        { t: "Haces una demo corta junto a la caja para no perder el control de la cola", v: 3 }]},
      { id: "s2", t: "Al cierre, la caja tiene 40 € de menos y el equipo se va en diez minutos.", o: [
        { t: "Cuadras tú solo y lo anotas al día siguiente si sigue descuadrado", v: 1 },
        { t: "Reconteo delante de quien ha cobrado, revisas los tickets del día y dejas la incidencia registrada", v: 3 },
        { t: "Pones 40 € de tu bolsillo para no generar incidencia", v: 0 },
        { t: "Lo dejas anotado y lo miras en el arqueo de mañana", v: 1 }]},
      { id: "s3", t: "Una persona de tu equipo lleva tres semanas por debajo de objetivo y ha bajado el ánimo.", o: [
        { t: "Le pones objetivos más bajos hasta que remonte", v: 0 },
        { t: "Hablas en privado, buscas juntos qué está pasando y acordáis dos acciones concretas con fecha", v: 3 },
        { t: "Lo comentas en la reunión de equipo para que todos se motiven", v: 0 },
        { t: "Le acompañas en sala un par de turnos y luego valoras", v: 2 }]},
      { id: "s4", t: "El plan comercial pide dar foco a una gama que en tu tienda se vende poco.", o: [
        { t: "Lo aplicas y avisas a tu RM del dato de tu tienda con una propuesta alternativa", v: 3 },
        { t: "Lo aplicas sin decir nada", v: 1 },
        { t: "Mantienes tu surtido porque conoces mejor a tu cliente", v: 0 },
        { t: "Lo aplicas a medias, en una zona poco visible", v: 0 }]},
      { id: "s5", t: "Un cliente exige la devolución de un producto usado y sin ticket, y alza la voz delante de otros clientes.", o: [
        { t: "Aceptas la devolución para acabar cuanto antes", v: 0 },
        { t: "Le niegas la devolución citando la política y sigues con el resto de clientes", v: 1 },
        { t: "Le llevas a un lado, escuchas, explicas qué sí puedes hacer y le ofreces una alternativa", v: 3 },
        { t: "Le dices que llame al servicio de atención al cliente", v: 1 }]},
      { id: "s6", t: "Recibes el inventario y faltan referencias de alto margen por valor de 600 €.", o: [
        { t: "Lo ajustas en sistema y sigues", v: 0 },
        { t: "Revisas entradas, mermas y ventas del periodo, buscas el patrón y lo compartes con tu RM", v: 3 },
        { t: "Preguntas al equipo si alguien sabe algo y esperas al siguiente inventario", v: 1 },
        { t: "Cambias la ubicación de esas referencias y vuelves a contar", v: 2 }]}
    ]
  },
  {
    id: "mystery-visita", tipo: "mystery", nombre: "Visita de Mystery Shopper",
    intro: "Rellena la ficha justo después de la visita, con lo que hayas observado.",
    aviso: "La ficha llega a RR.HH. y al Regional Manager de la zona.",
    preguntas: [
      { id: "m1", t: "¿Te saludaron en el primer minuto en sala?", o: [{ t: "Sí, de forma natural", v: 2 }, { t: "Tarde o de forma mecánica", v: 1 }, { t: "No", v: 0 }] },
      { id: "m2", t: "¿Hicieron preguntas para entender qué necesitabas?", o: [{ t: "Sí, varias y bien enfocadas", v: 2 }, { t: "Alguna", v: 1 }, { t: "Ninguna", v: 0 }] },
      { id: "m3", t: "¿Demostraron conocimiento del producto?", o: [{ t: "Sí, con argumentos concretos", v: 2 }, { t: "Básico", v: 1 }, { t: "No", v: 0 }] },
      { id: "m4", t: "¿Te ofrecieron una demostración?", o: [{ t: "Sí", v: 2 }, { t: "Solo al pedirla", v: 1 }, { t: "No", v: 0 }] },
      { id: "m5", t: "¿Propusieron un producto complementario?", o: [{ t: "Sí, con sentido", v: 2 }, { t: "De forma forzada", v: 1 }, { t: "No", v: 0 }] },
      { id: "m6", t: "¿Intentaron cerrar la venta?", o: [{ t: "Sí", v: 2 }, { t: "De forma tibia", v: 1 }, { t: "No", v: 0 }] },
      { id: "m7", t: "Orden, limpieza y precios visibles", o: [{ t: "Impecable", v: 2 }, { t: "Mejorable", v: 1 }, { t: "Deficiente", v: 0 }] },
      { id: "m8", t: "Escaparate acorde a la campaña en curso", o: [{ t: "Sí", v: 2 }, { t: "Parcialmente", v: 1 }, { t: "No", v: 0 }] },
      { id: "m9", t: "Tiempo de espera en caja", o: [{ t: "Menos de 2 minutos", v: 2 }, { t: "Entre 2 y 5", v: 1 }, { t: "Más de 5", v: 0 }] },
      { id: "m10", t: "¿Qué recordarías de la visita? ¿Y qué te chirrió?", tipo: "texto" }
    ]
  },
  {
    id: "clima-tienda", tipo: "clima", nombre: "Encuesta de clima de tienda", anonima: true,
    intro: "Es anónima. RR.HH. solo ve los resultados agregados de la tienda, nunca respuestas individuales, y no se publican resultados de tiendas con menos de 4 respuestas.",
    aviso: "Se tarda 5 minutos. No dejes rastro de tu nombre en el comentario si no quieres.",
    escala: ["Nada de acuerdo", "Poco", "Bastante", "Totalmente de acuerdo"],
    preguntas: [
      { id: "c1", t: "Sé qué se espera de mí en mi puesto", tipo: "likert" },
      { id: "c2", t: "Mi responsable de tienda me escucha", tipo: "likert" },
      { id: "c3", t: "Recibo la formación que necesito para vender bien", tipo: "likert" },
      { id: "c4", t: "Los horarios se comunican con antelación suficiente", tipo: "likert" },
      { id: "c5", t: "Somos suficientes para atender bien en las horas punta", tipo: "likert" },
      { id: "c6", t: "El ambiente entre compañeros es bueno", tipo: "likert" },
      { id: "c7", t: "Se reconoce el trabajo bien hecho", tipo: "likert" },
      { id: "c8", t: "Sé a quién acudir cuando tengo un problema", tipo: "likert" },
      { id: "c9", t: "Veo posibilidades de crecer en la compañía", tipo: "likert" },
      { id: "c10", t: "Recomendaría trabajar aquí a alguien conocido", tipo: "likert" },
      { id: "c11", t: "¿Qué cambiarías de tu tienda si pudieras cambiar una sola cosa?", tipo: "texto" }
    ]
  }
];

CONFIG.tiposPrueba = {
  psico: { t: "Pruebas situacionales", modulo: "psico" },
  mystery: { t: "Mystery Shopper", modulo: "mystery" },
  clima: { t: "Encuesta de Clima", modulo: "clima" }
};

Object.assign(SC, {
  plantilla(id) { return CONFIG.plantillas.find(p => p.id === id); },
  // Puntuación: solo cuenta lo puntuable (las preguntas de texto no puntúan)
  puntuar(plantilla, respuestas) {
    respuestas = respuestas || {};
    let obt = 0, max = 0, n = 0;
    plantilla.preguntas.forEach(q => {
      if (q.tipo === "texto") return;
      if (q.tipo === "likert") { max += 3; if (typeof respuestas[q.id] === "number") { obt += respuestas[q.id]; n++; } return; }
      max += Math.max(...q.o.map(o => o.v));
      const r = respuestas[q.id];
      if (r != null && q.o[r]) { obt += q.o[r].v; n++; }
    });
    const puntuables = plantilla.preguntas.filter(q => q.tipo !== "texto").length;
    return { obt, max, pct: max ? SC.r10(obt / max) : null, contestadas: n, puntuables, completa: n === puntuables };
  },
  /* Días naturales que una baja solapa con un mes "AAAA-MM".
     Una baja sin fecha de alta sigue abierta: cuenta hasta hoy o hasta el
     fin del mes, lo que llegue antes. */
  diasEnMes(baja, mes) {
    const [a, m] = mes.split("-").map(Number);
    const ini = new Date(Date.UTC(a, m - 1, 1)), fin = new Date(Date.UTC(a, m, 0));
    const bi = new Date(baja.inicio + "T00:00:00Z");
    const bf = baja.fin ? new Date(baja.fin + "T00:00:00Z") : new Date();
    if (isNaN(bi) || isNaN(bf)) return 0;
    const desde = bi > ini ? bi : ini, hasta = bf < fin ? bf : fin;
    if (hasta < desde) return 0;
    return Math.round((hasta - desde) / 86400000) + 1;
  },
  diasTotales(baja) {
    const bi = new Date(baja.inicio + "T00:00:00Z");
    const bf = baja.fin ? new Date(baja.fin + "T00:00:00Z") : new Date();
    if (isNaN(bi) || isNaN(bf) || bf < bi) return 0;
    return Math.round((bf - bi) / 86400000) + 1;
  },
  diasDelMes(mes) { const [a, m] = mes.split("-").map(Number); return new Date(Date.UTC(a, m, 0)).getUTCDate(); },

  /* Absentismo de un conjunto de tiendas en un conjunto de meses.
     Tasa = días naturales perdidos ÷ (plantilla × días del periodo).
     La plantilla sale del campo "empleados" de los KPIs mensuales; sin él
     no hay denominador y la tasa se devuelve nula en vez de inventada. */
  absentismo(tiendas, meses) {
    const porTipo = {}, porTienda = [];
    let dias = 0, expuestos = 0, procesos = 0, abiertos = 0, sinPlantilla = 0;
    const vistos = new Set();
    CONFIG.bajasTipos.forEach(x => porTipo[x.id] = 0);
    tiendas.forEach(t => {
      const bajas = (t.bajas || (t.datos && t.datos.bajas) || []);
      const k = (t.kpis || (t.datos && t.datos.kpis) || {});
      let dT = 0, eT = 0;
      meses.forEach(m => {
        const emp = Number((k[m] || {}).empleados) || 0;
        if (emp) eT += emp * SC.diasDelMes(m); else sinPlantilla++;
        bajas.forEach(b => {
          const d = SC.diasEnMes(b, m);
          if (!d) return;
          dT += d;
          porTipo[b.tipo] = (porTipo[b.tipo] || 0) + d;
          if (!vistos.has(b.id)) { vistos.add(b.id); procesos++; if (!b.fin) abiertos++; }
        });
      });
      dias += dT; expuestos += eT;
      porTienda.push({ id: t.id, nombre: t.nombre, codigo: t.codigo, dias: dT,
        tasa: eT ? SC.r10(dT / eT * 100) : null, nBajas: bajas.length });
    });
    const duraciones = [...vistos];
    return {
      dias, procesos, abiertos, porTipo, sinPlantilla,
      tasa: expuestos ? SC.r10(dias / expuestos * 100) : null,
      duracionMedia: procesos ? SC.r10(dias / procesos) : null,
      porTienda: porTienda.sort((a, b) => (b.tasa || 0) - (a.tasa || 0)),
      nTiendas: duraciones.length ? porTienda.filter(x => x.dias).length : 0
    };
  },
  codigoInvitacion() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres que se confundan
    let s = ""; for (let i = 0; i < 8; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return s.slice(0, 4) + "-" + s.slice(4);
  }
});


/* =====================================================================
   Textos multiidioma en cuestionarios, cuestionarios nuevos y KPIs del PDC
   ===================================================================== */
SC.txt = function (v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  const l = (typeof LANG === "string" ? LANG : "es");
  return v[l] != null ? v[l] : (v.es != null ? v.es : "");
};

CONFIG.dimensiones = {
  liderazgo:     { es: "Liderazgo de tienda", en: "Store leadership", fr: "Management du magasin" },
  carga:         { es: "Carga y horarios", en: "Workload and scheduling", fr: "Charge et horaires" },
  desarrollo:    { es: "Formación y desarrollo", en: "Training and development", fr: "Formation et développement" },
  reconocimiento:{ es: "Reconocimiento y objetivos", en: "Recognition and targets", fr: "Reconnaissance et objectifs" },
  equipo:        { es: "Equipo y confianza", en: "Team and trust", fr: "Équipe et confiance" },
  medios:        { es: "Medios para trabajar", en: "Tools to do the job", fr: "Moyens de travail" },
  acogida:       { es: "Acogida", en: "Welcome", fr: "Accueil" },
  expectativas:  { es: "Expectativas", en: "Expectations", fr: "Attentes" },
  salida:        { es: "Motivos de salida", en: "Reasons for leaving", fr: "Motifs de départ" }
};

const ESCALA5 = {
  es: ["Totalmente en desacuerdo", "En desacuerdo", "Ni sí ni no", "De acuerdo", "Totalmente de acuerdo"],
  en: ["Strongly disagree", "Disagree", "Neither", "Agree", "Strongly agree"],
  fr: ["Pas du tout d'accord", "Plutôt pas d'accord", "Ni l'un ni l'autre", "Plutôt d'accord", "Tout à fait d'accord"]
};
const L = (id, dim, es, en, fr) => ({ id, dim, tipo: "likert", t: { es, en, fr } });
const TXT = (id, es, en, fr) => ({ id, tipo: "texto", t: { es, en, fr } });

const CLIMA_ITEMS = [
  L("l1", "liderazgo", "Mi responsable de tienda me escucha y tiene en cuenta lo que digo", "My store manager listens to me and takes what I say into account", "Mon responsable m'écoute et tient compte de ce que je dis"),
  L("l2", "liderazgo", "Recibo comentarios útiles sobre cómo estoy haciendo mi trabajo", "I get useful feedback on how I am doing my job", "Je reçois un retour utile sur mon travail"),
  L("l3", "liderazgo", "Se trata a todo el equipo con respeto", "Everyone on the team is treated with respect", "Toute l'équipe est traitée avec respect"),
  L("c1", "carga", "Somos suficientes en las horas de más afluencia", "We are enough people during the busiest hours", "Nous sommes assez nombreux aux heures de forte affluence"),
  L("c2", "carga", "El horario se comunica con antelación suficiente", "Schedules are communicated far enough in advance", "Les plannings sont communiqués suffisamment à l'avance"),
  L("c3", "carga", "Puedo desconectar fuera de mi turno", "I can switch off outside my shift", "Je peux déconnecter en dehors de mon service"),
  L("d1", "desarrollo", "Recibo la formación que necesito para vender bien", "I get the training I need to sell well", "Je reçois la formation nécessaire pour bien vendre"),
  L("d2", "desarrollo", "Veo posibilidades de crecer en la compañía", "I see opportunities to grow in the company", "Je vois des possibilités d'évoluer dans l'entreprise"),
  L("r1", "reconocimiento", "Se reconoce el trabajo bien hecho", "Good work is recognised", "Le travail bien fait est reconnu"),
  L("r2", "reconocimiento", "Entiendo cómo se calculan mis objetivos y mi variable", "I understand how my targets and my bonus are calculated", "Je comprends comment sont calculés mes objectifs et ma prime"),
  L("e1", "equipo", "El ambiente entre compañeros es bueno", "The atmosphere among colleagues is good", "L'ambiance entre collègues est bonne"),
  L("e2", "equipo", "Puedo decir lo que pienso sin que me perjudique", "I can say what I think without it counting against me", "Je peux dire ce que je pense sans que cela me nuise"),
  L("m1", "medios", "Tengo el producto y los medios para atender bien al cliente", "I have the product and the tools to serve customers well", "J'ai le produit et les moyens pour bien servir le client"),
  L("m2", "medios", "Sé a quién acudir cuando tengo un problema", "I know who to turn to when I have a problem", "Je sais à qui m'adresser en cas de problème")
];
const ENPS = { id: "nps", tipo: "nps", t: { es: "¿Qué probabilidad hay de que recomiendes trabajar en Home & Cook a alguien conocido? (0 a 10)", en: "How likely are you to recommend working at Home & Cook to someone you know? (0 to 10)", fr: "Quelle est la probabilité que vous recommandiez de travailler chez Home & Cook ? (0 à 10)" } };

CONFIG.plantillas.push(
  {
    id: "clima-completo", tipo: "clima", anonima: true, escala: ESCALA5, dimensiones: true,
    nombre: { es: "Clima: encuesta completa", en: "Engagement: full survey", fr: "Climat : enquête complète" },
    intro: { es: "Es anónima. RR.HH. solo ve resultados agregados de tu tienda, nunca respuestas individuales, y no se publican resultados de tiendas con menos de 4 respuestas.",
             en: "This is anonymous. HR only sees aggregated results for your store, never individual answers, and results are not published for stores with fewer than 4 responses.",
             fr: "Anonyme. Les RH ne voient que des résultats agrégés par magasin, jamais les réponses individuelles, et rien n'est publié en dessous de 4 réponses." },
    aviso: { es: "Se tarda unos 6 minutos. No pongas tu nombre en los comentarios si no quieres.",
             en: "It takes about 6 minutes. Do not put your name in the comments unless you want to.",
             fr: "Environ 6 minutes. N'indiquez pas votre nom dans les commentaires si vous ne le souhaitez pas." },
    preguntas: CLIMA_ITEMS.concat([ENPS,
      TXT("t1", "Si pudieras cambiar una sola cosa de tu tienda, ¿cuál sería?", "If you could change one single thing about your store, what would it be?", "Si vous pouviez changer une seule chose dans votre magasin, laquelle ?"),
      TXT("t2", "¿Qué no deberíamos cambiar nunca?", "What should we never change?", "Qu'est-ce qu'il ne faudrait jamais changer ?")])
  },
  {
    id: "clima-pulso", tipo: "clima", anonima: true, escala: ESCALA5, dimensiones: true,
    nombre: { es: "Clima: pulso trimestral", en: "Engagement: quarterly pulse", fr: "Climat : pulse trimestriel" },
    intro: { es: "Seis preguntas para tomar el pulso entre encuestas completas. Anónima igual que la larga.",
             en: "Six questions to take the pulse between full surveys. Anonymous, same as the long one.",
             fr: "Six questions entre deux enquêtes complètes. Anonyme, comme la longue." },
    aviso: { es: "Dos minutos. Los resultados se comparan con la ola anterior.", en: "Two minutes. Results are compared with the previous wave.", fr: "Deux minutes. Les résultats sont comparés à la vague précédente." },
    preguntas: CLIMA_ITEMS.filter(q => ["c1", "l1", "r1", "e2", "d2"].includes(q.id)).concat([ENPS,
      TXT("t1", "¿Algo que quieras contar?", "Anything you want to tell us?", "Quelque chose à nous dire ?")])
  },
  {
    id: "onboarding-30", tipo: "onboarding",
    nombre: { es: "Onboarding: primeros 30 días", en: "Onboarding: first 30 days", fr: "Intégration : 30 premiers jours" },
    intro: { es: "Llevas unas semanas con nosotros. Cuéntanos cómo ha ido la llegada: sirve para mejorar la acogida de quien venga detrás.",
             en: "You have been with us a few weeks. Tell us how your arrival went: it helps us improve the welcome for whoever comes next.",
             fr: "Vous êtes parmi nous depuis quelques semaines. Dites-nous comment s'est passée votre arrivée." },
    aviso: { es: "Lo lee RR.HH. y tu Regional Manager. No se comparte con el resto del equipo de tienda.",
             en: "HR and your Regional Manager read it. It is not shared with the rest of the store team.",
             fr: "Lu par les RH et votre Regional Manager. Non partagé avec l'équipe du magasin." },
    escala: ESCALA5,
    preguntas: [
      L("o1", "acogida", "El primer día alguien me esperaba y me presentó al equipo", "On my first day someone was expecting me and introduced me to the team", "Le premier jour, quelqu'un m'attendait et m'a présenté à l'équipe"),
      L("o2", "acogida", "Tenía listo lo que necesitaba: uniforme, accesos y material", "What I needed was ready: uniform, access and equipment", "J'avais ce qu'il me fallait : tenue, accès et matériel"),
      L("o3", "acogida", "La formación inicial de producto me ha servido para atender clientes", "The initial product training helped me serve customers", "La formation produit initiale m'a aidé à servir les clients"),
      L("o4", "expectativas", "Sé qué se espera de mí en mi puesto", "I know what is expected of me in my role", "Je sais ce que l'on attend de moi"),
      L("o5", "expectativas", "El trabajo se parece a lo que me contaron en la entrevista", "The job matches what I was told in the interview", "Le poste correspond à ce qu'on m'a dit en entretien"),
      L("o6", "liderazgo", "Mi responsable ha estado disponible cuando lo he necesitado", "My manager was available when I needed them", "Mon responsable a été disponible quand j'en ai eu besoin"),
      L("o7", "equipo", "El equipo me ha ayudado a integrarme", "The team helped me fit in", "L'équipe m'a aidé à m'intégrer"),
      L("o8", "expectativas", "Me veo trabajando aquí dentro de un año", "I see myself working here a year from now", "Je me vois encore ici dans un an"),
      TXT("t1", "¿Qué mejorarías de tus primeras semanas?", "What would you improve about your first weeks?", "Qu'amélioreriez-vous dans vos premières semaines ?"),
      TXT("t2", "¿Qué te ha faltado para arrancar antes?", "What was missing for you to get going sooner?", "Que vous a-t-il manqué pour démarrer plus vite ?")
    ]
  },
  {
    id: "offboarding-salida", tipo: "offboarding",
    nombre: { es: "Offboarding: entrevista de salida", en: "Offboarding: exit interview", fr: "Départ : entretien de sortie" },
    intro: { es: "Nos ayuda mucho saber por qué te vas y qué habría hecho falta para que te quedaras. Lo usamos para corregir, no para justificar.",
             en: "It helps us a lot to know why you are leaving and what would have kept you. We use it to fix things, not to justify them.",
             fr: "Savoir pourquoi vous partez nous aide beaucoup, ainsi que ce qui aurait pu vous retenir." },
    aviso: { es: "Lo lee RR.HH. Tu respuesta no afecta a tu finiquito ni a futuras referencias.",
             en: "HR reads it. Your answer does not affect your final pay or future references.",
             fr: "Lu par les RH. Votre réponse n'affecte ni votre solde de tout compte ni vos références." },
    escala: ESCALA5,
    preguntas: [
      { id: "x0", dim: "salida", tipo: "opcion", sinPuntuar: true,
        t: { es: "¿Cuál es el motivo principal de tu salida?", en: "What is the main reason you are leaving?", fr: "Quelle est la raison principale de votre départ ?" },
        o: [{ t: { es: "Otra oferta de trabajo", en: "Another job offer", fr: "Une autre offre d'emploi" }, v: 0 },
            { t: { es: "Horarios o conciliación", en: "Schedule or work-life balance", fr: "Horaires ou équilibre de vie" }, v: 0 },
            { t: { es: "Salario o variable", en: "Pay or bonus", fr: "Salaire ou variable" }, v: 0 },
            { t: { es: "Relación con el responsable o el equipo", en: "Relationship with manager or team", fr: "Relation avec le responsable ou l'équipe" }, v: 0 },
            { t: { es: "Falta de desarrollo", en: "Lack of development", fr: "Manque de perspectives" }, v: 0 },
            { t: { es: "Motivos personales o mudanza", en: "Personal reasons or relocation", fr: "Raisons personnelles ou déménagement" }, v: 0 },
            { t: { es: "Fin de contrato", en: "End of contract", fr: "Fin de contrat" }, v: 0 }] },
      L("x1", "reconocimiento", "Me he sentido valorado por mi trabajo", "I felt valued for my work", "Je me suis senti valorisé pour mon travail"),
      L("x2", "desarrollo", "He tenido oportunidades de aprender y crecer", "I had opportunities to learn and grow", "J'ai eu des occasions d'apprendre et d'évoluer"),
      L("x3", "carga", "La carga de trabajo y los horarios eran sostenibles", "The workload and schedules were sustainable", "La charge de travail et les horaires étaient tenables"),
      L("x4", "liderazgo", "Mi responsable me ha apoyado", "My manager supported me", "Mon responsable m'a soutenu"),
      L("x5", "equipo", "Recomendaría trabajar en Home & Cook a alguien conocido", "I would recommend working at Home & Cook to someone I know", "Je recommanderais de travailler chez Home & Cook"),
      TXT("t1", "¿Qué habría hecho falta para que te quedaras?", "What would it have taken for you to stay?", "Qu'aurait-il fallu pour que vous restiez ?"),
      TXT("t2", "¿Qué te llevas de tu paso por aquí?", "What do you take away from your time here?", "Que retenez-vous de votre passage ici ?")
    ]
  }
);

CONFIG.tiposPrueba.onboarding = { t: { es: "Onboarding", en: "Onboarding", fr: "Intégration" } };
CONFIG.tiposPrueba.offboarding = { t: { es: "Offboarding", en: "Offboarding", fr: "Départs" } };

/* --------- KPIs del People Data Centre --------- */
/* La red real, a 27/09/2026. "rm" es la clave de zona del Regional Manager
   que la gestiona; al crear los usuarios se asocia cada clave a su persona.
   Si abre o cierra una tienda, se cambia aquí y en Usuarios y tiendas. */
CONFIG.red = [
  { codigo: "ES001", nombre: "HOME & COOK S.SEBASTIAN REYES", rm: "es" },
  { codigo: "ES002", nombre: "HOME & COOK GETAFE", rm: "es" },
  { codigo: "ES003", nombre: "HOME & COOK SEVILLA", rm: "es" },
  { codigo: "ES004", nombre: "HOME & COOK BIZKAIA", rm: "es" },
  { codigo: "ES006", nombre: "HOME & COOK MALLORCA", rm: "es" },
  { codigo: "ES007", nombre: "HOME & COOK TUI", rm: "pt" },
  { codigo: "ES008", nombre: "HOME & COOK A CORUÑA", rm: "es" },
  { codigo: "ES009", nombre: "HOME & COOK LAS ROZAS", rm: "es" },
  { codigo: "ES011", nombre: "HOME & COOK VILADECANS", rm: "es" },
  { codigo: "ES012", nombre: "HOME & COOK ALICANTE", rm: "es" },
  { codigo: "ES014", nombre: "HOME & COOK MÁLAGA", rm: "es" },
  { codigo: "ES015", nombre: "HOME & COOK ZARAGOZA", rm: "es" },
  { codigo: "ES019", nombre: "WMF MALLORCA", rm: "es" },
  { codigo: "ES020", nombre: "WMF S.SEBASTIAN REYES", rm: "es" },
  { codigo: "PT001", nombre: "HOME & COOK PORTO", rm: "pt" },
  { codigo: "PT002", nombre: "HOME & COOK FREEPORT", rm: "pt" },
  { codigo: "PT003", nombre: "HOME & COOK ALGARVE", rm: "pt" },
  { codigo: "PT004", nombre: "TEFAL OUTLET STRADA", rm: "pt" },
  { codigo: "PT005", nombre: "WMF FREEPORT", rm: "pt" },
  { codigo: "PT006", nombre: "WMF ALGARVE", rm: "pt" },
  { codigo: "PT008", nombre: "TEFAL Campera", rm: "pt" }
];
CONFIG.zonas = { es: "España", pt: "Portugal y Tui" };

/* Bajas y absentismo.
   Son las contingencias que constan en el parte de baja y que la empresa
   necesita conocer para la Seguridad Social y para cubrir el turno. NUNCA
   el diagnóstico ni la causa médica: eso es dato de salud del artículo 9
   del RGPD y la empresa no tiene por qué tenerlo. Por eso no hay ningún
   campo de texto libre en este apartado: si existiera, alguien lo usaría. */
CONFIG.bajasTipos = [
  { id: "it_comun",      t: "IT por contingencias comunes",  corto: "IT común",    color: "l1" },
  { id: "it_accidente",  t: "IT por accidente de trabajo",   corto: "Accidente",   color: "l0" },
  { id: "it_no_laboral", t: "Accidente no laboral",          corto: "No laboral",  color: "l05" },
  { id: "enf_prof",      t: "Enfermedad profesional",        corto: "Enf. prof.",  color: "l0" },
  { id: "maternidad",    t: "Nacimiento y cuidado de menor", corto: "Nacimiento",  color: "l15" },
  { id: "otras",         t: "Otras ausencias justificadas",  corto: "Otras",       color: "l2" }
];
/* Por encima de este porcentaje la tienda sale marcada. 4,5 % es la
   referencia habitual del comercio minorista en España; cámbialo cuando
   tengas el dato real de la red. */
CONFIG.absentismoObjetivo = 4.5;

CONFIG.franjas = ["10-12", "12-14", "14-16", "16-18", "18-20", "20-22"];

Object.assign(SC, {
  // Suma los meses seleccionados de una lista de tiendas
  kpis(tiendas, meses) {
    const S0 = { ventas: 0, tickets: 0, unidades: 0, visitantes: 0, horasContratadas: 0, horasTrabajadas: 0, horasApertura: 0 };
    const traf = CONFIG.franjas.map(() => 0), plan = CONFIG.franjas.map(() => 0);
    let empleados = 0, nTiendas = 0, nMeses = 0;
    tiendas.forEach(t => {
      const k = (t.datos && t.datos.kpis) || t.kpis || {};
      const ms = meses.filter(m => k[m]);
      if (!ms.length) return;
      nTiendas++;
      let ult = null;
      ms.forEach(m => {
        const d = k[m]; nMeses++;
        Object.keys(S0).forEach(c => { S0[c] += Number(d[c]) || 0; });
        (d.trafico || []).forEach((v, i) => traf[i] += Number(v) || 0);
        (d.horasPlan || []).forEach((v, i) => plan[i] += Number(v) || 0);
        ult = d;
      });
      empleados += Number(ult.empleados) || 0;
    });
    const div = (a, b) => (b ? SC.r10(a / b) : null);
    const sumT = traf.reduce((a, b) => a + b, 0), sumP = plan.reduce((a, b) => a + b, 0);
    let adaptacion = null;
    if (sumT > 0 && sumP > 0) {
      let dif = 0;
      for (let i = 0; i < traf.length; i++) dif += Math.abs(traf[i] / sumT - plan[i] / sumP);
      adaptacion = SC.r10(1 - dif / 2);
    }
    return Object.assign({}, S0, {
      nTiendas, nMeses, empleados, trafico: traf, horasPlan: plan, adaptacion,
      ticketMedio: div(S0.ventas, S0.tickets),
      upt: div(S0.unidades, S0.tickets),
      conversion: div(S0.tickets, S0.visitantes),
      ventasPorHoraContratada: div(S0.ventas, S0.horasContratadas),
      productividad: div(S0.ventas, S0.horasTrabajadas),
      horasContratadasPorApertura: div(S0.horasContratadas, S0.horasApertura),
      headcountPorApertura: div(S0.horasTrabajadas, S0.horasApertura),
      usoHoras: div(S0.horasTrabajadas, S0.horasContratadas),
      ventasPorEmpleado: empleados ? SC.r10(S0.ventas / empleados) : null
    });
  },
  // eNPS a partir de las respuestas de una campaña
  enps(respuestas) {
    const v = respuestas.map(r => r && r.nps).filter(x => typeof x === "number");
    if (!v.length) return null;
    const p = v.filter(x => x >= 9).length, d = v.filter(x => x <= 6).length;
    return { valor: Math.round((p - d) / v.length * 100), n: v.length, promotores: p, detractores: d };
  }
});

// Puntuación: las preguntas de texto no cuentan; nps y "sinPuntuar" se responden pero no puntúan
SC.puntuar = function (plantilla, respuestas) {
  respuestas = respuestas || {};
  let obt = 0, max = 0, contestadas = 0, obligatorias = 0;
  plantilla.preguntas.forEach(q => {
    if (q.tipo === "texto") return;
    obligatorias++;
    const r = respuestas[q.id];
    const resp = typeof r === "number";
    if (resp) contestadas++;
    if (q.tipo === "nps" || q.sinPuntuar) return;
    if (q.tipo === "likert") { const n = (SC.txt2(plantilla.escala) || []).length || 4; max += n - 1; if (resp) obt += r; return; }
    max += Math.max.apply(null, q.o.map(o => o.v));
    if (resp && q.o[r]) obt += q.o[r].v;
  });
  return { obt, max, pct: max ? SC.r10(obt / max) : null, contestadas, puntuables: obligatorias, completa: contestadas === obligatorias };
};
// La escala puede venir como lista o como {es,en,fr}
SC.txt2 = function (v) { return Array.isArray(v) ? v : (v && (v[typeof LANG === "string" ? LANG : "es"] || v.es)) || []; };

if (typeof module !== "undefined") module.exports = SC;
