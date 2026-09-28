# Idea — RAG con el curso de sommelier

## Estado

💡 Idea documentada (2026-09-28). **No hay nada implementado.** Carlos quiere valorar antes si convierte los PDF a Markdown.

---

## Objetivo

Usar el curso de sommelier de Carlos (PDF) como base de conocimiento para la IA de la app, con un RAG en n8n. El tutor de cata ([Fase 13](fase-13-tutor-cata.md)) corregiría con el método y el vocabulario del curso, en lugar de con lo que el modelo recuerde de forma genérica. Brave Search seguiría aportando lo que se dice del **vino concreto**, y el curso aportaría la **teoría**.

## Material

Carpeta de iCloud: `~/Library/Mobile Documents/com~apple~CloudDocs/Desktop/DE VINOS`

- 39 PDF y un `.webarchive` («Tema 4.- Los Sacacorchos»), 44 MB en total.
- 897 páginas y unos 1,2 millones de caracteres (unos 300.000 tokens).
- **Todos tienen texto seleccionable**, así que no hace falta OCR. Se comprobó con PDFKit: el texto sale limpio y las tablas de dos columnas se leen como «término + descripción» (por ejemplo, los tipos de tanino en Análisis Sensorial, p. 20).

### Qué temas incluir

| Grupo | Temas | Uso |
|---|---|---|
| Imprescindible | Análisis Sensorial, Tipos de Vinos, elaboración de blancos (I y II), tintos, rosados y maceración carbónica y vinos especiales, Crianza, Defectos y alteraciones, Maridaje y armonía, Servicio del vino y temperaturas | Tutor, glosario y sommelier |
| Útil | Regiones (Francia, Europa, EE. UU., Sudamérica, Sudáfrica, Nueva Zelanda y Australia), viña (morfología, ciclo vegetativo, fisiología, poda, protección), filtración y clarificación, conservación, tapones | Sommelier y enriquecimiento de denominaciones |
| Fuera por ahora | Café, té, agua, aceite, jamón, cerveza, destilados, hostelería, sector servicios, compras, funciones del sumiller, cartas de vino, lengua extranjera | No aportan a la app. Jamón y aceite quizá para maridaje más adelante |

## ¿Convertir los PDF a Markdown?

Idea de Carlos: pasarlos a Markdown para que ocupen menos tokens.

- **Tokens:** el ahorro es pequeño. El PDF extraído ya es texto plano; el Markdown solo quita saltos de línea partidos, cabeceras y pies de página repetidos, e índices. Se estima entre un 5 % y un 15 % menos. Además, los embeddings de todo el curso cuestan menos de 1 céntimo, así que el coste no es un motivo.
- **Donde sí ayuda es la calidad:**
  - Los encabezados (`#`, `##`) permiten trocear **por secciones del temario** en vez de por número de caracteres. Cada fragmento queda con un tema coherente y un título útil para citar.
  - Las tablas en Markdown conservan la relación entre filas y columnas mejor que el texto plano.
  - Se puede revisar y corregir a mano antes de indexarlo, y queda versionable.
- **Coste:** hay que convertirlo y revisarlo. Una herramienta automática (Docling, Marker o pymupdf4llm) lo hace en minutos; la revisión es lo que lleva tiempo.
- **Contra:** en Markdown se pierde el número de página, salvo que la conversión lo marque (por ejemplo, con un comentario `<!-- p. 20 -->` en cada página). Conviene conservarlo para poder citar la fuente.

**Recomendación:** merece la pena, pero por calidad y no por tokens. Hay que convertirlo con marcas de página y trocear por encabezados.

## Diseño propuesto (para cuando se retome)

1. **Preparar el texto (en local):** Markdown con marcas de página, o extracción con PDFKit por página si se descarta el Markdown. Salen fragmentos de unas 800 palabras con los metadatos `tema`, `seccion`, `pagina` y `grupo`. Se filtran las páginas de índice y las portadas.
2. **BD:** activar `pgvector` en el Supabase self-hosted. Está disponible (0.8.2) pero no instalado. Crear la tabla `curso_chunks` (contenido, metadatos, `embedding vector(1536)`) y la función de búsqueda que espera el nodo Supabase Vector Store de n8n.
3. **Workflow de carga en n8n:** recibe los fragmentos, calcula los embeddings con `text-embedding-3-small` y los guarda en Supabase. Se ejecuta una sola vez y otra si se añaden temas. Hay que comprobar si Omniroute acepta embeddings; si no, se usa la credencial «OpenAI Carlos».
4. **Tutor (`vinoteca-cata-tutor`):** antes del agente, recuperar los 4 o 5 fragmentos más cercanos a la sección y a lo que ha escrito el usuario y pasarlos como contexto. El tutor cita «según el curso, Análisis Sensorial, p. 20».
5. **Glosario:** las definiciones salen del curso siempre que exista el término.
6. **Sommelier y enriquecimiento:** en una segunda fase, como herramienta de consulta del agente.

**Evaluación:** repetir las pruebas del Zerberos (vista, nariz y boca) con y sin RAG y comparar el vocabulario, las definiciones y si cita el curso.

## Salvedad

El curso tiene derechos de autor. Usarlo en una app personal de un solo usuario es razonable, pero la app no debe mostrar párrafos literales largos: la IA lo usa como base y cita la fuente.
