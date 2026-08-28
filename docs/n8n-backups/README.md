# Backups de workflows n8n

Snapshots puntuales del JSON completo de un workflow, tomados **antes** de una edición
estructural (borrado/reordenación de nodos) vía `mcp__n8n-mcp__update_workflow`, para
poder restaurar manualmente si algo sale mal. No es un mecanismo automático — cada
archivo se crea a mano, justo antes del cambio que documenta.

Para restaurar: recrear los nodos/conexiones del JSON vía `addNode`/`addConnection`
(o pegar el JSON en el editor de n8n si el import manual es más rápido), o pedir
que se reconstruya el equivalente vía MCP a partir de este fichero.

## Índice

- [`vinoteca-scan-analizar-2026-08-28-pre-qr-removal.json`](vinoteca-scan-analizar-2026-08-28-pre-qr-removal.json)
  — estado de `Vinoteca – Scan Analizar` (`NMQZ4zhYw3RjTcLp`) justo antes de eliminar
  la rama de lectura de QR (12 nodos: `20 Preparar Trasera` → … → `Merge QR`, más
  `Merge Datos`). Ver `docs/CHANGELOG.md` para el motivo del borrado.
