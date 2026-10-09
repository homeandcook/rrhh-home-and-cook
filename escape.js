"use strict";
/* ===================== UN TURNO SEGURO · ESCAPE ROOM DE PRL =====================
   Es lunes, el Store Manager está de vacaciones y antes de abrir das una vuelta
   por la tienda. En cada zona tocas los objetos y decides: ¿esto es un riesgo
   o está bien? Los fallos cuentan. Con todas las zonas revisadas se abre la
   taquilla, tres preguntas, y sale la nota.

   Las tres zonas de sala son fotos de tiendas Home & Cook; la trastienda y el
   almacén van dibujados hasta que haya fotos. Los puntos van en porcentajes
   sobre la imagen, así que cambiar una foto no obliga a tocar nada más.

   Por dentro, el juego es una plantilla de preguntas como cualquier otra
   formación: cada objeto es una pregunta de dos opciones. Por eso se puede
   enviar con código, puntúa igual, vuelve al seguimiento y se ve en
   «Ver respuestas» sin código aparte.
   =============================================================================== */

const ESC_INTRO = "Es lunes, abres a las 9:30 y el Store Manager está de vacaciones: hoy la tienda es tuya. Antes de subir la persiana, das una vuelta. En cada zona, toca los objetos marcados y decide si son un riesgo o si están bien.";

