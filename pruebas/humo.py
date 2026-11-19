"""Prueba de humo de Pippole (0.37.0).

Abre la demo (?demo), entra como RR.HH. y como Regional Manager, recorre
cada apartado visible y sus pestañas, abre la pantalla de código y la
página de privacidad. Falla si hay errores de JavaScript o en la consola,
o si en pantalla aparece alguna marca del cliente.

Uso:  python3 -m http.server 8765 &   (desde la raíz del repositorio)
      python3 pruebas/humo.py [http://localhost:8765]
Sin salida a jsdelivr: HUMO_LIBS=/ruta/a/supabase.js python3 pruebas/humo.py
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765").rstrip("/")
MARCAS = ["HOME & COOK", "Home & Cook", "Home&Cook", "Groupe SEB", "SEB Academy", "Tefal", "Rowenta", "Moulinex",
          "Krups", "WMF", "Lagostina", "Atrivity", "Lyreco", "Great Place To Work"]
# El 404 de la copia de la plantilla del correo es normal fuera de la web publicada.
IGNORAR = ["correo_plantilla.js", "status of 404"]
fallos = []


async def preparar(b, ancho=1280, alto=900, tema="light"):
    pg = await b.new_page(viewport={"width": ancho, "height": alto}, color_scheme=tema)
    libs = os.environ.get("HUMO_LIBS")
    if libs:
        async def ruta(r):
            await r.fulfill(path=libs, content_type="application/javascript")
        await pg.route("**/cdn.jsdelivr.net/**", ruta)
    pg.on("pageerror", lambda e: fallos.append(f"Error de JavaScript: {e}"))
    pg.on("console", lambda m: fallos.append(f"Consola: {m.text}")
          if m.type == "error" and not any(x in m.text for x in IGNORAR) else None)
    return pg


async def entrar(pg, usuario):
    await pg.goto(BASE + "/?demo")
    await pg.evaluate("sessionStorage.clear()")
    await pg.goto(BASE + "/?demo")
    await pg.wait_for_selector("#lgUser")
    await pg.fill("#lgUser", usuario)
    await pg.fill("#lgPass", "demo1234")
    await pg.click("#lgBtn")
    # Sin wait_for_function: la CSP de la página no deja evaluar texto como código.
    for _ in range(50):
        if await pg.evaluate("typeof S !== 'undefined' && !!S.me"):
            break
        await pg.wait_for_timeout(200)
    else:
        fallos.append(f"{usuario}: no ha podido entrar")
    await pg.wait_for_timeout(600)


async def revisar_marcas(pg, donde):
    txt = await pg.evaluate("document.body.innerText")
    for m in MARCAS:
        if m in txt:
            fallos.append(f"Marca «{m}» en pantalla: {donde}")


async def recorrer(b, usuario):
    pg = await preparar(b)
    await entrar(pg, usuario)
    await revisar_marcas(pg, f"portada ({usuario})")
    mods = await pg.evaluate("MODULOS.filter(m => puedeVer(m.id)).map(m => [m.id, (m.tabs || []).map(t => t[0])])")
    if not mods:
        fallos.append(f"{usuario}: no ve ningún apartado")
    for mid, tabs in mods:
        await pg.evaluate(f"S.modulo = '{mid}'; S.indice = true; pintar()")
        await pg.wait_for_timeout(250)
        await revisar_marcas(pg, f"{mid} ({usuario})")
        for tab in tabs:
            await pg.evaluate(f"S.modulo = '{mid}'; S.tab = '{tab}'; S.indice = false; pintar()")
            await pg.wait_for_timeout(250)
            await revisar_marcas(pg, f"{mid} → {tab} ({usuario})")
    print(f"  {usuario}: {len(mods)} apartados recorridos")
    await pg.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await recorrer(b, "admin")
        await recorrer(b, "rm.es")
        # Pantalla de código: debe verse el aviso de privacidad.
        pg = await preparar(b, 390, 844, "dark")
        await pg.goto(BASE + "/?demo&codigo=")
        await pg.wait_for_selector("#codeIn")
        aviso = await pg.evaluate("(document.getElementById('pieLegal') || {}).innerText || ''")
        if "privacidad" not in aviso.lower():
            fallos.append("La pantalla de código no muestra el aviso de privacidad")
        print("  pantalla de código: revisada")
        await pg.goto(BASE + "/privacidad.html")
        if "Tus derechos" not in await pg.evaluate("document.body.innerText"):
            fallos.append("La página de privacidad no carga")
        print("  privacidad.html: revisada")
        await b.close()
    if fallos:
        print("\nFALLOS:")
        for f in dict.fromkeys(fallos):
            print(" -", f)
        sys.exit(1)
    print("\nPrueba de humo superada.")


asyncio.run(main())
