# Workflows de n8n — qué hace cada uno

Mapa de los 12 workflows de Vinoteca en `n8n.rabadanhouse.space` (todos en una misma carpeta del proyecto personal de Carlos). Para el formato de petición y respuesta de cada endpoint, ver [backend-n8n.md](backend-n8n.md). Estado a 2026-10-17.

## Vista general

| # | Workflow | Ruta del webhook | Lo llama | IA / servicios | Estado |
|---|----------|------------------|----------|----------------|--------|
| 1 | Scan Analizar v2 | `POST /scan/analizar` | `Scan.tsx`, fase 1 | OpenAI Vision `gpt-4o` | Activo |
| 2 | Scan · Foto de Estudio | *(sub-workflow)* | Scan Analizar v2 | Microservicios locales | Activo |
| 3 | Wine Identify | `POST /wine/identify` | `Scan.tsx`, fase 2 | Ninguna; Supabase | Activo |
| 4 | Wine Enrich | `POST /wine/enrich` | `Scan.tsx`, fase 3 | Brave + `gpt-4o-mini` | Activo |
| 5 | Wine Improve Photo | `POST /wine/improve-photo` | `WineDetail.tsx` | `gpt-image-1` | Activo |
| 6 | sommelier-chat | `POST /sommelier/chat` | `Sommelier.tsx`, `TastingChat.tsx` | Omniroute | Activo |
| 7 | sommelier-maridaje | `POST /sommelier/maridaje` | `Sommelier.tsx` | Omniroute | Activo |
| 8 | sommelier-enriquecimiento | `POST /sommelier/enriquecimiento` | `Sommelier.tsx` | Wikipedia + Omniroute | Activo |
| 9 | stats-insight | `POST /stats/insight` | `Stats.tsx` | Omniroute | Activo |
| 10 | ayuda-chat | `POST /ayuda/chat` | `AssistantWidget.tsx` | Omniroute | Activo |
| 11 | cata-tutor | `POST /cata/tutor` | `JournalSheetForm.tsx` | Brave + `gpt-4o-mini` | Activo |
| 12 | Scan Analizar Previo | — | Nadie | — | **Inactivo** |

Todas las rutas cuelgan de `https://n8n.rabadanhouse.space/webhook/vinoteca/...`. Qué modelo usa cada una y por qué: ver *Modelos de IA* en [backend-n8n.md](backend-n8n.md).

## El escaneo de una botella (workflows 1 a 4)

El alta de un vino por foto encadena tres llamadas desde `Scan.tsx`. Si una falla, las siguientes se saltan:

1. **Scan Analizar v2** lee la etiqueta y devuelve los datos en bruto.
2. **Wine Identify** normaliza el nombre, calcula el `wine_uid` y mira si el usuario ya tiene ese vino.
3. **Wine Enrich** completa lo que la etiqueta no dice: web de la bodega, descripción, precio, uva, crianza...

Si Wine Identify falla, la app no tiene `wine_uid` y **no llama a Wine Enrich**. Así pasó entre el 4 y el 17 de octubre de 2026 (variables de Supabase obsoletas en el stack de n8n).

## Detalle de cada workflow

### 1. Scan Analizar v2 — `zgCc5PEDG91zEBW4`

**Cometido:** leer la foto de la etiqueta y extraer los datos del vino.

- Recibe la imagen frontal y, si hay, la trasera, en base64.
- En paralelo lanza la foto de estudio (workflow 2) y manda las imágenes a OpenAI Vision (`gpt-4o`, `detail: high`, 900 tokens) por una llamada HTTP con la credencial «OpenAI Carlos».
- Pide un JSON con 14 campos: nombre, bodega, añada, región, denominación, uva, tipo, alcohol, crianza, descripción, `url_bodega`, temperatura de servicio, alérgenos y volumen. Si no es un vino, devuelve `{ "is_wine": false }`.
- Normaliza: alcohol a número, volumen a ml, tipo a la lista cerrada (Tinto, Blanco, Rosado, Espumoso, Dulce, Fortificado, Naranja) y añada a entero entre 1900 y 2100.
- `url_bodega` solo se acepta si aparece impresa en la etiqueta y responde.
- Devuelve los datos más `imagen_url`: la foto de estudio o, si falló, la original en base64.

