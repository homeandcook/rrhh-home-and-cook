/* =====================================================================
   Pippole · Pruebas de capacidad (0.39.0) · motor de los minijuegos

   Siete pruebas originales. Cada una se monta en un contenedor y, al
   terminar, llama a fin(resultado) con:
     { id, score (0 a 1), kpis: [[etiqueta, valor, detalle]], tabla: {cab, filas} | null,
       nota, datos: {…lo que hace falta para auditar el cálculo} }
   Los niveles se generan con una semilla: cada persona recibe una versión
   distinta y la semilla queda guardada.

   Sin baremo: las puntuaciones solo sirven para comparar dentro de una misma
   campaña y nunca para decidir solas. La validación (piloto, baremos,
   estudio de sesgos) está pendiente y la tiene que acompañar un psicólogo.
   ===================================================================== */

function capRng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function capNf(x, d = 0) { try { return new Intl.NumberFormat("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }).format(x); } catch (e) { return new Intl.NumberFormat("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }).format(x); } }
function capMmss(ms) { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
const capEspera = ms => new Promise(r => setTimeout(r, ms));
const capMed = xs => { if (!xs.length) return null; const a = xs.slice().sort((p, q) => p - q), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const capMedia = xs => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
const capR3 = x => Math.round(x * 1000) / 1000;
/* Una sola tecla activa a la vez: la prueba en marcha la registra y la quita al terminar. */
const CAP_NOTAS = {
  ruta: "Quien planifica suele tardar más en el primer movimiento y menos en total. Mover rápido y reiniciar mucho indica ensayo y error.",
  memoria: "La interrupción importa: recordar mucho fallando el par o impar indica que se ignora la segunda tarea. En el puesto, eso es atender a un cliente sin perder lo que se estaba haciendo.",
  clasificador: "La puntuación pesa un 70 % los aciertos y un 30 % la rapidez. El coste del cambio mide la flexibilidad: cuanto menor, mejor se adapta a una regla nueva.",
  patrones: "Razonamiento abstracto: descubrir reglas nuevas sin conocimientos previos. Es de las capacidades que mejor predicen el aprendizaje en puestos complejos.",
  caja: "Cálculo aplicado al día a día de caja: cambio, descuentos, promociones y totales.",
  caso: "La trampa del caso: la ubicación con más ventas no es la de más beneficio, y el coste de personal solo está en la segunda pestaña.",
  bandeja: "La clave ordena por impacto y urgencia, y a igualdad, lo que lleva menos tiempo. Es una clave de demostración: en una versión real la fijan responsables del puesto."
};
const CAPK = { fn: null };
document.addEventListener("keydown", e => { if (CAPK.fn && !e.altKey && !e.ctrlKey && !e.metaKey) CAPK.fn(e); });
function capTeclas(fn) { CAPK.fn = fn; }

/* ---------------------------------------------------------------
   1 · Ruta de reposición (planificación)
   --------------------------------------------------------------- */
function capSlide(g, n, p, d) {
  let [x, y] = p;
  for (;;) { const nx = x + d[0], ny = y + d[1]; if (nx < 0 || ny < 0 || nx >= n || ny >= n || g[ny][nx]) break; x = nx; y = ny; }
  return [x, y];
}
function capBfs(g, n, s) {
  const D = new Map([[s.join(), 0]]), q = [s];
  while (q.length) { const p = q.shift(); for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r = capSlide(g, n, p, d), k = r.join(); if (!D.has(k)) { D.set(k, D.get(p.join()) + 1); q.push(r); } } }
  return D;
}
function capNivelRuta(n, min, r) {
  for (let i = 0; i < 6000; i++) {
    const g = Array.from({ length: n }, () => Array.from({ length: n }, () => r() < 0.2 ? 1 : 0));
    const libres = []; g.forEach((f, y) => f.forEach((v, x) => { if (!v) libres.push([x, y]); }));
    const s = libres[Math.floor(r() * libres.length)], D = capBfs(g, n, s);
    const cand = [...D].filter(([, v]) => v >= min && v <= min + 1);
    if (!cand.length) continue;
    const [k, v] = cand[Math.floor(r() * cand.length)];
    return { n, g, s, goal: k.split(",").map(Number), opt: v };
  }
  throw new Error("No se ha podido generar el nivel");
}
const CAP_CAJAS = ["#F0B35A", "#8B77F3", "#5FB3A8", "#E07A5F", "#C9C2DE"];
function capEstanteria(x, y, c) {
  const h = (x * 7 + y * 13) % 5, X = x * c, Y = y * c;
  let s = `<rect x="${X + .7}" y="${Y + 1.6}" width="${c - 1.4}" height="${c - 1.4}" rx="1.4" fill="var(--cap-shelf2)"/><rect x="${X + .7}" y="${Y + .5}" width="${c - 1.4}" height="${c - 2.4}" rx="1.4" fill="var(--cap-shelf)"/>`;
  [[1.6, 1.4, 3, 2.6], [5, 1.4, 3.2, 2.6], [1.6, 4.6, 2.4, 2.6], [4.6, 4.6, 3.6, 2.6]].forEach(([a, b, w, hh], k) => {
    if ((h + k) % 3 === 2) return;
    s += `<rect x="${X + a}" y="${Y + b}" width="${w}" height="${hh}" rx=".5" fill="${CAP_CAJAS[(h + k) % 5]}"/><rect x="${X + a}" y="${Y + b}" width="${w}" height=".6" rx=".3" fill="#fff" opacity=".35"/>`;
  });
  return s;
}
function capMontarRuta(el, op, fin) {
  const NIV = op.niveles || [[6, 3], [7, 4], [7, 5], [8, 6], [8, 7]];
  const G = { niv: 0, lv: null, pos: null, mov: 0, rei: 0, t0: 0, prim: 0, log: [], anim: false, on: true, semilla: op.semilla };
  el.innerHTML = `<div class="cap-juego"><div class="cap-escena"><div class="cap-tablero" data-c="tab"></div><div class="cap-aviso" data-c="av" hidden></div></div>
    <div class="cap-lado"><div class="cap-chips"><span class="cap-chip">Nivel <b data-c="niv">1</b> de ${NIV.length}</span><span class="cap-chip">Movimientos <b data-c="mov">0</b></span><span class="cap-chip">Mínimo <b data-c="opt">–</b></span></div>
      <div class="cap-pips" data-c="pips" aria-hidden="true"></div>
      <div class="cap-flechas" aria-label="Mover el carro">
        <span></span><button class="btn" data-d="0,-1" aria-label="Arriba">${capFlecha("M12 19V5M5 12l7-7 7 7")}</button><span></span>
        <button class="btn" data-d="-1,0" aria-label="Izquierda">${capFlecha("M19 12H5M12 19l-7-7 7-7")}</button><button class="btn" data-d="0,1" aria-label="Abajo">${capFlecha("M12 5v14M19 12l-7 7-7-7")}</button><button class="btn" data-d="1,0" aria-label="Derecha">${capFlecha("M5 12h14M12 5l7 7-7 7")}</button>
      </div>
      <button class="btn" data-c="rei">Reiniciar nivel</button>
      <p class="cap-ayuda">Flechas del teclado, los botones o deslizando el dedo sobre el almacén.</p></div></div>`;
  const q = k => el.querySelector(`[data-c="${k}"]`);
  const pintar = () => {
    const L = G.lv, n = L.n, c = 10;
    let h = `<svg viewBox="-2 -2 ${n * c + 4} ${n * c + 4}" role="img" aria-label="Almacén de ${n} por ${n} casillas"><rect x="-2" y="-2" width="${n * c + 4}" height="${n * c + 4}" rx="4" fill="var(--cap-wall)"/>`;
    L.g.forEach((f, y) => f.forEach((v, x) => { if (!v) h += `<rect x="${x * c + .3}" y="${y * c + .3}" width="${c - .6}" height="${c - .6}" rx=".8" fill="${(x + y) % 2 ? "var(--cap-floor)" : "var(--cap-floor2)"}"/>`; }));
    const [gx, gy] = L.goal;
    h += `<g transform="translate(${gx * c + 5} ${gy * c + 5})"><circle class="cap-pulso" r="4.4" fill="none" stroke="var(--cap-gold)" stroke-width=".6"/><circle r="3.4" fill="var(--cap-gold)" opacity=".18"/><circle r="3.4" fill="none" stroke="var(--cap-gold)" stroke-width=".7" stroke-dasharray="1.2 .8"/><circle r="1.3" fill="var(--cap-gold)"/></g>`;
    L.g.forEach((f, y) => f.forEach((v, x) => { if (v) h += capEstanteria(x, y, c); }));
    h += `<g data-c="estelas"></g><g class="cap-carro" data-c="carro" style="transform:translate(${G.pos[0] * c}px,${G.pos[1] * c}px)"><ellipse cx="5" cy="8.6" rx="3.6" ry=".9" fill="#000" opacity=".25"/><rect x="1.9" y="2.2" width="6.2" height="5.6" rx="1.4" fill="var(--cap-accd)"/><rect x="1.9" y="1.6" width="6.2" height="5.2" rx="1.4" fill="var(--red)"/><rect x="2.8" y="2.5" width="4.4" height="1.6" rx=".6" fill="#fff" opacity=".55"/><circle cx="3.3" cy="8.1" r=".85" fill="var(--cap-wall)"/><circle cx="6.7" cy="8.1" r=".85" fill="var(--cap-wall)"/></g></svg>`;
    q("tab").innerHTML = h;
    q("niv").textContent = G.niv + 1; q("mov").textContent = G.mov; q("opt").textContent = L.opt;
    q("pips").innerHTML = NIV.map((_, i) => `<span class="cap-pip ${i < G.log.length ? "ok" : i === G.niv ? "act" : ""}"></span>`).join("");
  };
  const cargar = () => {
    const [n, min] = NIV[G.niv];
    G.lv = capNivelRuta(n, min, capRng(G.semilla + G.niv * 977)); G.pos = G.lv.s.slice(); G.mov = 0; G.rei = 0; G.t0 = performance.now(); G.prim = 0; G.movs = [];
    pintar();
  };
  const mover = d => {
    if (!G.on || G.anim) return;
    const L = G.lv, p = capSlide(L.g, L.n, G.pos, d);
    if (p[0] === G.pos[0] && p[1] === G.pos[1]) { capSon("ko"); return; }
    if (!G.prim) G.prim = performance.now() - G.t0;
    const dist = Math.abs(p[0] - G.pos[0]) + Math.abs(p[1] - G.pos[1]), dur = Math.min(90 * dist, 450);
    q("estelas").insertAdjacentHTML("beforeend", `<line class="cap-estela" x1="${G.pos[0] * 10 + 5}" y1="${G.pos[1] * 10 + 5}" x2="${p[0] * 10 + 5}" y2="${p[1] * 10 + 5}" stroke="var(--red)" stroke-width="2.2" stroke-linecap="round"/>`);
    G.pos = p; G.mov++; G.movs.push(d.join(",")); G.anim = true; capSon("tic");
    const car = q("carro"); car.style.setProperty("--dur", dur + "ms"); car.style.transform = `translate(${p[0] * 10}px,${p[1] * 10}px)`;
    q("mov").textContent = G.mov;
    setTimeout(async () => {
      if (!(p[0] === L.goal[0] && p[1] === L.goal[1])) { G.anim = false; return; }
      G.log.push({ opt: L.opt, mov: G.mov, rei: G.rei, t: Math.round(performance.now() - G.t0), prim: Math.round(G.prim), movs: G.movs });
      capSon("ok");
      const av = q("av"); av.innerHTML = `<div><b>Nivel ${G.niv + 1} completado</b><small>${G.mov === L.opt ? `${G.mov} movimientos: el mínimo posible` : `${G.mov} movimientos (mínimo ${L.opt})`}</small></div>`; av.hidden = false;
      await capEspera(1000); av.hidden = true; G.anim = false; G.niv++;
      if (G.niv < NIV.length) cargar(); else terminar();
    }, dur + 40);
  };
  const terminar = () => {
    G.on = false; capTeclas(null);
    const ef = capMedia(G.log.map(x => x.opt / x.mov)), perf = G.log.filter(x => x.mov === x.opt).length;
    const prim = capMedia(G.log.map(x => x.prim)), tot = G.log.reduce((s, x) => s + x.t, 0), rei = G.log.reduce((s, x) => s + x.rei, 0);
    fin({ id: "ruta", score: capR3(ef),
      kpis: [["Eficiencia", capNf(ef * 100) + " %", "mínimo ÷ movimientos"], ["Niveles al mínimo", `${perf} de ${NIV.length}`], ["Pensado antes de mover", capNf(prim / 1000, 1) + " s", "media por nivel"], ["Reinicios", String(rei)], ["Tiempo total", capMmss(tot)]],
      tabla: { cab: ["Nivel", "Mínimo", "Movimientos", "Reinicios", "Primer movimiento", "Tiempo"], filas: G.log.map((x, i) => [i + 1, x.opt, x.mov, x.rei, capNf(x.prim / 1000, 1) + " s", capMmss(x.t)]) },
      nota: CAP_NOTAS.ruta,
      datos: { semilla: G.semilla, niveles: G.log } });
  };
  el.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => mover(b.dataset.d.split(",").map(Number))));
  q("rei").addEventListener("click", () => { if (!G.on || G.anim) return; G.pos = G.lv.s.slice(); G.mov = 0; G.movs = []; G.rei++; pintar(); });
  capTeclas(e => { const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key]; if (m) { e.preventDefault(); mover(m); } });
  let sw = null;
  q("tab").addEventListener("pointerdown", e => { sw = [e.clientX, e.clientY]; });
  q("tab").addEventListener("pointerup", e => {
    if (!sw) return; const dx = e.clientX - sw[0], dy = e.clientY - sw[1]; sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    mover(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
  });
  cargar();
  return { mover, estado: () => G };
}
function capFlecha(d) { return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`; }

/* ---------------------------------------------------------------
   2 · Memoria con interrupciones (memoria de trabajo)
   --------------------------------------------------------------- */
function capMontarMemoria(el, op, fin) {
  const r = capRng(op.semilla), X = op.extra || 1;
  const G = { span: 3, fallos: 0, intento: 0, seq: [], resp: [], d: [], tRec: [], fase: "", max: 0, hist: [], ensayos: [] };
  el.innerHTML = `<div class="cap-juego"><div class="cap-senales" data-c="zona"><div class="cap-rejilla bloq" data-c="rej">${Array.from({ length: 16 }, (_, i) => `<button class="cap-cel" data-i="${i}" aria-label="Señal ${i + 1}"></button>`).join("")}</div></div>
    <div class="cap-lado"><div class="cap-chips"><span class="cap-chip">Secuencia de <b data-c="span">3</b></span><span class="cap-chip">Ensayo <b data-c="int">–</b></span></div>
      <div class="cap-caja"><b>Ahora</b><p data-c="msg" aria-live="polite">Prepárate.</p></div><div class="cap-pips" data-c="pips" aria-hidden="true"></div></div></div>`;
  const q = k => el.querySelector(`[data-c="${k}"]`), cels = [...el.querySelectorAll(".cap-cel")], msg = t => { q("msg").textContent = t; };
  const ensayo = async () => {
    if (!el.isConnected) return; // se cerró la vista previa: la prueba se para
    G.intento++; q("span").textContent = G.span; q("int").textContent = G.intento;
    const s = []; while (s.length < G.span) { const c = Math.floor(r() * 16); if (!s.includes(c)) s.push(c); }
    G.seq = s; G.resp = []; G.fase = "ver"; q("rej").classList.add("bloq"); msg("Observa el orden.");
    await capEspera(600);
    for (const c of s) { cels[c].classList.add("on"); capSon("nota", c); await capEspera(650); cels[c].classList.remove("on"); await capEspera(250); }
    if (!el.isConnected) return;
    G.fase = "distr"; const n = 10 + Math.floor(r() * 90), t0 = performance.now(), lim = 3000 * X, C = 2 * Math.PI * 26;
    const dv = document.createElement("div"); dv.className = "cap-distr";
    dv.innerHTML = `<span class="lbl">¿Es par?</span><span class="num">${n}</span><div class="cap-fila"><button class="btn" data-par="1">Par</button><button class="btn" data-par="0">Impar</button></div><svg class="cap-reloj" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="#3A3156" stroke-width="6"/><circle class="rel" cx="32" cy="32" r="26" fill="none" stroke="#8B77F3" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 32 32)"/></svg>`;
    q("zona").appendChild(dv); msg("Responde rápido: ¿par o impar? (teclas P o I)");
    try { dv.querySelector(".rel").animate([{ strokeDashoffset: 0 }, { strokeDashoffset: C }], { duration: lim, fill: "forwards" }); } catch (e) {}
    const resp = await new Promise(res => {
      const to = setTimeout(() => res(null), lim);
      const elegir = v => { clearTimeout(to); capTeclas(null); res(v); };
      dv.querySelectorAll("[data-par]").forEach(b => b.addEventListener("click", () => elegir(b.dataset.par === "1")));
      capTeclas(e => { const k = e.key.toLowerCase(); if (k === "p") elegir(true); if (k === "i") elegir(false); });
    });
    if (!el.isConnected) return;
    capTeclas(null);
    const okD = resp === (n % 2 === 0); G.d.push({ ok: okD, t: Math.round(performance.now() - t0), sin: resp === null });
    capSon(okD ? "tic" : "ko"); dv.remove();
    G.fase = "rec"; G.tr0 = performance.now(); q("rej").classList.remove("bloq"); msg(`Ahora pulsa las ${G.span} señales en el mismo orden.`);
  };
  cels.forEach(b => b.addEventListener("click", async () => {
    if (G.fase !== "rec") return;
    const i = +b.dataset.i, k = G.resp.length; G.resp.push(i);
    const bien = G.seq[k] === i; b.classList.add(bien ? "ok" : "ko"); capSon(bien ? "nota" : "ko", i);
    setTimeout(() => b.classList.remove("ok", "ko"), 320);
    if (!bien || G.resp.length === G.seq.length) {
      G.fase = ""; q("rej").classList.add("bloq"); G.tRec.push((performance.now() - G.tr0) / G.resp.length);
      G.hist.push(bien); G.ensayos.push({ span: G.span, ok: bien });
      q("pips").innerHTML = G.hist.map(x => `<span class="cap-pip ${x ? "ok" : "ko"}"></span>`).join("");
      if (bien) { G.max = G.span; G.span++; G.fallos = 0; capSon("ok"); msg("Correcto. La siguiente es más larga."); }
      else { G.fallos++; msg(G.fallos >= 2 ? "Fin de la prueba." : "No era ese orden. Otra con la misma longitud."); }
      await capEspera(1000);
      if (G.fallos >= 2 || G.span > 9) terminar(); else ensayo();
    }
  }));
  const terminar = () => {
    const dAcc = G.d.filter(x => x.ok).length / G.d.length, dT = capMedia(G.d.map(x => x.t)), rec = capMedia(G.tRec);
    // Puntuación: secuencia recordada (de 2 a 9) ajustada por cómo se atendió la interrupción.
    const score = Math.max(0, Math.min(1, (G.max - 2) / 7)) * (0.75 + 0.25 * dAcc);
    fin({ id: "memoria", score: capR3(score),
      kpis: [["Señales recordadas", String(G.max), "secuencia más larga sin error"], ["Par o impar bien", capNf(dAcc * 100) + " %", "la interrupción"], ["Tiempo en la interrupción", capNf(dT / 1000, 1) + " s"], ["Ritmo al recordar", capNf(rec / 1000, 1) + " s", "por señal"], ["Ensayos", String(G.intento)]],
      tabla: null,
      nota: CAP_NOTAS.memoria,
      datos: { semilla: op.semilla, ensayos: G.ensayos, interrupciones: G.d } });
  };
  setTimeout(ensayo, 400);
  return { estado: () => G };
}

