# ADR 0006 — Bloqueo del zoom manual en la app

**Fecha:** 2026-08-19
**Estado:** Implementado

## Contexto

Durante el cierre de la Fase 11 el usuario reportó que la app "no encajaba" en la pantalla del móvil y tenía que ajustar el zoom manualmente para ver todo. La causa raíz encontrada fue que varios inputs/selects/textareas del tema usan `font-size` menor de 16px (p. ej. `theme.font.base` = 14px, usado en el buscador de `Bodega.tsx`), lo que hace que iOS Safari haga zoom automático al enfocar el campo — zoom que no se revierte solo.

Ese primer fix (forzar 16px en campos de formulario en viewport móvil, ver `src/index.css`) resuelve el zoom automático al escribir, pero no impide que el usuario haga zoom manual con pellizco o doble-tap en cualquier otra parte de la app.

## Decisión

Se bloquea también el zoom manual, con instrucción explícita del usuario:

- `index.html`: `user-scalable=no, maximum-scale=1.0` en el meta viewport.
- `src/index.css`: `touch-action: manipulation` en `body`, para cubrir el zoom por doble-tap que algunos navegadores no bloquean solo con el meta tag.

## Consecuencias

- La app queda fija a la pantalla del dispositivo, sin que el usuario pueda desajustar el layout con un pellizco accidental — resuelve el síntoma original de raíz, no solo el caso de los inputs.
- **Trade-off de accesibilidad conocido y aceptado:** usuarios con baja visión que dependen del pinch-zoom del navegador para leer contenido ya no pueden hacerlo dentro de esta app. Si en el futuro se prioriza accesibilidad sobre este bloqueo, revertir revirtiendo el meta viewport y la regla `touch-action`; el fix de `font-size: 16px` en inputs (`src/index.css`) debe mantenerse en cualquier caso, ya que es el que evita el zoom *automático* no deseado de iOS.