const ESC_SALAS = [
  {
    id: "cafe", t: "Zona de café", sub: "Primera parada", foto: "esc-cafe.jpg", w: 1600, h: 1200, tono: "#E8A33D",
    intro: "La zona más visitada de la tienda. Mira el expositor, las baldas y la esquina de reserva.",
    puntos: [
      { x: 93, y: 58, r: 1, n: "Las cajas de la esquina", t: "Cajas de reserva apiladas en sala",
        d: "Una columna de cajas de reserva en la esquina de la sala, por encima de la altura de los hombros. Si alguien tira de una de abajo, o un cliente roza la pila, se viene encima.",
        q: "La reserva va a la trastienda. Si tiene que quedarse en sala, nunca por encima de los hombros y con lo pesado abajo." },
      { x: 52, y: 71, r: 1, n: "El cable de la cafetera roja", t: "Cable de demo suelto en la balda",
        d: "El cable de la cafetera de exposición queda suelto sobre el borde de la balda. Un enganchón al pasar y la máquina cae al suelo, o sobre un pie.",
        q: "Cables de demo recogidos por detrás del mueble. Nada que cuelgue hacia el pasillo." },
      { x: 75, y: 92, r: 1, n: "La caja junto al expositor", t: "Caja en el suelo junto al paso",
        d: "Una caja de producto apoyada en el suelo, en el borde del paso. Es el tipo de obstáculo que provoca la caída al mismo nivel, el accidente más frecuente del comercio.",
        q: "Nada en el suelo de la zona de paso. Tampoco «un momento»." },
      { x: 14, y: 80, r: 0, n: "La balda de abajo", t: "Lo pesado, en la balda de abajo",
        d: "Las cafeteras en caja, que es lo que más pesa, están en la balda más baja. Así se cogen sin levantar peso por encima de la cintura.", q: "" },
      { x: 37, y: 34, r: 0, n: "El expositor de arriba", t: "Demo sin cables a la vista",
        d: "Las máquinas del expositor superior están conectadas por detrás: no se ve un solo cable. Así es como tiene que estar.", q: "" },
      { x: 81, y: 72, r: 0, n: "La cesta de mimbre", t: "Cesta fuera del paso",
        d: "La cesta está en su soporte, pegada a la pared y sin invadir el pasillo. Correcto.", q: "" }
    ]
  },
  {
    id: "pasillo", t: "Cuidado personal y clima", sub: "El pasillo lateral", foto: "esc-pasillo.jpg", w: 1050, h: 1400, tono: "#4FA3D1",
    intro: "Ventiladores, purificadores y cuidado personal. Fíjate en lo que está en el suelo y en lo que está muy alto.",
    puntos: [
      { x: 53, y: 95, r: 1, n: "El borde de la tarima", t: "Borde de tarima a ras de suelo",
        d: "La tarima de exposición es baja y de un tono muy parecido al del suelo: su borde no se ve cuando se camina mirando las baldas. Es un tropiezo de manual.",
        q: "Borde de las tarimas señalizado con una banda de contraste, o la tarima fuera del paso." },
      { x: 49, y: 70, r: 1, n: "La torre negra", t: "Torre alta en el canto de la tarima",
        d: "Un purificador alto y estrecho, colocado junto al borde. Un golpe con un bolso o con un carro y cae hacia el pasillo.",
        q: "Lo alto y estrecho, hacia el centro de la tarima o sujeto a la base." },
      { x: 87, y: 9, r: 0, n: "La señal verde del techo", t: "Señal de evacuación visible",
        d: "La señal de salida está a la vista y sin nada que la tape. Así tiene que estar siempre, también en campaña.", q: "" },
      { x: 76, y: 31, r: 0, n: "Las baldas altas", t: "Arriba, solo lo que pesa poco",
        d: "En las baldas altas hay secadores y planchas de pelo en caja: poco peso. Lo que se coge por encima de la cabeza tiene que pesar poco.", q: "" },
      { x: 20, y: 82, r: 0, n: "El pasillo", t: "Paso amplio y despejado",
        d: "El paso principal está libre en toda su anchura. Correcto.", q: "" }
    ]
  },
  {
    id: "campana", t: "Mesa de campaña", sub: "Día sin IVA", foto: "esc-campana.jpg", w: 1050, h: 1400, tono: "#E52143",
    intro: "Día de campaña: más clientes, más producto en sala y más prisa. Justo cuando más se relaja todo.",
    puntos: [
      { x: 33, y: 66, r: 1, n: "La pila de climatizadoras", t: "Cajas de más de 20 kg apiladas a mano",
        d: "Una climatizadora portátil en caja suele pasar de 20 kg. Reponer esta pila una a una, sin ayuda y desde el suelo, es la forma más directa de lesionarse la espalda.",
        q: "Entre dos o con carro. Rodillas dobladas, la carga pegada al cuerpo y sin girar la cintura." },
      { x: 12, y: 38, r: 1, n: "Los soportes de las cestas", t: "Patas de los soportes en el paso",
        d: "Los soportes de las cestas abren las patas hacia el pasillo. Con la tienda llena, alguien las pisa o se engancha.",
        q: "Soportes pegados a la pared o al mueble, con las patas hacia dentro." },
      { x: 87, y: 46, r: 0, n: "Los robots sobre la mesa", t: "Producto pesado a la altura de la cintura",
        d: "Los robots aspiradores en caja están sobre la mesa, a la altura de la cintura: se cogen sin agacharse y sin levantarlos por encima del pecho.", q: "" }
    ]
  },
  {
    id: "trastienda", t: "Trastienda", sub: "Donde casi todo se tuerce", luz: "#2A3140", tono: "#E8A33D",
    intro: "Donde se descarga, se almacena y se pasa con prisa. Aquí ocurren la mayoría de los accidentes de una tienda.",
    puntos: [
      { x: 20.5, y: 82, r: 1, n: "La caja del suelo", t: "Caja en mitad del paso",
        d: "Un bulto en la zona de tránsito es la primera causa de caída al mismo nivel.", q: "Se retira ahora, no «cuando acabe la descarga»." },
      { x: 50, y: 30, r: 1, n: "El extintor", t: "Extintor tapado por mercancía",
        d: "Un extintor que no se ve y no se alcanza es un extintor que no existe. Además es una infracción directa en una inspección.",
        q: "Medio metro libre alrededor y la señal visible desde el pasillo." },
      { x: 78, y: 45, r: 1, n: "La escalera", t: "Escalera de mano apoyada en la estantería",
        d: "Apoyada en una estantería, la escalera se desplaza al subir. Las caídas de altura son pocas, pero son las que mandan a alguien al hospital.",
        q: "Escalera de tijera abierta del todo, sobre suelo firme, y nunca en el último peldaño." },
      { x: 35, y: 78, r: 1, n: "El cable del suelo", t: "Cable cruzando el paso",
        d: "El cable del cargador cruzando la zona de paso. Tropezar con él es cuestión de tiempo.", q: "Pegado a la pared o por canaleta. Nunca atravesando un paso." },
      { x: 74, y: 13, r: 1, n: "La balda alta de la derecha", t: "Carga pesada en la balda alta",
        d: "Lo pesado arriba descuadra la estantería y obliga a bajarlo por encima de la cabeza.", q: "Lo pesado abajo, lo ligero arriba. Siempre." },
      { x: 62, y: 85, r: 0, n: "La transpaleta", t: "Transpaleta recogida",
        d: "Aparcada fuera del paso y con las horquillas bajadas. Bien hecho.", q: "" },
      { x: 10, y: 35, r: 0, n: "El cartel verde", t: "Botiquín señalizado y accesible",
        d: "Visible, a la altura de la vista y sin nada delante. Correcto.", q: "" }
    ]
  },
  {
    id: "almacen", t: "Almacén alto", sub: "Lo que no se ve desde la sala", luz: "#243029", tono: "#6FBF8A",
    intro: "La última zona. Aquí no entra ningún cliente, y por eso es donde más se relaja todo el mundo.",
    puntos: [
      { x: 24, y: 38, r: 1, n: "La estantería de la izquierda", t: "Estantería alta sin anclar",
        d: "Una estantería alta sin anclaje vuelca al tirar de una caja de arriba. Es el accidente grave clásico de almacén.", q: "Anclada a la pared y con la carga máxima señalizada." },
      { x: 52, y: 62, r: 1, n: "La caja del centro", t: "Levantar con la espalda doblada",
        d: "Piernas rectas y espalda curvada: el gesto que lesiona la espalda, y lo hace sin avisar, un día cualquiera.",
        q: "Doblar las rodillas, la carga pegada al cuerpo, la espalda recta. Lo muy pesado, entre dos." },
      { x: 82, y: 73, r: 1, n: "El palé", t: "Palé roto en uso",
        d: "Con tablas sueltas, la carga se desequilibra al moverlo y las astillas cortan.", q: "Palé roto, fuera de circulación el mismo día." },
      { x: 39, y: 15, r: 1, n: "La luz de encima de la puerta", t: "Luz de emergencia apagada",
        d: "Si se va la luz en una sala sin ventanas, se sale a oscuras entre estanterías.", q: "Se comprueba en la revisión mensual y se avisa en el momento." },
      { x: 75, y: 87, r: 0, n: "La línea del suelo", t: "Pasillo marcado y libre",
        d: "Delimitado y sin obstáculos. Correcto.", q: "" },
      { x: 92, y: 27, r: 0, n: "El cartel de la derecha", t: "Carga máxima señalizada",
        d: "El cartel de kilos por balda está a la vista. Bien.", q: "" }
    ]
  }
];

