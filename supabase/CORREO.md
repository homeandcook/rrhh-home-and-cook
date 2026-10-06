# Enviar los correos desde la plataforma

Hoy, al pulsar **Enviar correo**, se abre tu programa de correo con el mensaje
puesto y lo envías tú. Funciona desde el primer día y no depende de nadie.

Esto explica cómo hacer que lo envíe la plataforma sola, desde una dirección de
la empresa. Son tres piezas y una de ellas no depende de ti.

| Pieza | Quién | Tiempo |
|---|---|---|
| 1. Cuenta en un proveedor de correo | Tú | 5 min |
| 2. Verificar el dominio (DNS) | **IT** | lo que tarden |
| 3. Desplegar la función y configurarla | Tú | 15 min |

Sin el paso 2 los correos salen, pero desde un dominio que no es el vuestro:
para probar vale, para escribir a 350 empleados no, porque acaban en spam y
parecen phishing.

---

## 1. Cuenta en el proveedor

Aquí se usa **Resend**. El plan gratuito da 3.000 correos al mes y 100 al día,
que para 21 tiendas sobra.

1. Entra en `resend.com` y crea la cuenta.
2. **API Keys → Create API Key**. Permiso: *Sending access*.
3. Cópiala. Empieza por `re_`. **Es secreta: no la pegues nunca en el código,
   ni en config.js, ni en GitHub.** Solo va donde dice el paso 3.

## 2. Verificar el dominio — esto lo hace IT

En Resend, **Domains → Add Domain**, y pon el dominio desde el que queréis
escribir. Resend te dará tres o cuatro registros DNS (DKIM, SPF y, si lo
pedís, DMARC).

Esos registros los tiene que crear IT en el DNS del dominio. Hasta que no
aparezcan como *Verified* en Resend, no uses la dirección real.

**Mientras tanto, para probar**: Resend te da una dirección de pruebas suya
que funciona sin verificar nada. Úsala solo contigo.

## 3. Desplegar la función

### 3.1 Crear la función

1. Supabase → tu proyecto → **Edge Functions** (menú de la izquierda).
2. **Deploy a new function → Via Editor**.
3. Nombre: `enviar-invitacion` (exactamente así).
4. Borra el ejemplo y pega entero el contenido de
   `supabase/funciones/enviar-invitacion.ts`.
5. **Deploy function**. Tarda unos segundos.

### 3.2 Poner los secretos

Supabase → **Project Settings → Edge Functions → Secrets** (o
**Manage secrets**). Añade:

| Nombre | Valor |
|---|---|
| `RESEND_API_KEY` | la clave del paso 1 |
| `CORREO_DE` | `RR.HH. Home & Cook <rrhh@vuestrodominio.com>` |
| `CORREO_RESPONDER` | tu correo, para que las respuestas te lleguen (opcional) |
| `URL_PLATAFORMA` | `https://people-retail.netlify.app/` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya están
puestas por Supabase: no las toques ni las copies a ningún sitio.

### 3.3 La columna de la fecha de envío

SQL Editor → pega `supabase/migracion_0.20.sql` → Run.

### 3.4 Encender el botón

En `config.js` de la plataforma, cambia:

```js
correoDirecto: true,
```

Sube el fichero y recarga. El botón pasa a decir **Enviar a todos los
pendientes** en rojo, y envía de verdad.

---

## Cómo probarlo sin molestar a nadie

1. Crea una campaña de prueba.
2. Añade una sola persona **a mano**, con tu propio correo.
3. Pulsa **Enviar correo** en su fila.
4. Mira tu bandeja. Si llega, entra con el código y responde.
5. Borra la campaña.

Si no llega: Supabase → Edge Functions → `enviar-invitacion` → **Logs**. Ahí
sale el motivo exacto.

---

## Qué comprueba la función antes de enviar

No envía a cualquier dirección que le pidan. Antes de nada:

- Lee las invitaciones **con tu sesión**, así que las políticas de la base de
  datos ya filtran: un Regional Manager solo puede escribir a su gente.
- Si alguna de las que pides no le sale, no envía ninguna.
- No envía si la campaña está cerrada, si la persona ya respondió, o si el
  correo no tiene forma de correo.
- Máximo 50 por llamada.
- La clave del proveedor nunca sale del servidor.

## Protección de datos

En el momento en que la plataforma envíe correos a empleados con sus
direcciones reales, esto es un tratamiento de datos personales con un
encargado nuevo (el proveedor de correo). Antes de usarlo con la red entera:

- Que IT y el responsable de protección de datos lo validen.
- El proveedor tiene que estar en el registro de tratamientos (art. 30) y
  firmar el contrato de encargado (art. 28).
- Comprueba dónde se guardan los datos: Resend permite elegir región.
