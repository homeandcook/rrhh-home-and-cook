"use strict";
/* ============ DESARROLLO · catálogos ============
   Escalas, competencias, opciones y textos del Talent Review. Vienen de la
   herramienta Talent Review v1.0 (ficha del manager y panel de RR.HH.),
   sin marcas, con un solo catálogo de 9-Box y con las erratas corregidas.
   Dos ámbitos: «oficina» y «retail». Lo que cambia entre ellos está en
   TRC.AMBITO.
   ================================================ */
const TRC = (() => {
  const PERF = [null,
    ["Rendimiento crítico", "No cumple las funciones básicas del puesto. Requiere supervisión constante."],
    ["Muy por debajo del estándar", "Errores recurrentes y muy poca autonomía."],
    ["Por debajo del estándar", "Cumple solo una parte de lo que el puesto exige. Necesita apoyo frecuente."],
    ["Irregular", "Saca el trabajo básico, pero con altibajos que obligan a estar encima."],
    ["Cumple el estándar del puesto", "Hace su trabajo bien y de forma estable. Es un buen resultado."],
    ["Cumple con solvencia", "Fiable y autónomo. Resuelve sin que haya que supervisarle."],
    ["Por encima del estándar", "Supera objetivos con regularidad y aporta soluciones propias."],
    ["Muy alto desempeño", "Referente dentro del equipo. Calidad e impacto por encima de lo que pide el puesto."],
    ["Excelente desempeño", "Su impacto se nota fuera de su área. Mejora procesos y resultados del negocio."],
    ["Desempeño excepcional", "Impacto estratégico y sostenido. Talento diferencial para la compañía."]];
  const POT = [null,
    ["Potencial no identificado", "Baja adaptación al cambio y escasa evolución observada."],
    ["Potencial muy limitado", "Dificultad para asumir tareas o contextos nuevos."],
    ["Potencial limitado", "Puede consolidarse en su rol actual, con poco recorrido más allá."],
    ["Potencial moderado", "Puede crecer de forma gradual y con acompañamiento."],
    ["Potencial adecuado", "Puede asumir más complejidad a medio plazo. Es un buen resultado."],
    ["Buen potencial", "Aprende rápido y se adapta bien a retos nuevos."],
    ["Potencial claro", "Preparado para asumir funciones ampliadas o proyectos clave."],
    ["Muy alto potencial", "Capacidad evidente de evolucionar hacia roles críticos o expertos."],
    ["Potencial estratégico", "Perfil de referencia futura dentro de la organización."],
    ["Talento excepcional", "Potencial extraordinario de crecimiento e influencia organizativa."]];
  const BANDAS = {
    perf: [["Bajo", "1-4", "No llega al estándar que exige el puesto."], ["Medio", "5-7", "Cumple el estándar del puesto. Es un buen resultado."], ["Alto", "8-10", "Claramente por encima de lo que el puesto exige."]],
    pot: [["Bajo", "1-4", "Recorrido limitado más allá de su rol actual."], ["Medio", "5-7", "Puede asumir más complejidad con el tiempo."], ["Alto", "8-10", "Preparado para roles claramente mayores."]]
  };
  const POPREF = {
    perf: "En un equipo típico la mayoría se sitúa en la banda media: hacer bien el trabajo que pide el puesto es un buen resultado, no un aprobado justo. La banda alta corresponde aproximadamente al 20 % superior de la compañía.",
    pot: "El potencial alto no premia el buen desempeño: describe capacidad de crecer hacia un rol distinto. En la mayoría de los equipos afecta a una o dos personas como mucho."
  };
  const COMPS = [
    ["Ejecución y resultados", "Orientación a resultados", "Se enfoca en objetivos y prioridades buscando impacto real en el negocio, con equilibrio entre calidad, eficiencia y ejecución.", "Impacto en resultados de negocio", "Stretch Assignment"],
    ["Ejecución y resultados", "Priorización y organización", "Gestiona tareas, tiempos y recursos con eficiencia. Diferencia urgencias de prioridades y mantiene control sobre la carga de trabajo.", "Priorización y gestión de la carga", "Coaching"],
    ["Ejecución y resultados", "Fiabilidad y compromiso", "Cumple plazos y estándares, hace seguimiento hasta el final y sostiene el esfuerzo e implicación en el tiempo.", "Fiabilidad en la entrega", "Coaching"],
    ["Relación e influencia", "Comunicación", "Claridad, concisión y adaptación del mensaje al interlocutor. Escucha, sintetiza y traslada mensajes de forma efectiva.", "Comunicación e influencia", "Coaching"],
    ["Relación e influencia", "Negociación", "Prepara, argumenta y cierra acuerdos con clientes, proveedores o áreas internas defendiendo el valor y buscando sostenibilidad de la relación.", "Capacidad de negociación", "Formación"],
    ["Relación e influencia", "Liderazgo e influencia", "Genera confianza, es ejemplo y moviliza personas o proyectos desde el conocimiento y la credibilidad, tenga o no equipo a cargo.", "Liderazgo e influencia", "Mentoring"],
    ["Relación e influencia", "Colaboración transversal", "Trabaja con otras áreas y con la central. Consigue avanzar sin autoridad jerárquica y tiene en cuenta el impacto de su trabajo en el resto.", "Colaboración transversal", "Proyecto Transversal"],
    ["Pensamiento y negocio", "Capacidad analítica", "Lee datos, los interpreta y saca conclusiones. Estructura información y la convierte en mensajes útiles para el negocio.", "Capacidad analítica y uso del dato", "Formación"],
    ["Pensamiento y negocio", "Visión estratégica y de negocio", "Conecta decisiones con objetivos de negocio, anticipa impactos y riesgos, y prioriza por valor y contexto.", "Visión estratégica y de negocio", "Mentoring"],
    ["Pensamiento y negocio", "Orientación al cliente", "Entiende las necesidades del cliente interno o externo y actúa para ofrecer soluciones, valor y una buena experiencia.", "Orientación al cliente", "Proyecto Transversal"],
    ["Desarrollo y adaptación", "Iniciativa e innovación", "No espera: propone, simplifica y desafía el status quo. Actúa con autonomía y busca mejores formas de trabajar.", "Autonomía e iniciativa", "Stretch Assignment"],
    ["Desarrollo y adaptación", "Agilidad y adaptabilidad", "Responde con rapidez y eficacia ante cambios, nuevas prioridades o entornos exigentes, manteniendo la calidad.", "Adaptabilidad y agilidad", "Stretch Assignment"],
    ["Desarrollo y adaptación", "Aprendizaje y autocrítica", "Reconoce sus áreas de mejora y tiene voluntad real de evolucionar. Aprende de forma continua y se adapta a nuevas herramientas o contextos.", "Aprendizaje y autoconocimiento", "Mentoring"]
  ].map(([fam, n, def, obj, acc]) => ({ fam, n, def, obj, acc }));
  const comp = n => COMPS.find(c => c.n === n);
  const OBJ_EXTRA = ["Preparación para promoción", "Preparación para movilidad horizontal", "Gestión de equipos futura", "Desarrollo internacional", "Visibilidad organizacional", "Consolidación en el rol actual"];
  const OBJETIVOS = [...new Set(COMPS.map(c => c.obj))].concat(OBJ_EXTRA);
  const ACCIONES = [
    ["Formación", "Cursos o formación reglada para adquirir un conocimiento concreto. Es la opción cuando la brecha es de conocimiento, no de experiencia."],
    ["Coaching", "Acompañamiento individual para desarrollar comportamiento, liderazgo o gestión emocional. Trabaja el cómo, no el qué."],
    ["Mentoring", "Alguien con más experiencia guía a la persona, comparte criterio y le abre perspectiva. Ideal para transmitir conocimiento del negocio."],
    ["Proyecto Transversal", "Participar en un proyecto que cruza áreas. Desarrolla visión global y relaciones fuera del equipo propio."],
    ["Stretch Assignment", "Una asignación por encima de su nivel actual, que la saca de su zona de confort para acelerar el crecimiento."],
    ["Movilidad Interna", "Cambio a otro puesto o área dentro de la compañía para ampliar experiencia o dar un paso de carrera."],
    ["Movilidad Internacional", "Asignación en otro país. Desarrolla adaptabilidad y visión global."]];
  const PLAZOS = ["3 meses", "6 meses", "12 meses", "12 meses +"];
  const PRIOS = ["Baja", "Media", "Alta"];
  const PRESUP = ["No requiere", "Requiere presupuesto"];
  const READY = ["Inmediata", "6-12 meses", "1-2 años", "3+ años"];
  const PROMO = ["Sí, de promoción", "Sí, de movimiento horizontal", "Sí, de ambas", "No de momento"];
  const AMBICION = [
    ["Acelerar: busca dar un salto", "Busca activamente nuevos desafíos. Fuerte motivación por ampliar su impacto y asumir responsabilidades superiores. Dispuesto a salir de su zona de confort; suele mostrar interés por promociones, movilidad o proyectos estratégicos."],
    ["Crecer de forma progresiva", "Quiere seguir creciendo de forma progresiva, ampliando alcance y contribución, pero priorizando una construcción sólida de experiencia y credibilidad. Abierto a nuevos retos cuando se siente preparado."],
    ["Especializarse: referencia técnica", "Está motivado por profundizar conocimientos y convertirse en una referencia técnica o funcional. Aporta valor a través de su expertise; no busca necesariamente liderazgo jerárquico."],
    ["Consolidarse en el rol actual", "Enfocado en consolidar capacidades dentro de su posición actual. Su prioridad es ganar experiencia y fortalecer competencias antes de plantearse movimientos."],
    ["Estabilidad: sin cambios a corto plazo", "Prioriza la estabilidad y el equilibrio de sus responsabilidades. Prefiere mantener su nivel de contribución sin cambios significativos a corto plazo. No implica falta de compromiso."]];
  const CARRERA = ["Gestión de equipos", "Expertise técnico", "Ambos", "Aún no lo sé"];
  const NIVEL3 = ["Bajo", "Medio", "Alto"];
  const RIESGO = { "": "Probabilidad de que abandone la compañía a corto-medio plazo.",
    Bajo: "Poco probable que se marche: persona estable y alineada, sin señales de salida.",
    Medio: "Podría considerar otras oportunidades si se le presentan.",
    Alto: "Muy probable que se marche en los próximos 12 meses." };
  const IMPACTO = { "": "Consecuencia para la organización si se fuera: conocimiento, relaciones, continuidad.",
    Bajo: "Impacto inmediato bajo: hay sucesor disponible o el perfil es fácil de reemplazar en el mercado.",
    Medio: "Impacto moderado: puede no haber sucesor identificado; hasta 3 meses de perturbación.",
    Alto: "Impacto crítico en el negocio: difícil de reemplazar y sin sucesor inmediato; más de 6 meses de perturbación." };
  /* Un solo catálogo de 9-Box: nombre de la casilla, qué hacer y color.
     Índice = (banda de potencial − 1) × 3 + banda de desempeño − 1. */
  const SEG = [
    ["Riesgo / Bajo desempeño", "Actuar o reubicar", "b"],
    ["Contribuidor efectivo", "Sostener y reconocer", "b"],
    ["Experto de confianza", "Retener conocimiento", "m"],
    ["Rendimiento inconsistente", "Diagnosticar la causa", "b"],
    ["Profesional sólido", "Columna vertebral", "m"],
    ["Alto rendimiento", "Ampliar alcance", "g"],
    ["Dilema / Enigma", "Entender qué le frena", "m"],
    ["Futuro líder", "Preparar sucesión", "g"],
    ["Estrella", "Proteger y proyectar", "g"]];
  const band = v => (v >= 8 ? 3 : v >= 5 ? 2 : v >= 1 ? 1 : 0);
  const segIdx = (perf, pot) => (perf > 0 && pot > 0 ? (band(pot) - 1) * 3 + band(perf) - 1 : -1);
  const nivel = v => NIVEL3.indexOf(v);
  const riesgoCod = (r, i) => (nivel(r) < 0 || nivel(i) < 0 ? "" : "CBA"[nivel(r)] + nivel(i));
  const EVMIN = 30;
  const CIFRA = /\d|\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|trimestre|semestre|campa[ñn]a|navidad|rebajas)\b/i;
  const SENSIBLE = [
    ["salud o bajas", /\b(embaraz|matern|patern|baja m[ée]dica|de baja|ilt\b|incapacidad|enferm|depresi|ansiedad|tratamiento m[ée]dico|hospital)/i],
    ["situación familiar", /\b(hijos?\b|hija\b|familia|divorci|separad[oa]\b|concili|guarder)/i],
    ["edad", /\b(edad\b|a[ñn]os de edad|jubilaci|prejubil)/i],
    ["actividad sindical", /\b(sindicat|comit[eé] de empresa|huelga|afiliad)/i],
    ["origen, creencias u orientación", /\b(religi|creenc|ideolog|nacionalidad|extranjer|inmigra|orientaci[oó]n sexual)/i]];
  const sensibles = txt => SENSIBLE.filter(([, re]) => re.test(txt || "")).map(([n]) => n);
  const AMBITO = {
    oficina: {
      nombre: "Oficina", evaluador: "manager",
      categorias: ["Manager", "Técnico / Specialist", "Administrativo / Soporte"],
      esManager: cat => cat === "Manager",
      unidad: "Departamento",
      evidencia: {
        perf: "Un hecho concreto, con cifra y periodo: qué hizo, cuánto, cuándo y qué parte es atribuible a esta persona.",
        pot: "Una situación nueva, con fecha: cómo reaccionó y qué asumió sin que se lo pidieran.",
        siPerf: "«Cerró el ejercicio un 14 % por encima del objetivo de su cartera, con dos cuentas nuevas abiertas en el segundo trimestre.»",
        siPot: "«En marzo asumió la coordinación del proyecto de cierre contable cuando su responsable estuvo fuera, y lo entregó en plazo sin ayuda.»"
      }
    },
    retail: {
      nombre: "Retail", evaluador: "responsable",
      categorias: ["Store Manager", "Assistant Store Manager"],
      esManager: cat => cat === "Store Manager",
      unidad: "Tienda",
      evidencia: {
        perf: "Un hecho concreto de tienda, con cifra y periodo: ventas, conversión, ticket medio, inventario, equipo…",
        pot: "Una situación nueva en tienda, con fecha: cómo reaccionó y qué asumió sin que se lo pidieran.",
        siPerf: "«En el primer semestre la tienda vendió un 9 % por encima del objetivo y la conversión pasó del 21 % al 25 % tras reorganizar los turnos de fin de semana.»",
        siPot: "«En julio llevó la tienda tres semanas sola durante la ausencia del Store Manager: cerró el inventario sin desviaciones y formó a dos personas nuevas.»"
      }
    }
  };
  const ASI_NO = "«Muy buena profesional, siempre disponible y con muy buena actitud. Es un pilar del equipo.» — describe a la persona, pero no dice qué hizo, ni cuánto, ni cuándo.";
  const CALENDARIO = [["Evaluación", "Cada responsable valora a su equipo · hasta la fecha límite"], ["Calibración", "Sesión entre responsables y RR.HH."], ["Devolución", "RR.HH. comparte conclusiones con cada responsable"], ["Planes en marcha", "Arrancan las acciones de desarrollo"]];
  const COMO = [
    ["Abre a una persona", "En la columna de la izquierda tienes a tu equipo. Pulsa un nombre para abrir su ficha. El punto de color indica cuáles están ya listas."],
    ["Recorre los cuatro pasos", "Desempeño y potencial · Competencias · Futuro y riesgo · Plan de desarrollo. Cada paso se pone en verde al completarse, y puedes ir y volver cuando quieras."],
    ["Escribe hechos, no adjetivos", "«Cerró el año un 14 % por encima de objetivo» dice mucho más que «muy buen trabajo». Escribe solo sobre desempeño: nada de salud o bajas, familia, edad, actividad sindical u origen."],
    ["Si alguien lleva poco tiempo", "Márcalo como «No evaluable en este ciclo» y escribe el motivo. Es mejor que poner una nota basada en seis meses de recorrido."],
    ["Se guarda solo", "Cada cambio se guarda al momento. Puedes dejarlo a medias y volver con el mismo código desde cualquier dispositivo."],
    ["Envía a RR.HH.", "Con las fichas listas, pulsa «Enviar a RR.HH.». Hasta entonces RR.HH. no las ve. Después puedes seguir corrigiendo mientras el ciclo esté abierto."]];
  const FAQ = [
    ["¿Diferencia entre desempeño y potencial?", "El desempeño es lo que la persona ha entregado en los últimos 12 meses en su puesto actual. El potencial es su capacidad de crecer hacia un rol distinto o mayor. Alguien puede rendir muy bien y no querer o no poder cambiar de rol, y al revés."],
    ["¿Por qué primero la banda y luego el número?", "Elegir primero bajo, medio o alto obliga a decidir lo importante. El número afina dentro de la banda y sirve para la calibración."],
    ["¿Un 5 es mala nota?", "No. 5 es cumplir el estándar del puesto, que es un buen resultado. La mayoría de un equipo típico está entre 5 y 7."],
    ["¿Por qué se justifica a partir de 8?", "Porque la banda alta tiene que poder sostenerse en la calibración con un hecho que la distinga de hacer bien el trabajo."],
    ["¿Qué escribo en «qué será distinto»?", "Un resultado observable al terminar el plan: algo que la persona hará y hoy no hace. Sin eso, en el próximo ciclo no se podrá saber si el plan funcionó."],
    ["¿Qué hago si alguien acaba de incorporarse?", "Márcalo como «No evaluable en este ciclo» y escribe el motivo."],
    ["¿Qué puedo escribir en los campos de texto?", "Solo hechos profesionales observables. Nada de salud o bajas, familia, edad, actividad sindical, origen, creencias u orientación. La herramienta avisa si detecta algo así."],
    ["¿La criticidad es del puesto o de la persona?", "Del puesto: lo que pasaría con la operativa, los clientes o las ventas si mañana quedara vacío."],
    ["¿Por qué no se pide sucesor para todos?", "Solo se pide en puestos críticos o de mando, que es donde un relevo sin preparar hace daño."],
    ["¿Es obligatorio el plan B?", "No. Es mejor un plan bien hecho que dos a medias."],
    ["¿Por qué el mapa sale al final?", "Para que valores a cada persona por lo que has observado, no por dónde la coloca la rejilla."],
    ["¿Por qué me avisa de mi distribución?", "No es una cuota. Es una señal para comprobar que la escala se está usando entera."],
    ["¿Hay que haberlo hablado con la persona?", "No es obligatorio, pero se registra. Lo que no vale es darlo por hablado sin haberlo hecho."]];
  const GUARDARRAIL = [["Alto", 20, "#2C6A4A"], ["Medio", 70, "#A8791F"], ["Bajo", 10, "#9C3B48"]];
  return { PERF, POT, BANDAS, POPREF, COMPS, comp, OBJETIVOS, ACCIONES, PLAZOS, PRIOS, PRESUP, READY, PROMO, AMBICION, CARRERA,
    NIVEL3, RIESGO, IMPACTO, SEG, band, segIdx, nivel, riesgoCod, EVMIN, CIFRA, sensibles, AMBITO, ASI_NO, CALENDARIO, COMO, FAQ, GUARDARRAIL };
})();

