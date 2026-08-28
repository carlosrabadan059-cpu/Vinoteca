# Descomponer "Vinoteca – Scan Analizar" en orquestador + sub-workflow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extraer la rama "Foto de Estudio" del workflow n8n activo "Vinoteca – Scan Analizar" a un sub-workflow tolerante a fallos, y publicar un orquestador nuevo ("v2") que lo invoca vía Execute Workflow, con las tres limpiezas menores ya aprobadas — sin cambiar el contrato público del webhook.

**Architecture:** Ver `docs/superpowers/specs/2026-08-28-scan-analizar-orquestador-design.md` para el diseño completo. Resumen: sub-workflow nuevo "Vinoteca – Scan · Foto de Estudio" (nodos `02/03/04` movidos, con `onError: continueErrorOutput` en `03`/`04`); orquestador nuevo y paralelo "Vinoteca – Scan Analizar v2" (copia del workflow activo con `02/03/04` sustituidos por un nodo `Execute Workflow`, y con `Debug Datos Vino`/`Tiene Nombre`/`Responder Sin nombre` eliminados). Migración: backup → construir y verificar en aislamiento → construir y verificar v2 en paralelo (sin tocar el webhook real) → corte final.

**Tech Stack:** n8n (self-hosted, `n8n.rabadanhouse.space`) vía MCP `mcp__n8n-mcp__*`. Sin cambios de código del repo salvo documentación (`docs/n8n-backups/`, `docs/CHANGELOG.md`).

---

## Contexto para quien ejecute este plan

- No hay test runner: toda la "prueba" de cada tarea es una llamada real al MCP de n8n (`execute_workflow`, `get_workflow_details`) con un resultado esperado exacto — trátalo como el equivalente de TDD en este dominio.
- El workflow activo hoy es `NMQZ4zhYw3RjTcLp` ("Vinoteca – Scan Analizar"), 18 nodos, `activeVersionId: 116faae3-3a63-40d5-b080-b51378beb5cc`, webhook en `POST https://n8n.rabadanhouse.space/webhook/vinoteca/scan/analizar`.
- El microservicio local `http://192.168.1.10:8090/remove-background` (nodo `03 Quitar Fondo`) está devolviendo 500 ahora mismo (verificado en sesión previa) — **no lo arregles**, es un issue aparte y documentado; de hecho te sirve gratis como caso de prueba real del manejo de error de este plan.
- Antes de escribir cualquier código del SDK, sigue el proceso obligatorio del servidor MCP: `get_workflow_sdk_reference` (ya usado para redactar este plan, pero vuelve a llamarlo tú mismo si tienes dudas de sintaxis) y `get_workflow_best_practices({technique: "document_processing"})` para el patrón `Execute Workflow`/`Execute Workflow Trigger`.
- `npx tsc -b` no aplica a este trabajo (no hay cambios de código TypeScript del repo).

---

### Task 1: Backup del workflow activo

**Files:**
- Create: `docs/n8n-backups/vinoteca-scan-analizar-2026-08-28-pre-orquestador.json`
- Modify: `docs/n8n-backups/README.md` (añadir una entrada más a la lista de backups, siguiendo el mismo formato que la entrada de la limpieza de QR de hoy)

- [ ] **Step 1: Obtener el JSON completo del workflow activo**

Llama:
```
mcp__n8n-mcp__get_workflow_details({ workflowId: "NMQZ4zhYw3RjTcLp", detailLevel: "full" })
```
Guarda el objeto `workflow` completo (incluye `nodes`, `connections`, `settings`) — es el mismo JSON ya usado para diseñar este plan.

- [ ] **Step 2: Escribir el snapshot**

Escribe el JSON completo (formateado, indentado a 2 espacios) en `docs/n8n-backups/vinoteca-scan-analizar-2026-08-28-pre-orquestador.json`.

- [ ] **Step 3: Añadir la entrada al README de backups**

Añade una línea a la lista de backups en `docs/n8n-backups/README.md` (mismo formato que la entrada existente de la limpieza de QR), enlazando al fichero nuevo y explicando que es el snapshot previo a la descomposición en orquestador + sub-workflow (ver `docs/superpowers/specs/2026-08-28-scan-analizar-orquestador-design.md`).

- [ ] **Step 4: Commit**

```bash
git add docs/n8n-backups/vinoteca-scan-analizar-2026-08-28-pre-orquestador.json docs/n8n-backups/README.md
git commit -m "docs(n8n): backup de Scan Analizar antes de la descomposición en orquestador"
git push
```

---

### Task 2: Construir el sub-workflow "Vinoteca – Scan · Foto de Estudio"

**Files:** ninguno del repo — solo entidades n8n vía MCP.

- [ ] **Step 1: Validar el código SDK mínimo (solo el trigger)**

```
mcp__n8n-mcp__validate_workflow({ code: `
import { workflow, trigger } from '@n8n/workflow-sdk';

const inicioSubworkflow = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: {
    name: 'Trigger',
    parameters: { inputSource: 'passthrough' },
    position: [-272, 176]
  },
  output: [{ body: { front: 'base64-frontal...', back: null } }]
});

export default workflow('vinoteca-scan-foto-estudio', 'Vinoteca – Scan · Foto de Estudio')
  .add(inicioSubworkflow);
` })
```
Expected: validación OK, sin errores de parseo.

