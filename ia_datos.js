"use strict";
/* ===================== FORMACIÓN DE IA · contenido =====================
   Contenido del curso de inteligencia artificial (Reglamento europeo de IA
   y su aplicación en el trabajo), traído del prototipo «Vigente».
   Versión 2026.10.1, verificado a 3 de octubre de 2026.
   Generado a partir de lib/content.mjs de Vigente: si cambia el contenido,
   se regenera este archivo en lugar de editarlo a mano.
   modulos[i]: itin ("nucleo" | "trabajo"), t, vig, min, c (HTML), p (3 preguntas: q, o, c = correcta, e = explicación)
   examen: las 12 preguntas del examen final, como "módulo-pregunta"
   ======================================================================= */
const IA_DATOS = {
 "meta": {
  "version": "2026.10.1",
  "verificado": "3 de octubre de 2026",
  "aprobado": 9,
  "nExamen": 12
 },
 "modulos": [
  {
   "itin": "nucleo",
   "t": "Qué regula y qué eres tú en él",
   "vig": "Base de todo lo demás",
   "min": 6,
   "c": "<p>El Reglamento (UE) 2024/1689 es un reglamento, no una directiva: se aplica directamente en España sin necesidad de transposición. La ley española en tramitación no lo reemplaza; designa autoridades y articula el procedimiento sancionador interno.</p>\n<p>Fue modificado en julio de 2026 por el Reglamento (UE) 2026/1744, el Ómnibus Digital, que reordenó el calendario y alivió cargas documentales para pymes. Conviene trabajar siempre con el texto consolidado.</p>\n<h4>La pregunta que decide todo lo demás</h4>\n<p>Tus obligaciones dependen del papel que ocupes, no del tamaño de tu empresa:</p>\n<ul>\n<li><b>Proveedor</b>: desarrolla un sistema de IA y lo introduce en el mercado o lo pone en servicio con su nombre o marca.</li>\n<li><b>Responsable del despliegue</b>: utiliza un sistema de IA bajo su autoridad en su actividad profesional. Aquí está la inmensa mayoría de las empresas.</li>\n<li><b>Importador</b> y <b>distribuidor</b>: introducen o comercializan en la Unión sistemas de terceros.</li>\n<li><b>Fabricante de producto</b>: incorpora IA a un producto que vende con su marca.</li>\n</ul>\n<p>Usar una herramienta de terceros no te convierte en proveedor. Pero hay dos puertas por las que se cambia de papel casi sin darse cuenta: ponerle tu marca a un sistema ajeno, o modificarlo sustancialmente o cambiar su finalidad prevista.</p>\n<h4>Alcance territorial</h4>\n<p>Alcanza a quien está fuera de la Unión si el resultado del sistema se utiliza dentro de ella.</p>",
   "p": [
    {
     "q": "Una empresa usa una herramienta de IA de un proveedor estadounidense para redactar descripciones de puesto. ¿Qué papel tiene?",
     "o": [
      "Proveedor, porque genera contenido con IA",
      "Responsable del despliegue",
      "Importador",
      "Ninguno: las herramientas de terceros quedan fuera"
     ],
     "c": 1,
     "e": "Utiliza bajo su autoridad un sistema desarrollado por otro en su actividad profesional. Es responsable del despliegue."
    },
    {
     "q": "¿Qué hace que un responsable del despliegue pase a tener obligaciones de proveedor?",
     "o": [
      "Tener más de 50 empleados",
      "Pagar una licencia empresarial",
      "Comercializarlo con su marca o modificarlo sustancialmente",
      "Usarlo con datos personales"
     ],
     "c": 2,
     "e": "Poner la marca propia, modificar sustancialmente el sistema o alterar su finalidad prevista arrastran las obligaciones de proveedor."
    },
    {
     "q": "El Reglamento (UE) 2026/1744 es:",
     "o": [
      "La ley española de IA",
      "El Ómnibus Digital, que modifica el Reglamento de IA",
      "El reglamento de protección de datos",
      "El estatuto de la AESIA"
     ],
     "c": 1,
     "e": "Es el Ómnibus Digital sobre IA, en vigor desde el 27 de julio de 2026, que reformó plazos y simplificó obligaciones."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "La escalera de riesgo",
   "vig": "Arquitectura del Reglamento",
   "min": 5,
   "c": "<p>La norma no dice si una tecnología es legal. Dice cuánto riesgo genera un uso concreto en un contexto concreto, y gradúa las obligaciones. El mismo modelo puede estar en el peldaño más bajo y en el más alto según para qué lo pongas a trabajar.</p>\n<h4>Riesgo inaceptable</h4><p>Prohibido, sin excepciones comerciales. Vigente desde el 2 de febrero de 2025.</p>\n<h4>Alto riesgo</h4><p>Permitido con el bloque completo de requisitos: gestión de riesgos, gobernanza de datos, documentación técnica, registros automáticos, transparencia hacia el usuario, supervisión humana, precisión, robustez, ciberseguridad, evaluación de conformidad y marcado CE.</p>\n<h4>Riesgo limitado</h4><p>No hay requisitos de producto, hay deberes de información. Si una persona puede confundir una máquina con una persona, o un contenido generado con uno real, hay que decirlo.</p>\n<h4>Riesgo mínimo</h4><p>Todo lo demás. Sin obligaciones específicas del Reglamento, lo que no significa sin obligaciones: el RGPD, el derecho laboral y la propiedad intelectual siguen ahí, y el artículo 4 también.</p>\n<h4>Los modelos de propósito general van aparte</h4><p>No encajan en la escalera porque no tienen una finalidad concreta. Tienen su propio régimen, con un escalón adicional para los de riesgo sistémico.</p>",
   "p": [
    {
     "q": "¿De qué depende que un sistema sea de alto riesgo?",
     "o": [
      "De la potencia del modelo",
      "De la finalidad y el contexto de uso",
      "Del número de usuarios",
      "De si usa redes neuronales"
     ],
     "c": 1,
     "e": "La clasificación responde al uso previsto y al contexto, no a la sofisticación técnica."
    },
    {
     "q": "Un sistema de riesgo mínimo:",
     "o": [
      "No tiene ninguna obligación legal",
      "Queda fuera del RGPD",
      "Sigue sujeto al artículo 4 y a la normativa general",
      "Requiere marcado CE"
     ],
     "c": 2,
     "e": "El Reglamento no le impone requisitos de producto, pero el artículo 4 y normas como el RGPD siguen aplicando."
    },
    {
     "q": "Los modelos de propósito general:",
     "o": [
      "Son siempre de alto riesgo",
      "Están siempre prohibidos",
      "Tienen un régimen propio, al margen de los cuatro niveles",
      "Son de riesgo mínimo por definición"
     ],
     "c": 2,
     "e": "Tienen un capítulo propio, con obligaciones específicas y un régimen reforzado para los de riesgo sistémico."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "Prácticas prohibidas",
   "vig": "Art. 5 · vigente desde el 2 de febrero de 2025",
   "min": 7,
   "c": "<p>Ocho familias de prácticas quedan fuera del mercado europeo. No hay evaluación de conformidad que las salve ni consentimiento que las habilite.</p>\n<ul>\n<li>Técnicas subliminales, manipuladoras o engañosas que distorsionen materialmente el comportamiento y causen un perjuicio considerable.</li>\n<li>Explotación de vulnerabilidades por edad, discapacidad o situación social o económica.</li>\n<li>Puntuación social que derive en trato perjudicial en contextos ajenos a aquel en que se recogieron los datos, o desproporcionado.</li>\n<li>Predicción del riesgo de delinquir basada únicamente en perfilado o rasgos de personalidad.</li>\n<li>Bases de datos de reconocimiento facial creadas mediante raspado indiscriminado de internet o de cámaras.</li>\n<li><b>Inferencia de emociones en el lugar de trabajo y en centros educativos</b>, salvo por motivos médicos o de seguridad.</li>\n<li>Categorización biométrica para deducir raza, opiniones políticas, afiliación sindical, convicciones religiosas, vida sexual u orientación sexual.</li>\n<li>Identificación biométrica remota en tiempo real en espacios públicos con fines policiales, salvo supuestos tasados.</li>\n</ul>\n<div class=\"aviso\"><b>Lo que más se incumple sin querer en recursos humanos.</b> La prohibición de inferir emociones en el contexto laboral alcanza a las videoentrevistas que puntúan entusiasmo o nerviosismo, y a las analíticas de reuniones que miden el ánimo del equipo. Se compran como productos de selección o de bienestar y son prácticas prohibidas.</div>\n<h4>Dos prohibiciones nuevas desde el 2 de diciembre de 2026</h4>\n<p>El Ómnibus añadió, a petición de España, la generación mediante IA de contenidos íntimos o sexuales sin consentimiento y de material de abuso sexual infantil.</p>\n<h4>Consecuencias</h4>\n<p>Hasta 35 millones de euros o el 7 % del volumen de negocio mundial, la cifra mayor. En España, el procedimiento sancionador nacional depende de una ley que sigue en tramitación.</p>",
   "p": [
    {
     "q": "Una empresa quiere implantar un software que analice el tono de voz de sus comerciales para medir su motivación. ¿Es legal?",
     "o": [
      "Sí, si los empleados consienten",
      "Sí, si no se guardan los audios",
      "No, es una práctica prohibida",
      "Sí, pero debe registrarse como alto riesgo"
     ],
     "c": 2,
     "e": "Inferir emociones en el contexto laboral es una práctica prohibida salvo motivos médicos o de seguridad. El consentimiento no la habilita."
    },
    {
     "q": "¿Cuál es el tope sancionador para las prácticas prohibidas?",
     "o": [
      "15 M€ o el 3 %",
      "35 M€ o el 7 %",
      "20 M€ o el 4 %",
      "10 M€ o el 2 %"
     ],
     "c": 1,
     "e": "Hasta 35 millones de euros o el 7 % del volumen de negocio mundial anual."
    },
    {
     "q": "Las prohibiciones sobre contenido íntimo no consentido y material de abuso sexual infantil generados con IA se aplican desde:",
     "o": [
      "Febrero de 2025",
      "Agosto de 2026",
      "2 de diciembre de 2026",
      "Diciembre de 2027"
     ],
     "c": 2,
     "e": "Las incorporó el Ómnibus Digital con fecha de aplicación del 2 de diciembre de 2026."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "Alfabetización en IA",
   "vig": "Art. 4 · vigente desde el 2 de febrero de 2025",
   "min": 6,
   "c": "<p>Es la obligación que casi nadie tiene documentada. Proveedores y responsables del despliegue deben adoptar medidas para garantizar, en la medida de lo posible, un nivel suficiente de alfabetización en IA entre su personal y quienes operan los sistemas por su cuenta.</p>\n<h4>Es una obligación de medios</h4>\n<p>El Ómnibus matizó la redacción: lo exigible es adoptar medidas que apoyen la alfabetización, no certificar un nivel por persona. Baja el listón de la prueba, no lo elimina.</p>\n<h4>Proporcional a cuatro variables</h4>\n<ul><li>Conocimientos, experiencia y formación previa de las personas.</li><li>Contexto de uso.</li><li>Colectivos sobre los que se usan los sistemas.</li><li>Nivel de riesgo.</li></ul>\n<h4>No existe un certificado oficial</h4>\n<p>La Comisión Europea lo escribió en julio de 2026: «no hace falta un certificado», basta un registro interno. La AESIA no certifica cursos ni sistemas. Lo que se enseña en una inspección es un expediente: plan, contenidos, destinatarios, fechas, evaluación y actualización.</p>\n<h4>Se aplica aunque tu riesgo sea mínimo</h4>\n<p>El artículo 4 no distingue por nivel de riesgo. Desde el 2 de agosto de 2026 su supervisión corresponde a las autoridades nacionales de vigilancia.</p>",
   "p": [
    {
     "q": "Una empresa de 40 personas solo usa un asistente conversacional para redactar correos. ¿Le aplica el artículo 4?",
     "o": [
      "No, solo a sistemas de alto riesgo",
      "No, solo a empresas de más de 250 empleados",
      "Sí, el artículo 4 no distingue por nivel de riesgo",
      "Solo si es proveedora"
     ],
     "c": 2,
     "e": "La obligación alcanza a proveedores y responsables del despliegue con independencia del riesgo."
    },
    {
     "q": "¿Qué acredita el cumplimiento del artículo 4?",
     "o": [
      "Un certificado emitido por la AESIA",
      "Un sello europeo de conformidad",
      "La evidencia interna: plan, contenidos, destinatarios y fechas",
      "El marcado CE"
     ],
     "c": 2,
     "e": "No existe certificación oficial. Lo exigible es demostrar las medidas adoptadas con documentación interna."
    },
    {
     "q": "Tras el Ómnibus Digital, el artículo 4 se formula como:",
     "o": [
      "Obligación de resultado: cada empleado debe alcanzar un nivel certificado",
      "Obligación de medios: adoptar medidas que apoyen la alfabetización",
      "Recomendación sin efecto jurídico",
      "Obligación solo para el sector público"
     ],
     "c": 1,
     "e": "Exige adoptar medidas de apoyo, no garantizar un nivel concreto por persona."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "Transparencia",
   "vig": "Art. 50 · vigente desde el 2 de agosto de 2026",
   "min": 7,
   "c": "<p>Es la obligación viva hoy y la que el ruido sobre el aplazamiento dejó en segundo plano. El Ómnibus movió el alto riesgo y dejó el artículo 50 en su fecha, con una única gracia.</p>\n<h4>Sistemas que interactúan con personas</h4><p>Hay que informar de que se interactúa con una IA, salvo que resulte evidente para una persona razonablemente atenta. Un chatbot con nombre y avatar humano no es evidente. Los empleados que usan un asistente interno también son personas a estos efectos.</p>\n<h4>Contenido sintético</h4><p>Los proveedores de sistemas generativos deben marcar las salidas en un formato legible por máquina. Conviene comprobar que la marca sobrevive al flujo de publicación: muchos pipelines eliminan los metadatos al redimensionar.</p>\n<div class=\"aviso\"><b>La gracia del Ómnibus.</b> Para los sistemas generativos que ya estaban en el mercado antes del 2 de agosto de 2026, el marcado legible por máquina tiene hasta el 2 de diciembre de 2026. El aviso al usuario y la revelación de deepfakes no tienen gracia. El contenido generado antes del 2 de agosto no requiere etiquetado retroactivo.</div>\n<h4>Deepfakes</h4><p>Quien despliega un sistema que genera imagen, audio o vídeo que se asemeje a personas, objetos o hechos reales debe revelar que es artificial.</p>\n<h4>Texto informativo publicado</h4><p>Si se publica texto generado para informar al público sobre asuntos de interés público, hay que revelarlo, salvo revisión humana con responsabilidad editorial.</p>\n<h4>Emociones y categorización biométrica</h4><p>Cuando no estén prohibidos, hay que informar a las personas expuestas y cumplir el RGPD.</p>\n<h4>Las directrices de la Comisión</h4><p>Adoptadas el 20 de julio de 2026. No son vinculantes, y lo dicen: la interpretación auténtica corresponde al Tribunal de Justicia. Advierten de que las referencias genéricas en términos y condiciones «difícilmente serán suficientes».</p>\n<h4>Consecuencias</h4><p>Hasta 15 millones de euros o el 3 %. A octubre de 2026 ninguna autoridad nacional ha sancionado todavía bajo este artículo.</p>",
   "p": [
    {
     "q": "El Ómnibus Digital aplazó el alto riesgo. ¿Qué pasó con el artículo 50?",
     "o": [
      "Se aplazó también a diciembre de 2027",
      "Se derogó",
      "Se mantuvo en el 2 de agosto de 2026, con gracia solo para el marcado de sistemas preexistentes",
      "Pasó a ser voluntario"
     ],
     "c": 2,
     "e": "La transparencia quedó en su fecha. La única gracia, hasta el 2 de diciembre de 2026, es para el marcado legible por máquina de sistemas generativos ya comercializados."
    },
    {
     "q": "Una agencia publica artículos redactados con IA sobre novedades fiscales, sin revisión. Debe:",
     "o": [
      "No hacer nada, es texto de riesgo mínimo",
      "Revelar que el contenido está generado por IA",
      "Registrarlo en la base de datos de la UE",
      "Solicitar autorización a la AESIA"
     ],
     "c": 1,
     "e": "El texto publicado para informar al público debe revelar su origen, salvo revisión humana con responsabilidad editorial."
    },
    {
     "q": "Las directrices de la Comisión sobre el artículo 50:",
     "o": [
      "Son vinculantes y sustituyen al Reglamento",
      "Orientan la interpretación, pero no son vinculantes",
      "Solo aplican al sector público",
      "Fueron anuladas por el Ómnibus"
     ],
     "c": 1,
     "e": "Adoptadas el 20 de julio de 2026, no son vinculantes: la interpretación auténtica corresponde al TJUE."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "Alto riesgo",
   "vig": "Anexo III · aplazado al 2 de diciembre de 2027",
   "min": 8,
   "c": "<p>El Ómnibus trasladó las obligaciones del Anexo III al 2 de diciembre de 2027 y las del Anexo I al 2 de agosto de 2028. El motivo: las normas armonizadas del CEN-CENELEC no estaban listas (a mediados de 2026, ninguna citada en el DOUE) y faltaban autoridades y organismos de evaluación en los Estados.</p>\n<h4>Qué hay en el Anexo III</h4>\n<ul>\n<li>Biometría, incluida la identificación remota no prohibida y el reconocimiento de emociones fuera del trabajo.</li>\n<li>Infraestructuras críticas.</li>\n<li>Educación y formación profesional: admisión, evaluación, detección de fraude.</li>\n<li><b>Empleo y gestión de trabajadores</b>: cribado, decisiones de promoción o extinción, asignación de tareas, seguimiento y evaluación del desempeño.</li>\n<li>Servicios esenciales, solvencia crediticia, seguros de vida y salud, emergencias.</li>\n<li>Aplicación de la ley, migración, justicia, procesos democráticos.</li>\n</ul>\n<h4>Requisitos del proveedor</h4><p>Gestión de riesgos durante todo el ciclo de vida, gobernanza de datos, documentación técnica, registros automáticos, instrucciones de uso, diseño que permita supervisión humana, precisión y robustez, ciberseguridad, evaluación de conformidad, marcado CE e inscripción en la base de datos de la Unión.</p>\n<h4>Obligaciones del responsable del despliegue</h4>\n<ul>\n<li>Usar el sistema conforme a las instrucciones.</li>\n<li>Supervisión humana por personas con competencia, formación y autoridad. Si solo puede mirar la decisión, no es supervisión.</li>\n<li>Conservar los registros automáticos.</li>\n<li><b>Informar a los trabajadores y a su representación</b> antes de poner en servicio un sistema de alto riesgo en el trabajo (art. 26.7, diferido también a diciembre de 2027; pero el art. 64.4.d del Estatuto ya obliga hoy a informar al comité).</li>\n<li>Evaluación de impacto en los derechos fundamentales en los supuestos previstos (art. 27).</li>\n</ul>\n<div class=\"aviso\"><b>El aplazamiento es margen, no amnistía.</b> El borrador de directrices de la Comisión de mayo de 2026 considera probablemente de alto riesgo las herramientas que puntúan o filtran candidatos aunque la decisión final sea humana. Un sistema de selección que entre en producción en 2027 sin trazabilidad ni registros costará mucho más rehacerlo que diseñarlo conforme ahora.</div>",
   "p": [
    {
     "q": "Un sistema que ordena candidaturas está en el Anexo III. ¿Desde cuándo debe cumplir el régimen de alto riesgo?",
     "o": [
      "2 de agosto de 2026",
      "2 de diciembre de 2026",
      "2 de diciembre de 2027",
      "2 de agosto de 2028"
     ],
     "c": 2,
     "e": "El Ómnibus trasladó el Anexo III al 2 de diciembre de 2027. El Anexo I va a agosto de 2028."
    },
    {
     "q": "Un ATS ordena candidatos pero la decisión final la toma una persona. Según el borrador de directrices de la Comisión:",
     "o": [
      "Deja de ser alto riesgo",
      "Sigue siendo probablemente de alto riesgo",
      "Pasa a riesgo mínimo si la persona firma",
      "Pasa a transparencia"
     ],
     "c": 1,
     "e": "El borrador de mayo de 2026 considera probablemente de alto riesgo las herramientas que puntúan o filtran candidatos aunque la decisión final sea humana."
    },
    {
     "q": "¿Por qué se aplazaron las obligaciones de alto riesgo?",
     "o": [
      "Solo por presión de las grandes tecnológicas",
      "Porque las normas armonizadas y las estructuras nacionales no estaban listas",
      "Porque se consideró que el riesgo era menor",
      "Porque se derogó el Anexo III"
     ],
     "c": 1,
     "e": "Ausencia de normas armonizadas del CEN-CENELEC y retrasos en la designación de autoridades y organismos de evaluación."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "Modelos de propósito general",
   "vig": "Cap. V · vigente desde el 2 de agosto de 2025",
   "min": 6,
   "c": "<p>Un GPAI es un modelo entrenado con grandes volúmenes de datos, con generalidad considerable, que sirve para tareas muy distintas. No encaja en la escalera y recibe un régimen propio.</p>\n<h4>Obligaciones del proveedor</h4>\n<ul><li>Documentación técnica del modelo y de su entrenamiento.</li><li>Información para quienes lo integren.</li><li>Política de cumplimiento de derechos de autor de la Unión.</li><li>Resumen público suficientemente detallado de los contenidos de entrenamiento.</li></ul>\n<h4>Riesgo sistémico</h4><p>Evaluación con pruebas adversarias, mitigación de riesgos sistémicos, notificación de incidentes graves a la Oficina de IA, ciberseguridad reforzada.</p>\n<h4>La primera acción de la Oficina de IA</h4><p>El 29 de agosto de 2026 envió las primeras solicitudes de información (art. 91) a más de treinta proveedores de modelos, en dos líneas: seguridad de los modelos más avanzados, y derechos de autor y transparencia. Responder con inexactitudes expone a multas de hasta 15 M€ o el 3 %.</p>\n<h4>Qué significa para quien no entrena modelos</h4><p>Que la diligencia debida es exigible hacia arriba. Si integras un GPAI, necesitas su documentación para cumplir tus propias obligaciones, y hay que pedirla en el contrato. Si lo comercializas con tu marca, puedes estar asumiendo el papel de proveedor del sistema resultante.</p>",
   "p": [
    {
     "q": "Un proveedor de GPAI debe publicar:",
     "o": [
      "El código fuente",
      "Los pesos del modelo",
      "Un resumen suficientemente detallado de los contenidos de entrenamiento",
      "La lista de sus clientes"
     ],
     "c": 2,
     "e": "Resumen público suficientemente detallado sobre los contenidos usados para entrenar el modelo."
    },
    {
     "q": "¿Qué hizo la Oficina de IA el 29 de agosto de 2026?",
     "o": [
      "Impuso las primeras multas del Reglamento",
      "Envió solicitudes de información a más de treinta proveedores de modelos",
      "Prohibió un modelo",
      "Publicó las normas armonizadas"
     ],
     "c": 1,
     "e": "Primera acción formal de aplicación: solicitudes de información del artículo 91. A octubre de 2026 no hay multas bajo el Reglamento en la UE."
    },
    {
     "q": "Si integras un GPAI de terceros en tu producto y lo vendes con tu marca:",
     "o": [
      "Sigues siendo solo responsable del despliegue",
      "Puedes asumir el papel de proveedor del sistema resultante",
      "Quedas exento por usar tecnología de terceros",
      "La responsabilidad es íntegramente del proveedor del modelo"
     ],
     "c": 1,
     "e": "Comercializar con marca propia arrastra las obligaciones de proveedor sobre el sistema resultante."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "España: quién vigila y qué se juega",
   "vig": "Autoridades, ley en tramitación y lo que ya sanciona",
   "min": 7,
   "c": "<p>El Reglamento es de aplicación directa, pero no puede designar autoridades nacionales ni regular el procedimiento sancionador de cada Estado. De eso se ocupa la capa española, que todavía está incompleta.</p>\n<h4>La AESIA</h4><p>Creada por el Real Decreto 729/2023, con sede en A Coruña, primera agencia nacional de supervisión de IA de la Unión. Supervisa, asesora y divulga. No certifica cursos ni sistemas, y no autoriza previamente nada.</p>\n<div class=\"aviso\"><b>La AESIA no puede multar todavía.</b> El régimen sancionador europeo está en vigor desde agosto de 2025, pero en España solo una norma con rango de ley puede tipificar infracciones. Esa norma es el Proyecto de Ley Orgánica 121/000096, que a 3 de octubre de 2026 acumula seis prórrogas del plazo de enmiendas sin votación. Quien sanciona hoy el mal uso de IA es la AEPD, por RGPD. No hay ninguna multa bajo el Reglamento de IA en ningún Estado miembro.</div>\n<h4>Ocho autoridades</h4><p>El proyecto reparte la vigilancia: AESIA, AEPD en datos y biometría, Banco de España, CNMV y DGSFP en finanzas y seguros, CGPJ en justicia, CNMC, y las que se designen. Prevé sanciones leves hasta 500.000 € o el 0,5 % y muy graves hasta 35 M€ o el 7 %, un inventario de IA en el sector público y la figura del delegado de IA.</p>\n<h4>La AEPD en 2026</h4><p>Guía de IA agéntica en febrero (trazabilidad de operaciones, niveles de autonomía) y nota técnica de calidad de datos el 21 de julio (la exactitud como adecuación al propósito, métricas y monitorización). Un sistema de riesgo mínimo para el Reglamento puede ser un tratamiento ilícito para el RGPD.</p>\n<h4>El sandbox</h4><p>El RD 817/2023 estableció un entorno controlado de pruebas, pero el del artículo 57 del Reglamento no puede convocarse en España hasta que la ley lo habilite. El plazo europeo es agosto de 2027.</p>",
   "p": [
    {
     "q": "A 3 de octubre de 2026, ¿puede la AESIA imponer una multa por incumplir el Reglamento de IA?",
     "o": [
      "Sí, desde agosto de 2025",
      "Sí, desde agosto de 2026",
      "No: falta la ley española que tipifique las infracciones",
      "Sí, pero solo a grandes empresas"
     ],
     "c": 2,
     "e": "Solo una norma con rango de ley puede tipificar infracciones, y el proyecto 121/000096 sigue en enmiendas. Hoy quien sanciona es la AEPD, por RGPD."
    },
    {
     "q": "¿Puede la AESIA emitir un certificado de cumplimiento del Reglamento?",
     "o": [
      "Sí, es su función principal",
      "Sí, para alto riesgo",
      "No, no certifica ni autoriza previamente",
      "Solo para empresas públicas"
     ],
     "c": 2,
     "e": "Supervisa, asesora y divulga; no expide certificados ni autoriza sistemas."
    },
    {
     "q": "Si un sistema de IA trata datos personales:",
     "o": [
      "Se aplica solo el Reglamento de IA",
      "Se aplica solo el RGPD",
      "Ambas normas se aplican de forma acumulativa",
      "La empresa elige"
     ],
     "c": 2,
     "e": "El Reglamento de IA no desplaza al RGPD: ambos se aplican simultáneamente."
    }
   ]
  },
  {
   "itin": "nucleo",
   "t": "Particulares: tus derechos",
   "vig": "Para quien está al otro lado del sistema",
   "min": 6,
   "c": "<p>El Reglamento se escribió sobre todo para quien desarrolla y despliega, pero reconoce posiciones concretas a quien recibe los efectos.</p>\n<h4>Saber que hay una máquina delante</h4><p>Desde el 2 de agosto de 2026, un chatbot o una voz automatizada que te atienda debe dejar claro que no es una persona. El contenido que imita personas o hechos reales debe ir revelado.</p>\n<h4>Que no te analicen las emociones en el trabajo ni en clase</h4><p>Prohibido desde febrero de 2025, salvo motivos médicos o de seguridad.</p>\n<h4>Conocer las reglas del algoritmo que te afecta en el trabajo</h4><p>Desde el 5 de octubre de 2026 (RD 723/2026) puedes pedir por escrito las pautas, criterios y reglas de funcionamiento de los sistemas algorítmicos que inciden en tu jornada, tareas, salario, progresión o extinción. La empresa tiene treinta días hábiles. Tu comité ya tenía derecho a esa información desde 2021.</p>\n<h4>Tus derechos de protección de datos siguen intactos</h4><p>Acceso, rectificación, supresión, oposición y el derecho a no ser objeto de decisiones automatizadas con efectos relevantes sin intervención humana. Exigibles hoy ante la AEPD.</p>\n<h4>Dónde reclamar</h4>\n<ul><li><b>AEPD</b>: cuando hay datos personales, que es casi siempre. Es quien sanciona hoy.</li><li><b>Representación legal e Inspección de Trabajo</b>: en el ámbito laboral.</li><li><b>AESIA</b>: incumplimientos del Reglamento; el mecanismo de reclamación se concretará con la ley.</li><li><b>Vía judicial</b>: daños, imagen, honor, propiedad intelectual.</li></ul>\n<h4>Si generan contenido íntimo tuyo con IA</h4><p>Prohibición expresa desde el 2 de diciembre de 2026. Al margen de ella, puede ser delito y la vía penal no espera.</p>",
   "p": [
    {
     "q": "Un chatbot de una tienda te atiende con nombre de persona sin indicar que es una IA. Desde agosto de 2026:",
     "o": [
      "Es correcto si el servicio es gratuito",
      "Incumple la transparencia del artículo 50",
      "Solo importa si es de alto riesgo",
      "Depende de si guardan tus datos"
     ],
     "c": 1,
     "e": "Hay que informar de que se interactúa con una IA salvo que sea evidente."
    },
    {
     "q": "Desde el 5 de octubre de 2026, un trabajador puede:",
     "o": [
      "Exigir que se desconecte cualquier algoritmo",
      "Pedir por escrito las reglas de funcionamiento de los algoritmos que le afectan",
      "Denunciar directamente ante la Comisión Europea",
      "Pedir el código fuente"
     ],
     "c": 1,
     "e": "El RD 723/2026 crea el derecho individual a conocer la existencia y las reglas de los sistemas algorítmicos que afectan a sus condiciones, con respuesta en treinta días hábiles."
    },
    {
     "q": "¿Qué autoridad sanciona hoy en España el mal uso de IA con datos personales?",
     "o": [
      "La AESIA",
      "La AEPD",
      "La Comisión Europea",
      "Ninguna hasta 2027"
     ],
     "c": 1,
     "e": "La AEPD, por RGPD. La AESIA no puede sancionar hasta que se apruebe la ley de gobernanza."
    }
   ]
  },
  {
   "itin": "trabajo",
   "t": "El comité y el algoritmo",
   "vig": "Art. 64.4.d ET · vigente desde agosto de 2021",
   "min": 6,
   "c": "<p>Mucho antes del Reglamento de IA, España ya tenía una norma sobre algoritmos en el trabajo, y es la que la Inspección puede exigir hoy mismo.</p>\n<h4>Qué dice</h4>\n<p>El artículo 64.4.d del Estatuto de los Trabajadores, introducido por el Real Decreto-ley 9/2021 (la llamada ley rider) y en vigor desde el 12 de agosto de 2021, da al comité de empresa el derecho a ser informado de los <b>parámetros, reglas e instrucciones</b> en los que se basan los algoritmos o sistemas de inteligencia artificial que afectan a la toma de decisiones que pueden incidir en las condiciones de trabajo, el acceso y el mantenimiento del empleo, incluida la elaboración de perfiles.</p>\n<h4>A quién alcanza</h4>\n<p>A cualquier empresa con representación legal de los trabajadores, sea cual sea el sector. No es solo para plataformas de reparto: un cuadrante de turnos automatizado, un sistema que puntúa productividad o un ATS que ordena candidaturas internas entran de lleno.</p>\n<h4>Qué hay que entregar</h4>\n<ul>\n<li>Qué sistemas existen y para qué decisiones se usan.</li>\n<li>Qué variables tienen en cuenta y con qué peso o lógica.</li>\n<li>Qué reglas e instrucciones se les han dado.</li>\n<li>Cómo interviene una persona en la decisión final.</li>\n</ul>\n<p>No hay que entregar el código fuente ni secretos empresariales, pero sí una explicación comprensible. El Ministerio de Trabajo publicó una guía práctica sobre esta obligación con un modelo de documento.</p>\n<div class=\"aviso\"><b>Lo que ya se inspecciona.</b> En noviembre de 2025 la Inspección de Trabajo anunció una campaña de control algorítmico en plataformas. Es el primer eslabón: cuando el artículo 26.7 del Reglamento de IA llegue en diciembre de 2027, lo hará sobre una obligación que en España ya existe y ya se revisa.</div>\n<h4>Cómo encaja con el Reglamento de IA</h4>\n<p>El Reglamento exigirá informar a los representantes antes de poner en servicio un sistema de alto riesgo. El Estatuto exige informar de los parámetros de cualquier algoritmo que incida en las condiciones de trabajo, de alto riesgo o no. La obligación española es más amplia y ya está vigente.</p>",
   "p": [
    {
     "q": "El artículo 64.4.d del Estatuto obliga a informar al comité sobre:",
     "o": [
      "Solo los algoritmos de plataformas de reparto",
      "Los parámetros, reglas e instrucciones de los algoritmos que inciden en las condiciones de trabajo",
      "El código fuente de cualquier software",
      "Solo los sistemas de alto riesgo del Reglamento de IA"
     ],
     "c": 1,
     "e": "Alcanza a cualquier empresa con representación legal y a cualquier algoritmo que incida en condiciones de trabajo, acceso y mantenimiento del empleo, incluidos los perfiles."
    },
    {
     "q": "¿Desde cuándo está vigente esa obligación?",
     "o": [
      "Desde febrero de 2025",
      "Desde agosto de 2021",
      "Desde agosto de 2026",
      "Desde diciembre de 2027"
     ],
     "c": 1,
     "e": "La introdujo el RDL 9/2021, en vigor desde el 12 de agosto de 2021. Es anterior al Reglamento de IA."
    },
    {
     "q": "Comparada con el artículo 26.7 del Reglamento de IA, la obligación española:",
     "o": [
      "Es más estrecha: solo alto riesgo",
      "Es más amplia: cualquier algoritmo que incida en las condiciones de trabajo, y ya vigente",
      "Es idéntica",
      "Quedó derogada por el Reglamento"
     ],
     "c": 1,
     "e": "El Estatuto no distingue por nivel de riesgo y ya está en vigor; el 26.7 llega en diciembre de 2027 y solo para alto riesgo."
    }
   ]
  },
  {
   "itin": "trabajo",
   "t": "El derecho individual",
   "vig": "RD 723/2026 · en vigor el 5 de octubre de 2026",
   "min": 6,
   "c": "<p>Hasta ahora el derecho a conocer el algoritmo era colectivo: lo tenía el comité. Desde el 5 de octubre de 2026 lo tiene cada trabajador.</p>\n<h4>Qué norma</h4>\n<p>El Real Decreto 723/2026, de 9 de septiembre, publicado en el BOE el 15 de septiembre (BOE-A-2026-19200), transpone la Directiva (UE) 2019/1152 sobre condiciones laborales transparentes y previsibles. Entre la información que la empresa debe facilitar a cada trabajador incluye, en su artículo 3.2.k, <b>la existencia de sistemas algorítmicos o automatizados de toma de decisiones</b> y sus <b>pautas, criterios y reglas de funcionamiento</b>, cuando afectan a la jornada, las tareas, el salario, la progresión, el lugar de trabajo o la extinción.</p>\n<h4>Cómo funciona</h4>\n<ul>\n<li>El trabajador lo pide; la empresa entrega la información en <b>treinta días hábiles</b>.</li>\n<li>Vale para contratos nuevos y para los que ya existen.</li>\n<li>No hace falta que el sistema sea de alto riesgo ni que exista comité.</li>\n<li>El incumplimiento encaja como infracción leve en la LISOS (art. 6.4), según los primeros análisis.</li>\n</ul>\n<h4>Qué cambia en la práctica</h4>\n<p>Hasta ahora, una empresa sin comité podía no tener que explicar nada a nadie. Desde octubre, cualquier persona de la plantilla puede preguntar por escrito qué sistema decide sobre sus turnos o su evaluación y con qué reglas. Eso obliga a tener la respuesta preparada antes de que llegue la pregunta.</p>\n<div class=\"ok-box\"><b>Qué preparar esta semana.</b> Un documento por cada sistema que incida en condiciones de trabajo: nombre, finalidad, variables que considera, reglas, quién revisa la salida y cómo se puede impugnar. Es el mismo documento que pide el comité y el que pedirá el Reglamento en 2027. Se escribe una vez.</div>",
   "p": [
    {
     "q": "El RD 723/2026 reconoce el derecho a conocer las reglas del algoritmo a:",
     "o": [
      "Solo al comité de empresa",
      "A cada trabajador individualmente",
      "Solo a los trabajadores de plataformas",
      "Solo a los sindicatos más representativos"
     ],
     "c": 1,
     "e": "Crea un derecho individual, además del colectivo del artículo 64.4.d del Estatuto."
    },
    {
     "q": "¿En qué plazo debe la empresa facilitar la información solicitada?",
     "o": [
      "Inmediatamente",
      "Treinta días hábiles",
      "Tres meses",
      "No hay plazo"
     ],
     "c": 1,
     "e": "Treinta días hábiles desde la solicitud."
    },
    {
     "q": "¿Qué directiva europea transpone el RD 723/2026?",
     "o": [
      "La Directiva de plataformas digitales",
      "La Directiva (UE) 2019/1152 de condiciones laborales transparentes y previsibles",
      "La Directiva de responsabilidad por productos",
      "La Directiva NIS2"
     ],
     "c": 1,
     "e": "Transpone la Directiva 2019/1152, que exige informar al trabajador de los elementos esenciales de su relación laboral; el algoritmo pasa a ser uno de ellos."
    }
   ]
  },
  {
   "itin": "trabajo",
   "t": "Igualdad y no discriminación",
   "vig": "Ley 15/2022 · lo que la IA no puede hacer peor que una persona",
   "min": 5,
   "c": "<p>Un algoritmo que discrimina no es un problema nuevo de IA: es discriminación, y la ley que la prohíbe ya existía.</p>\n<h4>La ley integral</h4>\n<p>La Ley 15/2022, de 12 de julio, integral para la igualdad de trato y la no discriminación, es horizontal: cubre el empleo, la formación, el acceso a bienes y servicios. Prohíbe la discriminación directa e indirecta por cualquier motivo, y la discriminación por un algoritmo es discriminación por quien lo usa.</p>\n<h4>El artículo 23</h4>\n<p>Es el único artículo de una ley española que habla expresamente de inteligencia artificial antes del Reglamento. Pide a las administraciones públicas que favorezcan mecanismos para que los algoritmos que usen minimicen sesgos, sean transparentes y rindan cuentas, con evaluaciones de impacto, y que promuevan <b>un sello de calidad de los algoritmos</b>. Ese sello no existe a día de hoy: nadie puede exhibirlo.</p>\n<p>Para el sector privado el artículo 23 es referencia, no mandato. Pero marca el estándar que un juez o la Inspección tomarán como razonable.</p>\n<h4>Dónde aparece el sesgo en recursos humanos</h4>\n<ul>\n<li>Cribado entrenado con los contratados históricos: reproduce el perfil del pasado.</li>\n<li>Evaluación por «actividad» que penaliza reducciones de jornada o permisos.</li>\n<li>Asignación de turnos que ignora conciliación y acaba cayendo siempre sobre las mismas personas.</li>\n<li>Pruebas de vídeo que puntúan peor a quien no encaja en la norma de expresión o acento.</li>\n</ul>\n<h4>La carga de la prueba</h4>\n<p>En discriminación, cuando hay indicios, la carga de probar que no la hubo pasa a la empresa. Con un algoritmo, eso significa poder explicar qué variables usa y demostrar que no son un proxy de un motivo protegido. Sin registros, no se puede.</p>",
   "p": [
    {
     "q": "La Ley 15/2022 es relevante para la IA porque:",
     "o": [
      "Regula los chatbots",
      "Prohíbe la discriminación por cualquier motivo, también cuando la produce un algoritmo",
      "Transpone el Reglamento de IA",
      "Obliga a usar IA en la selección"
     ],
     "c": 1,
     "e": "Es la ley horizontal de igualdad de trato; la discriminación algorítmica es discriminación de quien usa el algoritmo."
    },
    {
     "q": "El «sello de calidad de los algoritmos» que menciona el artículo 23:",
     "o": [
      "Lo emite la AESIA",
      "Lo emite la AEPD",
      "No existe todavía",
      "Es obligatorio para las pymes"
     ],
     "c": 2,
     "e": "La ley pide a las administraciones que lo promuevan, pero no se ha creado. Nadie puede exhibirlo."
    },
    {
     "q": "Si hay indicios de discriminación por un sistema de selección, ¿quién tiene que probar?",
     "o": [
      "El candidato, que el algoritmo discriminó",
      "La empresa, que no hubo discriminación",
      "El proveedor del software",
      "Nadie: los algoritmos son neutros"
     ],
     "c": 1,
     "e": "Con indicios, la carga de la prueba se invierte. Sin registros de qué variables usa el sistema, la empresa no puede defenderse."
    }
   ]
  },
  {
   "itin": "trabajo",
   "t": "Portugal",
   "vig": "Lei 13/2023 · ANACOM · CNPD",
   "min": 5,
   "c": "<p>Quien gestiona equipos en los dos países tiene dos capas nacionales distintas sobre el mismo Reglamento europeo.</p>\n<h4>El Código do Trabalho y los algoritmos</h4>\n<p>La Lei n.º 13/2023, de 3 de abril (Agenda do Trabalho Digno), modificó el Código do Trabalho e introdujo deberes de información a los trabajadores y a sus estructuras representativas sobre los <b>parámetros, criterios, reglas e instrucciones</b> de los algoritmos y sistemas de IA que afectan a decisiones sobre acceso y mantenimiento del empleo y condiciones de trabajo, con consulta a la comisión de trabajadores. La obligación es paralela a la española del artículo 64.4.d, con sus propios plazos y régimen de contraordenações.</p>\n<p class=\"ref\">El articulado exacto del Código do Trabalho afectado está pendiente de verificar en el Diário da República en esta versión.</p>\n<h4>Autoridades</h4>\n<ul>\n<li><b>ANACOM</b>: anunciada el 19 de septiembre de 2025 como autoridad de vigilancia del mercado para el Reglamento de IA. La designación formal no consta públicamente a octubre de 2026.</li>\n<li><b>CNPD</b>: protección de datos, incluida la biometría y las decisiones automatizadas.</li>\n<li><b>ACT</b>: Autoridade para as Condições do Trabalho, que vigila las obligaciones laborales, incluidas las de información algorítmica.</li>\n</ul>\n<h4>Sin ley nacional</h4>\n<p>Portugal no tiene una ley de IA equivalente al proyecto español. Cuenta con la Agenda Nacional de IA 2026-2030 (RCM 2/2026) y recomendaciones, pero el régimen sancionador nacional del Reglamento tampoco está articulado.</p>\n<h4>Lo práctico para una filial ibérica</h4>\n<p>Un solo documento por sistema sirve para las dos obligaciones de información: la española y la portuguesa piden lo mismo con palabras casi idénticas. Lo que cambia es a quién se entrega y en qué idioma.</p>",
   "p": [
    {
     "q": "La Lei 13/2023 portuguesa:",
     "o": [
      "Es la ley portuguesa de IA",
      "Introdujo en el Código do Trabalho deberes de información sobre algoritmos a trabajadores y representantes",
      "Designa a la CNPD como autoridad del Reglamento de IA",
      "No tiene relación con la IA"
     ],
     "c": 1,
     "e": "Es la Agenda do Trabalho Digno, que entre otras cosas introdujo la información algorítmica laboral, paralela al artículo 64.4.d español."
    },
    {
     "q": "¿Qué autoridad portuguesa fue anunciada para vigilar el Reglamento de IA?",
     "o": [
      "CNPD",
      "ACT",
      "ANACOM",
      "Banco de Portugal"
     ],
     "c": 2,
     "e": "ANACOM, anunciada el 19 de septiembre de 2025. La designación formal no consta públicamente a octubre de 2026."
    },
    {
     "q": "Para una empresa con plantilla en España y Portugal, el documento de información algorítmica:",
     "o": [
      "Debe ser completamente distinto en cada país",
      "Puede ser el mismo, adaptando destinatario e idioma",
      "Solo es obligatorio en España",
      "Solo es obligatorio en Portugal"
     ],
     "c": 1,
     "e": "Ambas normas piden parámetros, criterios, reglas e instrucciones. Cambia a quién se entrega y en qué idioma."
    }
   ]
  }
 ],
 "examen": [
  "0-0",
  "1-1",
  "2-2",
  "3-0",
  "4-1",
  "5-2",
  "6-0",
  "7-1",
  "8-2",
  "0-1",
  "0-2",
  "1-0"
 ]
};
