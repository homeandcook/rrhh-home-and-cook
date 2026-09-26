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

## Cómo numerar
- Cambio de textos o estilos: sube el tercer número (0.9.1).
- Apartado nuevo o cambio de funcionamiento: el segundo (0.10.0).
- Cuando entre en producción con datos reales: 1.0.0.
