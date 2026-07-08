# Fase 10 — Sommelier IA

## Estado

⬜ Pendiente

---

## Objetivo

Mejorar la experiencia del Sommelier IA con recomendaciones personalizadas basadas en el historial de catas del usuario, búsqueda por ocasión y comparativas entre vinos.

---

## Alcance

- Recomendaciones personalizadas basadas en historial de catas
- Búsqueda por ocasión ("vino para cena romántica", "para un asado de verano")
- Comparativas entre vinos de la colección
- Contexto de catas del usuario en todas las respuestas del Sommelier
- Maridajes inversos (dado un vino, qué platos recomienda)

---

## Funcionalidades

*(Por definir en la sesión de diseño de la fase)*

---

## Decisiones de diseño

*(Por definir)*

---

## Decisiones técnicas

- Los tres endpoints del Sommelier ya están activos: `chat`, `maridaje`, `enriquecimiento`
- Ampliar `WineCollection` enviada al Sommelier para incluir historial de catas (resumen)
- Posible nuevo endpoint `sommelier/recomendacion` en n8n

---

## Pendiente

- Completar Fase 8 (catas) antes de comenzar esta fase — el historial de catas es prerrequisito
- Diseño de la interfaz de recomendaciones

---

## Criterio de finalización

El Sommelier puede hacer recomendaciones personalizadas basándose en el gusto demostrado del usuario a través de su historial de catas.