- [ ] **Step 2: Crear el workflow**

```
mcp__n8n-mcp__create_workflow_from_code({
  code: <el mismo código del Step 1>,
  name: "Vinoteca – Scan · Foto de Estudio",
  description: "Sub-workflow: quita fondo y compone foto de estudio de la etiqueta frontal. Tolerante a fallo del microservicio local — si falla, devuelve { error, error_source } sin campo image.",
  versionName: "Trigger inicial"
})
```
Expected: respuesta con un `workflowId` nuevo. **Guarda ese id como `SUBWORKFLOW_ID` — lo necesitas en la Task 4.**

- [ ] **Step 3: Añadir el resto de nodos y conexiones**

```
mcp__n8n-mcp__update_workflow({
  workflowId: "<SUBWORKFLOW_ID>",
  versionName: "Nodos de foto de estudio con manejo de error",
  versionDescription: "Mueve 02/03/04 desde Scan Analizar y añade onError: continueErrorOutput en 03/04, con dos nodos Set terminales que devuelven { error, error_source } sin campo image cuando falla el microservicio local.",
  operations: [
    { type: "addNode", node: {
      name: "02 Convertir Frontal", type: "n8n-nodes-base.convertToFile", typeVersion: 1.1,
      parameters: { operation: "toBinary", sourceProperty: "body.front", options: {} },
      position: [480, -704]
    }},
    { type: "addNode", node: {
      name: "03 Quitar Fondo", type: "n8n-nodes-base.httpRequest", typeVersion: 4.4,
      parameters: {
        method: "POST", url: "http://192.168.1.10:8090/remove-background",
        sendBody: true, contentType: "multipart-form-data",
        bodyParameters: { parameters: [{ parameterType: "formBinaryData", name: "file", inputDataFieldName: "data" }] },
        options: {}
      },
      position: [704, -704]
    }},
    { type: "addNode", node: {
      name: "04 Montar fondo premium", type: "n8n-nodes-base.httpRequest", typeVersion: 4.4,
      parameters: {
        method: "POST", url: "http://192.168.1.10:8088/compose",
        sendBody: true, contentType: "multipart-form-data",
        bodyParameters: { parameters: [{ parameterType: "formBinaryData", name: "file", inputDataFieldName: "data" }] },
        options: {}
      },
      position: [912, -704]
    }},
    { type: "addNode", node: {
      name: "Fallo Quitar Fondo", type: "n8n-nodes-base.set", typeVersion: 3.4,
      parameters: {
        assignments: { assignments: [
          { id: "error-qf-1", name: "error", value: "={{ $json.error }}", type: "string" },
          { id: "error-qf-2", name: "error_source", value: "quitar_fondo", type: "string" }
        ] },
        options: {}
      },
      position: [704, -480]
    }},
    { type: "addNode", node: {
      name: "Fallo Montar Fondo", type: "n8n-nodes-base.set", typeVersion: 3.4,
      parameters: {
        assignments: { assignments: [
          { id: "error-mf-1", name: "error", value: "={{ $json.error }}", type: "string" },
          { id: "error-mf-2", name: "error_source", value: "montar_fondo", type: "string" }
        ] },
        options: {}
      },
      position: [912, -480]
    }},
    { type: "addConnection", source: "Trigger", target: "02 Convertir Frontal" },
    { type: "addConnection", source: "02 Convertir Frontal", target: "03 Quitar Fondo" },
    { type: "addConnection", source: "03 Quitar Fondo", sourceIndex: 0, target: "04 Montar fondo premium", targetIndex: 0 },
    { type: "addConnection", source: "03 Quitar Fondo", sourceIndex: 1, target: "Fallo Quitar Fondo", targetIndex: 0 },
    { type: "addConnection", source: "04 Montar fondo premium", sourceIndex: 1, target: "Fallo Montar Fondo", targetIndex: 0 },
    { type: "setNodeSettings", nodeName: "03 Quitar Fondo", settings: { onError: "continueErrorOutput" } },
    { type: "setNodeSettings", nodeName: "04 Montar fondo premium", settings: { onError: "continueErrorOutput" } }
  ]
})
```
Expected: operación atómica OK, sin errores.

**Nota:** deliberadamente no hay conexión de `04 Montar fondo premium` (salida normal, índice 0) hacia ningún nodo más — su salida directa ES el retorno del sub-workflow en el caso de éxito (último nodo ejecutado en esa rama). Esto es intencional, no un olvido.

- [ ] **Step 4: Verificar la forma del grafo**

```
mcp__n8n-mcp__get_workflow_details({ workflowId: "<SUBWORKFLOW_ID>", detailLevel: "full" })
```
Expected: 6 nodos (`Trigger`, `02 Convertir Frontal`, `03 Quitar Fondo`, `04 Montar fondo premium`, `Fallo Quitar Fondo`, `Fallo Montar Fondo`). `03 Quitar Fondo` y `04 Montar fondo premium` tienen `onError: "continueErrorOutput"` en sus settings. Sin conexiones colgantes.

---

### Task 3: Verificar el sub-workflow en aislamiento