const ESC_FINAL = [
  { t: "¿Cuál es el accidente más frecuente en una tienda?",
    o: ["Caída desde una escalera", "Caída al mismo nivel: un tropiezo o un resbalón", "Corte con el cúter", "Golpe con la transpaleta"],
    r: 1, por: "Tropezar con algo que no debería estar ahí. Por eso casi toda la prevención en tienda es orden: no dejar nada en el paso." },
  { t: "Hay que bajar al suelo una climatizadora de la pila de campaña. ¿Cómo?",
    o: ["Tiras de ella con los brazos estirados, que es solo un momento", "Entre dos, o con carro, doblando las rodillas y con la caja pegada al cuerpo", "La deslizas por el borde de la mesa y la dejas caer", "La giras sobre una esquina hasta el suelo"],
    r: 1, por: "Más de 20 kg no se manejan solo. Rodillas dobladas, carga pegada al cuerpo y sin girar la cintura." },
  { t: "En plena campaña, el único hueco libre para un expositor es delante de la salida de emergencia. ¿Qué haces?",
    o: ["Lo pones, pero avisas al equipo", "Lo pones solo en horario de tienda", "Buscas otro sitio: la salida no se tapa nunca", "Lo pones y lo quitas si viene una inspección"],
    r: 2, por: "Una vía de evacuación bloqueada no admite matices ni horarios. Si no cabe en otro sitio, no cabe en la tienda." }
];
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