/* ---------------------------------------------------------------
   3 · Clasificador (cambio de tarea y atención)
   --------------------------------------------------------------- */
function capMontarClasificador(el, op, fin) {
  const r = capRng(op.semilla), X = op.extra || 1, N = op.n || 40, NP = op.practica == null ? 6 : op.practica;
  const ensayos = [];
  let regla = r() < .5 ? "forma" : "color";
  for (let i = 0; i < NP + N; i++) {
    if (i > 0 && r() < .35) regla = regla === "forma" ? "color" : "forma";
    ensayos.push({ regla, forma: r() < .5 ? "circulo" : "cuadrado", color: r() < .5 ? "violeta" : "ambar", prac: i < NP });
  }
  const lado = e => (e.regla === "forma" ? (e.forma === "circulo" ? "izq" : "der") : (e.color === "violeta" ? "izq" : "der"));
  el.innerHTML = `<div class="cap-clas">
    <div class="cap-chips"><span class="cap-chip" data-c="fase">Práctica</span><span class="cap-chip">Ensayo <b data-c="n">0</b> de <span data-c="tot">${NP}</span></span></div>
    <div class="cap-clas-esc" data-c="esc"><div class="cap-regla" data-c="regla">Prepárate</div><div class="cap-est" data-c="est"></div><p class="cap-fb" data-c="fb" aria-live="polite"></p></div>
    <div class="cap-clas-bot">
      <button class="cap-resp" data-l="izq"><b>Izquierda</b><span>${capFig("circulo", "gris", 18)} círculo</span><span>${capFig("cuadrado", "violeta", 18)} violeta</span><small>tecla F o ←</small></button>
      <button class="cap-resp" data-l="der"><b>Derecha</b><span>${capFig("cuadrado", "gris", 18)} cuadrado</span><span>${capFig("cuadrado", "ambar", 18)} ámbar</span><small>tecla J o →</small></button>
    </div></div>`;
  const q = k => el.querySelector(`[data-c="${k}"]`);
  let k = -1, t0 = 0, esperando = false, to = null;
  const log = [];
  const sig = async () => {
    if (!el.isConnected) return;
    k++;
    if (k === NP) { q("fase").textContent = "Prueba"; q("tot").textContent = N; q("regla").textContent = "Ahora cuenta"; q("est").innerHTML = ""; q("fb").textContent = "Sin avisos de acierto a partir de aquí."; await capEspera(1800); }
    if (k >= ensayos.length) return terminar();
    const e = ensayos[k];
    q("n").textContent = e.prac ? k + 1 : k - NP + 1;
    q("regla").textContent = e.regla === "forma" ? "FORMA" : "COLOR"; q("regla").className = "cap-regla " + e.regla;
    q("est").innerHTML = ""; q("fb").textContent = "";
    await capEspera(350);
    if (!el.isConnected) return;
    q("est").innerHTML = capFig(e.forma, e.color, 96); t0 = performance.now(); esperando = true;
    to = setTimeout(() => responder(null), 2500 * X);
  };
  const responder = async l => {
    if (!esperando) return; esperando = false; clearTimeout(to);
    const e = ensayos[k], rt = performance.now() - t0, ok = l === lado(e);
    const prev = k > 0 ? ensayos[k - 1] : null;
    if (!e.prac) log.push({ regla: e.regla, cambio: !!prev && !prev.prac && prev.regla !== e.regla, ok, rt: Math.round(rt), sin: l === null });
    if (e.prac) { q("fb").textContent = l === null ? "Demasiado lento." : ok ? "Bien." : `No: con ${e.regla === "forma" ? "FORMA" : "COLOR"} iba a la ${lado(e) === "izq" ? "izquierda" : "derecha"}.`; capSon(ok ? "tic" : "ko"); await capEspera(ok ? 500 : 1400); }
    else { capSon("tic"); el.querySelector(".cap-clas-esc").classList.add("flash"); await capEspera(150); el.querySelector(".cap-clas-esc").classList.remove("flash"); }
    sig();
  };
  el.querySelectorAll(".cap-resp").forEach(b => b.addEventListener("click", () => responder(b.dataset.l)));
  capTeclas(e => { const m = { f: "izq", F: "izq", ArrowLeft: "izq", j: "der", J: "der", ArrowRight: "der" }[e.key]; if (m) { e.preventDefault(); responder(m); } });
  const terminar = () => {
    capTeclas(null);
    const acc = log.filter(x => x.ok).length / log.length;
    const rep = capMed(log.filter(x => x.ok && !x.cambio).map(x => x.rt)), cam = capMed(log.filter(x => x.ok && x.cambio).map(x => x.rt)), med = capMed(log.filter(x => x.ok).map(x => x.rt));
    const vel = med == null ? 0 : Math.max(0, Math.min(1, (1800 * X - med) / (1200 * X)));
    fin({ id: "clasificador", score: capR3(0.7 * acc + 0.3 * vel),
      kpis: [["Aciertos", capNf(acc * 100) + " %", `${log.filter(x => x.ok).length} de ${log.length}`], ["Tiempo de respuesta", med == null ? "–" : capNf(med) + " ms", "mediana de los aciertos"], ["Coste del cambio", rep == null || cam == null ? "–" : capNf(cam - rep) + " ms", "cuánto más tarda al cambiar de regla"], ["Sin responder", String(log.filter(x => x.sin).length)]],
      tabla: null,
      nota: CAP_NOTAS.clasificador,
      datos: { semilla: op.semilla, ensayos: log } });
  };
  setTimeout(sig, 600);
  return { responder, estado: () => ({ k, e: ensayos[k], lado: ensayos[k] ? lado(ensayos[k]) : null, esperando }) };
}
function capFig(forma, color, t) {
  const f = { violeta: "#7B63F0", ambar: "#E3A33A", gris: "var(--muted)" }[color];
  return `<svg width="${t}" height="${t}" viewBox="0 0 40 40" aria-hidden="true">${forma === "circulo" ? `<circle cx="20" cy="20" r="16" fill="${f}"/>` : `<rect x="5" y="5" width="30" height="30" rx="5" fill="${f}"/>`}</svg>`;
}