**Nota de ejecución (descubierto al ejecutar este plan):** la herramienta `mcp__n8n-mcp__execute_workflow` no soporta ejecutar directamente un `Execute Workflow Trigger` — solo Schedule/Webhook/Form/Chat ("Trigger node ... is not supported for MCP execution"). No hay forma de probar este sub-workflow en aislamiento real sin alterar temporalmente su trigger. Se optó por saltar la verificación aislada y confiar en la cobertura equivalente de la Task 5 (Caso B, fallback por microservicio caído, ejercita esta misma ruta del sub-workflow con una ejecución real vía el webhook del orquestador). Los Steps 1-4 de abajo quedan como referencia de lo que se intentó.

**Files:** ninguno.

- [ ] **Step 1: Aprender el shape de entrada exacto de este trigger**

```
mcp__n8n-mcp__get_workflow_details({ workflowId: "<SUBWORKFLOW_ID>", detailLevel: "execution" })
```
Lee el campo `triggerInfo` de la respuesta — indica exactamente cómo pasar `inputs` a `execute_workflow` para un `Execute Workflow Trigger` con `inputSource: passthrough` (puede diferir del shape `webhookData` usado para triggers de tipo webhook). Usa ese shape exacto en los pasos siguientes.

- [ ] **Step 2: Localizar o regenerar la foto de prueba**

Comprueba si sigue existiendo `/private/tmp/claude-501/-Volumes-SSD-Externo-Proyectos-Antigravity-Vinoteca/7c98367d-ccba-404c-a926-3ef2b493bc51/scratchpad/chanin-final.b64` (foto de La Chanin, Cható Gañán, ya usada y verificada en una sesión previa contra este mismo workflow). Si no existe, regenérala desde `/Users/carlosrabadan/Desktop/IMG_5995.jpeg` (si sigue presente) con:
```python
from PIL import Image
im = Image.open('/Users/carlosrabadan/Desktop/IMG_5995.jpeg')
im = im.convert('RGB')
im.thumbnail((520, 520))
im.save('/tmp/chanin-final.jpg', quality=62, optimize=True)
```
y codifica el resultado a base64. Si tampoco existe la foto original, usa cualquier foto real de etiqueta de vino disponible, downscaleada con el mismo procedimiento (objetivo: base64 bajo ~25KB para que sea barato de manejar en este entorno).

- [ ] **Step 3: Ejecutar caso éxito o caso error (lo que el microservicio dé hoy)**

```
mcp__n8n-mcp__execute_workflow({
  workflowId: "<SUBWORKFLOW_ID>",
  executionMode: "manual",
  triggerNodeName: "Trigger",
  inputs: { <shape exacto aprendido en el Step 1, con body: { front: "<base64 del Step 2>", back: null }> }
})
```
Luego:
```
mcp__n8n-mcp__get_workflow_execution({ executionId: "<id devuelto>", includeData: true })
```
Expected — dos resultados válidos según el estado actual del microservicio:
- Si `192.168.1.10:8090` sigue caído (confirmado caído en la sesión anterior): la ejecución termina en `Fallo Quitar Fondo`, con `json.error_source: "quitar_fondo"` y `json.error` con el mensaje del 500. Sin campo `image`.
- Si el microservicio ya se recuperó: la ejecución termina en `04 Montar fondo premium` con un campo `image` poblado, sin pasar por ningún nodo `Fallo *`.

Ambos son un PASS — documenta cuál de los dos ocurrió, lo necesitas para saber si además hace falta forzar el caso de error manualmente en el Step 4.

- [ ] **Step 4: Forzar el caso de error si el microservicio ya funciona**

Solo si el Step 3 terminó en éxito: deshabilita temporalmente `03 Quitar Fondo` para simular el fallo.
```
mcp__n8n-mcp__update_workflow({
  workflowId: "<SUBWORKFLOW_ID>",
  versionName: "Test temporal: forzar fallo de 03 Quitar Fondo",
  operations: [{ type: "setNodeDisabled", nodeName: "03 Quitar Fondo", disabled: true }]
})
```
Nota: con el nodo deshabilitado, no se dispara su `onError` — su salida simplemente no fluye. Para probar el camino de error de verdad necesitas que el nodo SÍ se ejecute y falle. Si el microservicio está sano, la alternativa más fiel es apuntar temporalmente la URL de `03 Quitar Fondo` a un endpoint que sabes que da error (por ejemplo, cambia `url` a `http://192.168.1.10:8090/no-existe`), ejecutar, y luego revertir el `url` a su valor original con otra llamada a `update_workflow`. Confirma en `get_workflow_execution` que termina en `Fallo Quitar Fondo` con `error_source: "quitar_fondo"`.

Revierte cualquier cambio temporal (URL o `disabled`) a su estado original antes de continuar a la Task 4 — deja el sub-workflow exactamente como quedó verificado en la Task 2.

---

### Task 4: Construir el orquestador "Vinoteca – Scan Analizar v2"

**Files:** ninguno del repo.

- [ ] **Step 1: Validar el código SDK mínimo (solo el webhook trigger, con path temporal)**

```
mcp__n8n-mcp__validate_workflow({ code: `
import { workflow, trigger } from '@n8n/workflow-sdk';

const recibirImagen = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: '01 Recibir Imagen',
    parameters: { httpMethod: 'POST', path: 'vinoteca/scan/analizar-v2', responseMode: 'responseNode', options: {} },
    position: [-272, 176]
  },
  output: [{ body: { front: 'base64-frontal...', back: null } }]
});

export default workflow('vinoteca-scan-analizar-v2', 'Vinoteca – Scan Analizar v2')
  .add(recibirImagen);