/* ---------- El juego como plantilla de preguntas ----------
   Cada objeto es una pregunta de dos opciones: 0 = «Es un riesgo», 1 = «Está
   bien». Vale 1 punto acertar. La taquilla son tres preguntas más.          */
function esc_idP(s, i) { return s.id + "-" + i; }
const ESC_PLANTILLA = {
  id: "form-seguridad", tipo: "formacion", anonima: false, curso: "seguridad", juego: true,
  nombre: { es: "Formación: Un turno seguro", en: "Training: A safe shift", fr: "Formation : Un service en sécurité" },
  intro: { es: ESC_INTRO, en: ESC_INTRO, fr: ESC_INTRO },
  aviso: { es: "Unos 20 minutos. El código sirve una sola vez, así que termínalo de una sentada.",
           en: "About 20 minutes. The code works only once.", fr: "Environ 20 minutes. Le code ne sert qu'une fois." },
  preguntas: ESC_SALAS.flatMap(s => s.puntos.map((p, i) => ({
    id: esc_idP(s, i), t: s.t + " · " + p.n, por: p.t + ". " + p.d + (p.q ? " " + p.q : ""),
    o: [{ t: "Es un riesgo", v: p.r ? 1 : 0 }, { t: "Está bien", v: p.r ? 0 : 1 }]
  }))).concat(ESC_FINAL.map((q, i) => ({
    id: "f" + i, t: q.t, por: q.por, o: q.o.map((t, k) => ({ t, v: k === q.r ? 1 : 0 }))
  })))
};
if (typeof SC !== "undefined" && SC.CONFIG && !SC.CONFIG.plantillas.some(p => p.id === ESC_PLANTILLA.id)) SC.CONFIG.plantillas.push(ESC_PLANTILLA);

/* ---------- Dónde vive el estado ----------
   Dentro de la plataforma, en S.esc (y en el navegador, para poder dejarlo a
   medias). Con código, las respuestas van en INV.respuestas, que es lo que se
   envía, y el resto en INV.esc.                                             */
let escModo = "int";
function esc_ui() {
  if (escModo === "inv") return INV.esc = INV.esc || { sala: null, ficha: null, fase: "mapa" };
  if (!S.esc || !S.esc.resp) {
    let g = null;
    try { g = JSON.parse(localStorage.getItem("sc-esc2") || "null"); } catch (e) {}
    S.esc = g && g.resp ? g : { sala: null, ficha: null, fase: "mapa", resp: {} };
  }
  return S.esc;
}
function esc_resp() { return escModo === "inv" ? INV.respuestas : esc_ui().resp; }
function esc_guardar() { if (escModo === "int") try { localStorage.setItem("sc-esc2", JSON.stringify(S.esc)); } catch (e) {} }
function esc_salaDe(id) { return ESC_SALAS.find(s => s.id === id); }
function esc_hechos(s) { const R = esc_resp(); return s.puntos.filter((p, i) => R[esc_idP(s, i)] != null).length; }
function esc_aciertos(s) { const R = esc_resp(); return s.puntos.filter((p, i) => R[esc_idP(s, i)] === (p.r ? 0 : 1)).length; }
function esc_completa(s) { return esc_hechos(s) === s.puntos.length; }
function esc_llaves() { return ESC_SALAS.filter(esc_completa).length; }
function esc_imagen(s) { return (window.ESC_IMG && window.ESC_IMG[s.foto]) || "img/" + s.foto; }

/* ---------- Escena: foto o dibujo ---------- */
function esc_fondo(s, mini) {
  if (s.foto) return `<img class="esc-foto" src="${esc_imagen(s)}" alt="${esc(s.t)}" ${mini ? 'loading="lazy"' : ""} width="${s.w}" height="${s.h}">`;
  return esc_escena(s);
}

