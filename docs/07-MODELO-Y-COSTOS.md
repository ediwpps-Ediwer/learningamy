# Uso de modelos y tokens

Fecha: 21 de septiembre de 2026.

La aplicación de Gaby no necesita un modelo de IA durante el juego. El diagnóstico, la selección de preguntas, la adaptación de dificultad, el calendario de revisiones, la puntuación objetiva y las recompensas funcionan con JavaScript local. Por eso una sesión de Gaby consume **cero tokens de API**, funciona sin conexión después de cargar y no envía datos del niño a un modelo.

## Dónde sí conviene usar un modelo

El modelo se usa fuera del juego, en tareas puntuales para el adulto:

- Convertir una foto o PDF de tarea en un paquete de contenido verificable.
- Proponer una adaptación que conserve el objetivo escolar y conecte con una habilidad anterior.
- Resumir semanalmente los resultados y sugerir qué observar después.
- Ayudar a modificar código cuando una prueba demuestra una necesidad nueva.

La respuesta de contenido debe ser JSON pequeño: objetivo, habilidades, ítems, respuesta correcta, adaptación y fuente. El adulto revisa la clave antes de publicarla. No se envían nombre completo, identificadores escolares, credenciales ni el historial completo si solo hace falta un resumen.

## Enrutamiento económico

1. **Modelo rápido y económico:** extracción, normalización, clasificación de habilidad, resumen rutinario y generación de variantes equivalentes.
2. **Modelo de razonamiento medio:** tarea ambigua, OCR dudoso, conflicto entre objetivo y adaptación o revisión semanal que necesita explicar decisiones.
3. **Modelo más capaz:** cambios de arquitectura, errores difíciles o revisión pedagógica que afecte la validez de la evidencia. Se usa una vez y luego se fija el resultado en datos versionados.

No se usa un modelo para sumar puntos, decidir si una respuesta objetiva es correcta, calcular fechas, otorgar monedas, ordenar habilidades o ejecutar pruebas. Esas decisiones deben seguir siendo deterministas y auditables.

## Presupuesto operativo sugerido

| Actividad | Frecuencia | Política |
|---|---:|---|
| Juego diario | Cada sesión | 0 tokens; motor local |
| Preparar tarea | 1 vez por paquete | Modelo económico; solo material nuevo |
| Revisión familiar | 1 vez por semana | Resumen corto; enviar agregados, no eventos crudos |
| Revisión pedagógica | Cada 4 semanas | Modelo medio; escalar solo si hay ambigüedad |
| Código | Por cambio | Modelo capaz para diseño; económico para formato y pruebas |

Se guardan una huella y una versión de cada paquete. Si la tarea no cambió, no se vuelve a enviar. Las instrucciones estables se mantienen al principio del prompt y el contenido variable al final para favorecer caché. Se piden salidas breves y estructuradas, se agrupan varios ítems en una sola solicitud y se evita incluir archivos completos cuando bastan las líneas relevantes.

La guía oficial de modelos confirma que las variantes económicas están orientadas a cargas de alto volumen y que el contenido en caché tiene una tarifa menor; la selección concreta debe respetar los modelos disponibles en la cuenta. [Comparación oficial de modelos de OpenAI](https://developers.openai.com/api/docs/models/compare).