` })
```
**Importante:** el `path` es `vinoteca/scan/analizar-v2` (temporal, con sufijo), NO el path de producción — el workflow original sigue activo en `vinoteca/scan/analizar` durante toda esta tarea y la Task 5, así que usar el mismo path chocaría. El path se corrige a `vinoteca/scan/analizar` en la Task 6, después de archivar el original.

- [ ] **Step 2: Crear el workflow**

```
mcp__n8n-mcp__create_workflow_from_code({
  code: <el mismo código del Step 1>,
  name: "Vinoteca – Scan Analizar v2",
  description: "Recibe imagen(es) de etiqueta de vino en base64, llama a OpenAI Vision (gpt-4o), extrae los datos del vino y devuelve el JSON al cliente. Sustituye a Vinoteca – Scan Analizar: la foto de estudio se delega al sub-workflow Vinoteca – Scan · Foto de Estudio (tolerante a fallo).",
  versionName: "Trigger inicial (path temporal de verificación)"
})
```
Expected: `workflowId` nuevo. **Guarda ese id como `V2_ID`.**

- [ ] **Step 3: Añadir el resto de nodos**

```
mcp__n8n-mcp__update_workflow({
  workflowId: "<V2_ID>",
  versionName: "Grafo completo del orquestador",
  versionDescription: "Copia de Vinoteca – Scan Analizar (18 nodos) con: 02/03/04 sustituidos por Execute Workflow hacia el sub-workflow de foto de estudio; credenciales huérfanas quitadas de 11 Analizar Vision; Debug Datos Vino/Tiene Nombre/Responder Sin nombre eliminados (Es Vino? true conecta directo a 30 Fusionar Datos del Vino).",
  operations: [
    { type: "addNode", node: {
      name: "Execute Foto de Estudio", type: "n8n-nodes-base.executeWorkflow", typeVersion: 1.3,
      parameters: {
        mode: "once", source: "database",
        workflowId: { __rl: true, mode: "id", value: "<SUBWORKFLOW_ID de la Task 2>" }
      },
      position: [480, -704]
    }},
    { type: "addNode", node: {
      name: "10 Preparar GPT", type: "n8n-nodes-base.code", typeVersion: 2,
      parameters: { jsCode: "const frontB64 = $input.first().json.body.front;\nconst backB64 = $input.first().json.body.back;\n\nconst prompt = `Eres un sommelier experto con acceso a bases de datos de vinos. Analiza con detalle TODAS las imágenes de etiqueta proporcionadas y extrae TODA la información posible.\n\nPRIMERO determina si la imagen muestra una botella de vino o una etiqueta de vino. Si NO es una botella/etiqueta de vino, devuelve:\n{\"is_wine\": false}\n\nSi SÍ es una botella/etiqueta de vino, devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin backticks, sin texto adicional):\n{\n  \"is_wine\": true,\n  \"nombre\": \"nombre del vino o marca en la etiqueta\",\n  \"bodega\": \"nombre del productor o bodega\",\n  \"anada\": 2023,\n  \"region\": \"región vitivinícola (ej: Ribera del Duero, Rioja, Priorat)\",\n  \"denominacion\": \"denominación de origen o indicación geográfica (ej: DO Ribera del Duero, IGP Vinos de la Tierra)\",\n  \"uva\": \"variedad o variedades de uva (ej: Tempranillo, Garnacha, Cabernet Sauvignon)\",\n  \"tipo\": \"Tinto\",\n  \"alcohol\": \"14.5%\",\n  \"crianza\": \"tipo de crianza (ej: Roble, Crianza, Reserva, Gran Reserva, Joven)\",\n  \"descripcion\": \"descripción breve del vino si aparece en alguna etiqueta, máximo 2 frases\",\n  \"url_bodega\": \"URL de la bodega SOLO si aparece impresa literalmente en la etiqueta, si no null\",\n  \"temp_servicio\": \"temperatura de servicio recomendada si aparece (ej: 15-16°C)\",\n  \"contiene\": \"alérgenos o aditivos relevantes (ej: Contiene sulfitos)\",\n  \"volumen\": \"volumen de la botella (ej: 750 ml)\"\n}\n\nReglas importantes:\n- Extrae TODOS los campos de CUALQUIER etiqueta disponible (frontal o trasera), no reserves campos solo para la trasera\n- Para 'tipo' usa SOLO uno de: Tinto, Blanco, Rosado, Espumoso, Dulce, Fortificado, Naranja\n- Si el color no está explícito, infiere el tipo por el color de la botella o conocimiento del vino\n- Para vinos españoles conocidos usa tu conocimiento para completar región/uva/tipo/alcohol aunque no aparezcan en la etiqueta — EXCEPCIÓN: 'url_bodega' NUNCA se completa de memoria ni se infiere a partir del nombre de la bodega (por ejemplo, no generes algo como \"bodeganombre.com\" solo porque reconoces la bodega). Solo se extrae si el texto de la URL/web aparece impreso literalmente en alguna de las etiquetas\n- 'denominacion' puede ser DO, DOCa, DOQ, AOC, IGP, VdT, etc.\n- Si hay añada visible úsala; si no, devuelve null\n- 'alcohol' aparece habitualmente en la etiqueta trasera o frontal como \"X% vol\" o \"X% alc.\"\n- 'volumen' suele aparecer como \"75 cl\" o \"750 ml\"\n- 'contiene' suele ser \"Contiene sulfitos\" u otros alérgenos\n- Devuelve null SOLO si genuinamente no puedes encontrar ni inferir el campo (salvo url_bodega, que sigue su propia regla arriba)\n- NUNCA inventes datos sobre vinos que no reconoces; en ese caso devuelve null`;\n\nconst content = [\n  { type: 'text', text: prompt },\n  { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + frontB64, detail: 'high' } }\n];\nif (backB64) {\n  content.push({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + backB64, detail: 'high' } });\n}\n\nreturn [{ json: {\n  model: 'gpt-4o',\n  max_tokens: 900,\n  messages: [{ role: 'user', content }]\n} }];" },
      position: [400, -384]
    }},
    { type: "addNode", node: {
      name: "11 Analizar Vision", type: "n8n-nodes-base.httpRequest", typeVersion: 4.3,
      parameters: {
        method: "POST", url: "https://api.openai.com/v1/chat/completions",
        authentication: "predefinedCredentialType", nodeCredentialType: "openAiApi",
        sendHeaders: true, headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
        sendBody: true, contentType: "raw", rawContentType: "application/json",
        body: "={{ JSON.stringify({ model: $json.model, max_tokens: $json.max_tokens, messages: $json.messages }) }}\n",
        options: {}
      },
      credentials: { openAiApi: { id: "HeNfhfUfwAHOImZn", name: "OpenAI Carlos" } },
      position: [576, -384]
    }},
    { type: "addNode", node: {
      name: "12 Parsear Vision", type: "n8n-nodes-base.code", typeVersion: 2,
      parameters: { jsCode: "const raw = $input.first().json.choices?.[0]?.message?.content ?? '';\n\nconst cleaned = raw.replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '').trim();\n\nlet parsed;\ntry {\n  parsed = JSON.parse(cleaned);\n} catch {\n  parsed = {};\n}\n\n// Si GPT indica que no es un vino, devolver flag inmediatamente\nif (parsed.is_wine === false) {\n  return [{ json: { is_wine: false } }];\n}\n\nreturn [{ json: {\n  is_wine: true,\n  nombre:       parsed.nombre       ?? null,\n  bodega:       parsed.bodega       ?? null,\n  anada:        parsed.anada        ?? null,\n  region:       parsed.region       ?? null,\n  denominacion: parsed.denominacion ?? null,\n  uva:          parsed.uva          ?? null,\n  tipo:         parsed.tipo         ?? null,\n  alcohol:      parsed.alcohol      ?? null,\n  crianza:      parsed.crianza      ?? null,\n  descripcion:  parsed.descripcion  ?? null,\n  url_bodega:   parsed.url_bodega   ?? null,\n  temp_servicio: parsed.temp_servicio ?? null,\n  contiene:     parsed.contiene     ?? null,\n  volumen:      parsed.volumen      ?? null,\n} }];" },
      position: [752, -384]
    }},
    { type: "addNode", node: {
      name: "Es Vino?", type: "n8n-nodes-base.if", typeVersion: 2,
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 1 },
          conditions: [{ id: "is-wine-check", leftValue: "={{ $json.is_wine }}", rightValue: true, operator: { type: "boolean", operation: "equals" } }],
          combinator: "and"
        },
        options: {}
      },
      position: [912, -368]
    }},
    { type: "addNode", node: {
      name: "30 Fusionar Datos del Vino", type: "n8n-nodes-base.code", typeVersion: 2,
      parameters: { jsCode: "// F30 — Reindexa los datos de \"12 Parsear Vision\" (GPT Vision), normalizando cadenas\n// vacías a null. Antes fusionaba con datos de un QR leído de la etiqueta trasera\n// (pick(vino.X, qr.qr_X)); esa rama se eliminó (ver docs/CHANGELOG.md — el escáner de\n// QR ya se había retirado del cliente en V1.3, los QR de etiqueta apuntan casi siempre\n// al portal AECOC y no a datos útiles). GPT Vision es ahora la única fuente aquí.\nfunction clean(value) {\n  if (value === undefined || value === null) return null\n  if (typeof value === 'string' && value.trim() === '') return null\n  return value\n}\n\nconst vino = $('12 Parsear Vision').first().json\n\nreturn [\n  {\n    json: {\n      nombre: clean(vino.nombre),\n      bodega: clean(vino.bodega),\n      anada: clean(vino.anada),\n      region: clean(vino.region),\n      denominacion: clean(vino.denominacion),\n      uva: clean(vino.uva),\n      tipo: clean(vino.tipo),\n      alcohol: clean(vino.alcohol),\n      crianza: clean(vino.crianza),\n      descripcion: clean(vino.descripcion),\n      url_bodega: clean(vino.url_bodega),\n      temp_servicio: clean(vino.temp_servicio),\n      contiene: clean(vino.contiene),\n      volumen: clean(vino.volumen),\n    }\n  }\n]\n" },
      position: [2704, -32]
    }},
    { type: "addNode", node: {
      name: "Normalizar Datos", type: "n8n-nodes-base.code", typeVersion: 2,
      parameters: { jsCode: "function clean(value) {\n    if (value === undefined || value === null) return null;\n\n    if (typeof value === \"string\") {\n        value = value.trim();\n\n        if (\n            value === \"\" ||\n            value.toLowerCase() === \"null\" ||\n            value.toLowerCase() === \"undefined\"\n        ) {\n            return null;\n        }\n    }\n\n    return value;\n}\n\nfunction normalizeAlcohol(value) {\n\n    value = clean(value);\n\n    if (!value) return null;\n\n    value = value\n        .replace(\",\", \".\")\n        .replace(\"%\", \"\")\n        .replace(/vol/gi, \"\")\n        .trim();\n\n    const number = parseFloat(value);\n\n    return isNaN(number)\n        ? null\n        : number;\n}\n\nfunction normalizeVolume(value) {\n\n    value = clean(value);\n\n    if (!value) return null;\n\n    value = value.toLowerCase();\n\n    if (value.includes(\"75\")) return 750;\n\n    if (value.includes(\"750\")) return 750;\n\n    if (value.includes(\"37.5\")) return 375;\n\n    if (value.includes(\"1500\")) return 1500;\n\n    return value;\n}\n\nfunction normalizeTipo(value){\n\n    value = clean(value);\n\n    if(!value) return null;\n\n    value=value.toLowerCase();\n\n    if(value.includes(\"tinto\")) return \"Tinto\";\n\n    if(value.includes(\"blanco\")) return \"Blanco\";\n\n    if(value.includes(\"rosado\")) return \"Rosado\";\n\n    if(value.includes(\"espum\")) return \"Espumoso\";\n\n    if(value.includes(\"dulce\")) return \"Dulce\";\n\n    if(value.includes(\"fort\")) return \"Fortificado\";\n\n    if(value.includes(\"naranja\")) return \"Naranja\";\n\n    return value;\n}\n\nfunction normalizeAnada(value){\n\n    value=clean(value);\n\n    if(!value) return null;\n\n    const year=parseInt(value);\n\n    if(year>=1900 && year<=2100)\n        return year;\n\n    return null;\n\n}\n\n// Verificación real: GPT Vision no navega la web, solo reconoce patrones de nombres de\n// bodega — antes de aceptar url_bodega comprobamos que la URL responda de verdad (mismo\n// patrón que Wine Enrich F8b). Si no responde 2xx/3xx, se descarta en vez de guardar un\n// enlace inventado o roto.\nasync function urlEsAlcanzable(url) {\n  try {\n    const res = await this.helpers.httpRequest({\n      method: 'GET',\n      url,\n      timeout: 8000,\n      simple: false,\n      returnFullResponse: true,\n    })\n    return res.statusCode >= 200 && res.statusCode < 400\n  } catch {\n    return false\n  }\n}\n\nconst wine=$input.first().json;\n\nlet urlBodega = clean(wine.url_bodega);\nif (urlBodega && !/^https?:\\/\\//i.test(urlBodega)) {\n  urlBodega = null;\n}\nif (urlBodega && !(await urlEsAlcanzable.call(this, urlBodega))) {\n  urlBodega = null;\n}\n\nreturn [\n\n{\n\njson:{\n\n...wine,\n\nnombre:clean(wine.nombre),\n\nbodega:clean(wine.bodega),\n\nanada:normalizeAnada(wine.anada),\n\nregion:clean(wine.region),\n\ndenominacion:clean(wine.denominacion),\n\nuva:clean(wine.uva),\n\ntipo:normalizeTipo(wine.tipo),\n\nalcohol:normalizeAlcohol(wine.alcohol),\n\nvolumen:normalizeVolume(wine.volumen),\n\ncrianza:clean(wine.crianza),\n\ndescripcion:clean(wine.descripcion),\n\nurl_bodega:urlBodega,\n\ntemp_servicio:clean(wine.temp_servicio),\n\ncontiene:clean(wine.contiene),\n\ncertificaciones:Array.isArray(wine.certificaciones)\n? wine.certificaciones\n:[],\n\nmaridaje:Array.isArray(wine.maridaje)\n? wine.maridaje\n:[],\n\nimagen_url:clean(wine.imagen_url),\n\nqr_fuente:clean(wine.qr_fuente)\n\n}\n\n}\n\n];" },
      position: [2912, -32]
    }},
    { type: "addNode", node: {
      name: "Merge Final", type: "n8n-nodes-base.merge", typeVersion: 3.2,
      parameters: { mode: "combine", combineBy: "combineByPosition", options: {} },
      position: [3104, -384]
    }},
    { type: "addNode", node: {
      name: "40 Extraer URL Imagen", type: "n8n-nodes-base.code", typeVersion: 2,
      parameters: { jsCode: "const wineData = $json;\n\nlet imagenUrl = null;\n\nif ($json.image) {\n  imagenUrl = $json.image;\n}\n\nif (!imagenUrl) {\n  const frontB64 = $('01 Recibir Imagen').first().json.body.front;\n  imagenUrl = 'data:image/jpeg;base64,' + frontB64;\n}\n\nreturn [{\n  json: {\n    ...wineData,\n    imagen_url: imagenUrl\n  }\n}];" },
      position: [3312, -384]
    }},
    { type: "addNode", node: {
      name: "Preparar Respuesta API", type: "n8n-nodes-base.code", typeVersion: 2,
      parameters: { jsCode: "const wine = $input.first().json;\n\nreturn [\n  {\n    json: {\n      nombre: wine.nombre,\n      bodega: wine.bodega,\n      anada: wine.anada,\n      region: wine.region,\n      denominacion: wine.denominacion,\n      uva: wine.uva,\n      tipo: wine.tipo,\n      alcohol: wine.alcohol,\n      crianza: wine.crianza,\n      descripcion: wine.descripcion,\n      url_bodega: wine.url_bodega,\n      temp_servicio: wine.temp_servicio,\n      contiene: wine.contiene,\n      volumen: wine.volumen,\n\n      maridaje: wine.maridaje ?? [],\n      certificaciones: wine.certificaciones ?? [],\n\n      imagen_url: wine.imagen_url,\n      imagen_trasera_url: wine.imagen_trasera_url ?? null,\n\n      has_qr: wine.has_qr ?? false,\n      qr_fuente: wine.qr_fuente ?? null\n    }\n  }\n];" },
      position: [3520, -384]
    }},
    { type: "addNode", node: {
      name: "41 Responder", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1.5,
      parameters: { options: { responseCode: 200, responseHeaders: { entries: [{ name: "Content-Type", value: "application/json" }] } } },
      position: [3712, -384]
    }},
    { type: "addNode", node: {
      name: "Responder No Vino", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1.5,
      parameters: {
        respondWith: "json", responseBody: "={{ JSON.stringify({ is_wine: false }) }}",
        options: { responseCode: 200, responseHeaders: { entries: [{ name: "Content-Type", value: "application/json" }] } }
      },
      position: [1120, -224]
    }},
    { type: "addConnection", source: "01 Recibir Imagen", target: "Execute Foto de Estudio" },
    { type: "addConnection", source: "01 Recibir Imagen", target: "10 Preparar GPT" },
    { type: "addConnection", source: "Execute Foto de Estudio", target: "Merge Final", targetIndex: 0 },
    { type: "addConnection", source: "10 Preparar GPT", target: "11 Analizar Vision" },
    { type: "addConnection", source: "11 Analizar Vision", target: "12 Parsear Vision" },
    { type: "addConnection", source: "12 Parsear Vision", target: "Es Vino?" },
    { type: "addConnection", source: "Es Vino?", sourceIndex: 0, target: "30 Fusionar Datos del Vino" },
    { type: "addConnection", source: "Es Vino?", sourceIndex: 1, target: "Responder No Vino" },
    { type: "addConnection", source: "30 Fusionar Datos del Vino", target: "Normalizar Datos" },
    { type: "addConnection", source: "Normalizar Datos", target: "Merge Final", targetIndex: 1 },
    { type: "addConnection", source: "Merge Final", target: "40 Extraer URL Imagen" },
    { type: "addConnection", source: "40 Extraer URL Imagen", target: "Preparar Respuesta API" },
    { type: "addConnection", source: "Preparar Respuesta API", target: "41 Responder" }
  ]
})
```
Expected: operación atómica OK.

- [ ] **Step 4: Verificar la forma del grafo completo**

```
mcp__n8n-mcp__get_workflow_details({ workflowId: "<V2_ID>", detailLevel: "full" })
```
Expected: 13 nodos (`01 Recibir Imagen`, `Execute Foto de Estudio`, `10 Preparar GPT`, `11 Analizar Vision`, `12 Parsear Vision`, `Es Vino?`, `30 Fusionar Datos del Vino`, `Normalizar Datos`, `Merge Final`, `40 Extraer URL Imagen`, `Preparar Respuesta API`, `41 Responder`, `Responder No Vino`). `11 Analizar Vision` tiene únicamente la credencial `openAiApi` (sin `httpHeaderAuth` ni `httpCustomAuth`). Ningún nodo llamado `Debug Datos Vino`, `Tiene Nombre` ni `Responder Sin nombre`. Sin conexiones colgantes.

---

### Task 5: Verificar el orquestador v2 completo (4 casos), sin tocar el webhook real

**Files:** ninguno.

- [ ] **Step 1: Caso A — escaneo normal**

Usa el mismo payload (`front` en base64) de la Task 3, Step 2.
```
mcp__n8n-mcp__execute_workflow({
  workflowId: "<V2_ID>", executionMode: "manual", triggerNodeName: "01 Recibir Imagen",
  inputs: { webhookData: { body: { front: "<base64>", back: null } } }
})
```
Luego `mcp__n8n-mcp__get_workflow_execution({ executionId: "<id>", includeData: true })`.

Expected: `lastNodeExecuted: "41 Responder"`. Respuesta final con `is_wine: true`, `nombre: "Cható Gañán"` (dato real ya confirmado en sesión previa contra la misma foto), el resto de campos de identidad `null`, `has_qr: false`, `qr_fuente: null`, `maridaje: []`, `certificaciones: []`, e `imagen_url` poblado — con el valor real de `04 Montar fondo premium` si el microservicio ya funciona, o con el fallback `data:image/jpeg;base64,...` (la foto frontal cruda) si no.

- [ ] **Step 2: Caso B — fallback por microservicio caído**

Si en el Step 1 la ejecución de `Execute Foto de Estudio` terminó con `error`/`error_source` (microservicio caído), este caso ya está cubierto — confirma en la respuesta final del Step 1 que, a pesar de eso, `41 Responder` devolvió un `ScanResult` completo y correcto (con `imagen_url` usando el fallback a la foto frontal cruda, no un error propagado al cliente).

Si el Step 1 tuvo éxito completo (microservicio sano), fuerza el fallo temporalmente: en el sub-workflow, cambia `url` de `03 Quitar Fondo` a un endpoint inexistente (`http://192.168.1.10:8090/no-existe`) vía `update_workflow`, repite este mismo `execute_workflow` contra `V2_ID`, confirma el mismo resultado esperado, y **revierte el `url` a su valor original** antes de seguir.

