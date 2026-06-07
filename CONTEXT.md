# CONTEXT.md — Vinoteca

Domain glossary for the Vinoteca wine-cellar / tasting-notes PWA. All code, issue titles, and agent output should use these terms exactly.

## Glossary

| Term | Definition | Avoid |
|---|---|---|
| **Vinoteca** | The app itself; literally "wine cellar" in Spanish | "wine app", "the app" |
| **Vino** | A wine bottle record (`Wine` type). A vino belongs to one user. | "wine entry", "bottle" |
| **Bodega** | The user's personal wine cellar — the collection of all their vinos. The `/bodega` route shows this. | "cellar", "library", "collection", "productor" |
| **Productor** | The company or winery that made a vino (`bodega` field on the `Wine` type, e.g. "Vega Sicilia"). | "bodega" (when referring to the maker), "winery" |
| **Cata** | A tasting session for a specific vino (`Tasting` type). A vino can have many catas. | "review", "note" |
| **Notas de cata** | Free-text tasting notes within a cata (`notas_cata` field). | "notes", "description" |
| **Añada** | Vintage year of a vino (`anada` field). | "vintage", "year" |
| **Región** | Broad geographic zone of the vino (e.g. Rioja, Ribera del Duero). Free text (`region` field). | "zone", "area" |
| **Denominación** | Official quality certification (e.g. DOCa Rioja, DO Ribera del Duero). Free text but the Scan workflow should normalise it against the official registry (`denominacion` field). | "appellation", "region" |
| **Uva** | Grape variety or blend (`uva` field). | "grape", "varietal" |
| **Tipo** | Wine category. Closed list: Tinto, Blanco, Rosado, Espumoso, Dulce, Fortificado, Naranja. | "style", "colour" |
| **Maridaje** | Food pairing suggestion within a cata (`maridaje` field). | "pairing", "food pairing" |
| **Puntuación** | Numeric score for a cata on the Parker 0–100 scale (`puntuacion` field). | "score", "rating", "points" |
| **Sommelier** | AI assistant on the `/sommelier` tab for free-form wine questions, recommendations, and pairings. Implemented as an n8n workflow called via webhook. | "AI chat", "chatbot" |
| **Asistente de cata** | AI assistant scoped to a specific cata; helps the user analyse colour, aroma, and palate for that wine. Separate n8n workflow from the Sommelier. | "sommelier" (when referring to the cata assistant), "chat de cata" |
| **Chat de cata** | The conversation thread of an Asistente de cata, persisted in `chat_history` on the `Tasting` record. Each cata has its own independent thread. | "sommelier history", "global chat" |
| **Añadir** | The action of adding a new vino to the bodega. The `/anadir` route captures the label photo and sends it to the n8n Scan workflow. | "add wine", "new wine" |
| **Scan workflow** | n8n workflow that receives a label image from the app, identifies the wine (vision + external search), formats the image, writes the Vino record to Supabase, and returns the result to the app. | "image analysis", "OCR flow" |
| **Synced** | A vino or cata that has been confirmed written to Supabase (`synced_at` is non-null). Opposite of pending/offline. | "saved", "uploaded" |
| **Estadísticas** | The `/stats` screen. Shows a breakdown of the user's Bodega by Tipo (Tinto, Blanco, Rosado, Espumoso, Dulce, Fortificado, Naranja). | "analytics", "insights" |

## Routes and their domain meaning

| Route | Domain concept |
|---|---|
| `/bodega` | Browse the bodega (CellarPage) |
| `/anadir` | Añadir a new vino (ScanPage — camera scan or manual entry) |
| `/catas` | Browse all catas across all vinos (TastingsPage) |
| `/sommelier` | AI sommelier chat (SommelierPage) |

## Data model summary

```
User
└── Wine (vino)
    ├── fields: nombre, bodega*, añada, region, denominación, uva, imagen_frontal_url, imagen_trasera_url
    └── Tasting (cata)
        └── fields: fecha, puntuación, notas_cata, aroma, color_descripcion, maridaje, chat_history[]
```

*`bodega` on the `Wine` type is the Productor name — not the user's Bodega.

## Missing glossary terms

If you encounter a concept not listed here, flag it for `/grill-with-docs` rather than inventing a synonym.