/* ---------- Pintar ---------- */
function esc_pintar(html) {
  if (escModo === "inv") {
    $("app").innerHTML = `<div class="guest wide"><div class="esquina"><span class="chipseb">${logoSEB(32)}</span></div>
      <div class="guest-card wide esc-inv">${selectorIdioma()}${html}</div>${bandaMarcas()}</div>`;
  } else $("vista").innerHTML = `<div class="page esc">${html}</div>`;
}
function esc_repintar() {
  const u = esc_ui();
  if (u.fase === "final") return esc_pintarFinal();
  if (u.fase === "hecho" && escModo === "int") return esc_pintarHecho();
  if (u.sala) return esc_pintarSala(esc_salaDe(u.sala));
  esc_pintarMapa();
}
function pintarEscape() { escModo = "int"; esc_repintar(); }
function pintarEscapeInvitado() { escModo = "inv"; esc_repintar(); }

function esc_cabecera(titulo, sub, volver) {
  const atras = volver === "cursos" ? (escModo === "int" ? `<button class="btn small ghost" data-action="volverCursos">← Formaciones</button>` : "")
    : `<button class="btn small ghost" data-action="escMapa">← Las zonas</button>`;
  const quien = escModo === "inv" && INV.datos ? `<p class="esc-quien">${esc(INV.datos.destinatario || "")}${INV.datos.tienda ? " · " + esc(INV.datos.tienda) : ""}</p>` : "";
  return `<div class="page-h"><div>${atras}<h1>${esc(titulo)}</h1>${quien}${sub ? `<p class="muted">${esc(sub)}</p>` : ""}</div></div>`;
}

function esc_pintarMapa() {
  const n = esc_llaves(), tot = ESC_SALAS.length;
  esc_pintar(`${esc_cabecera("Un turno seguro", ESC_INTRO, "cursos")}
    <div class="esc-mapa">${ESC_SALAS.map(s => {
      const h = esc_hechos(s), ok = esc_completa(s);
      return `<button class="esc-puerta ${ok ? "ok" : ""}" data-action="escEntrar" data-s="${s.id}" style="--ton:${s.tono}">
        <span class="esc-mini">${esc_fondo(s, true)}</span>
        <span class="esc-puerta-t">${esc(s.t)}<small>${esc(s.sub)}</small></span>
        <span class="esc-estado">${ok ? `✓ Revisada · ${esc_aciertos(s)} de ${s.puntos.length} aciertos` : h ? `${h} de ${s.puntos.length} revisados` : `${s.puntos.length} objetos por revisar`}</span></button>`;
    }).join("")}</div>
    <div class="esc-llavero">
      ${ESC_SALAS.map(s => `<span class="esc-llave ${esc_completa(s) ? "on" : ""}">${esc_completa(s) ? "🔑" : "🔒"}<small>${esc(s.t)}</small></span>`).join("")}
      <button class="btn primary" data-action="escFinal" ${n < tot ? "disabled" : ""}>${n < tot ? `Faltan ${tot - n} ${tot - n === 1 ? "zona" : "zonas"}` : "Abrir la taquilla"}</button>
    </div>
    ${escModo === "int" && Object.keys(esc_resp()).length ? `<p class="hint"><button class="btn small ghost" data-action="escReiniciar">Empezar de cero</button></p>` : ""}`);
}