/* ---------------------------------------------------------------
   4 · Patrones (razonamiento abstracto con matrices)
   --------------------------------------------------------------- */
function capMatriz(r, dif) {
  const tipos = dif === 1 ? ["col", "fila"] : dif === 2 ? ["col", "fila", "latin"] : ["latin", "latin2", "col"];
  const atrs = ["forma", "num", "relleno"];
  const varian = atrs.slice().sort(() => r() - .5).slice(0, dif);
  const regla = {}; atrs.forEach(a => { regla[a] = varian.includes(a) ? { t: tipos[Math.floor(r() * tipos.length)], k: Math.floor(r() * 3) } : { t: "const", k: Math.floor(r() * 3) }; });
  const v = (a, f, c) => { const R = regla[a]; return R.t === "const" ? R.k : R.t === "col" ? (c + R.k) % 3 : R.t === "fila" ? (f + R.k) % 3 : R.t === "latin" ? (f + c + R.k) % 3 : (2 * f + c + R.k) % 3; };
  const celda = (f, c) => ({ forma: v("forma", f, c), num: v("num", f, c), relleno: v("relleno", f, c) });
  const celdas = []; for (let f = 0; f < 3; f++) for (let c = 0; c < 3; c++) celdas.push(celda(f, c));
  const ok = celdas[8], clave = x => `${x.forma}${x.num}${x.relleno}`, vistas = new Set([clave(ok)]), dis = [];
  const cambios = []; atrs.forEach(a => [1, 2].forEach(d => cambios.push([a, d])));
  cambios.sort(() => r() - .5).forEach(([a, d]) => { const x = Object.assign({}, ok, { [a]: (ok[a] + d) % 3 }); if (dis.length < 5 && !vistas.has(clave(x))) { vistas.add(clave(x)); dis.push(x); } });
  const ops = [ok, ...dis].sort(() => r() - .5);
  return { celdas, ops, correcta: ops.indexOf(ok), regla };
}
function capDibujo(x, t) {
  const pos = [[[20, 20]], [[12, 20], [28, 20]], [[9, 20], [20, 20], [31, 20]]][x.num], s = [12, 8.5, 6.5][x.num];
  const fill = ["none", "rgba(123,99,240,.38)", "#7B63F0"][x.relleno];
  const forma = (cx, cy) => x.forma === 0 ? `<circle cx="${cx}" cy="${cy}" r="${s}"/>` : x.forma === 1 ? `<rect x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" rx="1.5"/>` : `<path d="M${cx} ${cy - s}L${cx + s} ${cy + s * .85}H${cx - s}Z"/>`;
  return `<svg width="${t}" height="${t}" viewBox="0 0 40 40" aria-hidden="true"><g fill="${fill}" stroke="#7B63F0" stroke-width="1.8" stroke-linejoin="round">${pos.map(([a, b]) => forma(a, b)).join("")}</g></svg>`;
}
function capMontarPatrones(el, op, fin) {
  const r = capRng(op.semilla), X = op.extra || 1, DIF = op.dificultades || [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], LIM = (op.limite || 7 * 60000) * X;
  const items = DIF.map(d => capMatriz(r, d)), resp = [];
  let i = 0, t0 = performance.now(), ti = t0, reloj = null, acabado = false;
  el.innerHTML = `<div class="cap-pat"><div class="cap-chips"><span class="cap-chip">Patrón <b data-c="i">1</b> de ${items.length}</span><span class="cap-chip">Tiempo restante <b data-c="t">${capMmss(LIM)}</b></span></div>
    <div class="cap-pat-cuerpo"><div class="cap-matriz" data-c="m"></div><div><p class="cap-ayuda">¿Qué figura completa el hueco? Pulsa una opción (o las teclas 1 a 6).</p><div class="cap-ops" data-c="ops"></div><button class="btn ghost" data-c="saltar">Saltar</button></div></div></div>`;
  const q = k => el.querySelector(`[data-c="${k}"]`);
  const pintar = () => {
    const it = items[i]; q("i").textContent = i + 1;
    q("m").innerHTML = it.celdas.map((c, k) => k === 8 ? `<div class="cap-hueco">?</div>` : `<div>${capDibujo(c, 64)}</div>`).join("");
    q("ops").innerHTML = it.ops.map((o, k) => `<button class="cap-op" data-k="${k}" aria-label="Opción ${k + 1}"><small>${k + 1}</small>${capDibujo(o, 56)}</button>`).join("");
    q("ops").querySelectorAll(".cap-op").forEach(b => b.addEventListener("click", () => elegir(+b.dataset.k)));
    ti = performance.now();
  };
  const elegir = k => {
    if (acabado) return;
    resp.push({ dif: DIF[i], ok: k === items[i].correcta, k, t: Math.round(performance.now() - ti) });
    capSon("tic"); i++;
    if (i >= items.length) terminar(); else pintar();
  };
  q("saltar").addEventListener("click", () => elegir(null));
  capTeclas(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 6) { e.preventDefault(); elegir(n - 1); } });
  reloj = setInterval(() => { if (!el.isConnected) { clearInterval(reloj); return; } const rest = LIM - (performance.now() - t0); q("t").textContent = capMmss(Math.max(0, rest)); if (rest <= 0) terminar(true); }, 250);
  const terminar = porTiempo => {
    if (acabado) return; acabado = true; clearInterval(reloj); capTeclas(null);
    while (resp.length < items.length) resp.push({ dif: DIF[resp.length], ok: false, k: null, t: 0, sinTiempo: true });
    const ok = resp.filter(x => x.ok).length, pd = d => { const xs = resp.filter(x => x.dif === d); return `${xs.filter(x => x.ok).length} de ${xs.length}`; };
    fin({ id: "patrones", score: capR3(ok / items.length),
      kpis: [["Aciertos", `${ok} de ${items.length}`], ["Fáciles", pd(1)], ["Medios", pd(2)], ["Difíciles", pd(3)], ["Tiempo", capMmss(performance.now() - t0), porTiempo ? "se acabó el tiempo" : ""]],
      tabla: { cab: ["Patrón", "Dificultad", "Resultado", "Tiempo"], filas: resp.map((x, n) => [n + 1, ["", "Fácil", "Media", "Difícil"][x.dif], x.sinTiempo ? "Sin tiempo" : x.k === null ? "Saltado" : x.ok ? "Bien" : "Mal", x.t ? capNf(x.t / 1000, 1) + " s" : "–"]) },
      nota: CAP_NOTAS.patrones,
      datos: { semilla: op.semilla, respuestas: resp } });
  };
  pintar();
  return { elegir, estado: () => ({ i, it: items[i] }) };
}

