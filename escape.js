"use strict";
/* ===================== UN TURNO SEGURO · ESCAPE ROOM DE PRL =====================
   Cuatro dependencias de una tienda. En cada una hay riesgos escondidos entre
   objetos que están bien. Encuéntralos todos y se abre la llave de esa sala;
   con las cuatro llaves se abre la taquilla final.

   Las salas van dibujadas en SVG a propósito: pesan unos kilobytes en vez de
   megabytes, se ven igual en cualquier pantalla y no dependen de ningún banco
   de imágenes. El día que haya fotos de una tienda de verdad, se cambia el
   fondo de cada sala y lo demás sigue igual: los puntos van en porcentajes.
   =============================================================================== */

const ESC_SALAS = [
  {
    id: "trastienda", t: "Trastienda", sub: "Donde casi todo se tuerce",
    luz: "#2A3140", tono: "#E8A33D",
    intro: "El sitio donde se descarga, se almacena y se pasa con prisa. Aquí es donde ocurren la mayoría de los accidentes de una tienda.",
    puntos: [
      { x: 20.5, y: 82, r: 1, t: "Caja en mitad del paso", d: "Un bulto en la zona de tránsito es la primera causa de caída al mismo nivel, y la caída al mismo nivel es el accidente más frecuente del comercio.", q: "Se retira ahora, no «cuando acabe la descarga»." },
      { x: 50, y: 30, r: 1, t: "Extintor tapado por mercancía", d: "Un extintor que no se ve y no se alcanza es un extintor que no existe. Además es una infracción directa en una inspección.", q: "Medio metro libre alrededor y el cartel visible desde el pasillo." },
      { x: 78, y: 45, r: 1, t: "Escalera apoyada en el lineal", d: "Apoyada en una estantería móvil, la escalera se desplaza al subir. Las caídas de altura son pocas, pero son las que mandan a alguien al hospital.", q: "Escalera de tijera abierta del todo, sobre suelo firme, y nunca en el último peldaño." },
      { x: 35, y: 78, r: 1, t: "Cable cruzando el suelo", d: "El cable de la transpaleta o del cargador cruzando la zona de paso. Tropezar con él es cuestión de tiempo.", q: "Pegado a la pared o por canaleta. Nunca atravesando un paso." },
      { x: 74, y: 13, r: 1, t: "Carga pesada en el estante alto", d: "Lo pesado arriba descuadra la estantería y obliga a bajarlo por encima de la cabeza.", q: "Lo pesado abajo, lo ligero arriba. Siempre." },
      { x: 62, y: 85, r: 0, t: "Transpaleta recogida junto a la pared", d: "Aparcada fuera del paso, con las horquillas bajadas. Esto está bien hecho.", q: "" },
      { x: 10, y: 35, r: 0, t: "Botiquín señalizado y accesible", d: "Visible, a la altura de la vista y sin nada delante. Correcto.", q: "" }
    ]
  },
  {
    id: "sala", t: "Sala de venta", sub: "Con clientes dentro",
    luz: "#1F2B38", tono: "#4FA3D1",
    intro: "Aquí el riesgo no es solo tuyo: cualquier cosa que dejes mal puesta se la lleva por delante un cliente, y eso es responsabilidad de la tienda.",
    puntos: [
      { x: 25.8, y: 83, r: 1, t: "Suelo mojado sin señalizar", d: "Acaban de fregar o se ha derramado algo y no hay cono. Si cae un cliente, la tienda responde.", q: "Cono amarillo antes de empezar a fregar, no después de que alguien resbale." },
      { x: 53, y: 28, r: 1, t: "Producto apilado por encima de la cabeza", d: "Una torre de cajas en el expositor: inestable, y si cae, cae sobre alguien.", q: "Nada apilado por encima de 1,80 m en zona de clientes." },
      { x: 82, y: 58, r: 1, t: "Salida de emergencia bloqueada", d: "Un palé o un expositor delante de la salida. En caso de evacuación, esa puerta no sirve.", q: "Las vías de evacuación están siempre libres. Sin excepciones, ni en campaña." },
      { x: 42, y: 15, r: 1, t: "Luminaria fundida sobre el pasillo", d: "Menos luz es menos capacidad de ver un obstáculo, y en el escalón del fondo eso importa.", q: "Se reporta el mismo día. No se espera a la revisión mensual." },
      { x: 68, y: 79, r: 0, t: "Demo con el cable recogido", d: "El robot de cocina enchufado, con el cable por detrás del mueble. Bien.", q: "" },
      { x: 14.7, y: 47, r: 0, t: "Cartel de aforo visible", d: "Colocado y legible. Correcto.", q: "" }
    ]
  },
  {
    id: "caja", t: "Zona de caja", sub: "Ocho horas en el mismo metro cuadrado",
    luz: "#2B2535", tono: "#C98BD9",
    intro: "En caja no hay accidentes espectaculares: hay trastornos musculoesqueléticos, que son más del 70 % de las bajas del comercio y se construyen en silencio durante meses.",
    puntos: [
      { x: 30, y: 45, r: 1, t: "Pantalla demasiado baja", d: "Obliga a flexionar el cuello todo el turno. Es la causa número uno de cervicalgia en caja.", q: "El borde superior de la pantalla, a la altura de los ojos." },
      { x: 60, y: 65, r: 1, t: "Sin alfombra antifatiga", d: "De pie sobre suelo duro ocho horas: sobrecarga lumbar y de piernas. Una alfombra cuesta poco y cambia el turno.", q: "Alfombra antifatiga en todos los puestos de pie." },
      { x: 75.6, y: 38.5, r: 1, t: "Reponer girando la cintura", d: "Coger bolsas del lateral girando el tronco, cien veces al día. El giro con carga es lo que lesiona, no el peso.", q: "Mover los pies, no la cintura. Lo de uso frecuente, al alcance sin girar." },
      { x: 46, y: 86, r: 1, t: "Caja de monedas en el suelo", d: "Obliga a agacharse doblando la espalda cada vez.", q: "Nada de uso frecuente por debajo de las rodillas." },
      { x: 88, y: 55, r: 0, t: "Silla regulable en altura", d: "Con respaldo y regulación. Correcto.", q: "" },
      { x: 13.4, y: 68.5, r: 0, t: "Reposapiés disponible", d: "Está y se usa. Bien.", q: "" }
    ]
  },
  {
    id: "almacen", t: "Almacén alto", sub: "Lo que no se ve desde la sala",
    luz: "#243029", tono: "#6FBF8A",
    intro: "La última sala. Aquí no entra ningún cliente, y por eso es donde más se relaja todo el mundo.",
    puntos: [
      { x: 24, y: 38, r: 1, t: "Estantería sin anclar a la pared", d: "Una estantería alta sin anclaje vuelca al tirar de una caja de arriba. Es el accidente grave clásico de almacén.", q: "Anclada a pared y con la carga máxima señalizada." },
      { x: 52, y: 62, r: 1, t: "Levantar con la espalda doblada", d: "Piernas rectas y espalda curvada: el gesto que rompe discos. Y lo hace sin avisar, un día cualquiera.", q: "Doblar rodillas, carga pegada al cuerpo, espalda recta. Más de 25 kg, entre dos." },
      { x: 82, y: 73, r: 1, t: "Palé roto en uso", d: "Con tablas sueltas, la carga se desequilibra al moverlo y las astillas cortan.", q: "Palé roto, fuera de circulación el mismo día." },
      { x: 39, y: 15, r: 1, t: "Luz de emergencia apagada", d: "Si falla la luz en una sala sin ventanas, se sale a oscuras entre estanterías.", q: "Se comprueba en la revisión mensual y se reporta en el acto." },
      { x: 75, y: 87, r: 0, t: "Pasillo libre y marcado", d: "Delimitado y sin obstáculos. Correcto.", q: "" },
      { x: 92, y: 27, r: 0, t: "Carga máxima señalizada", d: "El cartel de kilos por balda, visible. Bien.", q: "" }
    ]
  }
];

