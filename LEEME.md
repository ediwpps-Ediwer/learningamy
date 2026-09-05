# Juego de Gaby — carpeta del proyecto

## Dónde dejar la documentación

**Opción 1 — la más simple y la que recomiendo: arrastrala a este chat.**
Foto, PDF o captura, directo en la conversación. Yo la leo al instante y la
convierto en niveles. No hay que mover archivos ni avisar nada.

**Opción 2 — si preferís dejarla en la PC:**

```
Escritorio\Claude\JuegoGaby\contenido\entrada\
```

Dejá ahí los archivos y decime *"ya dejé archivos en entrada"*. Yo los abro, los
proceso, y los muevo a `contenido\procesado\` para que sepamos cuáles ya están
convertidos en niveles.

> Podés usar las dos. El chat es más rápido para una foto suelta; la carpeta es
> mejor para descargar varios PDFs de golpe.

### Cómo nombrar los archivos (ayuda, no es obligatorio)

```
ireading-reading-otonio-2026.pdf
programa-septiembre-2026.pdf
tarea-2026-09-08-math.jpg
tarea-2026-09-08-reading.jpg
reportcard-2026-q1.pdf
```

Si el nombre no dice nada, igual lo abro y lo identifico.

### Qué material es el más valioso

| Prioridad | Documento | Para qué lo uso |
|---|---|---|
| 1 | **i-Ready Reading completo** (con el desglose por dominio, no solo el puntaje) | Saber en cuál de las 6 áreas está la caída y arrancar exactamente ahí |
| 2 | **Programa del mes** | Que el juego practique lo mismo que está viendo en clase esta semana |
| 3 | **Tareas diarias** | Cada tarea se vuelve un nivel |
| 4 | **Report card** | Lo que ven los maestros que no se ve en los números |
| 5 | i-Ready de Math, si existe | Confirmar el nivel de mate |

---

## Estructura de la carpeta

```
JuegoGaby\
  LEEME.md                  <- este archivo
  docs\
    00-ESTRATEGIA.md        <- arquitectura, plan, decisiones técnicas
    01-PERFIL-GABY.md       <- todo lo que sé de Gaby (se actualiza siempre)
  contenido\
    entrada\                <- AQUÍ dejás los documentos
    procesado\              <- acá los muevo yo cuando ya los convertí
  datos\                    <- progreso y premios
```

---

## Estado actual

**Fase 0 — decisiones y prueba de micrófono.** Todavía no hay juego escrito.
Antes de programar hay que resolver una cosa: si el micrófono funciona dentro de un
Artifact de Claude en la tablet. Esa respuesta decide dónde vive el juego.
Ver `docs\00-ESTRATEGIA.md`, sección 3.