- [ ] **Step 3: Caso C — sin nombre reconocible**

Este caso necesita que `12 Parsear Vision` produzca `{ is_wine: true, nombre: null, ... }` sin depender de una foto real ambigua. Antes de este paso, busca las herramientas de datos fijados (`ToolSearch({query: "select:mcp__n8n-mcp__prepare_workflow_pin_data,mcp__n8n-mcp__test_workflow", max_results: 5})`), lee sus schemas, y úsalas para fijar la salida de `12 Parsear Vision` a `{ is_wine: true, nombre: null, bodega: null, anada: null, region: null, denominacion: null, uva: null, tipo: null, alcohol: null, crianza: null, descripcion: null, url_bodega: null, temp_servicio: null, contiene: null, volumen: null }` y ejecutar el resto del grafo desde ahí.

Expected: la ejecución llega a `41 Responder` con `nombre: null` (y el resto de campos `null`) en vez de fallar o devolver un shape distinto — confirma explícitamente que **no** existe ningún nodo `Responder Sin nombre` ni ninguna respuesta con forma distinta al `ScanResult` normal.

- [ ] **Step 4: Caso D — no es vino**

Con el mismo mecanismo de datos fijados del Step 3, fija la salida de `12 Parsear Vision` a `{ is_wine: false }` y ejecuta desde ahí.