const ESC_FINAL = [
  { t: "¿Cuál es el accidente más frecuente en una tienda?",
    o: ["Caída desde una escalera", "Caída al mismo nivel: tropiezo o resbalón", "Corte manipulando cúter", "Golpe con una transpaleta"],
    r: 1, por: "Tropezar con algo que no debería estar ahí. Por eso lo primero de todo es el orden: casi toda la prevención en retail es no dejar cosas en el paso." },
  { t: "Vas a coger una caja pesada del suelo. ¿Qué haces?",
    o: ["Doblas la espalda y tiras con fuerza", "Doblas las rodillas, pegas la carga al cuerpo y subes con las piernas", "La arrastras hasta la estantería", "Pides a alguien que la empuje mientras tiras"],
    r: 1, por: "Rodillas, carga pegada, espalda recta y sin girar la cintura. Por encima de 25 kg, entre dos o con medios mecánicos." },
  { t: "En plena campaña, el único sitio libre para un expositor es delante de la salida de emergencia. ¿Qué haces?",
    o: ["Lo pones, pero avisas al equipo de que está ahí", "Lo pones solo durante el horario de tienda", "Buscas otro sitio: la salida no se bloquea nunca", "Lo pones y lo quitas si viene una inspección"],
    r: 2, por: "Una vía de evacuación bloqueada no admite matices ni horarios. Si no cabe en otro sitio, no cabe en la tienda." }
];