function esc_pintarSala(s) {
  const u = esc_ui(), R = esc_resp(), f = u.ficha != null ? s.puntos[u.ficha] : null;
  const fid = f ? esc_idP(s, u.ficha) : null, decidido = f && R[fid] != null, bien = decidido && R[fid] === (f.r ? 0 : 1);
  const ok = esc_completa(s);
  const ratio = s.foto ? `aspect-ratio:${s.w}/${s.h};max-width:calc(74vh * ${s.w} / ${s.h})` : "";
  esc_pintar(`${esc_cabecera(s.t, s.intro, "mapa")}
    <div class="esc-cuenta-l"><span class="esc-cuenta ${ok ? "ok" : ""}">${esc_hechos(s)} de ${s.puntos.length} revisados</span></div>
    <div class="esc-escena ${s.foto ? "foto" : ""}" style="--ton:${s.tono};${ratio}">
      ${esc_fondo(s)}
      ${s.puntos.map((p, i) => {
        const r = R[esc_idP(s, i)], est = r == null ? "" : r === (p.r ? 0 : 1) ? "acierto" : "fallo";
        return `<button class="esc-pt ${est} ${u.ficha === i ? "sel" : ""}" style="left:${p.x}%;top:${p.y}%" data-action="escPunto" data-i="${i}" aria-label="${esc(p.n)}"><i></i></button>`;
      }).join("")}
    </div>
    ${f ? (decidido
      ? `<section class="card esc-ficha ${bien ? "bien" : "mal"}">
          <div class="esc-veredicto">${bien ? "✓ Bien visto" : "✗ No"} · <span>${f.r ? "Es un riesgo" : "Está bien"}</span></div>
          <h2>${esc(f.t)}</h2><p>${esc(f.d)}</p>
          ${f.q ? `<p class="esc-q"><b>Qué se hace:</b> ${esc(f.q)}</p>` : ""}
          <div class="actions"><button class="btn" data-action="escCerrarFicha">Seguir revisando</button></div></section>`
      : `<section class="card esc-ficha pregunta">
          <h2>${esc(f.n)}</h2><p class="muted">¿Esto es un riesgo o está bien?</p>
          <div class="esc-decide"><button class="btn esc-b-mal" data-action="escDecide" data-v="0">⚠ Es un riesgo</button>
            <button class="btn esc-b-bien" data-action="escDecide" data-v="1">✓ Está bien</button></div></section>`)
      : `<p class="hint esc-pista">Toca cada punto y decide. Unos son riesgos y otros están bien: los fallos cuentan.</p>`}
    ${ok && !f ? `<div class="cta-rp esc-ok"><div><b>Zona revisada. Llave conseguida.</b>
      <p class="hint">${esc_aciertos(s)} de ${s.puntos.length} aciertos en ${esc(s.t.toLowerCase())}.</p></div>
      <span><button class="btn primary" data-action="escMapa">Siguiente zona</button></span></div>` : ""}`);
  const fi = document.querySelector(".esc-ficha"); if (fi && fi.scrollIntoView) fi.scrollIntoView({ block: "nearest" });
}

function esc_pintarFinal() {
  const R = esc_resp(), n = ESC_FINAL.filter((q, i) => R["f" + i] != null).length;
  esc_pintar(`${esc_cabecera("La taquilla", "Tres preguntas y has terminado. Las llaves ya están puestas.", "mapa")}
    <div class="qlist">${ESC_FINAL.map((q, i) => `<fieldset class="preg"><legend>${i + 1}. ${esc(q.t)}</legend>
      ${q.o.map((o, k) => `<label class="op ${R["f" + i] === k ? "on" : ""}"><input type="radio" name="ef${i}" ${R["f" + i] === k ? "checked" : ""}
        data-action="escResp" data-q="${i}" data-k="${k}"><span>${esc(o)}</span></label>`).join("")}</fieldset>`).join("")}</div>
    <div class="guest-f"><span class="muted num">${n} de ${ESC_FINAL.length} contestadas</span>
      <button class="btn primary" data-action="escEnviar" ${n < ESC_FINAL.length ? "disabled" : ""}>${escModo === "inv" ? "Enviar" : "Abrir la taquilla"}</button></div>`);
}