/* ---------------------------------------------------------------
   5 · Caja rápida (cálculo aplicado)
   --------------------------------------------------------------- */
function capItemsCaja(r) {
  const p2 = x => Math.round(x * 100) / 100, prec = (a, b) => p2(a + r() * (b - a));
  const tipos = [
    () => { const p = prec(3, 48); const b = [5, 10, 20, 50, 100].find(x => x > p); return { t: `El cliente paga ${capNf(p, 2)} € con un billete de ${b} €. ¿Cuánto cambio le das?`, a: p2(b - p) }; },
    () => { const p = 20 + Math.floor(r() * 32) * 5, d = [10, 15, 20, 25, 30, 40][Math.floor(r() * 6)]; return { t: `Un artículo de ${capNf(p)} € tiene un ${d} % de descuento. ¿Cuánto paga el cliente?`, a: p2(p * (1 - d / 100)) }; },
    () => { const p = Math.floor(8 + r() * 50) + (r() < .5 ? .9 : .5); /* ×1,5 da siempre céntimos exactos */ return { t: `Promoción «la segunda unidad al 50 %». El cliente lleva dos unidades de ${capNf(p, 2)} €. ¿Cuánto paga?`, a: p2(p * 1.5) }; },
    () => { const a = prec(2, 30), b = prec(2, 30), c = prec(2, 30); return { t: `Cesta con tres artículos: ${capNf(a, 2)} €, ${capNf(b, 2)} € y ${capNf(c, 2)} €. ¿Cuál es el total?`, a: p2(a + b + c) }; }
  ];
  const orden = [0, 1, 3, 2, 0, 1, 3, 2, 1, 0, 2, 3];
  return orden.map(k => tipos[k]());
}
function capMontarCaja(el, op, fin) {
  const X = op.extra || 1, items = op.items || capItemsCaja(capRng(op.semilla)), LIM = 30000 * X, resp = [];
  let i = 0, ti = 0, to = null, tic = null;
  el.innerHTML = `<div class="cap-caja-j"><div class="cap-chips"><span class="cap-chip">Pregunta <b data-c="i">1</b> de ${items.length}</span></div>
    <div class="cap-ticket"><div class="cap-ticket-h">Caja 2 · ticket en curso</div><p data-c="t"></p>
      <form data-c="f" class="cap-campo" autocomplete="off"><label><span class="sr">Respuesta en euros</span><input data-c="in" inputmode="decimal" placeholder="0,00"></label><span>€</span><button class="btn primary" type="submit">Siguiente</button></form>
      <div class="cap-barra"><i data-c="bar"></i></div></div>
    <p class="cap-ayuda">Puedes usar papel. Escribe la cifra con coma o punto para los céntimos. Cada pregunta tiene ${capNf(LIM / 1000)} segundos.</p></div>`;
  const q = k => el.querySelector(`[data-c="${k}"]`);
  const pintar = () => {
    q("i").textContent = i + 1; q("t").textContent = items[i].t; q("in").value = ""; q("in").focus(); ti = performance.now();
    const bar = q("bar"); bar.style.transition = "none"; bar.style.width = "100%"; void bar.offsetWidth; bar.style.transition = `width ${LIM}ms linear`; bar.style.width = "0%";
    clearTimeout(to); to = setTimeout(() => siguiente(null), LIM);
  };
  const leer = v => { const s = String(v || "").replace(/[€\s]/g, ""); if (!s) return null; const n = parseFloat(/,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")); return isNaN(n) ? null : n; };
  const siguiente = v => {
    clearTimeout(to); if (!el.isConnected) return;
    const n = leer(v), ok = n != null && Math.abs(n - items[i].a) < 0.011;
    resp.push({ ok, n, a: items[i].a, t: Math.round(performance.now() - ti), sin: n == null });
    capSon(ok ? "tic" : "tic"); i++;
    if (i >= items.length) terminar(); else pintar();
  };
  q("f").addEventListener("submit", e => { e.preventDefault(); siguiente(q("in").value); });
  const terminar = () => {
    clearTimeout(to); clearInterval(tic);
    const ok = resp.filter(x => x.ok).length, tm = capMedia(resp.filter(x => !x.sin).map(x => x.t));
    fin({ id: "caja", score: capR3(ok / items.length),
      kpis: [["Aciertos", `${ok} de ${items.length}`], ["Tiempo medio", tm == null ? "–" : capNf(tm / 1000, 1) + " s", "por pregunta respondida"], ["Sin responder", String(resp.filter(x => x.sin).length)]],
      tabla: { cab: ["Pregunta", "Respuesta", "Correcta", "Tiempo"], filas: resp.map((x, n) => [n + 1, x.n == null ? "–" : capNf(x.n, 2) + " €", capNf(x.a, 2) + " €", capNf(x.t / 1000, 1) + " s"]) },
      nota: CAP_NOTAS.caja,
      datos: { semilla: op.semilla, respuestas: resp } });
  };
  pintar();
  return { siguiente, items };
}

/* ---------------------------------------------------------------
   6 · Minicaso: qué local abrir (análisis de datos)
   --------------------------------------------------------------- */
const CAP_SITIOS = ["Centro comercial norte", "Calle comercial", "Parque comercial", "Estación de tren"];
const CAP_PINES = [[46, 40], [146, 106], [262, 76], [118, 196]];
function capCaso(seed) {
  const r = capRng(seed);
  for (let i = 0; i < 800; i++) {
    const s = CAP_SITIOS.map(n => ({ n, traf: Math.round((6000 + r() * 12000) / 100) * 100, conv: Math.round((8 + r() * 14) * 10) / 10, ticket: Math.round(28 + r() * 42),
      alq: Math.round((4000 + r() * 10000) / 100) * 100, pers: Math.round((9000 + r() * 7000) / 100) * 100 }));
    s.forEach(x => { x.ventas = x.traf * x.conv / 100 * x.ticket; x.ben = Math.round((x.ventas * 0.45 - x.alq - x.pers) * 100) / 100; });
    const ord = s.slice().sort((a, b) => b.ben - a.ben);
    if (ord[0].ben > 0 && ord[0].ben - ord[1].ben > Math.abs(ord[0].ben) * 0.04 && ord[0].n !== s.slice().sort((a, b) => b.ventas - a.ventas)[0].n) return s;
  }
  throw new Error("No se ha podido generar el caso");
}
function capMontarCaso(el, op, fin) {
  const S = capCaso(op.semilla), t0 = performance.now(), tSec = { ubic: 0, costes: 0 };
  let sec = "ubic", desde = t0, sel = -1, hecho = false;
  const L = "ABCD";
  el.innerHTML = `<div class="cap-caso"><div class="cap-mapa" data-c="mapa"></div><div><div class="cap-dtabs" role="tablist"><button class="cap-dtab" role="tab" data-s="ubic" aria-selected="true">Ubicaciones</button><button class="cap-dtab" role="tab" data-s="costes" aria-selected="false">Costes y márgenes</button></div><div data-c="datos"></div></div></div>
    <form data-c="f" novalidate>
      <div class="cap-preg"><b>1. ¿Qué ubicación da más beneficio al mes?</b><div class="cap-opsr">${S.map((x, i) => `<label class="cap-opr"><input type="radio" name="q1" value="${i}"><span class="cap-letra">${L[i]}</span>${x.n}</label>`).join("")}</div></div>
      <div class="cap-preg"><b>2. ¿Cuál es el beneficio mensual de esa ubicación?</b><label class="cap-campo"><span class="sr">Beneficio mensual en euros</span><input name="q2" inputmode="decimal" autocomplete="off"><span>€</span></label></div>
      <div class="cap-preg"><b>3. Si en «${S[1].n}» la conversión bajara 2 puntos, ¿cuánto beneficio perdería al mes?</b><label class="cap-campo"><span class="sr">Pérdida mensual en euros</span><input name="q3" inputmode="decimal" autocomplete="off"><span>€</span></label></div>
      <div class="cap-preg"><b>4. Vas a enseñar a dirección el beneficio de las cuatro ubicaciones. ¿Qué gráfico usarías?</b><div class="cap-opsr">${["Barras ordenadas de mayor a menor", "Líneas", "Tarta", "Dispersión"].map((t, i) => `<label class="cap-opr"><input type="radio" name="q4" value="${i}">${t}</label>`).join("")}</div></div>
      <div class="cap-fila"><button class="btn primary" type="submit">Entregar respuestas</button><span class="cap-ayuda">No se puede cambiar después. Puedes usar papel o calculadora.</span></div></form></div>`;
  const q = k => el.querySelector(`[data-c="${k}"]`);
  const mapa = () => {
    let h = `<svg viewBox="0 0 320 240" role="img" aria-label="Plano con las cuatro ubicaciones"><rect width="320" height="240" fill="var(--cap-floor)"/><g fill="var(--cap-floor2)">${[[8, 8, 66, 46], [92, 8, 108, 46], [220, 8, 92, 46], [8, 72, 66, 70], [92, 72, 108, 70], [220, 72, 92, 70], [8, 160, 66, 72], [92, 160, 108, 72], [220, 160, 92, 72]].map(([x, y, w, hh]) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6"/>`).join("")}</g>
      <g fill="#5FB3A8" opacity=".35"><circle cx="246" cy="196" r="14"/><circle cx="270" cy="210" r="11"/><circle cx="288" cy="190" r="9"/></g><path d="M-10 150C60 128 120 170 200 140S290 120 330 132" stroke="#3B6FA8" stroke-opacity=".4" stroke-width="14" fill="none"/>
      <g stroke="var(--paper)" stroke-width="8" stroke-linecap="round" fill="none"><path d="M0 63H320M83 0V240M210 0V240M0 151H320"/></g><g stroke="var(--muted)" stroke-opacity=".55" stroke-width="2" stroke-dasharray="7 6" fill="none"><path d="M0 222C80 214 120 236 320 212"/></g>`;
    CAP_PINES.forEach(([x, y], i) => { const s = sel === i;
      h += `<g class="cap-pin" data-pin="${i}" tabindex="0" role="button" aria-label="${CAP_SITIOS[i]}" transform="translate(${x} ${y}) scale(${s ? 1.25 : 1})"><ellipse cx="0" cy="13" rx="7" ry="2.4" fill="#000" opacity=".22"/><path d="M0 13C-8 3-10-2-10-6a10 10 0 0 1 20 0c0 4-2 9-10 19z" fill="${s ? "var(--cap-gold)" : "var(--red)"}"/><circle cx="0" cy="-6" r="5.6" fill="#fff"/><text x="0" y="-3" text-anchor="middle" font-size="8" font-weight="800" fill="#231A3D">${L[i]}</text></g>`; });
    q("mapa").innerHTML = h + `</svg>`;
    q("mapa").querySelectorAll(".cap-pin").forEach(p => { const f = () => { sel = +p.dataset.pin; mapa(); datos(); }; p.addEventListener("click", f); p.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }); });
  };
  const fila = (i, celdas) => `<tr class="${sel === i ? "sel" : ""}"><td><span class="cap-letra">${L[i]}</span>${S[i].n}</td>${celdas}</tr>`;
  const datos = () => {
    el.querySelectorAll(".cap-dtab").forEach(b => b.setAttribute("aria-selected", b.dataset.s === sec));
    q("datos").innerHTML = sec === "ubic"
      ? `<div class="tablewrap"><table class="cap-t"><thead><tr><th>Ubicación</th><th class="num">Visitas/mes</th><th class="num">Conversión</th><th class="num">Ticket</th><th class="num">Alquiler/mes</th></tr></thead><tbody>${S.map((x, i) => fila(i, `<td class="num">${capNf(x.traf)}</td><td class="num">${capNf(x.conv, 1)} %</td><td class="num">${capNf(x.ticket)} €</td><td class="num">${capNf(x.alq)} €</td>`)).join("")}</tbody></table></div><p class="cap-ayuda">Conversión: de cada 100 visitas, cuántas compran. Pulsa un punto del plano para marcar su fila.</p>`
      : `<div class="cap-caja"><b>Margen</b><p>El margen bruto es el 45 % de las ventas en todas las ubicaciones.</p></div><div class="tablewrap"><table class="cap-t"><thead><tr><th>Ubicación</th><th class="num">Personal/mes</th></tr></thead><tbody>${S.map((x, i) => fila(i, `<td class="num">${capNf(x.pers)} €</td>`)).join("")}</tbody></table></div><p class="cap-ayuda">Beneficio mensual = margen bruto − alquiler − personal.</p>`;
  };
  el.querySelectorAll(".cap-dtab").forEach(b => b.addEventListener("click", () => { if (hecho) return; const ahora = performance.now(); tSec[sec] += ahora - desde; desde = ahora; sec = b.dataset.s; datos(); }));
  q("f").addEventListener("submit", e => {
    e.preventDefault(); if (hecho) return;
    const f = new FormData(e.target), num = v => { const s = String(v || "").replace(/[€\s]/g, ""); const n = parseFloat(/,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", ".")); return isNaN(n) ? null : n; };
    const mejor = S.indexOf(S.slice().sort((a, b) => b.ben - a.ben)[0]), B = S[1], perd = Math.round(B.traf * 0.02 * B.ticket * 0.45 * 100) / 100;
    const r2 = num(f.get("q2")), r3 = num(f.get("q3"));
    const qs = [f.get("q1") !== null && +f.get("q1") === mejor, r2 != null && Math.abs(r2 - S[mejor].ben) <= Math.abs(S[mejor].ben) * 0.01, r3 != null && Math.abs(r3 - perd) <= perd * 0.02, f.get("q4") === "0"];
    hecho = true; const ahora = performance.now(); tSec[sec] += ahora - desde;
    const ok = qs.filter(Boolean).length, vio = tSec.costes > 1500;
    const sol = [S[mejor].n, capNf(S[mejor].ben) + " €", capNf(perd) + " €", "Barras ordenadas"];
    fin({ id: "caso", score: capR3(ok / 4),
      kpis: [["Respuestas correctas", `${ok} de 4`], ["Tiempo", capMmss(ahora - t0)], ["En «Ubicaciones»", capMmss(tSec.ubic)], ["En «Costes y márgenes»", capMmss(tSec.costes), vio ? "la revisó" : "no la revisó: le faltaba el personal"]],
      tabla: { cab: ["Pregunta", "Resultado", "Respuesta correcta"], filas: qs.map((x, i) => [i + 1, x ? "Bien" : "Mal", sol[i]]) },
      nota: CAP_NOTAS.caso,
      datos: { semilla: op.semilla, respuestas: { q1: f.get("q1"), q2: f.get("q2"), q3: f.get("q3"), q4: f.get("q4") }, tiempos: tSec } });
  });
  mapa(); datos();
  return { S };
}

/* ---------------------------------------------------------------
   7 · Bandeja de entrada (priorización)
   --------------------------------------------------------------- */
const CAP_TAREAS = [
  { t: "Un cliente reclama un pedido que no ha llegado", imp: 3, urg: 3, esf: 20 },
  { t: "Hay un error en la nómina de una persona del equipo", imp: 3, urg: 3, esf: 45 },
  { t: "Un proveedor no ha enviado la mercancía de la campaña", imp: 3, urg: 2, esf: 30 },
  { t: "Una formación obligatoria del equipo vence hoy", imp: 2, urg: 3, esf: 60 },
  { t: "Preparar el informe mensual de ventas para dirección", imp: 2, urg: 3, esf: 90 },
  { t: "Aprobar las vacaciones de diciembre", imp: 2, urg: 2, esf: 15 },
  { t: "Revisar la propuesta de un nuevo proceso", imp: 3, urg: 1, esf: 60 },
  { t: "Responder a la encuesta interna sobre proveedores", imp: 1, urg: 2, esf: 20 },
  { t: "Ordenar el archivo compartido del departamento", imp: 1, urg: 1, esf: 30 },
  { t: "Actualizar la presentación del equipo", imp: 1, urg: 1, esf: 60 }
];
const capValorTarea = x => 3 * x.imp + 3 * x.urg - x.esf / 60;
function capMontarBandeja(el, op, fin) {
  const r = capRng(op.semilla), X = op.extra || 1, LIM = 5 * 60000 * X;
  const elegidas = CAP_TAREAS.map((x, i) => Object.assign({ id: i }, x)).sort(() => r() - .5).slice(0, 7);
  let orden = elegidas.slice(), hecho = false; const t0 = performance.now(); let movs = 0;
  const IMP = ["", "Impacto bajo", "Impacto medio", "Impacto alto"], URG = ["", "Sin fecha", "Esta semana", "Vence hoy"];
  el.innerHTML = `<div class="cap-band"><div class="cap-chips"><span class="cap-chip">Tiempo restante <b data-c="t">${capMmss(LIM)}</b></span></div>
    <p class="cap-ayuda">Es lunes a primera hora. Ordena las tareas de la primera a la última que harías hoy con las flechas de cada tarjeta. Ten en cuenta el impacto, la fecha y el tiempo que lleva cada una.</p>
    <ol class="cap-lista" data-c="l"></ol><div class="cap-fila"><button class="btn primary" data-c="ok">Entregar el orden</button></div></div>`;
  const q = k => el.querySelector(`[data-c="${k}"]`);
  const pintar = () => {
    q("l").innerHTML = orden.map((x, i) => `<li class="cap-tarea"><span class="cap-pos">${i + 1}</span><div><b>${x.t}</b><span class="cap-tags"><span class="i${x.imp}">${IMP[x.imp]}</span><span class="u${x.urg}">${URG[x.urg]}</span><span>${x.esf} min</span></span></div>
      <span class="cap-mov"><button class="btn" data-m="-1" data-i="${i}" aria-label="Subir «${x.t}»" ${i ? "" : "disabled"}>${capFlecha("M12 19V5M5 12l7-7 7 7")}</button><button class="btn" data-m="1" data-i="${i}" aria-label="Bajar «${x.t}»" ${i < orden.length - 1 ? "" : "disabled"}>${capFlecha("M12 5v14M19 12l-7 7-7-7")}</button></span></li>`).join("");
    q("l").querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => {
      const i = +b.dataset.i, j = i + +b.dataset.m; if (j < 0 || j >= orden.length) return;
      [orden[i], orden[j]] = [orden[j], orden[i]]; movs++; capSon("tic"); pintar();
      const nb = q("l").querySelector(`[data-i="${j}"][data-m="${b.dataset.m}"]`) || q("l").querySelector(`[data-i="${j}"]`); if (nb && !nb.disabled) nb.focus();
    }));
  };
  const reloj = setInterval(() => { if (!el.isConnected) { clearInterval(reloj); return; } const rest = LIM - (performance.now() - t0); q("t").textContent = capMmss(Math.max(0, rest)); if (rest <= 0) entregar(true); }, 250);
  const entregar = porTiempo => {
    if (hecho) return; hecho = true; clearInterval(reloj);
    const clave = elegidas.slice().sort((a, b) => capValorTarea(b) - capValorTarea(a)), pos = new Map(clave.map((x, i) => [x.id, i]));
    const n = orden.length, dif = orden.reduce((s, x, i) => s + Math.abs(i - pos.get(x.id)), 0), maxD = Math.floor(n * n / 2);
    const top3 = orden.slice(0, 3).filter(x => pos.get(x.id) < 3).length;
    fin({ id: "bandeja", score: capR3(1 - dif / maxD),
      kpis: [["Acuerdo con la clave", capNf((1 - dif / maxD) * 100) + " %"], ["Primeras tres bien", `${top3} de 3`], ["Cambios de orden", String(movs)], ["Tiempo", capMmss(performance.now() - t0), porTiempo ? "se acabó el tiempo" : ""]],
      tabla: { cab: ["Su orden", "Tarea", "Orden de la clave"], filas: orden.map((x, i) => [i + 1, x.t, pos.get(x.id) + 1]) },
      nota: CAP_NOTAS.bandeja,
      datos: { semilla: op.semilla, orden: orden.map(x => x.id), clave: clave.map(x => x.id) } });
  };
  q("ok").addEventListener("click", () => entregar(false));
  pintar();
  return { entregar, orden: () => orden };
}

/* ---------------------------------------------------------------
   Catálogo, baterías y sonido
   --------------------------------------------------------------- */
const CAPJ = {
  ruta: { t: "Ruta de reposición", mide: "Planificación", min: 4, montar: capMontarRuta, ins: "Lleva el carro hasta el punto de entrega ámbar. El carro no frena: se desliza hasta chocar con una estantería o con la pared. Llega con el menor número de movimientos posible. Son 5 almacenes cada vez más grandes." },
  memoria: { t: "Memoria con interrupciones", mide: "Memoria de trabajo", min: 4, montar: capMontarMemoria, ins: "Se encienden varias señales, una tras otra. Antes de repetirlas aparece un número: di si es par o impar. Después, pulsa las señales en el mismo orden. Cada acierto alarga la secuencia; dos fallos seguidos con la misma longitud terminan la prueba." },
  clasificador: { t: "Clasificador", mide: "Atención y flexibilidad", min: 3, montar: capMontarClasificador, ins: "Aparece una figura y una regla. Con FORMA, el círculo va a la izquierda y el cuadrado a la derecha. Con COLOR, lo violeta va a la izquierda y lo ámbar a la derecha. La regla cambia sin avisar: responde rápido y sin fallos. Empieza con 6 ensayos de práctica." },
  caja: { t: "Caja rápida", mide: "Cálculo aplicado", min: 4, montar: capMontarCaja, ins: "Doce situaciones de caja: cambio, descuentos, promociones y totales. Escribe el importe exacto con céntimos. Cada pregunta tiene un tiempo límite. Puedes usar papel, no calculadora." },
  patrones: { t: "Patrones", mide: "Razonamiento abstracto", min: 7, pc: true, montar: capMontarPatrones, ins: "En cada cuadro de 3 × 3 falta una figura. Descubre qué cambia por filas y por columnas (forma, número y relleno) y elige la que completa el patrón. Son 10, de más fácil a más difícil, en 7 minutos." },
  caso: { t: "Minicaso: qué local abrir", mide: "Análisis de datos", min: 6, pc: true, montar: capMontarCaso, ins: "Dirección duda entre cuatro ubicaciones para un nuevo local. Revisa el plano y las dos pestañas de datos, y responde cuatro preguntas. Puedes usar papel o calculadora." },
  bandeja: { t: "Bandeja de entrada", mide: "Priorización", min: 4, montar: capMontarBandeja, ins: "Tienes siete tareas pendientes. Ordénalas de la primera a la última que harías hoy, según su impacto, su fecha y el tiempo que llevan. Tienes 5 minutos." }
};
const CAP_BATERIAS = {
  retail: { t: "Retail", d: "Tienda: planificación, memoria, cálculo de caja y atención.", juegos: ["ruta", "memoria", "caja", "clasificador"] },
  oficina: { t: "Oficina y especialistas", d: "Razonamiento abstracto, análisis de datos, priorización y memoria.", juegos: ["patrones", "caso", "bandeja", "memoria"] }
};
const capMinutos = js => js.reduce((s, j) => s + (CAPJ[j] ? CAPJ[j].min : 0), 0);

/* Sonido: apagado salvo que la persona lo active (CAPSON.on). */
const CAPSON = { on: false, ac: null };
function capSonido(v) { CAPSON.on = v; if (v && !CAPSON.ac) { try { CAPSON.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { CAPSON.ac = null; } } }
function capTono(f, dur = .08, tipo = "sine", vol = .05, delay = 0) {
  if (!CAPSON.on || !CAPSON.ac) return;
  try { const A = CAPSON.ac, o = A.createOscillator(), g = A.createGain(), t = A.currentTime + delay; o.type = tipo; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(A.destination); o.start(t); o.stop(t + dur + .02); } catch (e) {}
}
function capSon(k, i) { if (k === "ok") { capTono(660, .1); capTono(880, .14, "sine", .05, .09); } else if (k === "ko") capTono(180, .18, "triangle", .06); else if (k === "nota") capTono(520 + (i || 0) * 18, .1, "sine", .04); else capTono(420, .04, "square", .02); }

/* Informe de un resultado (RR.HH. y vista previa). */
function capInformeHtml(res) {
  if (!res || typeof res !== "object") return `<p class="muted">Sin resultado.</p>`;
  const J = CAPJ[res.id] || { t: String(res.id || ""), mide: "" };
  // Viene de lo que envía el navegador de quien hace la prueba: se comprueba la forma antes de pintarlo.
  const lista = x => (Array.isArray(x) ? x : []);
  const kpis = lista(res.kpis).filter(Array.isArray), tabla = res.tabla && Array.isArray(res.tabla.cab) && Array.isArray(res.tabla.filas) ? res.tabla : null;
  if (!res.nota && CAPJ[res.id]) res = Object.assign({}, res, { nota: CAP_NOTAS[res.id] || "" });
  res = Object.assign({}, res, { kpis, tabla: tabla && { cab: tabla.cab, filas: tabla.filas.filter(Array.isArray) }, score: typeof res.score === "number" ? res.score : 0 });
  return `<div class="cap-inf"><div class="cap-inf-h"><b>${esc(J.t)}</b><span class="muted">${esc(J.mide)} · puntuación ${Math.round((res.score || 0) * 100)} de 100</span>${res.reinicios ? `<span class="badge">Reiniciada ${res.reinicios} ${res.reinicios === 1 ? "vez" : "veces"} al recargar</span>` : ""}</div>
    <div class="cap-kpis">${(res.kpis || []).map(([t, v, s]) => `<div><small>${esc(t)}</small><b>${esc(v)}</b>${s ? `<small>${esc(s)}</small>` : ""}</div>`).join("")}</div>
    ${res.tabla ? `<div class="tablewrap"><table class="cap-t"><thead><tr>${res.tabla.cab.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${res.tabla.filas.map(f => `<tr>${f.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
    ${res.nota ? `<p class="hint">${esc(res.nota)}</p>` : ""}</div>`;
}

/* ---------------------------------------------------------------
   Reproductor: una o varias pruebas seguidas
   op = { juegos, extra, semilla, mostrarResultados, alTerminarJuego(res), alFin(resultados), hechos }
   --------------------------------------------------------------- */
function capReproducir(el, op) {
  const P = { i: 0, res: Object.assign({}, op.hechos || {}) };
  const pend = () => op.juegos.filter(j => !P.res[j]);
  const intro = () => {
    capTeclas(null);
    const js = pend();
    if (!js.length) { el.innerHTML = ""; return op.alFin && op.alFin(P.res); }
    const id = js[0], J = CAPJ[id], n = op.juegos.indexOf(id) + 1;
    el.innerHTML = `<div class="cap-intro"><span class="cap-paso">Prueba ${n} de ${op.juegos.length}</span><h2>${esc(J.t)}</h2><p class="cap-mide">${esc(J.mide)} · unos ${J.min} minutos</p><p>${esc(J.ins)}</p>
      ${J.pc ? `<p class="cap-aviso-pc">Mejor en ordenador: hay tablas y mucha información.</p>` : ""}
      <div class="cap-fila"><button class="btn primary" data-c="go">Empezar esta prueba</button><label class="cap-son"><input type="checkbox" data-c="son" ${CAPSON.on ? "checked" : ""}> Sonido</label></div></div>`;
    el.querySelector('[data-c="son"]').addEventListener("change", e => capSonido(e.target.checked));
    el.querySelector('[data-c="go"]').addEventListener("click", () => jugar(id));
    const b = el.querySelector('[data-c="go"]'); if (b) b.focus();
  };
  const jugar = id => {
    if (op.alEmpezarJuego) op.alEmpezarJuego(id);
    const cont = document.createElement("div"); cont.className = "cap-zona"; el.innerHTML = ""; el.appendChild(cont);
    const semilla = (op.semilla || Date.now()) + op.juegos.indexOf(id) * 7919;
    P.ctrl = CAPJ[id].montar(cont, { semilla, extra: op.extra || 1 }, res => {
      if (!cont.isConnected) return;
      res.semilla = semilla; res.fin = new Date().toISOString();
      P.res[id] = res; capTeclas(null);
      if (op.alTerminarJuego) op.alTerminarJuego(id, res);
      if (op.mostrarResultados) {
        el.innerHTML = capInformeHtml(res) + `<div class="cap-fila" style="margin-top:12px">${pend().length ? `<button class="btn primary" data-c="sig">Siguiente prueba</button>` : `<button class="btn primary" data-c="sig">Terminar</button>`}</div>`;
        el.querySelector('[data-c="sig"]').addEventListener("click", intro);
      } else intro();
    });
  };
  intro();
  return P;
}