/* ---------- Estado y progreso ---------- */
function esc_est() {
  if (!S.esc) {
    let g = null;
    try { g = JSON.parse(localStorage.getItem("sc-esc") || "null"); } catch (e) {}
    S.esc = g && typeof g === "object" ? g : { sala: null, halladas: {}, ficha: null, fase: "mapa", resp: {}, enviado: false };
  }
  return S.esc;
}
function esc_salaDe(id) { return ESC_SALAS.find(s => s.id === id); }
function esc_riesgos(s) { return s.puntos.filter(p => p.r); }
function esc_hall(id) { return (esc_est().halladas[id] || []); }
function esc_completa(s) { return esc_hall(s.id).filter(k => s.puntos[k] && s.puntos[k].r).length === esc_riesgos(s).length; }
function esc_llaves() { return ESC_SALAS.filter(esc_completa).length; }

/* ---------- Escenas ----------
   Dibujo plano con profundidad: pared al fondo, suelo en perspectiva, luz
   cenital y sombras pegadas a los objetos. Son unos pocos kilobytes y se ven
   nítidas en cualquier pantalla. Cuando haya fotos reales, se cambia esta
   función y los puntos siguen igual, porque van en porcentajes.            */
function esc_escena(s) {
  const T = s.tono;
  const D = `<defs>
    <linearGradient id="pa-${s.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${s.luz}"/><stop offset="1" stop-color="#0E1218"/></linearGradient>
    <linearGradient id="su-${s.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#171D26"/><stop offset="1" stop-color="#090C11"/></linearGradient>
    <radialGradient id="lu-${s.id}" cx="50%" cy="24%" r="70%">
      <stop offset="0" stop-color="${T}" stop-opacity=".34"/>
      <stop offset=".55" stop-color="${T}" stop-opacity=".10"/>
      <stop offset="1" stop-color="${T}" stop-opacity="0"/></radialGradient>
    <linearGradient id="cj-${s.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5A4428"/><stop offset="1" stop-color="#33261592"/></linearGradient>
    <linearGradient id="mt-${s.id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#39424E"/><stop offset=".5" stop-color="#242C36"/><stop offset="1" stop-color="#171D25"/></linearGradient>
  </defs>`;
  const fondo = `<rect width="1000" height="600" fill="url(#pa-${s.id})"/>
    <path d="M0 392 L1000 392 L1000 600 L0 600 Z" fill="url(#su-${s.id})"/>
    <path d="M150 392 L40 600 M380 392 L330 600 M620 392 L670 600 M850 392 L960 600"
      stroke="#000" stroke-opacity=".30" stroke-width="2"/>
    <rect width="1000" height="600" fill="url(#lu-${s.id})"/>`;
  const sombra = (x, w, y) => `<ellipse cx="${x + w / 2}" cy="${y}" rx="${w * 0.6}" ry="8" fill="#000" opacity=".42"/>`;
  // Caja de cartón con cinta y solapa
  const caja = (x, y, w, h) => `${sombra(x, w, y + h + 2)}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#cj-${s.id})"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="none" stroke="#7A5C33" stroke-opacity=".8" stroke-width="1.5"/>
    <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#2A1F11" stroke-opacity=".75" stroke-width="2"/>
    <rect x="${x}" y="${y + h * 0.26}" width="${w}" height="${Math.max(5, h * 0.1)}" fill="#C8B48A" opacity=".30"/>`;
  // Estantería metálica con baldas y bultos
  const estante = (x, w, h, n, carga) => {
    let o = `${sombra(x, w, 394)}<rect x="${x}" y="${392 - h}" width="${w}" height="${h}" fill="#0B0F15" opacity=".92"/>`;
    for (let i = 0; i <= n; i++) {
      const y = 392 - h * i / n;
      o += `<rect x="${x - 4}" y="${y - 5}" width="${w + 8}" height="7" rx="2" fill="url(#mt-${s.id})"/>`;
      if (carga && i < n && i > 0) {
        const bw = w * 0.3;
        o += caja(x + 10 + (i % 2) * bw * 1.1, y - 5 - h / n * 0.62, bw, h / n * 0.6);
      }
    }
    o += `<rect x="${x - 5}" y="${392 - h}" width="9" height="${h}" fill="url(#mt-${s.id})"/>
          <rect x="${x + w - 4}" y="${392 - h}" width="9" height="${h}" fill="url(#mt-${s.id})"/>`;
    return o;
  };
  const extintor = (x, y, h) => `${sombra(x, h * 0.42, y + h + 2)}
    <rect x="${x}" y="${y + h * 0.12}" width="${h * 0.42}" height="${h * 0.88}" rx="${h * 0.1}" fill="#8E1621"/>
    <rect x="${x}" y="${y + h * 0.12}" width="${h * 0.16}" height="${h * 0.88}" rx="${h * 0.08}" fill="#C0303C" opacity=".55"/>
    <rect x="${x + h * 0.14}" y="${y}" width="${h * 0.14}" height="${h * 0.16}" fill="#3A3F46"/>
    <rect x="${x + h * 0.04}" y="${y + h * 0.44}" width="${h * 0.34}" height="${h * 0.2}" fill="#F3E7C8" opacity=".55"/>`;
  const escalera = (x1, y1, x2, y2) => { let o = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4C5663" stroke-width="9" stroke-linecap="round"/>
    <line x1="${x1 + 44}" y1="${y1}" x2="${x2 + 44}" y2="${y2}" stroke="#3B434E" stroke-width="9" stroke-linecap="round"/>`;
    for (let k = 1; k <= 7; k++) { const t = k / 8, X = x1 + (x2 - x1) * t, Y = y1 + (y2 - y1) * t;
      o += `<line x1="${X}" y1="${Y}" x2="${X + 44}" y2="${Y}" stroke="#596472" stroke-width="6" stroke-linecap="round"/>`; }
    return o; };
  const cartel = (x, y, w, h, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${col || "#13351F"}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#6FD39A" stroke-opacity=".8" stroke-width="2"/>
    <rect x="${x + w * 0.2}" y="${y + h * 0.33}" width="${w * 0.6}" height="${h * 0.14}" fill="#8FE8B6" opacity=".75"/>
    <rect x="${x + w * 0.2}" y="${y + h * 0.57}" width="${w * 0.4}" height="${h * 0.12}" fill="#8FE8B6" opacity=".45"/>`;

  if (s.id === "trastienda") return `<svg viewBox="0 0 1000 600" class="esc-svg">${D}${fondo}
    ${estante(55, 180, 300, 4, true)}${estante(650, 270, 345, 5, true)}
    ${caja(150, 452, 110, 76)}
    ${caja(318, 310, 118, 82)}${caja(336, 244, 82, 64)}
    ${caja(548, 336, 104, 56)}
    ${escalera(690, 390, 772, 120)}
    <path d="M60 500 Q 420 480 985 536" stroke="#2B3340" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M60 500 Q 420 480 985 536" stroke="${T}" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${extintor(468, 150, 96)}
    ${cartel(58, 170, 76, 54)}
    <rect x="552" y="486" width="186" height="26" rx="5" fill="#2B333E"/>
    <rect x="566" y="512" width="22" height="30" rx="4" fill="#20262F"/><rect x="702" y="512" width="22" height="30" rx="4" fill="#20262F"/>
    </svg>`;

  if (s.id === "sala") return `<svg viewBox="0 0 1000 600" class="esc-svg">${D}${fondo}
    ${estante(70, 165, 236, 3, true)}${estante(800, 170, 226, 3, true)}
    ${estante(458, 200, 150, 2, false)}
    ${caja(492, 196, 78, 58)}${caja(502, 134, 60, 56)}${caja(512, 86, 42, 42)}
    <ellipse cx="258" cy="498" rx="118" ry="32" fill="#2E6C8E" opacity=".45"/>
    <ellipse cx="258" cy="498" rx="70" ry="18" fill="#53A7CE" opacity=".35"/>
    <rect x="762" y="236" width="124" height="156" rx="4" fill="#0F2417"/>
    <rect x="762" y="236" width="124" height="156" rx="4" fill="none" stroke="#5FBF8C" stroke-opacity=".7" stroke-width="2.5"/>
    <path d="M800 268 l16 -14 v10 h18 v-10 l16 14 -16 14 v-10 h-18 v10 z" fill="#8FE8B6" opacity=".8"/>
    ${caja(778, 300, 92, 92)}
    <circle cx="420" cy="88" r="30" fill="#1B232D"/><circle cx="420" cy="88" r="20" fill="#2A3340"/>
    <rect x="610" y="440" width="140" height="68" rx="7" fill="#242C36"/>
    <rect x="626" y="452" width="108" height="30" rx="4" fill="#39424E"/>
    ${cartel(104, 254, 86, 56, "#132033")}
    </svg>`;

  if (s.id === "caja") return `<svg viewBox="0 0 1000 600" class="esc-svg">${D}${fondo}
    ${sombra(170, 650, 466)}
    <rect x="170" y="330" width="650" height="78" rx="7" fill="#2A3039"/>
    <rect x="170" y="330" width="650" height="16" rx="7" fill="#39414D"/>
    <rect x="236" y="222" width="140" height="98" rx="6" fill="#161C25"/>
    <rect x="252" y="236" width="108" height="66" rx="3" fill="${T}" opacity=".22"/>
    <rect x="292" y="320" width="28" height="14" fill="#1C222B"/>
    <rect x="520" y="378" width="170" height="30" rx="4" fill="#0A0D12" opacity=".85"/>
    <rect x="690" y="170" width="132" height="122" rx="6" fill="#232A34"/>
    <rect x="704" y="184" width="104" height="94" rx="3" fill="#161C25"/>
    ${caja(404, 492, 112, 46)}
    <rect x="836" y="286" width="96" height="20" rx="10" fill="#2E3641"/>
    <rect x="874" y="306" width="16" height="78" fill="#2A313B"/>
    <ellipse cx="882" cy="388" rx="42" ry="10" fill="#242B34"/>
    <rect x="72" y="398" width="124" height="26" rx="5" fill="#2A313B"/>
    <rect x="72" y="398" width="124" height="7" rx="4" fill="#3A434F"/>
    </svg>`;

  return `<svg viewBox="0 0 1000 600" class="esc-svg">${D}${fondo}
    ${estante(130, 205, 348, 5, true)}${estante(690, 225, 326, 5, true)}
    ${caja(492, 322, 104, 72)}
    <path d="M470 430 q 26 -74 76 -34" stroke="#C8B48A" stroke-opacity=".55" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${sombra(738, 160, 468)}
    <rect x="738" y="424" width="162" height="22" rx="3" fill="#6B522F"/>
    <rect x="738" y="446" width="162" height="12" rx="2" fill="#3E2F1B"/>
    <rect x="770" y="424" width="16" height="34" fill="#2A1F11" opacity=".7"/>
    <rect x="846" y="424" width="16" height="34" fill="#2A1F11" opacity=".7"/>
    ${cartel(346, 72, 82, 32, "#1A1F16")}
    <rect x="600" y="520" width="300" height="7" rx="3" fill="${T}" opacity=".40"/>
    <rect x="876" y="138" width="88" height="48" rx="5" fill="#232A34"/>
    <rect x="890" y="152" width="60" height="20" rx="2" fill="#8FE8B6" opacity=".35"/>
    </svg>`;
}

/* ---------- Pantallas ---------- */
function pintarEscape() {
  const e = esc_est();
  if (e.fase === "final") return esc_pintarFinal();
  if (e.fase === "hecho") return esc_pintarHecho();
  if (e.sala) return esc_pintarSala(esc_salaDe(e.sala));
  esc_pintarMapa();
}

function esc_pintarMapa() {
  const n = esc_llaves(), total = ESC_SALAS.length;
  $("vista").innerHTML = `<div class="page esc">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverCursos">← Formaciones</button>
      <h1>Un turno seguro</h1>
      <p class="muted">Cuatro dependencias de la tienda. En cada una hay riesgos escondidos entre cosas que están bien puestas. Encuéntralos todos y conseguirás la llave.</p></div>
      ${n ? `<span class="esc-cuenta">${n} de ${total} llaves</span>` : ""}</div>

    <div class="esc-mapa">${ESC_SALAS.map((s, i) => {
      const hechas = esc_hall(s.id).filter(k => s.puntos[k] && s.puntos[k].r).length, tot = esc_riesgos(s).length;
      const ok = hechas === tot;
      return `<button class="esc-puerta ${ok ? "ok" : ""}" data-action="escEntrar" data-s="${s.id}" style="--ton:${s.tono}">
        <span class="esc-mini">${esc_escena(s)}</span>
        <span class="esc-puerta-t">${esc(s.t)}<small>${esc(s.sub)}</small></span>
        <span class="esc-estado">${ok ? "✓ Llave conseguida" : `${hechas} de ${tot} riesgos`}</span></button>`;
    }).join("")}</div>

    <div class="esc-llavero">
      ${ESC_SALAS.map(s => `<span class="esc-llave ${esc_completa(s) ? "on" : ""}" title="${esc(s.t)}">${esc_completa(s) ? "🔑" : "🔒"}<small>${esc(s.t)}</small></span>`).join("")}
      <button class="btn primary" data-action="escFinal" ${n < total ? "disabled" : ""}>${n < total ? `Faltan ${total - n} ${total - n === 1 ? "llave" : "llaves"}` : "Abrir la taquilla"}</button>
    </div>
    ${n ? `<p class="hint"><button class="btn small ghost" data-action="escReiniciar">Empezar de cero</button></p>` : ""}</div>`;
}

function esc_pintarSala(s) {
  const e = esc_est(), hall = esc_hall(s.id);
  const riesgos = esc_riesgos(s).length, encontrados = hall.filter(k => s.puntos[k] && s.puntos[k].r).length;
  const ok = encontrados === riesgos;
  const f = e.ficha != null ? s.puntos[e.ficha] : null;
  $("vista").innerHTML = `<div class="page esc">
    <div class="page-h"><div><button class="btn small ghost" data-action="escMapa">← Las cuatro salas</button>
      <h1>${esc(s.t)}</h1><p class="muted">${esc(s.intro)}</p></div>
      <span class="esc-cuenta ${ok ? "ok" : ""}">${encontrados} de ${riesgos} riesgos</span></div>

    <div class="esc-escena" style="--ton:${s.tono}">
      ${esc_escena(s)}
      ${s.puntos.map((p, i) => {
        const visto = hall.includes(i);
        return `<button class="esc-pt ${visto ? (p.r ? "mal" : "bien") : ""}" style="left:${p.x}%;top:${p.y}%"
          data-action="escPunto" data-i="${i}" aria-label="Revisar"><i></i></button>`;
      }).join("")}
    </div>

    ${f ? `<section class="card esc-ficha ${f.r ? "riesgo" : "correcto"}">
      <div class="card-h"><h2>${f.r ? "⚠ " : "✓ "}${esc(f.t)}</h2>
        <button class="btn small ghost" data-action="escCerrarFicha">Cerrar</button></div>
      <p>${esc(f.d)}</p>
      ${f.q ? `<p class="esc-q"><b>Qué se hace:</b> ${esc(f.q)}</p>` : `<p class="hint">Esto no es un riesgo. Buscas lo que está mal, no lo que está bien.</p>`}
    </section>` : `<p class="hint esc-pista">Pulsa sobre los objetos marcados. Unos son riesgos y otros no: acertar es distinguirlos.</p>`}

    ${ok ? `<div class="cta-rp esc-ok"><div><b>Sala despejada. Llave conseguida.</b>
      <p class="hint">Has encontrado los ${riesgos} riesgos de ${esc(s.t).toLowerCase()}.</p></div>
      <span><button class="btn primary" data-action="escMapa">Volver a las salas</button></span></div>` : ""}
    </div>`;
  const fi = document.querySelector(".esc-ficha"); if (fi) fi.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function esc_pintarFinal() {
  const e = esc_est(), n = Object.keys(e.resp).length;
  $("vista").innerHTML = `<div class="page esc">
    <div class="page-h"><div><button class="btn small ghost" data-action="escMapa">← Las cuatro salas</button>
      <h1>La taquilla</h1><p class="muted">Tres preguntas y has terminado. Las cuatro llaves ya están puestas.</p></div></div>
    <div class="qlist">${ESC_FINAL.map((q, i) => `<fieldset class="preg"><legend>${i + 1}. ${esc(q.t)}</legend>
      ${q.o.map((o, k) => `<label class="op ${e.resp[i] === k ? "on" : ""}"><input type="radio" name="ef${i}" ${e.resp[i] === k ? "checked" : ""}
        data-action="escResp" data-q="${i}" data-k="${k}"><span>${esc(o)}</span></label>`).join("")}</fieldset>`).join("")}</div>
    <div class="guest-f"><span class="muted num">${n} de ${ESC_FINAL.length} contestadas</span>
      <button class="btn primary" data-action="escEnviar" ${n < ESC_FINAL.length ? "disabled" : ""}>Abrir la taquilla</button></div></div>`;
}

function esc_pintarHecho() {
  const e = esc_est();
  const bien = ESC_FINAL.filter((q, i) => e.resp[i] === q.r).length;
  const apto = bien / ESC_FINAL.length >= 0.6;
  $("vista").innerHTML = `<div class="page esc">
    <div class="page-h"><div><button class="btn small ghost" data-action="volverCursos">← Formaciones</button>
      <h1>Un turno seguro</h1></div></div>
    <div class="nota-inv ${apto ? "ok" : "ko"}"><b>${bien} de ${ESC_FINAL.length}</b>
      <span>${apto ? "Formación superada. Las cuatro salas y la taquilla." : "No llega al 60 %. Repite las preguntas cuando quieras."}</span></div>
    <ul class="repaso">${ESC_FINAL.map((q, i) => {
      const ok = e.resp[i] === q.r;
      return `<li class="${ok ? "ok" : "ko"}"><b>${esc(q.t)}</b>
        <span>${ok ? "Correcto: " + esc(q.o[q.r]) : `Contestaste «${esc(q.o[e.resp[i]] || "nada")}». La correcta es «${esc(q.o[q.r])}».`}</span>
        <small>${esc(q.por)}</small></li>`;
    }).join("")}</ul>
    <section class="card"><h2>Los 17 riesgos de la tienda</h2>
      <p class="hint">Lo que has encontrado, por sala. Imprímelo y cuélgalo en la trastienda.</p>
      ${ESC_SALAS.map(s => `<h3 class="esc-h3">${esc(s.t)}</h3><ul class="lista cuidado">
        ${esc_riesgos(s).map(p => `<li><b>${esc(p.t)}</b> — ${esc(p.q)}</li>`).join("")}</ul>`).join("")}
      <div class="actions"><button class="btn" data-action="escImprimir">Imprimir el resumen</button>
        <button class="btn ghost" data-action="escReiniciar">Volver a jugar</button></div></section></div>`;
}

/* ---------- Acciones ---------- */
const ACCIONES_ESC = {
  escEntrar(b) { const e = esc_est(); e.sala = b.dataset.s; e.ficha = null; e.fase = "sala"; window.scrollTo(0, 0); },
  escMapa() { const e = esc_est(); e.sala = null; e.ficha = null; e.fase = "mapa"; window.scrollTo(0, 0); },
  escCerrarFicha() { esc_est().ficha = null; },
  escPunto(b) {
    const e = esc_est(), s = esc_salaDe(e.sala), i = Number(b.dataset.i);
    e.ficha = i;
    const h = e.halladas[s.id] = (e.halladas[s.id] || []).slice();
    if (!h.includes(i)) h.push(i);
    if (esc_completa(s)) toast("Llave de " + s.t.toLowerCase() + " conseguida");
    esc_guardar();
  },
  escFinal() { const e = esc_est(); e.fase = "final"; window.scrollTo(0, 0); },
  escResp(b) { esc_est().resp[Number(b.dataset.q)] = Number(b.dataset.k); esc_guardar(); },
  escEnviar() {
    const e = esc_est();
    e.fase = "hecho"; e.enviado = true;
    const bien = ESC_FINAL.filter((q, i) => e.resp[i] === q.r).length;
    const p = progreso(); p.seguridad = Object.assign(p.seguridad || {}, {
      completado: new Date().toISOString(), test: { aciertos: bien, total: ESC_FINAL.length }
    });
    guardarProgreso(p);
    window.scrollTo(0, 0);
  },
  escImprimir() {
    $("print").innerHTML = `<div class="page"><h1>Un turno seguro · los riesgos de la tienda</h1>
      ${ESC_SALAS.map(s => `<h2>${esc(s.t)}</h2><ul>${esc_riesgos(s).map(p => `<li><b>${esc(p.t)}</b><br>${esc(p.d)}<br><i>${esc(p.q)}</i></li>`).join("")}</ul>`).join("")}</div>`;
    window.print(); return false;
  },
  escReiniciar() {
    S.esc = { sala: null, halladas: {}, ficha: null, fase: "mapa", resp: {}, enviado: false };
    esc_guardar();
  }
};
function esc_guardar() { try { localStorage.setItem("sc-esc", JSON.stringify(esc_est())); } catch (e) {} }
