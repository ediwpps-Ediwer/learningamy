# Block Quest — el juego de Gabriel

Práctica de Reading y Math armada con **su propio material de clase**:
sus listas de sight words, sus hojas de nonsense words, su módulo VCe, sus
Equation Cards, sus Model Cards y la lección de gráficas de esta semana.

---

## Probarlo ahora en la PC

**Doble clic en `iniciar.cmd`.** Abre Chrome solo, en `http://localhost:8790`.

Tiene que ser por ahí y no abriendo `web/index.html` directo: el micrófono solo
funciona en HTTPS o en `localhost`, y con doble clic al archivo el juego de
lectura en voz alta no anda.

Para cerrarlo: `Ctrl+C` en la ventana negra, o cerrarla.

---

## Subirlo a la tablet (Netlify)

1. Entrá a **app.netlify.com** → **Add new site** → **Deploy manually**.
2. Arrastrá la carpeta **`web`** (la carpeta entera, no los archivos sueltos).
3. Netlify te da una dirección `https://algo.netlify.app`. Esa es la del juego.
4. En la tablet, abrí esa dirección **en Chrome** → menú ⋮ → **Agregar a
   pantalla de inicio**. Queda con ícono propio y a pantalla completa.

Desde ahí el micrófono funciona, porque Netlify sirve por HTTPS.

---

## Lo que falta (2 cosas, ninguna urgente)

### 1. La voz en inglés americano — 5 minutos, en la tablet

El chequeo mostró que solo hay voces **británicas** instaladas. Gabriel estudia
en Georgia; la voz que le enseñe la pronunciación debería ser americana.

> Ajustes → Administración general (o Sistema) → **Texto a voz** →
> Motor de Google → Instalar datos de voz → **English (United States)**

El juego avisa en el panel de papá si detecta que la voz no es americana.

### 2. La clave de Supabase — para sincronizar entre aparatos

Sin esto el juego funciona perfecto, pero el progreso vive solo en el aparato
donde jugó.

1. En Supabase → **SQL Editor** → pegá y corré el contenido de **`supabase.sql`**.
2. Supabase → **Project Settings → API** → copiá la **anon / publishable key**.
3. Pegala en `web/js/config.js`, en `supabaseAnonKey`.
4. Volvé a subir la carpeta `web` a Netlify.

> Esa clave está diseñada para viajar dentro de apps cliente: no es secreta.
> La **`service_role` no va nunca acá** — esa sí es sensible.

---

## Cómo agregar las tareas de cada día

1. Le sacás foto a la tarea y me la mandás por el chat.
2. Yo la leo y agrego un paquete de contenido a `web/js/datos.js`.
3. Volvés a subir la carpeta `web` a Netlify (arrastrar de nuevo).
4. Gabriel abre el juego y el nivel nuevo está ahí.

El motor del juego no conoce ninguna palabra en particular: solo sabe jugar
*tipos* de juego. Por eso una tarea nueva es un archivo de datos, no código.

---

## Los nueve juegos

**Reading**

| Juego | Qué entrena | De dónde salió |
|---|---|---|
| Word Reading | Pronunciación con semáforo, palabra por palabra | Listas de sight words M1–M10 |
| Speed Run | Fluidez: cuántas palabras en 60 s | Hojas de Nonsense Word Fluency |
| Spelling | **Escribir** la palabra — su hueco más grande (0 % en la prueba) | Spelling vCe de esta semana |
| Word Search | Reconocimiento visual contra reloj | Palabras VCe del Módulo 3 |
| Story + Challenger | Personajes, ambiente, diálogo, moraleja | Cuentos decodificables propios |

**Math**

| Juego | Qué entrena | De dónde salió |
|---|---|---|
| Bar & Picture Graphs | Leer datos de gráficas | i-Ready Lesson 4 (esta semana) |
| Equation Cards | Incógnita en cualquier posición | Sus Equation Cards de clase |
| Math Facts | Suma y resta + **las 4 estrategias** | Sus Model Cards |
| Word Problems | Seguir la consigna, paso a paso | Aviso de la maestra |
| Money | Monedas, billetes, comprar y dar vuelto | Actividad de la Lesson 4 |
| Shapes | Geometría 2D y 3D | i-Ready: su dominio más flojo |

---

## Panel de papá

Se entra por el botón 👤 arriba a la derecha. Pide una multiplicación de dos
cifras — no es seguridad de verdad, es una puerta que un chico de 7 no cruza.

Adentro: resumen del día, resultados del diagnóstico, **destrezas ordenadas de
peor a mejor**, qué palabras le cuestan y cuáles domina, el vocabulario que
tuvo que traducir, la tienda de premios editable, y los ajustes.

**Modo adulto:** en Ajustes se puede activar. En vez de usar el micrófono, vos
escuchás y marcás Bien / Casi / No pudo. Es bastante más preciso que el
reconocimiento de voz con acento infantil, y es como se administran estas
pruebas en la escuela.

---

## Estructura

```
JuegoGaby/
  iniciar.cmd          doble clic para jugar en la PC
  servir.py            el servidor local
  supabase.sql         correr una vez en Supabase
  README.md            este archivo
  web/                 <- ESTO es lo que se sube a Netlify
    index.html
    css/estilo.css
    js/config.js       claves (la anon key va acá)
    js/datos.js        todo el contenido (acá agrego las tareas)
    js/nucleo.js       guardado, voz, semáforo, economía
    js/juegos.js       los nueve minijuegos
    js/app.js          pantallas, avatar, diagnóstico, panel
  docs/                estrategia, perfil, decisiones, bitácora, análisis
  contenido/entrada/   donde dejás los papeles
```

---

## Decisiones que vale la pena conocer

- **Fallar nunca resta esmeraldas.** Se gana o no se gana. Está 113 puntos abajo
  en lectura; una app que castiga se abandona.
- **Toda instrucción se dice en voz alta.** La interfaz está en inglés por
  decisión tuya, pero él lee a nivel kinder: si solo la escribiera, fallaría
  ejercicios que sí sabe resolver. El botón **ES** está siempre visible, y cada
  vez que lo usa queda registrado — eso dice qué vocabulario le falta.
- **La tipografía no es decorativa.** Toda palabra en inglés que él debe leer
  está en **Andika**, una fuente diseñada para lectores principiantes, con
  letras inequívocas (`a` de un piso, `l` / `I` / `1` distintas).
- **El diagnóstico no empieza por lo básico.** Sacó 100 % en fonética en la
  prueba de la escuela. Empezar por sonidos de letras sería aburrirlo con lo que
  ya sabe. Ver `docs/04-ANALISIS-PRUEBAS.md`.