### 2. Scan · Foto de Estudio — `TrzbwmC833dJKElJ`

**Cometido:** dejar la etiqueta frontal como una foto de estudio. Es un sub-workflow, sin webhook: solo lo invoca el workflow 1.

- Convierte la imagen base64 en fichero.
- Le quita el fondo con el microservicio local `192.168.1.10:8090/remove-background`.
- Monta el fondo premium con el microservicio local `192.168.1.10:8088/compose`.
- No usa IA. Es tolerante a fallos: si un microservicio cae, devuelve `error` y `error_source` (`quitar_fondo` o `montar_fondo`) y el escaneo sigue con la foto original.

### 3. Wine Identify — `iiA1ONh56EL3lFju`

**Cometido:** decidir si el vino ya está en la colección del usuario y darle una identidad estable.

- No usa IA. Normaliza el texto: minúsculas, sin tildes, sin prefijos de bodega («Bodega», «Finca»...), saca el año si venía dentro del nombre y corrige nombre y bodega si estaban invertidos.
- Calcula el `wine_uid`, un SHA-256 de `nombre|bodega|añada` normalizados.
- Busca en la tabla `wines` del usuario con la API REST de Supabase y la service-role key, en tres pasos: por `wine_uid`; por nombre, bodega y añada en vinos sin `wine_uid`; por nombre y añada ignorando la bodega.
- Devuelve `exists`, `wine_id`, `confidence` (0,95 / 0,8 / 0,5), el `wine_uid` y los datos normalizados.
- **Necesita** las variables `VINOTECA_SUPABASE_URL` y `VINOTECA_SUPABASE_SERVICE_KEY` del stack de n8n.

### 4. Wine Enrich — `rV1BrlPmkUB87jnn`

**Cometido:** completar datos que la etiqueta no trae, solo con información verificable.

- Busca el vino y, aparte, la web de la bodega con Brave Search. Elige como candidata la web cuyo dominio contiene el nombre de la bodega y descarta tiendas, guías y páginas aparcadas.
- Descarga la web candidata y la usa como fuente de la descripción.
- `gpt-4o-mini` rellena uva, crianza, alcohol, temperatura, región, denominación y descripción; una segunda pasada extractiva completa lo que falte.
- El precio sale de otra búsqueda en tiendas, nunca de la memoria del modelo.
- Verifica la `url_bodega` antes de devolverla. La descripción solo se devuelve si la web oficial se verificó.
- Detalle de la lógica de la URL: sección 9 de [backend-n8n.md](backend-n8n.md).

### 5. Wine Improve Photo — `2vA9Ze6ARZ6EwlP6`

**Cometido:** rehacer el fondo de una foto ya guardada con un fondo oscuro de estudio.

- Descarga `imagen_original_url`.
- La edita con `gpt-image-1` (1024×1536, `input_fidelity: high`) con un prompt fijo: fondo oscuro, liso, sin tocar botella ni etiqueta.
- Devuelve `imageDataUrl` en base64.
- Convive con el microservicio de la foto de estudio del escaneo (workflow 2); son dos maneras distintas de lograr un fondo parecido.

### 6. sommelier-chat — `Yd2Llg4eRLaAD21I`

**Cometido:** el chat libre del Sommelier.

- Recibe el historial, el último mensaje, la colección del usuario, su perfil de gusto y una pista de intención (`comparativa`, `maridaje-inverso`).
- Un agente responde como sumiller, priorizando vinos de la colección, en el idioma del usuario y con un máximo de 3 párrafos.
- Modelo: `Combo_n8n` de Omniroute. Devuelve `{ reply }`.

### 7. sommelier-maridaje — `yMlzaK784fz1VHzz`

**Cometido:** decir qué vino de la colección va con un plato u ocasión.