Expected: la ejecución termina en `Responder No Vino` con `{ "is_wine": false }` como única respuesta — sin llegar a `30 Fusionar Datos del Vino` ni a `41 Responder`.

- [ ] **Step 5: Limpieza de datos fijados**

Si el mecanismo de la Task usó pin data persistente en el workflow, quítalo antes de continuar a la Task 6 (el workflow debe quedar limpio, sin datos de prueba fijados, antes de publicarlo).

---

### Task 6: Corte a producción y documentación

**Files:**
- Modify: `docs/CHANGELOG.md`

- [ ] **Step 1: Corregir el path del webhook de v2 al path de producción**

```
mcp__n8n-mcp__update_workflow({
  workflowId: "<V2_ID>",
  versionName: "Path de producción",
  operations: [{
    type: "updateNodeParameters", nodeName: "01 Recibir Imagen", replace: true,
    parameters: { httpMethod: "POST", path: "vinoteca/scan/analizar", responseMode: "responseNode", options: {} }
  }]
})
```

- [ ] **Step 2: Renombrar el workflow original a "Previo"**

```
mcp__n8n-mcp__update_workflow({
  workflowId: "NMQZ4zhYw3RjTcLp",
  versionName: "Renombrar antes de archivar",
  operations: [{ type: "setWorkflowMetadata", name: "Vinoteca – Scan Analizar Previo" }]
})
```