function esc_pintarHecho() {
  const R = esc_resp(), nota = SC.puntuar(ESC_PLANTILLA, R), apto = nota.pct >= 0.6;
  const fallos = ESC_SALAS.flatMap(s => s.puntos.map((p, i) => ({ s, p, i })).filter(x => R[esc_idP(x.s, x.i)] !== (x.p.r ? 0 : 1)));
  esc_pintar(`${esc_cabecera("Un turno seguro", "", "cursos")}
    <div class="nota-inv ${apto ? "ok" : "ko"}"><b>${nota.obt} de ${nota.puntuables}</b>
      <span>${apto ? "Formación superada." : "No llega al 60 %. Repásalo con tu responsable."}</span></div>
    ${fallos.length ? `<section class="card"><h2>Lo que se te escapó</h2><ul class="repaso">${fallos.map(x =>
      `<li class="ko"><b>${esc(x.s.t)} · ${esc(x.p.t)}</b><span>${x.p.r ? "Era un riesgo." : "Estaba bien."} ${esc(x.p.d)}</span>${x.p.q ? `<small>${esc(x.p.q)}</small>` : ""}</li>`).join("")}</ul></section>` : ""}
    <section class="card"><h2>Los riesgos de la tienda</h2>
      <p class="hint">Todo lo que había que ver, por zona. Imprímelo y cuélgalo en la trastienda.</p>
      ${ESC_SALAS.map(s => `<h3 class="esc-h3">${esc(s.t)}</h3><ul class="lista cuidado">
        ${s.puntos.filter(p => p.r).map(p => `<li><b>${esc(p.t)}</b>. ${esc(p.q)}</li>`).join("")}</ul>`).join("")}
      <div class="actions"><button class="btn" data-action="escImprimir">Imprimir el resumen</button>
        <button class="btn ghost" data-action="escReiniciar">Volver a empezar</button></div></section>`);
}

/* ---------- Acciones ----------
   Todas repintan solas y devuelven false: así funcionan igual dentro de la
   plataforma y en la pantalla de invitado, que no repinta por su cuenta.   */
const ACCIONES_ESC = {
  escEntrar(b) { const u = esc_ui(); u.sala = b.dataset.s; u.ficha = null; u.fase = "sala"; esc_guardar(); esc_repintar(); window.scrollTo(0, 0); return false; },
  escMapa() { const u = esc_ui(); u.sala = null; u.ficha = null; u.fase = "mapa"; esc_guardar(); esc_repintar(); window.scrollTo(0, 0); return false; },
  escPunto(b) { esc_ui().ficha = Number(b.dataset.i); esc_repintar(); return false; },
  escCerrarFicha() { esc_ui().ficha = null; esc_repintar(); return false; },
  escDecide(b) {
    const u = esc_ui(), s = esc_salaDe(u.sala), R = esc_resp(), id = esc_idP(s, u.ficha);
    if (R[id] == null) R[id] = Number(b.dataset.v);   // la primera decisión es la que cuenta
    if (esc_completa(s)) toast("Zona revisada: llave conseguida");
    esc_guardar(); esc_repintar(); return false;
  },
  escFinal() { esc_ui().fase = "final"; esc_repintar(); window.scrollTo(0, 0); return false; },
  escResp(b) { esc_resp()["f" + b.dataset.q] = Number(b.dataset.k); esc_guardar(); esc_repintar(); return false; },
  async escEnviar() {
    if (escModo === "inv") { await ACCIONES_INVITADO.invEnviar(); return false; }
    const u = esc_ui(), nota = SC.puntuar(ESC_PLANTILLA, esc_resp());
    u.fase = "hecho";
    const p = progreso();
    p.seguridad = Object.assign(p.seguridad || {}, { completado: new Date().toISOString(), test: { aciertos: nota.obt, total: nota.puntuables } });
    guardarProgreso(p); esc_guardar(); esc_repintar(); window.scrollTo(0, 0); return false;
  },
  escImprimir() {
    $("print").innerHTML = `<div class="page"><h1>Un turno seguro · los riesgos de la tienda</h1>
      ${ESC_SALAS.map(s => `<h2>${esc(s.t)}</h2><ul>${s.puntos.filter(p => p.r).map(p => `<li><b>${esc(p.t)}</b><br>${esc(p.d)}<br><i>${esc(p.q)}</i></li>`).join("")}</ul>`).join("")}</div>`;
    window.print(); return false;
  },
  escReiniciar() {
    if (escModo === "int") { S.esc = { sala: null, ficha: null, fase: "mapa", resp: {} }; esc_guardar(); }
    esc_repintar(); return false;
  }
};
if (typeof ACCIONES_INVITADO !== "undefined") Object.assign(ACCIONES_INVITADO, ACCIONES_ESC);