- Recibe el plato, la ocasión, la colección y el perfil de gusto.
- El modelo devuelve un JSON con la recomendación y el `wineId` elegido. La lectura del JSON es tolerante a texto alrededor, y se quitan las negritas Markdown.
- Si ningún vino encaja, lo dice y sugiere qué tipo de vino buscar. Modelo: `Combo_n8n`.

### 8. sommelier-enriquecimiento — `dUq4iL2FvkIR0Awl`

**Cometido:** explicar una denominación de origen.

- Consulta el resumen de la denominación en la Wikipedia en español y se lo da a un agente.
- Devuelve 3-4 frases técnicas sobre clima, suelos, uvas y estilo de vino: `{ info, fuente }`.
- Modelo: `Combo_n8n`. La `fuente` siempre dice «Wikipedia + OpenAI», aunque el modelo sea Omniroute.

### 9. stats-insight — `ZcK7uQdi8lu3gcpa`

**Cometido:** el párrafo de análisis de la pantalla de Estadísticas.

- Recibe las métricas del dashboard: totales, puntuación media, regiones, tipos, añadas y mejor vino.
- Un agente escribe 4-5 frases sobre patrones, fortalezas y una sugerencia para la bodega.
- Devuelve `{ insight }` sin formato Markdown. La app guarda el resultado 24 h en `localStorage`. Modelo: `Combo_n8n`.

### 10. ayuda-chat — `HX02775Le59A84br`

**Cometido:** el asistente flotante que explica cómo usar la app.

- Responde dudas de uso (añadir vinos, escanear, catas, navegación) en 3 párrafos como máximo.
- No da recomendaciones de vino: remite a la pestaña Sommelier. Modelo: `Combo_n8n`. Devuelve `{ reply }`.

### 11. cata-tutor — `z7XSxU1hF5lZwX7H`

**Cometido:** el botón «Revisar» de la ficha guiada de cata (Vista, Nariz, Boca).

- Si el cliente no manda `notasPro`, busca en Brave notas de cata profesionales del vino (5 resultados en español). El cliente las reenvía para hacer una sola búsqueda por cata.
- Un agente docente (`gpt-4o-mini` con un Structured Output Parser) valora lo escrito, dice qué falta observar, lo reescribe como un sumiller sin añadir nada que el usuario no dijera, explica 2-4 términos técnicos y lo compara con las notas encontradas.
- Una normalización final corrige las claves con tilde que el modelo a veces devuelve.
- Devuelve `valoracion`, `falta`, `version_pro`, `terminos`, `comparacion_pro`, `siguiente` y `notasPro`.

### 12. Scan Analizar Previo — `EtTezN27e9tqvOjS`

Versión anterior del escaneo (OpenAI Vision con `gpt-4o`), **inactivo y sin ningún cliente que lo llame**. Lo sustituye el workflow 1. No lo he abierto para revisar su contenido: candidato a archivar.

## Observaciones pendientes

- **Webhooks sin autenticación:** n8n indica «No credentials required» en todos los webhooks de Vinoteca, aunque existe la credencial Header Auth `mSeQOoORfe8qLqNH` y [backend-n8n.md](backend-n8n.md) habla de protegerlos. Quien conozca una URL puede llamarla y gastar saldo de OpenAI. Conviene comprobarlo.
- **Scan Analizar v2, comprobación de la URL:** el nodo «Normalizar Datos» repite el chequeo de alcance antiguo de Wine Enrich (sin `User-Agent`, con la opción inexistente `simple: false`), que descarta webs válidas con respuesta 403.
- **Scan Analizar v2, borrador:** la versión activa y el borrador no coinciden (solo en el nodo que invoca al sub-workflow). Revisar y publicar.
- **Nodos sueltos de OpenRouter** sin conectar en sommelier-chat, sommelier-maridaje, sommelier-enriquecimiento y stats-insight.
- **Descripciones desfasadas** en n8n: sommelier-chat, sommelier-maridaje y stats-insight dicen «gpt-4o»; hoy usan Omniroute.
- **Publicar:** cualquier cambio exige publicar el workflow, ver [backend-n8n.md](backend-n8n.md).
