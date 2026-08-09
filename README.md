<!-- App: https://hmorelos.github.io/albatros-app/ -->

# albatros-app
control de reservas 

## Sync de reservas por paquetes pequenos

La app ahora puede enviar `reservas` en lotes pequenos para evitar payloads gigantes.
Ahora viene activo por defecto.

Para apagarlo temporalmente:

- `localStorage.setItem("alb_chunk_sync_v1", "0")`

Para forzarlo de forma explicita en una llamada:

- `syncTab("rsvp_v6", rsvps, { chunked: true })`

Protocolo esperado en backend (Apps Script):

1. `POST { action: "replaceRowsStart", tab: "reservas", totalRows, totalChunks }`
2. `POST { action: "replaceRowsChunk", tab: "reservas", chunkIndex, totalChunks, rows: [...] }`
3. `POST { action: "replaceRowsCommit", tab: "reservas", totalRows, totalChunks }`

Cada objeto de `rows` representa una reserva y se debe guardar en una fila (una columna con JSON por fila).

La app mantiene fallback automatico al metodo legado `POST { tab, data }` si el flujo por chunks no se confirma en verificacion remota.

Implementacion sugerida en backend:

- [appscript.gs](appscript.gs)