- [ ] **Step 3: Archivar el original**

```
mcp__n8n-mcp__archive_workflow({ workflowId: "NMQZ4zhYw3RjTcLp" })
```
Esto libera el path `vinoteca/scan/analizar` para que `V2_ID` lo tome en el Step 4.

- [ ] **Step 4: Publicar v2**

```
mcp__n8n-mcp__publish_workflow({ workflowId: "<V2_ID>" })
```

- [ ] **Step 5: Confirmar el corte**

```
mcp__n8n-mcp__get_workflow_details({ workflowId: "<V2_ID>", detailLevel: "full" })
```
Expected: `active: true`, webhook en `vinoteca/scan/analizar`.
```
mcp__n8n-mcp__get_workflow_details({ workflowId: "NMQZ4zhYw3RjTcLp", detailLevel: "full" })
```
Expected: `isArchived: true`, `name: "Vinoteca – Scan Analizar Previo"`.

- [ ] **Step 6: Documentar en el CHANGELOG**

Añade una entrada nueva bajo `## [Unreleased]` → `### Changed` (crea la sección si no existe todavía en el bloque `[Unreleased]`) en `docs/CHANGELOG.md`, con el mismo nivel de detalle que la entrada de la limpieza de QR (commit `96dc0d2`): explica que el workflow n8n `Vinoteca – Scan Analizar` se sustituyó por `Vinoteca – Scan Analizar v2`, que la rama de foto de estudio ahora vive en un sub-workflow independiente (`Vinoteca – Scan · Foto de Estudio`) con manejo de error explícito — un fallo del microservicio local de recorte de fondo ya no tumba el resto del escaneo, solo degrada a usar la foto frontal cruda —, que se eliminaron los nodos vestigiales `Debug Datos Vino`/`Tiene Nombre`/`Responder Sin nombre` (este último tenía un bug: devolvía una cadena suelta en vez del objeto `ScanResult` completo), y que el original quedó archivado como `Vinoteca – Scan Analizar Previo`. Enlaza al spec (`docs/superpowers/specs/2026-08-28-scan-analizar-orquestador-design.md`) y al backup (`docs/n8n-backups/`).

- [ ] **Step 7: Commit**

```bash
git add docs/CHANGELOG.md
git commit -m "docs: documentar la descomposición de Scan Analizar en orquestador + sub-workflow"
git push
```
