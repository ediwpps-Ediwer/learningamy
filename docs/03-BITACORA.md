# Bitácora

> Qué se probó, qué se aprendió, qué se decidió. Orden cronológico inverso
> (lo más nuevo arriba).

---

## 2026-09-05 · Construido y probado — versión 1

El proyecto se movió de `OneDrive\Escritorio\Claude\JuegoGaby` a
**`C:\Proyectos\JuegoGaby`**, siguiendo la regla del `CLAUDE.md` de Ediwer: al
sincronizar Netlify con GitHub esto va a ser un repo git, y un `.git` dentro de
una carpeta que OneDrive toca se puede corromper.

Se construyó la app completa: 9 minijuegos, avatar, diagnóstico de 8 pruebas,
economía de esmeraldas, tienda de premios y panel de padre. PWA instalable,
funciona sin internet, tema único oscuro de bloques.

**Probado en navegador**, no solo escrito:

| Verificado | Resultado |
|---|---|
| Portada y creación de avatar | Renderiza, el personaje se arma |
| Gráfica de barras | Escala, grilla, ticks y etiquetas correctos |
| Spelling (MADE) | Semáforo verde, +3 esmeraldas, huecos en verde |
| Equation Cards | Carga las 8 ecuaciones reales de su hoja |
| Las 4 estrategias | Ten frame, number bond, recta numérica y count on dibujan bien |

**Un error encontrado y corregido durante la prueba:** el generador de preguntas
arma `"How many {etiqueta} are there?"`, y la gráfica inventada de bloques tenía
etiquetas incontables (`Stone`, `Dirt`, `Gold`), lo que producía
*"How many Dirt are there?"* — que no es inglés correcto. En una app cuyo
propósito es enseñar a leer no se puede modelar mal la gramática. Se cambiaron
por sustantivos contables en plural: Pickaxes, Torches, Shields, Boats.

**Pendientes que no bloquean:** la anon key de Supabase (sincronización entre
aparatos) y la voz en_US en la tablet.

---

## 2026-09-05 · Chequeo técnico en la tablet — RESULTADO

Se corrió `chequeo.html` publicado como Artifact, abierto en Chrome en la tablet.

### Datos crudos

```
[01] Android · Chrome · pantalla 1205x753 · ventana 0x0
[02] seguro=true marco=true marcoDaMic=false apiMedia=true
[03] microfono: FALLO NotAllowedError — Permission denied
[04] reconocimiento: FALLO not-allowed
[05] voz: OK 2 voces en · usa English United Kingdom / en_GB
ua: Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/151.0.0.0
```

### Hallazgo 1 — El Artifact NO entrega micrófono (definitivo)

`document.featurePolicy.allowsFeature("microphone")` devolvió **false**. Eso es la
política de permisos del `<iframe>` que contiene la página, decidida por el sitio
que la aloja. **No hay nada que se pueda hacer desde adentro de la página**: no es
un permiso que el usuario haya negado y que se pueda volver a pedir, es una puerta
cerrada antes de que la pregunta llegue al usuario.

Los errores [03] y [04] son consecuencia de eso, no fallas independientes:
`NotAllowedError` y `not-allowed` son exactamente lo que devuelve el navegador
cuando el marco bloquea la función.

**Consecuencia:** la opción A (juego como Artifact) queda descartada para el juego
de lectura en voz alta. Se va a la opción B: hosting propio con HTTPS.

> Vale la pena registrar que la prueba costó 10 minutos y evitó descubrir esto
> después de construir el juego entero encima de la plataforma equivocada.

### Hallazgo 2 — La tablet es buen equipo para esto

Android 10 con **Chrome 151**, actualizado. Fuera del marco, el reconocimiento de
voz de Chrome en Android es de lo mejor que hay disponible en navegador. Pantalla
1205×753 en horizontal: espacio de sobra para una sopa de letras de 10×10 y para
una gráfica de barras cómoda.

*(`ventana 0x0` es un artefacto de medir el iframe antes de que el contenedor lo
dimensionara. No es un problema del aparato.)*

### Hallazgo 3 — Solo hay voces británicas instaladas

`[05]` funcionó, pero las 2 voces en inglés disponibles son **en_GB**, no en_US.

Gaby estudia en Georgia y lo que oye en clase es inglés americano. Si la voz que le
enseña la pronunciación correcta es británica, le vamos a estar enseñando un
modelo distinto al que le van a evaluar. Diferencias que sí importan a este nivel:

| Palabra | en_US | en_GB |
|---|---|---|
| `water` | la `t` suena como `d` suave | `t` marcada, o glotal |
| `car`, `far`, `bird` | la `r` final se pronuncia | la `r` final desaparece |
| `dance`, `bath` | vocal como en `cat` | vocal larga, casi `ah` |
| `hot`, `dog` | vocal abierta | vocal redondeada |

**Acción para el papá:** instalar la voz de inglés de Estados Unidos en la tablet.
Ajustes → Administración general (o Sistema) → Texto a voz → Motor de Google →
Instalar datos de voz → **English (United States)**.

Mientras tanto el juego funciona igual, pero conviene arreglarlo antes de que
empiece a usar la corrección de pronunciación en serio.

---

## 2026-09-05 · Arranque del proyecto

Consigna recibida del papá. Perfil de Gaby cargado en `01-PERFIL-GABY.md`.
Estrategia y arquitectura en `00-ESTRATEGIA.md`. Cuatro decisiones de producto
tomadas en `02-DECISIONES.md`.

Entorno de la PC verificado: Python 3.12.10 y Node 24.19.0 presentes. No hace
falta instalar nada del lado de la PC.

## 2026-09-21 · Revisión y nueva planificación

Se revisaron documentación, código y el sitio en modo prueba. Se comprobaron avatar, entrada al diagnóstico, navegación, retos y ayuda de Spelling. No se usó la partida real ni se evaluó a Gaby.

Hallazgos: retos por fecha, dominio mezclado entre modalidades, repaso sin calendario, contenido con semana fija y conclusiones causales excesivas en el análisis escolar. Se corrigió la interpretación de 04 y se marcaron como históricos los documentos desactualizados.

Entregados 05-REPLANIFICACION.md, 06-IMPLEMENTACION.md y AGENTS.md. El nuevo pedido de diagnóstico inicial y periódico queda incorporado con ruta adaptativa, chequeo semanal y revisión cada cuatro semanas.

## 2026-09-21 · Explorer 1 local

Se implementó la ruta en `aprendizaje.js` y `aventura.js`, reutilizando los juegos existentes. Se agregaron reanudación, evidencia por modalidad, misión adaptativa, calendario local, respaldo de migración, aldea y panel familiar. Se verificó con 19 pruebas automáticas y navegación completa en `?prueba`. No se publicó ni se tocó la partida real.
