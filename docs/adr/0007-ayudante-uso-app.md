# ADR 0007 — Ayudante flotante de uso de la app

**Fecha:** 2026-08-19
**Estado:** Implementado

## Contexto

El usuario pidió un "ayudante" para resolver dudas sobre cómo usar la app (añadir vinos, escanear etiquetas, registrar catas, navegación) — algo distinto del Sommelier existente en `/sommelier`, que da recomendaciones de vino, no ayuda de uso. El icono debía tener forma de personaje "tipo sommelier", ser activable/desactivable, y explícitamente **no debía ser molesto ni dificultar la vista de los vinos** en pantalla.

## Decisión

- **Widget global, no una pestaña nueva:** `AssistantWidget` se monta una sola vez en `src/components/ui/Layout.tsx` (junto a `Toast`/`SyncIndicator`), visible en todas las rutas protegidas, en vez de duplicarlo por página.
- **No intrusivo por diseño:** icono de 44px (más pequeño que el FAB de escaneo, 52px), en la esquina **inferior izquierda** — a propósito en el lado opuesto al FAB de escaneo de `Bodega.tsx` (inferior derecha), para que nunca coincidan dos botones flotantes. Opacidad reducida (0.55) en reposo, `1` al interactuar. El chat se abre como panel tipo bottom-sheet superpuesto (con scrim), nunca inline empujando contenido — así en reposo solo ocupa 44px en una esquina y jamás tapa una tarjeta de vino.
- **No conserva la conversación al cerrar:** decisión explícita del usuario tras el primer despliegue — cerrar el panel (botón X o tocar fuera) limpia `messages`/`input`, así que cada apertura empieza de cero. A diferencia del Sommelier (`/sommelier`), donde el historial de chat persiste mientras el usuario navega, este ayudante es de consulta puntual, no de conversación continuada.
- **Backend en n8n, mismo patrón que el resto de asistentes IA** (ver [ADR 0001](0001-ai-assistants-via-n8n.md)): nuevo workflow `vinoteca-ayuda-chat` (webhook `POST /webhook/vinoteca/ayuda/chat` → AI Agent `gpt-4o-mini`, credencial "OpenAI Carlos" reutilizada de los workflows de sommelier), en vez de reintroducir llamadas a OpenAI desde el cliente. El system prompt vive en el nodo del workflow, no en el repo.

## Consecuencias

- Añadir o cambiar temas de ayuda requiere editar el system prompt del nodo "Ayuda AI" en n8n (vía n8n-mcp o la UI de n8n), no solo tocar `AssistantWidget.tsx`.
- Al no persistir conversación, el usuario no puede retomar una duda a medias tras cerrar el panel — trade-off aceptado a cambio de simplicidad y de que cada sesión de ayuda sea autocontenida.
- El posicionamiento en la esquina inferior izquierda asume que ningún otro FAB futuro se coloque ahí — si se añade uno, revisar este ADR.
