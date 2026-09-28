# Fase 13 — Tutor de cata y glosario (V3.1)

## Estado

✅ Completada (2026-09-28): probada por Carlos y desplegada en producción junto con la [Fase 12](fase-12-cuaderno-catas.md).

---

## Objetivo

Aprender a catar mientras se rellena el cuaderno: una ayuda que **dirige la cata y corrige lo que se escribe** en cada sección, enseñando el vocabulario del vino, y que compara la descripción con **notas de cata profesionales** buscadas en internet.

## Decisiones (tomadas con Carlos, 2026-09-28)

| Pregunta | Decisión |
|---|---|
| Cómo ayuda | **Tutor por sección**: botón «🎓 Revisar» en Vista, Nariz y Boca de la ficha guiada (`JournalSheetForm`). |
| Notas profesionales | Se buscan con **Brave Search** desde n8n y se muestran **después** de que el usuario haya escrito lo suyo, para no condicionarle. |
| Vocabulario | **Glosario personal** en la app (tabla `glossary_terms`, página `/glosario`). |
| Brave | Credencial ya existente en n8n: «Brave Search account» (`braveSearchApi`). |

## Piezas

- **n8n** `vinoteca-cata-tutor` (`POST vinoteca/cata/tutor`) — ver [backend-n8n.md §8](../backend-n8n.md). Devuelve valoración, qué falta observar, «cómo lo diría un sumiller» (solo con los descriptores del usuario), 2–4 términos con definición, comparación con las notas profesionales (o `null`) y una pista para la siguiente sección.
- **BD** [`20260928120000_glosario_cata.sql`](../../supabase/migrations/20260928120000_glosario_cata.sql): `glossary_terms` con RLS por usuario, categoría (vista/nariz/boca/general), vino de origen (`on delete set null`) y deduplicación por `termino_key = lower(btrim(termino))` (columna generada, porque PostgREST solo admite `on_conflict` sobre columnas).
- **Cliente**
  - `callCataTutor` en `src/lib/n8n.ts`; `describeBoca` en `cuadernoHelpers.ts` pasa las escalas a palabras (con números, el modelo los copiaba en la versión del sumiller).
  - `TutorPanel`: valoración, «Fíjate también en», versión del sumiller con **«Usar esta versión»** (sustituye Vista/Nariz; en Boca se añade a las notas), chips de vocabulario con definición y **«Guardar en mi glosario»**, bloque plegable «Lo que dicen los profesionales» con las fuentes enlazadas.
  - `JournalSheetForm` recibe `wine` (desde `NuevaCata` y `TastingEditForm`); guarda las `notasPro` de la primera revisión y las reenvía en las demás, así que **Brave se consulta una vez por cata**.
  - `useGlossary` (solo online) y página `/glosario` con buscador, filtro por sección, borrar y enlace al vino; acceso con 📖 en la cabecera del cuaderno.

## Verificado

- Webhook de producción con el Zerberos en vista, nariz y boca: JSON correcto, términos con definición y fuentes reales de Brave. Con `notasPro` ya enviadas, el nodo de Brave no se ejecuta.
- SQL: un término repetido con otras mayúsculas y espacios se ignora; otro usuario no ve las filas (RLS). Advisors sin avisos nuevos.
- `npx tsc -b`, ESLint de los archivos tocados y `npm run build` limpios.

## Rendimiento y ajustes (2026-09-28)

- El modelo del agente se cambió de `Combo_n8n` (Omniroute) a **`gpt-4o-mini`**: cada revisión pasa de 20–24 s a **unos 3 s** (la primera de la cata, con la búsqueda en Brave, 3–4 s). Casi todo el tiempo era la generación de texto (unos 590 tokens a unos 25 tokens/s).
- Con el modelo más rápido hubo que endurecer el prompt:
  - ejemplos BIEN/MAL de la versión del sumiller, para que no añada intensidades ni adjetivos de calidad y escriba Boca en prosa;
  - solo la lista de aspectos de la sección revisada, con 2–3 preguntas como máximo;
  - citas por el sitio web y no por número;
  - la pista final se fija desde el workflow según la sección.
- `Extract Pro Notes` quita los extractos repetidos de Brave (la descripción venía duplicada dentro de `extra_snippets`) y sube el límite a 900 caracteres, así llegan las frases útiles de la nota.

## Pendiente / fuera de alcance

- Brave suele devolver notas de **otros vinos de la bodega** o de otra añada; el prompt obliga a devolver `comparacion_pro: null` si ninguna habla de este vino, pero las fuentes se siguen mostrando.
- La corrección no se guarda con la cata: lo aprendido queda en el glosario y en el texto si se pulsa «Usar esta versión».
- Añadir términos a mano al glosario (la categoría `general` ya existe para ello).
