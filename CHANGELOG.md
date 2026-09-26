# Registro de versiones

Formato: versión · fecha · qué cambió · si hace falta tocar la base de datos.

## 0.9.0 · 24/09/2026 · **SQL: no**
Estado actual del prototipo.
- Portada RRHH x Home&Cook con logotipo propio, Groupe SEB y cinta de marcas.
- Scorecard Retail: objetivos, seguimiento de 6 meses, cierre anual, bonus e informe imprimible.
- Talent Matrix: ficha por persona y mapa 9-Box para RR.HH.
- People Data Centre: datos clave con filtros, KPIs de negocio, de RR.HH. y ajuste al tráfico.
- Pruebas con código de invitado: Psicotécnicos, Mystery Shopper, Clima (por olas y dimensiones), Onboarding y Offboarding.
- Formaciones: Circuito de Venta en 7 paradas, chuleta imprimible, arcade "Un turno en la tienda" y role play con IA (11 escenarios).
- Idiomas: español, inglés y francés en portada, acceso y pantallas de invitado.
- Enlace a HomeTime (requiere VPN).

## 0.9.1 · 24/09/2026 · **SQL: no**
- El dominio interno de los usuarios pasa a ser `homeandcook.app`. Afecta a `config.js`, al correo del administrador en Supabase y al README.

## 0.10.0 · 26/09/2026 · **SQL: no**
Rediseño de la pantalla de acceso, la primera que ve todo el mundo.

Aspecto:
- A dos columnas en ordenador: panel de marca a la izquierda (logo de Home & Cook grande, logotipo RRHH x Home&Cook, una sola frase y la cinta de marcas dentro) y formulario a la derecha. En móvil y tablet se apila: primero el panel, debajo el formulario.
- El logo de Groupe SEB pasa al panel, acompañado de «Una plataforma de Groupe SEB Ibérica».
- De tres subtítulos a uno. Campos más altos y fondo con dos tintes en diagonal.

Funcionamiento:
- Botón visible **«Entrar con un código de invitación»**, separado del formulario. Antes era un enlace pequeño: es la puerta de las encuestas, los psicotécnicos y el mystery shopper.
- Ojo para ver la contraseña mientras se escribe.
- «Recordar mi usuario en este equipo»: si está marcado, la próxima vez el usuario viene puesto y el cursor va directo a la contraseña.
- «¿Has olvidado la contraseña?» explica que solo RR.HH. puede restablecerla.
- Mensajes distintos si no hay internet o si el servidor no responde (proyecto de Supabase en pausa), en vez de un error técnico.
- Número de versión en el pie.
- Se puede instalar en el móvil como una aplicación: `manifest.json`, `icon-192.png`, `icon-512.png` y `apple-touch-icon.png`.
- Los textos nuevos están en español, inglés y francés.
- Arreglado: al entrar por `?codigo=` sin código, ya no aparece el aviso de «código caducado» antes de escribir nada.

## Cómo numerar
- Cambio de textos o estilos: sube el tercer número (0.9.1).
- Apartado nuevo o cambio de funcionamiento: el segundo (0.10.0).
- Cuando entre en producción con datos reales: 1.0.0.