/* ---------- Reglas comunes a la ficha y al panel ---------- */
const TR = {
  vacio() {
    return { noEval: false, noEvalWhy: "", perf: 0, pot: 0, evP: "", evO: "", justP: "", justO: "", star: "", str: [], imp: [],
      promo: "", promoPos: "", promoRdy: "", horizPos: "", horizRdy: "", carrera: "", ambicion: "",
      critRole: "", riesgo: "", impacto: "", retencion: "", sucExiste: "", sucQuien: "", sucRdy: "",
      objA: "", accA: "", timA: "", priA: "", resA: "", budA: "", objB: "", accB: "", timB: "", priB: "", resB: "", budB: "",
      talked: "", talkedDate: "", baja: false, bajaMotivo: "", bajaFecha: "", note: "" };
  },
  d(p) { return Object.assign(TR.vacio(), p.datos || {}); },
  hot: e => e.riesgo === "Alto" && e.impacto === "Alto",
  necesitaSucesor: (e, p, amb) => e.critRole === "Alto" || TRC.AMBITO[amb].esManager(p.categoria),
  tocada(e) { const v = TR.vacio(); return Object.keys(v).some(k => JSON.stringify(e[k]) !== JSON.stringify(v[k])); },
  faltan(e) {
    if (e.baja) return [];
    if (e.noEval) return (e.noEvalWhy || "").trim() ? [] : ["el motivo de no evaluable"];
    const f = [], ev = (s, n) => { const x = (s || "").trim(); if (!x) f.push(`las evidencias de ${n}`); else if (x.length < TRC.EVMIN) f.push(`una evidencia de ${n} más detallada (al menos una frase)`); };
    if (!(e.perf > 0 && e.pot > 0)) f.push("desempeño y potencial");
    ev(e.evP, "desempeño"); ev(e.evO, "potencial");
    if (e.perf >= 8 && !(e.justP || "").trim()) f.push("la justificación del desempeño alto");
    if (e.pot >= 8 && !(e.justO || "").trim()) f.push("la justificación del potencial alto");
    if (!e.star) f.push("la competencia estrella");
    if (!(e.str || []).length) f.push("al menos un punto fuerte");
    if (!(e.imp || []).length) f.push("al menos un área de mejora");
    if (!e.promo) f.push("promoción / movimiento horizontal");
    if (!e.critRole) f.push("criticidad del puesto");
    if (!e.riesgo) f.push("riesgo de salida");
    if (!e.impacto) f.push("impacto de salida");
    if (TR.hot(e) && !(e.retencion || "").trim()) f.push("la acción de retención");
    if (!(e.objA && e.accA && e.timA && e.priA)) f.push("el plan A completo");
    if (!(e.resA || "").trim()) f.push("qué será distinto (plan A)");
    if (!e.talked) f.push("si lo has hablado con la persona");
    return f;
  },
  pasoHecho(e, paso) {
    if (e.noEval) return !!(e.noEvalWhy || "").trim();
    const f = TR.faltan(e), tiene = arr => arr.some(x => f.includes(x) || f.some(y => y.startsWith(x)));
    const P = {
      perf: ["desempeño y potencial", "las evidencias de", "una evidencia de", "la justificación del"],
      comp: ["la competencia estrella", "al menos un punto fuerte", "al menos un área de mejora"],
      fut: ["promoción / movimiento horizontal", "criticidad del puesto", "riesgo de salida", "impacto de salida", "la acción de retención"],
      plan: ["el plan A completo", "qué será distinto (plan A)", "si lo has hablado con la persona"] };
    return !tiene(P[paso]);
  },
  completa: e => TR.faltan(e).length === 0,
  apellidos: n => String(n || "").split(",")[0].trim()
};
