/* ============================================================================
   JUEGOS — los nueve minijuegos
   Cada uno expone: { id, nombre, mundo, destreza, iniciar(el, cfg, fin) }
   `fin(resultado)` se llama al terminar el nivel.
   ========================================================================== */

(function (global) {
  "use strict";

  var D = global.DATOS;
  var N = global.NUCLEO;
  var U = N.Util, Voz = N.Voz, Sem = N.Semaforo, Eco = N.Economia, Pro = N.Progreso;

  /* ==========================================================================
     UI compartida
     ======================================================================== */

  var EF = global.EFECTOS;
  var Snd = EF.Sonido, Part = EF.Particulas, Racha = EF.Racha, Compa = EF.Compa;

  var ui = {
    /* `pasos` dibuja la pista de bloques: se ve cuánto falta para terminar,
       que es la diferencia entre "una lista de ejercicios" y "un nivel". */
    marco: function (el, titulo, subtitulo, pasos) {
      Racha.reiniciar();
      var pista = "";
      if (pasos > 0) {
        pista = '<div class="pista" id="pista">';
        for (var i = 0; i < pasos; i++) pista += '<span class="pista-bloque"></span>';
        pista += '</div>';
      }
      el.innerHTML =
        '<div class="juego">' +
          '<header class="juego-top">' +
            '<span class="compa-caja" id="compa">' + Compa.svg("normal", 44) + '</span>' +
            '<span class="juego-tit-caja">' +
              '<h2 class="juego-tit">' + U.esc(titulo) + '</h2>' +
              (subtitulo ? '<p class="juego-sub">' + U.esc(subtitulo) + '</p>' : '') +
            '</span>' +
            '<span class="racha" id="racha" hidden></span>' +
          '</header>' +
          pista +
          '<div class="juego-cuerpo" id="cuerpo"></div>' +
          '<footer class="juego-pie" id="pie"></footer>' +
        '</div>';

      var m = {
        cuerpo: el.querySelector("#cuerpo"),
        pie: el.querySelector("#pie"),
        top: el.querySelector(".juego-top"),
        compa: el.querySelector("#compa"),
        rachaEl: el.querySelector("#racha"),
        pistaEl: el.querySelector("#pista")
      };

      /* marca el avance en la pista */
      m.paso = function (n, color) {
        if (!m.pistaEl) return;
        var b = m.pistaEl.children[n];
        if (b) { b.className = "pista-bloque hecho sem-fondo-" + (color || "verde"); }
      };

      /* Todo acierto y todo error pasa por acá. Un solo lugar para el sonido,
         las partículas, la racha y el pago — así ningún juego se olvida de
         alguna parte y todos se sienten igual. */
      var pasoActual = 0;
      m.premiar = function (elemento, color, base) {
        var pago = 0;
        m.paso(pasoActual++, color === "verde" ? "verde"
                           : color === "amarillo" ? "amarillo" : "rojo");
        if (color === "verde") {
          var n = Racha.acierto();
          var mult = Racha.multiplicador();
          pago = (base != null ? base : Eco.PAGOS.acierto) * mult;
          Eco.dar(pago, "juego");
          Snd.acierto();
          if (n >= 3) Snd.combo(n);
          Part.estallar(elemento, 10 + Math.min(n, 8));
          Part.flotar(elemento, "+" + pago, "#2ee6a0");
          Compa.reaccionar(m.compa, n >= 5 ? "fiesta" : "feliz", 44);
        } else if (color === "amarillo") {
          Racha.fallo();
          pago = base != null ? base : Eco.PAGOS.amarillo;
          if (pago) { Eco.dar(pago, "juego"); Part.flotar(elemento, "+" + pago, "#ffcc4d"); }
          Snd.casi();
          Compa.reaccionar(m.compa, "pensando", 44);
        } else {
          Racha.fallo();
          Snd.error();
          Part.sacudir(elemento);
          Compa.reaccionar(m.compa, "ups", 44);
        }
        // insignia de racha
        var r = Racha.valor();
        if (r >= 3) {
          m.rachaEl.hidden = false;
          m.rachaEl.textContent = "🔥 " + r + "  x" + Racha.multiplicador();
          m.rachaEl.classList.remove("late"); void m.rachaEl.offsetWidth;
          m.rachaEl.classList.add("late");
        } else {
          m.rachaEl.hidden = true;
        }
        return pago;
      };

      return m;
    },

    boton: function (texto, clase, alTocar) {
      var b = document.createElement("button");
      b.className = "btn " + (clase || "");
      b.innerHTML = texto;
      b.addEventListener("click", alTocar);
      return b;
    },

    /* botón de traducción — siempre visible, nunca escondido en un menú */
    traducir: function (textoEs, destreza) {
      var b = document.createElement("button");
      b.className = "btn-es";
      b.type = "button";
      b.setAttribute("aria-label", "Show Spanish hint");
      b.innerHTML = '<span>ES</span>';
      var abierto = false, globo = null;
      b.addEventListener("click", function () {
        abierto = !abierto;
        if (abierto) {
          globo = document.createElement("div");
          globo.className = "globo-es";
          globo.textContent = textoEs;
          b.parentNode.insertBefore(globo, b.nextSibling);
          Voz.decirEs(textoEs);
          // registra que necesitó traducción: dice qué vocabulario le falta
          var e = N.Almacen.leer();
          e.traduccionesUsadas.push({ t: Date.now(), texto: textoEs, destreza: destreza || null });
          if (e.traduccionesUsadas.length > 300) e.traduccionesUsadas.shift();
          N.Almacen.guardar();
        } else if (globo) { globo.remove(); globo = null; }
      });
      return b;
    },

    /* botón de audio: toda instrucción se puede oír, no solo leer */
    oir: function (texto, opciones) {
      var b = document.createElement("button");
      b.className = "btn-oir";
      b.type = "button";
      b.setAttribute("aria-label", "Listen");
      b.innerHTML = '<svg viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges">' +
        '<rect x="2" y="6" width="3" height="4" fill="currentColor"/>' +
        '<path d="M5 6 L9 3 L9 13 L5 10 Z" fill="currentColor"/>' +
        '<rect x="11" y="5" width="1" height="6" fill="currentColor"/>' +
        '<rect x="13" y="3" width="1" height="10" fill="currentColor"/></svg>';
      b.addEventListener("click", function () { Voz.decir(texto, opciones); });
      return b;
    },

    consigna: function (en, es, destreza, opcionesVoz) {
      var d = document.createElement("div");
      d.className = "consigna";
      var p = document.createElement("p");
      p.className = "consigna-en";
      p.textContent = en;
      d.appendChild(p);
      var fila = document.createElement("div");
      fila.className = "consigna-acc";
      fila.appendChild(ui.oir(en, opcionesVoz));
      fila.appendChild(ui.traducir(es, destreza));
      d.appendChild(fila);
      // se lee sola al aparecer: él no puede leerla todavía
      setTimeout(function () { Voz.decir(en, opcionesVoz); }, 350);
      return d;
    },

    marcador: function (pie, texto) {
      var d = document.createElement("div");
      d.className = "marcador";
      d.textContent = texto;
      pie.appendChild(d);
      return d;
    },

    semaforoChip: function (color) {
      var s = document.createElement("span");
      s.className = "chip-sem chip-" + color;
      s.textContent = color === "verde" ? "✓" : color === "amarillo" ? "~" : "✗";
      return s;
    },

    /* pantalla de cierre de nivel */
    fin: function (el, datos, alSalir) {
      var pct = datos.total ? Math.round(datos.aciertos / datos.total * 100) : 0;
      var medalla = pct >= 90 ? "★★★" : pct >= 70 ? "★★" : pct >= 40 ? "★" : "";
      var mejorRacha = Racha.mejor();

      el.innerHTML =
        '<div class="fin">' +
          (medalla ? '<div class="fin-estrellas">' + medalla + '</div>' : '') +
          '<div class="fin-emeralds">+' + datos.esmeraldas + ' <span>gems</span></div>' +
          '<div class="fin-barra"><div class="fin-relleno" style="width:0%"></div></div>' +
          '<p class="fin-pct">' + datos.aciertos + ' of ' + datos.total + '  ·  ' + pct + '%</p>' +
          (mejorRacha >= 3 ? '<p class="fin-racha">🔥 Best streak: ' + mejorRacha + ' in a row</p>' : '') +
          (datos.extra ? '<p class="fin-extra">' + U.esc(datos.extra) + '</p>' : '') +
          '<div class="fin-compa">' + Compa.svg(pct >= 70 ? "fiesta" : "normal", 68) + '</div>' +
          '<div class="fin-acc"></div>' +
        '</div>';

      // la barra se llena a la vista: el cierre tiene que sentirse como premio
      var relleno = el.querySelector(".fin-relleno");
      requestAnimationFrame(function () {
        relleno.style.transition = "width .9s cubic-bezier(.2,.8,.3,1)";
        relleno.style.width = pct + "%";
      });
      if (pct >= 70) Snd.nivel(); else Snd.moneda();
      var caja = el.querySelector(".fin-emeralds");
      if (datos.esmeraldas > 0) setTimeout(function () { Part.estallar(caja, 18); }, 250);

      var acc = el.querySelector(".fin-acc");
      acc.appendChild(ui.boton("Keep going", "btn-primario", alSalir));
    }
  };

  /* ==========================================================================
     1 · LECTURA DE PALABRAS  (micrófono, semáforo, words per minute)
     ======================================================================== */

  var MIN_PPM = 5, MAX_PPM = 200;

  var lecturaPalabras = {
    id: "lectura-palabras",
    nombre: "Word Reading",
    mundo: "reading",
    destreza: "fluidez-lectura",

    iniciar: function (el, cfg, fin) {
      var palabras = cfg.items || [];
      var modo = cfg.modo || "practica";   // "practica" | "carrera"
      var m = ui.marco(el, modo === "carrera" ? "Speed Run" : "Word Reading",
        modo === "carrera" ? "Choose a word list and pace"
                           : "Read the word aloud");

      if (modo === "carrera" && Voz.hayMicrofono) return carrera();
      if (cfg.adulto || N.Almacen.leer().ajustes.modoAdulto || !Voz.hayMicrofono) return practicaAdulto();
      return practicaMic();

      /* --- modo práctica con micrófono: una a la vez, más preciso -------- */
      function practicaMic() {
        var i = 0, aciertos = 0, gan = 0, intento = 0, resultados = [];

        function pintar() {
          if (i >= palabras.length) return cerrar();
          var w = palabras[i];
          m.cuerpo.innerHTML = "";

          var tarjeta = document.createElement("div");
          tarjeta.className = "palabra-grande";
          tarjeta.textContent = w.p;
          m.cuerpo.appendChild(tarjeta);

          var acc = document.createElement("div");
          acc.className = "fila-acc";
          acc.appendChild(ui.oir(w.s || w.p, { rate: 0.7 }));
          if (w.es) acc.appendChild(ui.traducir(w.es, lecturaPalabras.destreza));
          m.cuerpo.appendChild(acc);

          var estado = document.createElement("p");
          estado.className = "estado";
          estado.textContent = "Tap the microphone and read the word";
          m.cuerpo.appendChild(estado);

          m.pie.innerHTML = "";
          var bMic = ui.boton("🎤 Read it", "btn-primario btn-mic", function () {
            bMic.disabled = true;
            estado.textContent = "Listening…";
            estado.className = "estado escuchando";
            var t0 = Date.now();
            Voz.escuchar({ tiempoMax: 6000 }).then(function (oido) {
              var r = Sem.evaluar(w, oido);
              var ms = Date.now() - t0;
              intento++;
              // dos intentos antes de marcar rojo
              if (r.color === "rojo" && intento < 2) {
                estado.className = "estado";
                estado.textContent = "I could not hear that. Try again.";
                bMic.disabled = false;
                return;
              }
              aplicar(w, r, ms);
            });
          });
          m.pie.appendChild(bMic);

          var bNo = ui.boton("The mic did not hear me", "btn-suave", function () {
            intento = 0;
            estado.className = "estado";
            estado.textContent = "Try again. Move closer to the microphone.";
            bMic.disabled = false;
          });
          m.pie.appendChild(bNo);
          m.pie.appendChild(ui.boton("Skip", "btn-fantasma", function () {
            aplicar(w, { color: "rojo", razon: "Saltada", oido: "" }, 0);
          }));

          function aplicar(w, r, ms) {
            resultados.push({ w: w, r: r, ms: ms });
            Pro.registrarPalabra(w.p, r.color, ms, "oral-automatico");
            Pro.registrar(lecturaPalabras.destreza, r.color === "verde",
              { ms: ms, item: w.p, semaforo: r.color });
            gan += m.premiar(tarjeta, r.color, Eco.PAGOS[r.color]);
            if (r.color === "verde") aciertos++;

            estado.className = "estado sem-" + r.color;
            estado.textContent = r.razon + (r.oido ? '  (heard: "' + r.oido + '")' : "");
            tarjeta.classList.add("sem-borde-" + r.color);
            m.pie.innerHTML = "";
            var b = ui.boton("Next", "btn-primario", function () {
              i++; intento = 0; pintar();
            });
            m.pie.appendChild(b);
            if (r.color !== "verde") {
              m.pie.appendChild(ui.boton("🔊 Hear it again", "btn-suave", function () {
                Voz.decir(w.s || w.p, { rate: 0.6 });
              }));
            }
          }
        }

        function cerrar() {
          repaso(m, resultados, function () {
            ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: palabras.length },
              function () { fin({ aciertos: aciertos, total: palabras.length, esmeraldas: gan }); });
          });
        }
        pintar();
      }

      /* --- modo práctica con adulto: el papá marca. Es lo más preciso ---- */
      function practicaAdulto() {
        var i = 0, aciertos = 0, gan = 0, resultados = [];
        function pintar() {
          if (i >= palabras.length) return cerrar();
          var w = palabras[i];
          m.cuerpo.innerHTML = "";
          var tarjeta = document.createElement("div");
          tarjeta.className = "palabra-grande";
          tarjeta.textContent = w.p;
          m.cuerpo.appendChild(tarjeta);
          var nota = document.createElement("p");
          nota.className = "estado";
          nota.textContent = "Gaby reads aloud. A parent marks how it went.";
          m.cuerpo.appendChild(nota);

          m.pie.innerHTML = "";
          [["verde", "Correct"], ["amarillo", "Almost"], ["rojo", "Not yet"]].forEach(function (par) {
            m.pie.appendChild(ui.boton(par[1], "btn-sem btn-" + par[0], function () {
              var r = { color: par[0], razon: "Marcado por el adulto", oido: "" };
              resultados.push({ w: w, r: r, ms: 0 });
              Pro.registrarPalabra(w.p, par[0], 0, "oral-adulto");
              Pro.registrar(lecturaPalabras.destreza, par[0] === "verde",
                { item: w.p, semaforo: par[0] });
              gan += m.premiar(tarjeta, par[0], Eco.PAGOS[par[0]]);
              if (par[0] === "verde") aciertos++;
              i++; pintar();
            }));
          });
          m.pie.appendChild(ui.oir(w.s || w.p, { rate: 0.7 }));
        }
        function cerrar() {
          repaso(m, resultados, function () {
            ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: palabras.length },
              function () { fin({ aciertos: aciertos, total: palabras.length, esmeraldas: gan }); });
          });
        }
        pintar();
      }

      /* --- modo carrera: las palabras aparecen A UN RITMO ELEGIDO ---------
         Antes era una grilla y 60 segundos libres. Esto es mejor para lo que
         le hace falta: se elige una velocidad en words per minute, las
         palabras aparecen a ese ritmo, y él las va diciendo a medida que
         salen. Marcar el ritmo es como se entrena fluidez de verdad — el
         objetivo deja de ser "leer rápido" y pasa a ser "seguir el pulso",
         que es mucho más claro para un chico de 7.
         Se registra cuántas dijo bien A ESA velocidad, así se puede subir de
         a poco y ver el progreso real.                                      */

      function carrera() {
        if (cfg.conjuntos && cfg.conjuntos.length) elegirConjunto();
        else elegirVelocidad();

        /* Qué lista practicar. Todas salen de sus papeles, y cada una dice de
           cuál — así se ve que no es contenido inventado sino su tarea. */
        function elegirConjunto() {
          m.cuerpo.innerHTML = "";
          m.pie.innerHTML = "";

          var cab = document.createElement("div");
          cab.className = "vel-cab";
          cab.innerHTML =
            '<h3 class="vel-tit">Which words?</h3>' +
            '<p class="vel-sub">All lists come from school worksheets.</p>';
          m.cuerpo.appendChild(cab);

          var caja = document.createElement("div");
          caja.className = "conjuntos";
          cfg.conjuntos.forEach(function (c) {
            var b = document.createElement("button");
            b.className = "conjunto" + (c.destacado ? " conjunto-prio" : "");
            b.innerHTML =
              (c.destacado ? '<span class="conjunto-tag">Recommended</span>' : "") +
              '<span class="conjunto-nom">' + U.esc(c.nombre) + '</span>' +
              '<span class="conjunto-fuente">' + U.esc(c.fuente) + '</span>' +
              '<span class="conjunto-n">' + c.items.length + ' palabras</span>';
            b.addEventListener("click", function () {
              palabras = U.mezclar(c.items);
              Snd.bloque();
              elegirVelocidad();
            });
            caja.appendChild(b);
          });
          m.cuerpo.appendChild(caja);
        }

        function elegirVelocidad() {
          var e = N.Almacen.leer();
          var rec = (e.destrezas["record-ppm"] || {}).mejor || 0;
          var elegida = (e.ajustes && e.ajustes.ultimaPpm) || (rec ? siguienteMeta(rec) : 20);

          m.cuerpo.innerHTML = "";
          m.pie.innerHTML = "";

          var caja = document.createElement("div");
          caja.className = "vel-panel";
          caja.innerHTML =
            '<h3 class="vel-tit">Choose a speed</h3>' +
            '<p class="vel-sub">Words will appear on their own. ' +
            'Read each one aloud as soon as you see it.</p>' +

            '<div class="vel-dial">' +
              '<button class="vel-paso" id="menos" aria-label="Slower">−</button>' +
              '<div class="vel-centro">' +
                '<input class="vel-input" id="ppm" type="number" inputmode="numeric" ' +
                  'min="' + MIN_PPM + '" max="' + MAX_PPM + '" step="1" value="' + elegida + '" ' +
                  'aria-label="Words per minute">' +
                '<span class="vel-unidad">words per minute</span>' +
                '<span class="vel-cada" id="cada"></span>' +
              '</div>' +
              '<button class="vel-paso" id="mas" aria-label="Faster">+</button>' +
            '</div>' +

            '<div class="vel-chips" id="chips"></div>' +
            (rec ? '<p class="vel-rec">Your best: <b>' + rec + '</b> WPM</p>' : "") +
            '<p class="vel-ref">These are individual made-up words, not connected text. ' +
            'Do not compare this number with school fluency averages, which are ' +
            'measured by reading stories.</p>';
          m.cuerpo.appendChild(caja);

          var inp = caja.querySelector("#ppm");
          var cada = caja.querySelector("#cada");

          function limpiar(v) {
            v = parseInt(v, 10);
            if (!v || v < MIN_PPM) v = MIN_PPM;
            if (v > MAX_PPM) v = MAX_PPM;
            return v;
          }
          function refrescar() {
            var v = limpiar(inp.value);
            var seg = 60 / v;
            cada.textContent = "1 every " + (seg >= 1 ? seg.toFixed(seg < 10 ? 1 : 0) + " seconds"
                                                     : Math.round(seg * 1000) + " ms");
            caja.querySelectorAll(".vel-chip").forEach(function (c) {
              c.classList.toggle("sel", +c.dataset.v === v);
            });
          }
          function poner(v) { inp.value = limpiar(v); refrescar(); }

          caja.querySelector("#menos").addEventListener("click", function () {
            poner(limpiar(inp.value) - paso(limpiar(inp.value))); Snd.tic(false);
          });
          caja.querySelector("#mas").addEventListener("click", function () {
            poner(limpiar(inp.value) + paso(limpiar(inp.value))); Snd.tic(true);
          });
          inp.addEventListener("input", refrescar);
          inp.addEventListener("blur", function () { poner(inp.value); });

          /* el paso crece con el número: abajo se ajusta fino, arriba de a 10 */
          function paso(v) { return v < 30 ? 1 : v < 60 ? 5 : 10; }

          var chips = caja.querySelector("#chips");
          [10, 15, 20, 30, 40, 60, 90, 120, 150, 200].forEach(function (v) {
            var c = document.createElement("button");
            c.className = "vel-chip";
            c.dataset.v = v;
            c.textContent = v;
            c.addEventListener("click", function () { poner(v); Snd.tic(true); });
            chips.appendChild(c);
          });

          m.pie.appendChild(ui.boton("▶ GO", "btn-primario btn-grande", function () {
            var v = limpiar(inp.value);
            var e2 = N.Almacen.leer();
            e2.ajustes.ultimaPpm = v;
            N.Almacen.guardar();
            Snd.bloque();
            cuentaRegresiva(v);
          }));

          refrescar();
        }

        /* la velocidad justo por encima de su récord: ni aburrida ni imposible */
        function siguienteMeta(rec) {
          var escala = [10, 15, 20, 30, 40, 60, 90, 120, 150, 200];
          for (var i = 0; i < escala.length; i++) {
            if (escala[i] > rec) return escala[i];
          }
          return MAX_PPM;
        }

        function cuentaRegresiva(ppm) {
          m.cuerpo.innerHTML = "";
          m.pie.innerHTML = "";
          var c = document.createElement("div");
          c.className = "cuenta";
          m.cuerpo.appendChild(c);
          var n = 3;
          Voz.decir("Get ready", { rate: 0.9 });
          (function paso() {
            if (n === 0) {
              c.textContent = "GO!";
              Snd.cuenta(true);
              setTimeout(function () { correr(ppm); }, 600);
              return;
            }
            c.textContent = n;
            Snd.cuenta(false);
            n--;
            setTimeout(paso, 800);
          })();
        }

        function correr(ppm) {
          var intervalo = 60000 / ppm;
          // el reconocimiento llega con ~1,5 s de atraso: cuantas palabras
          // entran en ese tiempo es cuantas hay que seguir mirando hacia atras
          var VENTANA = Math.max(3, Math.min(10, Math.ceil(1500 / intervalo)));
          var lista = U.mezclar(palabras);
          // la tanda dura mas o menos lo mismo a cualquier velocidad (~30 s),
          // asi 200 ppm no se termina en cinco segundos
          var SEGUNDOS_TANDA = 30;
          var total = Math.min(lista.length,
                               Math.max(8, Math.round(ppm * SEGUNDOS_TANDA / 60)));

          m.cuerpo.innerHTML = "";
          m.pie.innerHTML = "";

          var escenario = document.createElement("div");
          escenario.className = "escenario";
          escenario.innerHTML =
            '<div class="ritmo"><div class="ritmo-relleno" id="rr"></div></div>' +
            '<div class="palabra-viva" id="pv"></div>' +
            '<div class="estela" id="es"></div>';
          m.cuerpo.appendChild(escenario);

          var pv = escenario.querySelector("#pv");
          var rr = escenario.querySelector("#rr");
          var es = escenario.querySelector("#es");

          var hud = document.createElement("div");
          hud.className = "carrera-hud";
          hud.innerHTML = '<span id="hDicho">0</span> / <span id="hTotal">' + total + '</span>' +
                          '<span class="carrera-ppm">' + ppm + ' ppm</span>';
          m.top.appendChild(hud);
          var hDicho = hud.querySelector("#hDicho");

          var mostradas = [];   // { w, color, resuelto, chip }
          var i = 0, dichas = 0, verdes = 0, gan = 0, corriendo = true;
          var reloj = null, animRitmo = null;

          /* --- mostrar la próxima palabra --- */
          function siguiente() {
            if (!corriendo) return;
            if (i >= total) return terminar();

            var w = lista[i];
            var entrada = { w: w, color: null, resuelto: false, chip: null, cuando: Date.now() };
            mostradas.push(entrada);
            i++;

            pv.textContent = w.p;
            pv.className = "palabra-viva entra";
            void pv.offsetWidth;
            pv.classList.add("entra");
            Snd.tic(true);

            // chip en la estela
            var chip = document.createElement("span");
            chip.className = "estela-chip";
            chip.textContent = w.p;
            es.appendChild(chip);
            entrada.chip = chip;
            while (es.children.length > 6) es.removeChild(es.firstChild);

            // barra de ritmo
            rr.style.transition = "none";
            rr.style.width = "0%";
            void rr.offsetWidth;
            rr.style.transition = "width " + intervalo + "ms linear";
            rr.style.width = "100%";

            // cerrar la de hace 2 palabras: si no la dijo, es "no dijo", no "mal"
            var vieja = mostradas[mostradas.length - (VENTANA + 1)];
            if (vieja && !vieja.resuelto) cerrar(vieja, "nodijo");

            reloj = setTimeout(siguiente, intervalo);
          }

          function cerrar(entrada, color) {
            if (entrada.resuelto) return;
            entrada.resuelto = true;
            entrada.color = color;
            if (entrada.chip) {
              entrada.chip.classList.add("cerrado", color === "nodijo" ? "chip-nodijo" : "sem-fondo-" + color);
            }
            if (color === "nodijo") {
              Pro.registrarPalabra(entrada.w.p, "sin-evidencia", null, "oral-automatico");
              return;
            }
            dichas++;
            hDicho.textContent = dichas;
            Pro.registrarPalabra(entrada.w.p, color, null, "oral-automatico");
            if (color === "verde") {
              verdes++;
              gan += m.premiar(entrada.chip, "verde", Eco.PAGOS.verde);
            } else {
              gan += m.premiar(entrada.chip, "amarillo", Eco.PAGOS.amarillo);
            }
          }

          /* --- escuchar sin parar y emparejar con lo que está en pantalla ---
             El reconocedor devuelve texto con retraso, así que cada palabra
             que oye se compara contra las últimas 3 que se mostraron y todavía
             no se resolvieron. Sin esa ventana, todo llegaría tarde y contaría
             como no dicho.                                                   */
          var sinMic = false;
          Voz.escucharCarrera(Math.ceil((total * intervalo) / 1000) + 3, function (texto, esFinal) {
            if (!corriendo || !esFinal) return;
            String(texto).toLowerCase().split(/\s+/).filter(Boolean).forEach(function (tk) {
              for (var k = mostradas.length - 1; k >= Math.max(0, mostradas.length - VENTANA); k--) {
                var en = mostradas[k];
                if (en.resuelto) continue;
                var r = Sem.evaluar(en.w, { alternativas: [{ t: tk, c: null }] });
                if (r.color !== "rojo") { cerrar(en, r.color); return; }
              }
            });
          }).then(function (res) {
            /* Si el reconocimiento no arranca (permiso negado, sin internet,
               navegador que no lo trae), NO se corta la carrera: el ritmo sirve
               igual como marcapasos y al final lo marca el adulto. Antes esto
               terminaba el juego antes de mostrar la primera palabra. */
            if (res && res.error) { sinMic = true; avisarSinMic(); return; }
            if (corriendo) terminar();
          });

          function avisarSinMic() {
            var a = document.createElement("p");
            a.className = "aviso-sinmic";
            a.textContent = "No microphone? Keep the pace, then mark the words read correctly.";
            escenario.insertBefore(a, escenario.firstChild);
          }

          function terminar() {
            if (!corriendo) return;
            corriendo = false;
            clearTimeout(reloj);
            cancelAnimationFrame(animRitmo);

            // sin micrófono, el adulto marca cuáles dijo bien antes de contar
            if (sinMic) return marcarAMano();
            mostradas.forEach(function (en) { if (!en.resuelto) cerrar(en, "nodijo"); });
            contar();
          }

          /* Marcado manual: es como se toma una prueba de fluidez en la escuela.
             El adulto toca las que dijo bien y listo. */
          function marcarAMano() {
            m.cuerpo.innerHTML = "";
            m.pie.innerHTML = "";
            var caja = document.createElement("div");
            caja.className = "marcar";
            caja.innerHTML = '<p class="marcar-tit">Tap the words read correctly</p>';
            var grilla = document.createElement("div");
            grilla.className = "marcar-grilla";
            mostradas.forEach(function (en) {
              var b = document.createElement("button");
              b.className = "marcar-chip";
              b.textContent = en.w.p;
              b.addEventListener("click", function () {
                en.marcada = !en.marcada;
                b.classList.toggle("si", en.marcada);
                Snd.tic(en.marcada);
              });
              grilla.appendChild(b);
            });
            caja.appendChild(grilla);
            m.cuerpo.appendChild(caja);
            m.pie.appendChild(ui.boton("Done", "btn-primario", function () {
              mostradas.forEach(function (en) {
                en.resuelto = false;
                cerrar(en, en.marcada ? "verde" : "nodijo");
              });
              contar();
            }));
          }

          function contar() {
            var e = N.Almacen.leer();
            var reg = e.destrezas["record-ppm"] || { mejor: 0 };
            // solo cuenta como récord si dijo bien al menos el 60% a esa velocidad
            var logrado = verdes >= Math.ceil(total * 0.6);
            var nuevoRecord = logrado && ppm > (reg.mejor || 0);
            if (nuevoRecord) {
              e.destrezas["record-ppm"] = { mejor: ppm, intentos: 1, aciertos: 1, historial: [] };
              N.Almacen.guardar();
              gan += Eco.dar(Eco.PAGOS.recordPersonal, "record");
            }
            Pro.registrar("fluidez-ritmo:" + ppm, logrado,
              { item: verdes + "/" + total + " a " + ppm + "ppm" });

            if (nuevoRecord) Snd.nivel();

            var extra = "You read " + verdes + " of " + total + " words at " + ppm + " WPM" +
                        (nuevoRecord ? "  ·  NEW RECORD!" :
                         logrado ? "  ·  You reached this speed!" :
                                   "  ·  Try a slower speed");

            var resultados = mostradas.map(function (en) {
              return { w: en.w, r: { color: en.color === "nodijo" ? "rojo" : en.color,
                                     razon: en.color === "nodijo" ? "Not attempted" : "",
                                     oido: "" }, ms: 0 };
            });

            repaso(m, resultados, function () {
              ui.fin(el, { esmeraldas: gan, aciertos: verdes, total: total, extra: extra },
                function () { fin({ aciertos: verdes, total: total, esmeraldas: gan, ppm: ppm }); });
            });
          }

          setTimeout(siguiente, 400);
        }
      }

      /* --- repaso: amarillas y rojas, con la pronunciación correcta ------ */
      function repaso(m, resultados, listo) {
        var malas = resultados.filter(function (r) { return r.r.color !== "verde"; });
        if (!malas.length) return listo();
        var k = 0;
        function paso() {
          if (k >= malas.length) return listo();
          var it = malas[k];
          m.cuerpo.innerHTML = "";
          m.pie.innerHTML = "";
          var caja = document.createElement("div");
          caja.className = "repaso";
          caja.innerHTML =
            '<p class="repaso-tit">' + (it.r.color === "amarillo" ? "Almost got it" : "Listen to this one") + '</p>' +
            '<div class="palabra-grande sem-borde-' + it.r.color + '">' + U.esc(it.w.p) + '</div>' +
            '<p class="repaso-nota">' + U.esc(it.r.razon) + '</p>';
          m.cuerpo.appendChild(caja);

          var acc = document.createElement("div");
          acc.className = "fila-acc";
          acc.appendChild(ui.boton("🔊 Listen", "btn-suave", function () {
            Voz.decir(it.w.s || it.w.p, { rate: 0.6 });
          }));
          if (it.r.color === "rojo") {
            acc.appendChild(ui.boton("🔤 Letter by letter", "btn-suave", function () {
              Voz.deletrear(it.w.p);
            }));
          }
          if (it.w.es) acc.appendChild(ui.traducir(it.w.es, "repaso"));
          caja.appendChild(acc);

          Voz.decir(it.w.s || it.w.p, { rate: 0.6 });
          m.pie.appendChild(ui.boton("Next", "btn-primario", function () { k++; paso(); }));
        }
        paso();
      }
    }
  };

  /* ==========================================================================
     2 · SOPA DE LETRAS
     ======================================================================== */

  var sopaLetras = {
    id: "sopa-letras",
    nombre: "Word Search",
    mundo: "reading",
    destreza: "reconocimiento-visual",

    iniciar: function (el, cfg, fin) {
      var palabras = (cfg.items || []).slice(0, cfg.cuantas || 6);
      var lado = cfg.lado || (palabras.length > 5 ? 10 : 8);
      var diagonales = !!cfg.diagonales;
      var m = ui.marco(el, "Word Search", "Find the words", palabras.length);

      var rejilla = generar(palabras.map(function (w) { return w.p.toUpperCase(); }), lado, diagonales);
      var encontradas = {}, gan = 0, t0 = Date.now();

      /* --- pintar --- */
      var tabla = document.createElement("div");
      tabla.className = "sopa";
      tabla.style.setProperty("--lado", lado);
      rejilla.letras.forEach(function (fila, y) {
        fila.forEach(function (ch, x) {
          var c = document.createElement("button");
          c.className = "sopa-celda";
          c.textContent = ch;
          c.dataset.x = x; c.dataset.y = y;
          tabla.appendChild(c);
        });
      });
      m.cuerpo.appendChild(tabla);

      var listaEl = document.createElement("div");
      listaEl.className = "sopa-lista";
      palabras.forEach(function (w) {
        var s = document.createElement("span");
        s.className = "sopa-obj";
        s.dataset.w = w.p.toUpperCase();
        s.textContent = w.p;
        s.addEventListener("click", function () { Voz.decir(w.p, { rate: 0.7 }); });
        listaEl.appendChild(s);
      });
      m.cuerpo.appendChild(listaEl);

      var reloj = document.createElement("div");
      reloj.className = "reloj";
      reloj.textContent = "0s";
      m.top.appendChild(reloj);
      var tick = setInterval(function () {
        reloj.textContent = Math.round((Date.now() - t0) / 1000) + "s";
      }, 500);

      /* --- selección por arrastre (táctil y ratón) --- */
      var arrastrando = false, desde = null, sel = [];

      function celdaEn(ev) {
        var p = ev.touches ? ev.touches[0] : ev;
        var e = document.elementFromPoint(p.clientX, p.clientY);
        return e && e.classList.contains("sopa-celda") ? e : null;
      }
      function limpiarSel() {
        sel.forEach(function (c) { c.classList.remove("sel"); });
        sel = [];
      }
      function trazar(a, b) {
        limpiarSel();
        var x1 = +a.dataset.x, y1 = +a.dataset.y, x2 = +b.dataset.x, y2 = +b.dataset.y;
        var dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
        var largo = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
        // solo líneas rectas u 8 direcciones
        if (!(x1 === x2 || y1 === y2 || Math.abs(x2 - x1) === Math.abs(y2 - y1))) return "";
        var txt = "";
        for (var i = 0; i <= largo; i++) {
          var c = tabla.querySelector('[data-x="' + (x1 + dx * i) + '"][data-y="' + (y1 + dy * i) + '"]');
          if (!c) return "";
          c.classList.add("sel"); sel.push(c);
          txt += c.textContent;
        }
        return txt;
      }
      function soltar(txt) {
        var inv = txt.split("").reverse().join("");
        var hit = palabras.filter(function (w) {
          var W = w.p.toUpperCase();
          return (W === txt || W === inv) && !encontradas[W];
        })[0];
        if (hit) {
          var W = hit.p.toUpperCase();
          encontradas[W] = true;
          sel.forEach(function (c) { c.classList.add("hallada"); });
          var chip = listaEl.querySelector('[data-w="' + W + '"]');
          if (chip) chip.classList.add("hallada");
          Voz.decir(hit.p, { rate: 0.7 });
          gan += m.premiar(chip || tabla, "verde");
          Pro.registrar(sopaLetras.destreza, true, { item: hit.p });
          Pro.registrarPalabra(hit.p, "verde", null, "reconocimiento-visual");
          sel = [];
          if (Object.keys(encontradas).length === palabras.length) cerrar();
        } else {
          limpiarSel();
        }
      }

      tabla.addEventListener("pointerdown", function (ev) {
        var c = celdaEn(ev); if (!c) return;
        ev.preventDefault(); arrastrando = true; desde = c; trazar(c, c);
      });
      tabla.addEventListener("pointermove", function (ev) {
        if (!arrastrando) return;
        var c = celdaEn(ev); if (c && desde) trazar(desde, c);
      });
      global.addEventListener("pointerup", function () {
        if (!arrastrando) return;
        arrastrando = false;
        var txt = sel.map(function (c) { return c.textContent; }).join("");
        soltar(txt);
      });

      m.pie.appendChild(ui.boton("Give up", "btn-fantasma", cerrar));

      function cerrar() {
        clearInterval(tick);
        var seg = Math.round((Date.now() - t0) / 1000);
        var n = Object.keys(encontradas).length;
        if (n === palabras.length) gan += Eco.dar(Eco.PAGOS.nivelCompleto, "sopa");
        ui.fin(el, { esmeraldas: gan, aciertos: n, total: palabras.length,
                     extra: "Tiempo: " + seg + " seconds" },
          function () { fin({ aciertos: n, total: palabras.length, esmeraldas: gan, segundos: seg }); });
      }

      /* --- generador de rejilla --- */
      function generar(ws, lado, diag) {
        var g = [], i, j;
        for (i = 0; i < lado; i++) { g.push(new Array(lado).fill(null)); }
        var dirs = [[1, 0], [0, 1]];
        if (diag) dirs = dirs.concat([[1, 1], [1, -1]]);

        ws.forEach(function (w) {
          var puesto = false, tries = 0;
          while (!puesto && tries < 260) {
            tries++;
            var d = U.azar(dirs);
            var x = U.entero(0, lado - 1), y = U.entero(0, lado - 1);
            var fx = x + d[0] * (w.length - 1), fy = y + d[1] * (w.length - 1);
            if (fx < 0 || fx >= lado || fy < 0 || fy >= lado) continue;
            var choca = false;
            for (i = 0; i < w.length; i++) {
              var cx = x + d[0] * i, cy = y + d[1] * i;
              if (g[cy][cx] !== null && g[cy][cx] !== w[i]) { choca = true; break; }
            }
            if (choca) continue;
            for (i = 0; i < w.length; i++) { g[y + d[1] * i][x + d[0] * i] = w[i]; }
            puesto = true;
          }
        });
        var abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (i = 0; i < lado; i++) {
          for (j = 0; j < lado; j++) {
            if (g[i][j] === null) g[i][j] = abc[U.entero(0, 25)];
          }
        }
        return { letras: g };
      }
    }
  };

  /* ==========================================================================
     3 · SPELLING  (el hueco más grande: 0/7 en la prueba)
     ======================================================================== */

  var spelling = {
    id: "spelling",
    nombre: "Spelling",
    mundo: "reading",
    destreza: "encoding",

    iniciar: function (el, cfg, fin) {
      var palabras = cfg.items || [];
      var m = ui.marco(el, "Spelling", "Listen to the word and spell it", palabras.length);
      var i = 0, aciertos = 0, gan = 0, resultados = [];

      function pintar() {
        if (i >= palabras.length) return cerrar();
        var w = palabras[i];
        var meta = w.p.toLowerCase();
        var ayudas = 0, construido = [];
        m.cuerpo.innerHTML = ""; m.pie.innerHTML = "";

        var cab = document.createElement("div");
        cab.className = "spell-cab";
        cab.appendChild(ui.boton("🔊 Listen", "btn-primario", function () {
          Voz.decir(w.s || w.p, { rate: 0.65 });
        }));
        if (w.es) cab.appendChild(ui.traducir(w.es, spelling.destreza));
        m.cuerpo.appendChild(cab);
        Voz.decir(w.s || w.p, { rate: 0.65 });

        // huecos
        var huecos = document.createElement("div");
        huecos.className = "spell-huecos";
        for (var k = 0; k < meta.length; k++) {
          var h = document.createElement("span");
          h.className = "spell-hueco";
          huecos.appendChild(h);
        }
        m.cuerpo.appendChild(huecos);

        // letras disponibles: las de la palabra + distractores
        var pool = meta.split("");
        var abc = "abcdefghijklmnopqrstuvwxyz";
        var extra = Math.min(4, Math.max(2, 8 - meta.length));
        for (var z = 0; z < extra; z++) pool.push(abc[U.entero(0, 25)]);
        pool = U.mezclar(pool);

        var teclas = document.createElement("div");
        teclas.className = "spell-teclas";
        pool.forEach(function (l, idx) {
          var b = document.createElement("button");
          b.className = "tecla";
          b.textContent = l.toUpperCase();
          b.dataset.idx = idx;
          b.addEventListener("click", function () {
            if (b.disabled || construido.length >= meta.length) return;
            b.disabled = true;
            construido.push({ l: l, boton: b });
            repintarHuecos();
            if (construido.length === meta.length) revisar();
          });
          teclas.appendChild(b);
        });
        m.cuerpo.appendChild(teclas);

        function repintarHuecos() {
          var hs = huecos.querySelectorAll(".spell-hueco");
          hs.forEach(function (h, n) {
            h.textContent = construido[n] ? construido[n].l.toUpperCase() : "";
            h.classList.toggle("lleno", !!construido[n]);
          });
        }

        m.pie.appendChild(ui.boton("⌫ Clear", "btn-suave", function () {
          var u = construido.pop();
          if (u) u.boton.disabled = false;
          repintarHuecos();
        }));
        m.pie.appendChild(ui.boton("💡 Hint", "btn-suave", function () {
          if (construido.length >= meta.length) return;
          ayudas++;
          var necesaria = meta[construido.length];
          var cand = Array.prototype.slice.call(teclas.querySelectorAll(".tecla"))
            .filter(function (b) { return !b.disabled && b.textContent.toLowerCase() === necesaria; })[0];
          if (cand) cand.click();
        }));

        function revisar() {
          var texto = construido.map(function (c) { return c.l; }).join("");
          var color = texto !== meta ? "rojo" : (ayudas === 0 ? "verde" : "amarillo");
          resultados.push({ w: w, color: color, escrito: texto, ayudas: ayudas });
          Pro.registrar(spelling.destreza, color === "verde", { item: w.p, semaforo: color });
          Pro.registrarPalabra(w.p, color, null, "letras-moviles");
          gan += m.premiar(huecos, color, Eco.PAGOS[color]);
          if (color === "verde") aciertos++;

          var hs = huecos.querySelectorAll(".spell-hueco");
          hs.forEach(function (h, n) {
            h.classList.add(meta[n] === texto[n] ? "ok" : "mal");
          });

          m.pie.innerHTML = "";
          var msg = document.createElement("p");
          msg.className = "estado sem-" + color;
          msg.textContent = color === "verde" ? "Perfect!"
            : color === "amarillo" ? "Bien, pero con ayuda"
            : "Se escribe: " + w.p.toUpperCase();
          m.cuerpo.appendChild(msg);

          if (color !== "verde") {
            // amarillo: oye la pronunciación · rojo: pronunciación + deletreo
            Voz.decir(w.s || w.p, { rate: 0.6 }).then(function () {
              if (color === "rojo") return Voz.deletrear(w.p);
            });
            m.pie.appendChild(ui.boton("🔤 Letter by letter", "btn-suave", function () {
              Voz.deletrear(w.p);
            }));
          }
          m.pie.appendChild(ui.boton("Next", "btn-primario", function () { i++; pintar(); }));
        }
      }

      function cerrar() {
        var malas = resultados.filter(function (r) { return r.color !== "verde"; })
                              .map(function (r) { return r.w.p; });
        ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: palabras.length,
          extra: malas.length ? "Practice these with less help: " + malas.join(", ") : "All correct without help!" },
          function () { fin({ aciertos: aciertos, total: palabras.length, esmeraldas: gan }); });
      }
      pintar();
    }
  };

  /* ==========================================================================
     4 · CUENTO + CHALLENGER
     ======================================================================== */

  var cuento = {
    id: "cuento",
    nombre: "Story",
    mundo: "reading",
    destreza: "comprension",

    iniciar: function (el, cfg, fin) {
      var c = cfg.cuento || D.CUENTOS[0];
      var m = ui.marco(el, c.titulo, "Read the story", c.preguntas.length);
      var escena = 0, gan = 0;

      function pintarEscena() {
        if (escena >= c.escenas.length) return challenger();
        var s = c.escenas[escena];
        m.cuerpo.innerHTML = ""; m.pie.innerHTML = "";

        var arte = document.createElement("div");
        arte.className = "escena-arte";
        arte.innerHTML = Arte.escena(s.arte);
        m.cuerpo.appendChild(arte);

        var texto = document.createElement("p");
        texto.className = "escena-texto";
        texto.textContent = s.en;
        m.cuerpo.appendChild(texto);

        var acc = document.createElement("div");
        acc.className = "fila-acc";
        acc.appendChild(ui.oir(s.en, { rate: 0.75 }));
        acc.appendChild(ui.traducir(s.es, cuento.destreza));
        m.cuerpo.appendChild(acc);

        var puntos = document.createElement("div");
        puntos.className = "puntos-escena";
        c.escenas.forEach(function (_, k) {
          var p = document.createElement("span");
          p.className = "punto" + (k === escena ? " activo" : k < escena ? " visto" : "");
          puntos.appendChild(p);
        });
        m.cuerpo.appendChild(puntos);

        m.pie.appendChild(ui.boton(escena === c.escenas.length - 1 ? "Challenger →" : "Next →",
          "btn-primario", function () { escena++; pintarEscena(); }));
        if (escena > 0) {
          m.pie.appendChild(ui.boton("← Back", "btn-fantasma",
            function () { escena--; pintarEscena(); }));
        }
      }

      function challenger() {
        var q = 0, aciertos = 0;
        function pintarP() {
          if (q >= c.preguntas.length) return cerrar();
          var pg = c.preguntas[q];
          m.cuerpo.innerHTML = ""; m.pie.innerHTML = "";

          var cab = document.createElement("div");
          cab.className = "chall-cab";
          cab.innerHTML = '<span class="chall-tag">CHALLENGER</span>' +
                          '<span class="chall-n">' + (q + 1) + " / " + c.preguntas.length + '</span>';
          m.cuerpo.appendChild(cab);
          m.cuerpo.appendChild(ui.consigna(pg.q_en, pg.q_es, cuento.destreza, { rate: 0.8 }));

          var ops = document.createElement("div");
          ops.className = "opciones";
          var orden = U.mezclar(pg.ops.map(function (t, k) { return { t: t, k: k }; }));
          orden.forEach(function (o) {
            var b = document.createElement("button");
            b.className = "opcion";
            b.textContent = o.t;
            b.addEventListener("click", function () {
              var ok = o.k === pg.r;
              ops.querySelectorAll(".opcion").forEach(function (x) { x.disabled = true; });
              b.classList.add(ok ? "ok" : "mal");
              if (!ok) {
                orden.forEach(function (oo, n) {
                  if (oo.k === pg.r) ops.children[n].classList.add("ok");
                });
              }
              if (ok) { aciertos++; gan += m.premiar(b, "verde"); } else { m.premiar(b, "rojo"); }
              Pro.registrar(cuento.destreza + ":" + pg.tipo, ok, { item: c.id + ":" + q });
              Voz.decir(ok ? "Correct!" : "Not quite.", { rate: 0.9 });
              m.pie.innerHTML = "";
              m.pie.appendChild(ui.boton("Next", "btn-primario", function () { q++; pintarP(); }));
            });
            ops.appendChild(b);
          });
          m.cuerpo.appendChild(ops);
        }
        function cerrar() {
          if (aciertos === c.preguntas.length) gan += Eco.dar(Eco.PAGOS.nivelCompleto, "cuento");
          ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: c.preguntas.length },
            function () { fin({ aciertos: aciertos, total: c.preguntas.length, esmeraldas: gan }); });
        }
        pintarP();
      }
      pintarEscena();
    }
  };

  /* ==========================================================================
     5 · OPERACIONES  (incógnita en cualquier posición + estrategias)
     ======================================================================== */

  var operaciones = {
    id: "operaciones",
    nombre: "Math Facts",
    mundo: "math",
    destreza: "operaciones",

    iniciar: function (el, cfg, fin) {
      var lista = cfg.items || generarSet(cfg.cuantas || 8, cfg.max || 20);
      var pedirEstrategia = cfg.estrategia !== false;
      var m = ui.marco(el, "Math Facts", "Solve the equation", lista.length);
      var i = 0, aciertos = 0, gan = 0, t0;

      function generarSet(n, max) {
        var out = [];
        for (var k = 0; k < n; k++) {
          var op = Math.random() < 0.6 ? "+" : "-";
          var a, b, r, hueco;
          if (op === "+") {
            a = U.entero(2, max - 2); b = U.entero(2, max - a); r = a + b;
          } else {
            r = U.entero(2, max - 2); b = U.entero(1, max - r); a = r + b;
          }
          hueco = U.azar(["resultado", "segundo", "primero"]);
          out.push({ a: a, b: b, r: r, op: op, hueco: hueco, txt: textoDe(a, b, r, op, hueco) });
        }
        return out;
      }
      function textoDe(a, b, r, op, hueco) {
        if (hueco === "resultado") return a + " " + op + " " + b + " = ?";
        if (hueco === "segundo")   return a + " " + op + " ? = " + r;
        return "? " + op + " " + b + " = " + r;
      }
      function respuestaDe(e) {
        return e.hueco === "resultado" ? e.r : e.hueco === "segundo" ? e.b : e.a;
      }

      function pintar() {
        if (i >= lista.length) return cerrar();
        var e = lista[i];
        var correcta = respuestaDe(e);
        m.cuerpo.innerHTML = ""; m.pie.innerHTML = "";
        t0 = Date.now();

        var eq = document.createElement("div");
        eq.className = "ecuacion";
        eq.textContent = e.txt;
        m.cuerpo.appendChild(eq);

        if (e.hueco !== "resultado") {
          var aviso = document.createElement("p");
          aviso.className = "aviso-consigna";
          aviso.textContent = "Look: the missing number is not at the end";
          m.cuerpo.appendChild(aviso);
        }

        var opciones = U.mezclar(distractores(correcta));
        var ops = document.createElement("div");
        ops.className = "opciones-num";
        opciones.forEach(function (v) {
          var b = document.createElement("button");
          b.className = "opcion-num";
          b.textContent = v;
          b.addEventListener("click", function () { elegir(v, b, ops, e, correcta); });
          ops.appendChild(b);
        });
        m.cuerpo.appendChild(ops);

        m.pie.appendChild(ui.boton("💡 Strategies", "btn-suave", function () {
          mostrarEstrategias(e, correcta);
        }));
      }

      function distractores(c) {
        var s = {}; s[c] = true;
        var out = [c];
        while (out.length < 4) {
          var d = c + U.entero(-4, 4);
          if (d >= 0 && !s[d]) { s[d] = true; out.push(d); }
        }
        return out;
      }

      function elegir(v, b, ops, e, correcta) {
        var ms = Date.now() - t0;
        var ok = v === correcta;
        ops.querySelectorAll(".opcion-num").forEach(function (x) { x.disabled = true; });
        b.classList.add(ok ? "ok" : "mal");
        if (!ok) {
          ops.querySelectorAll(".opcion-num").forEach(function (x) {
            if (+x.textContent === correcta) x.classList.add("ok");
          });
        }
        if (ok) { aciertos++; gan += m.premiar(b, "verde"); } else { m.premiar(b, "rojo"); }
        Pro.registrar(operaciones.destreza, ok, { ms: ms, item: e.txt });
        Pro.registrar(operaciones.destreza + ":hueco-" + e.hueco, ok, { item: e.txt });

        m.pie.innerHTML = "";
        if (!ok || pedirEstrategia) {
          m.pie.appendChild(ui.boton("Show strategies", "btn-suave",
            function () { mostrarEstrategias(e, correcta); }));
        }
        m.pie.appendChild(ui.boton("Next", "btn-primario", function () { i++; pintar(); }));
      }

      /* muestra las 4 rutas que enseña la escuela — el pedido del papá */
      function mostrarEstrategias(e, correcta) {
        m.cuerpo.innerHTML = "";
        var h = document.createElement("p");
        h.className = "estrategia-tit";
        h.textContent = "There are several ways to make " + correcta;
        m.cuerpo.appendChild(h);

        var caja = document.createElement("div");
        caja.className = "estrategias";
        var a = e.hueco === "primero" ? correcta : e.a;
        var b = e.hueco === "segundo" ? correcta : e.b;

        caja.appendChild(tarjetaEstr("Ten Frame", "Make ten, then add the rest",
          Arte.tenFrame(e.op === "+" ? a + b : e.r)));
        caja.appendChild(tarjetaEstr("Number Bond", "Break apart the number",
          Arte.numberBond(e.op === "+" ? a + b : e.a, a, b)));
        caja.appendChild(tarjetaEstr("Number Line", "Jump along the number line",
          Arte.rectaNumerica(a, b, e.op)));
        caja.appendChild(tarjetaEstr("Count On", "Count on",
          Arte.contarAdelante(a, b)));
        m.cuerpo.appendChild(caja);

        m.pie.innerHTML = "";
        m.pie.appendChild(ui.boton("Next", "btn-primario", function () { i++; pintar(); }));
      }
      function tarjetaEstr(titulo, sub, svg) {
        var d = document.createElement("div");
        d.className = "estr-tarjeta";
        d.innerHTML = '<h4>' + titulo + '</h4><p>' + sub + '</p>' + svg;
        return d;
      }

      function cerrar() {
        if (aciertos === lista.length) gan += Eco.dar(Eco.PAGOS.nivelCompleto, "mate");
        ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: lista.length },
          function () { fin({ aciertos: aciertos, total: lista.length, esmeraldas: gan }); });
      }
      pintar();
    }
  };

  /* ==========================================================================
     6 · PROBLEMAS  (separa "falló la mate" de "falló el inglés")
     ======================================================================== */

  var problemas = {
    id: "problemas",
    nombre: "Word Problems",
    mundo: "math",
    destreza: "problemas",

    iniciar: function (el, cfg, fin) {
      var lista = cfg.items || U.tomar(D.PROBLEMAS, cfg.cuantas || 4);
      var m = ui.marco(el, "Word Problems", "Read and solve step by step", lista.length);
      var i = 0, aciertos = 0, gan = 0;

      function pintar() {
        if (i >= lista.length) return cerrar();
        var p = lista[i];
        var usoTraduccion = false;
        m.cuerpo.innerHTML = ""; m.pie.innerHTML = "";

        var texto = document.createElement("p");
        texto.className = "problema-texto";
        texto.textContent = p.en;
        m.cuerpo.appendChild(texto);

        var acc = document.createElement("div");
        acc.className = "fila-acc";
        acc.appendChild(ui.oir(p.en, { rate: 0.75 }));
        var bt = ui.traducir(p.es, problemas.destreza);
        bt.addEventListener("click", function () { usoTraduccion = true; });
        acc.appendChild(bt);
        m.cuerpo.appendChild(acc);
        Voz.decir(p.en, { rate: 0.75 });

        paso1();

        /* paso 1 — ¿qué te preguntan? (mide comprensión del inglés) */
        function paso1() {
          var q = document.createElement("div");
          q.className = "paso";
          q.innerHTML = '<h4>1 · What is the question?</h4>';
          var opsQ = U.mezclar([
            { t: p.pregunta_en, ok: true },
            { t: "How many colors are there?", ok: false },
            { t: "What day is it?", ok: false }
          ]);
          var cont = document.createElement("div");
          cont.className = "opciones";
          opsQ.forEach(function (o) {
            var b = document.createElement("button");
            b.className = "opcion";
            b.textContent = o.t;
            b.addEventListener("click", function () {
              cont.querySelectorAll(".opcion").forEach(function (x) { x.disabled = true; });
              b.classList.add(o.ok ? "ok" : "mal");
              Pro.registrar("problemas:comprension-ingles", o.ok, { item: p.id });
              setTimeout(paso2, 500);
            });
            cont.appendChild(b);
          });
          q.appendChild(cont);
          m.cuerpo.appendChild(q);
        }

        /* paso 2 — ¿suma o resta? (mide la consigna) */
        function paso2() {
          var q = document.createElement("div");
          q.className = "paso";
          q.innerHTML = '<h4>2 · Add or subtract?</h4>';
          var cont = document.createElement("div");
          cont.className = "opciones";
          [["+ Add", "+"], ["− Subtract", "-"]].forEach(function (par) {
            var b = document.createElement("button");
            b.className = "opcion opcion-op";
            b.textContent = par[0];
            b.addEventListener("click", function () {
              var esperado = p.op === "+-" ? "+" : p.op;
              var ok = par[1] === esperado;
              cont.querySelectorAll(".opcion").forEach(function (x) { x.disabled = true; });
              b.classList.add(ok ? "ok" : "mal");
              Pro.registrar("problemas:operacion", ok, { item: p.id });
              if (!ok) {
                var pista = document.createElement("p");
                pista.className = "pista";
                pista.textContent = 'The clue is in "' + p.clave + '"';
                q.appendChild(pista);
                Voz.decir(p.clave, { rate: 0.6 });
              }
              setTimeout(paso3, ok ? 400 : 1600);
            });
            cont.appendChild(b);
          });
          q.appendChild(cont);
          m.cuerpo.appendChild(q);
        }

        /* paso 3 — el número (mide la matemática pura) */
        function paso3() {
          var q = document.createElement("div");
          q.className = "paso";
          q.innerHTML = '<h4>3 · What is the answer?</h4>';
          var cont = document.createElement("div");
          cont.className = "opciones-num";
          var ops = U.mezclar([p.r, p.r + 1, p.r - 2, p.r + 3].filter(function (v, k, arr) {
            return v >= 0 && arr.indexOf(v) === k;
          }));
          ops.forEach(function (v) {
            var b = document.createElement("button");
            b.className = "opcion-num";
            b.textContent = v;
            b.addEventListener("click", function () {
              var ok = v === p.r;
              cont.querySelectorAll(".opcion-num").forEach(function (x) { x.disabled = true; });
              b.classList.add(ok ? "ok" : "mal");
              if (ok) { aciertos++; gan += m.premiar(b, "verde"); } else { m.premiar(b, "rojo"); }
              Pro.registrar("problemas:calculo", ok, { item: p.id });
              Pro.registrar(problemas.destreza, ok,
                { item: p.id + (usoTraduccion ? ":conTraduccion" : "") });
              m.pie.innerHTML = "";
              m.pie.appendChild(ui.boton("Next", "btn-primario", function () { i++; pintar(); }));
            });
            cont.appendChild(b);
          });
          q.appendChild(cont);
          m.cuerpo.appendChild(q);
          q.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }

      function cerrar() {
        ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: lista.length },
          function () { fin({ aciertos: aciertos, total: lista.length, esmeraldas: gan }); });
      }
      pintar();
    }
  };

  /* ==========================================================================
     7 · MONEDAS Y BILLETES
     ======================================================================== */

  var monedas = {
    id: "monedas",
    nombre: "Money",
    mundo: "math",
    destreza: "dinero",

    iniciar: function (el, cfg, fin) {
      var modo = cfg.modo || "identificar";   // identificar | contar | tienda
      var rondas = cfg.rondas || 6;
      var m = ui.marco(el, "Money",
        modo === "identificar" ? "What is it worth?" :
        modo === "contar" ? "Count the money" : "Shop for an item");
      var i = 0, aciertos = 0, gan = 0;

      function centavos(v) {
        return v >= 100 ? "$" + (v / 100).toFixed(2) : v + "¢";
      }

      function pintar() {
        if (i >= rondas) return cerrar();
        m.cuerpo.innerHTML = ""; m.pie.innerHTML = "";
        if (modo === "identificar") return identificar();
        if (modo === "contar") return contar();
        return tienda();
      }

      function identificar() {
        var c = U.azar(D.DINERO);
        var vis = document.createElement("div");
        vis.className = "moneda-grande";
        vis.innerHTML = Arte.dinero(c, 140);
        m.cuerpo.appendChild(vis);
        m.cuerpo.appendChild(ui.consigna("How much is this " + c.nombre + "?",
          "How much is this " + c.nombre + "?", monedas.destreza));

        var ops = U.mezclar(U.tomar(D.DINERO.filter(function (x) { return x.id !== c.id; }), 3)
                    .concat([c]));
        var cont = document.createElement("div");
        cont.className = "opciones-num";
        ops.forEach(function (o) {
          var b = document.createElement("button");
          b.className = "opcion-num";
          b.textContent = centavos(o.v);
          b.addEventListener("click", function () {
            var ok = o.id === c.id;
            cont.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
            b.classList.add(ok ? "ok" : "mal");
            if (ok) {
              aciertos++; gan += m.premiar(b, "verde");
            } else {
              m.premiar(b, "rojo");
              Voz.decir("A " + c.nombre + " is " + c.es.replace("centavos", "cents"), { rate: 0.8 });
            }
            Pro.registrar(monedas.destreza + ":identificar", ok, { item: c.id });
            siguiente();
          });
          cont.appendChild(b);
        });
        m.cuerpo.appendChild(cont);
      }

      function contar() {
        var set = [], total = 0, n = U.entero(3, 5);
        var posibles = D.DINERO.filter(function (d) { return d.tipo === "moneda"; });
        for (var k = 0; k < n; k++) {
          var c = U.azar(posibles); set.push(c); total += c.v;
        }
        var vis = document.createElement("div");
        vis.className = "monton";
        set.forEach(function (c) {
          var d = document.createElement("div");
          d.className = "moneda-chica";
          d.innerHTML = Arte.dinero(c, 74);
          d.addEventListener("click", function () { Voz.decir(c.nombre, { rate: 0.8 }); });
          vis.appendChild(d);
        });
        m.cuerpo.appendChild(vis);
        m.cuerpo.appendChild(ui.consigna("How much money is here?",
          "How much money is here?", monedas.destreza));

        var ops = U.mezclar([total, total + 5, total - 5, total + 10]
          .filter(function (v, k, a) { return v > 0 && a.indexOf(v) === k; }));
        var cont = document.createElement("div");
        cont.className = "opciones-num";
        ops.forEach(function (v) {
          var b = document.createElement("button");
          b.className = "opcion-num";
          b.textContent = centavos(v);
          b.addEventListener("click", function () {
            var ok = v === total;
            cont.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
            b.classList.add(ok ? "ok" : "mal");
            if (ok) { aciertos++; gan += m.premiar(b, "verde"); } else { m.premiar(b, "rojo"); }
            Pro.registrar(monedas.destreza + ":contar", ok, { item: "total:" + total });
            siguiente();
          });
          cont.appendChild(b);
        });
        m.cuerpo.appendChild(cont);
      }

      function tienda() {
        var art = U.azar(D.TIENDA);
        var pagoCon = art.precio <= 100 ? 100 : art.precio <= 200 ? 200 : 500;
        var vuelto = pagoCon - art.precio;

        var vis = document.createElement("div");
        vis.className = "tienda-item";
        vis.innerHTML = Arte.objeto(art.icono, 110) +
          '<div class="tienda-precio">' + centavos(art.precio) + '</div>';
        m.cuerpo.appendChild(vis);
        m.cuerpo.appendChild(ui.consigna(
          "You buy the " + art.p + " with " + centavos(pagoCon) + ". How much change?",
          "You buy " + art.es + " for " + centavos(pagoCon) + ". How much change do you get?",
          monedas.destreza));

        var ops = U.mezclar([vuelto, vuelto + 5, vuelto - 5, vuelto + 10]
          .filter(function (v, k, a) { return v >= 0 && a.indexOf(v) === k; }));
        var cont = document.createElement("div");
        cont.className = "opciones-num";
        ops.forEach(function (v) {
          var b = document.createElement("button");
          b.className = "opcion-num";
          b.textContent = centavos(v);
          b.addEventListener("click", function () {
            var ok = v === vuelto;
            cont.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
            b.classList.add(ok ? "ok" : "mal");
            if (ok) { aciertos++; gan += m.premiar(b, "verde"); } else { m.premiar(b, "rojo"); }
            Pro.registrar(monedas.destreza + ":vuelto", ok, { item: art.p });
            siguiente();
          });
          cont.appendChild(b);
        });
        m.cuerpo.appendChild(cont);
      }

      function siguiente() {
        m.pie.innerHTML = "";
        m.pie.appendChild(ui.boton("Next", "btn-primario", function () { i++; pintar(); }));
      }
      function cerrar() {
        ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: rondas },
          function () { fin({ aciertos: aciertos, total: rondas, esmeraldas: gan }); });
      }
      pintar();
    }
  };

  /* ==========================================================================
     8 · GRÁFICAS  (barras y pictogramas — la lección de esta semana)
     ======================================================================== */

  var graficas = {
    id: "graficas",
    nombre: "Graphs",
    mundo: "math",
    destreza: "graficas",

    iniciar: function (el, cfg, fin) {
      var g = cfg.grafica || U.azar(D.GRAFICAS);
      var cuantas = cfg.cuantas || 5;
      var m = ui.marco(el, "Graphs", g.titulo, cuantas);
      var i = 0, aciertos = 0, gan = 0;
      var preguntas = armarPreguntas(g, cuantas);

      var vis = document.createElement("div");
      vis.className = "grafica-caja";
      vis.innerHTML = g.tipo === "barras" ? Arte.grafBarras(g) : Arte.pictograma(g);
      m.cuerpo.appendChild(vis);

      var zona = document.createElement("div");
      zona.className = "grafica-preg";
      m.cuerpo.appendChild(zona);

      function armarPreguntas(g, n) {
        var d = g.datos, out = [];
        var orden = d.slice().sort(function (a, b) { return b.v - a.v; });
        var mayor = orden[0], menor = orden[orden.length - 1];
        var total = d.reduce(function (s, x) { return s + x.v; }, 0);

        var uno = U.azar(d);
        out.push({ en: "How many " + uno.et + " are there?",
                   es: "¿Cuántos " + uno.es + " hay?", r: uno.v, tipo: "cuantos" });
        out.push({ en: "Which has the most?", es: "¿Cuál tiene más?",
                   r: mayor.et, ops: d.map(function (x) { return x.et; }), tipo: "mas" });
        out.push({ en: "Which has the fewest?", es: "¿Cuál tiene menos?",
                   r: menor.et, ops: d.map(function (x) { return x.et; }), tipo: "menos" });
        var par = U.tomar(d, 2);
        if (par[0].v < par[1].v) par.reverse();
        out.push({ en: "How many more " + par[0].et + " than " + par[1].et + "?",
                   es: "¿Cuántos " + par[0].es + " más que " + par[1].es + "?",
                   r: par[0].v - par[1].v, tipo: "cuantosMas" });
        out.push({ en: "How many in all?", es: "¿Cuántos hay en total?",
                   r: total, tipo: "total" });
        var par2 = U.tomar(d, 2);
        out.push({ en: "How many " + par2[0].et + " and " + par2[1].et + " together?",
                   es: "¿Cuántos " + par2[0].es + " y " + par2[1].es + " juntos?",
                   r: par2[0].v + par2[1].v, tipo: "juntos" });
        return U.mezclar(out).slice(0, n);
      }

      function pintar() {
        if (i >= preguntas.length) return cerrar();
        var q = preguntas[i];
        zona.innerHTML = "";
        m.pie.innerHTML = "";
        zona.appendChild(ui.consigna(q.en, q.es, graficas.destreza, { rate: 0.8 }));

        var ops, cls;
        if (q.ops) {
          ops = U.mezclar(q.ops); cls = "opciones";
        } else {
          ops = U.mezclar([q.r, q.r + 1, q.r - 1, q.r + 2]
            .filter(function (v, k, a) { return v >= 0 && a.indexOf(v) === k; }));
          cls = "opciones-num";
        }
        var cont = document.createElement("div");
        cont.className = cls;
        ops.forEach(function (v) {
          var b = document.createElement("button");
          b.className = q.ops ? "opcion" : "opcion-num";
          b.textContent = v;
          b.addEventListener("click", function () {
            var ok = String(v) === String(q.r);
            cont.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
            b.classList.add(ok ? "ok" : "mal");
            if (!ok) {
              cont.querySelectorAll("button").forEach(function (x) {
                if (x.textContent === String(q.r)) x.classList.add("ok");
              });
            }
            if (ok) { aciertos++; gan += m.premiar(b, "verde"); } else { m.premiar(b, "rojo"); }
            Pro.registrar(graficas.destreza + ":" + q.tipo, ok, { item: g.id });
            m.pie.appendChild(ui.boton("Next", "btn-primario", function () { i++; pintar(); }));
          });
          cont.appendChild(b);
        });
        zona.appendChild(cont);
      }

      function cerrar() {
        if (aciertos === preguntas.length) gan += Eco.dar(Eco.PAGOS.nivelCompleto, "grafica");
        ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: preguntas.length },
          function () { fin({ aciertos: aciertos, total: preguntas.length, esmeraldas: gan }); });
      }
      pintar();
    }
  };

  /* ==========================================================================
     9 · FORMAS  (Geometry = Needs Improvement en i-Ready)
     ======================================================================== */

  var formas = {
    id: "formas",
    nombre: "Shapes",
    mundo: "math",
    destreza: "geometria",

    iniciar: function (el, cfg, fin) {
      var rondas = cfg.rondas || 6;
      var m = ui.marco(el, "Shapes", "Name the shape", rondas);
      var i = 0, aciertos = 0, gan = 0;

      function pintar() {
        if (i >= rondas) return cerrar();
        m.cuerpo.innerHTML = ""; m.pie.innerHTML = "";
        var f = U.azar(D.FORMAS);
        var modo = U.azar(["nombrar", "contar"]);

        var vis = document.createElement("div");
        vis.className = "forma-caja";
        vis.innerHTML = Arte.forma(f, 160);
        m.cuerpo.appendChild(vis);

        var q, correcta, ops, cls;
        if (modo === "nombrar") {
          q = ["What shape is this?", "¿Qué forma es esta?"];
          correcta = f.en;
          ops = U.mezclar(U.tomar(D.FORMAS.filter(function (x) { return x.id !== f.id && x.d === f.d; }), 3)
                  .map(function (x) { return x.en; }).concat([f.en]));
          cls = "opciones";
        } else if (f.d === 2) {
          q = ["How many sides does it have?", "¿Cuántos lados tiene?"];
          correcta = String(f.lados);
          ops = U.mezclar([f.lados, f.lados + 1, Math.max(0, f.lados - 1), f.lados + 2]
            .filter(function (v, k, a) { return a.indexOf(v) === k; }).map(String));
          cls = "opciones-num";
        } else {
          q = ["How many faces does it have?", "¿Cuántas caras tiene?"];
          correcta = String(f.caras);
          ops = U.mezclar([f.caras, f.caras + 1, Math.max(0, f.caras - 1), f.caras + 2]
            .filter(function (v, k, a) { return a.indexOf(v) === k; }).map(String));
          cls = "opciones-num";
        }

        m.cuerpo.appendChild(ui.consigna(q[0], q[1], formas.destreza));

        var cont = document.createElement("div");
        cont.className = cls;
        ops.forEach(function (v) {
          var b = document.createElement("button");
          b.className = cls === "opciones" ? "opcion" : "opcion-num";
          b.textContent = v;
          b.addEventListener("click", function () {
            var ok = String(v) === String(correcta);
            cont.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
            b.classList.add(ok ? "ok" : "mal");
            if (!ok) {
              cont.querySelectorAll("button").forEach(function (x) {
                if (x.textContent === String(correcta)) x.classList.add("ok");
              });
              Voz.decir("This is a " + f.en, { rate: 0.8 });
            }
            if (ok) { aciertos++; gan += m.premiar(b, "verde"); } else { m.premiar(b, "rojo"); }
            Pro.registrar(formas.destreza + ":" + modo, ok, { item: f.id });
            m.pie.appendChild(ui.boton("Next", "btn-primario", function () { i++; pintar(); }));
          });
          cont.appendChild(b);
        });
        m.cuerpo.appendChild(cont);
      }

      function cerrar() {
        ui.fin(el, { esmeraldas: gan, aciertos: aciertos, total: rondas },
          function () { fin({ aciertos: aciertos, total: rondas, esmeraldas: gan }); });
      }
      pintar();
    }
  };

  /* ==========================================================================
     ARTE — SVG de bloques, original
     ======================================================================== */

  var Arte = {
    px: function (x, y, w, h, c) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
    },

    escena: function (tipo) {
      var s = '<svg viewBox="0 0 64 40" width="100%" height="150" shape-rendering="crispEdges" aria-hidden="true">';
      var cielo = { cueva: "#12162a", antorcha: "#1b1430", esmeralda: "#101a24",
                    amigo: "#1d2440", cometa: "#2a4a7a", lago: "#2a4a7a",
                    arbol: "#2a4a7a", ayuda: "#35558a", felices: "#4a6fa8" }[tipo] || "#1a2038";
      s += Arte.px(0, 0, 64, 40, cielo);
      if (tipo === "cueva" || tipo === "antorcha" || tipo === "esmeralda") {
        s += Arte.px(0, 26, 64, 14, "#3a3f52");
        s += Arte.px(0, 24, 64, 3, "#4a5065");
        for (var i = 0; i < 8; i++) s += Arte.px(i * 8 + 2, 28, 4, 4, "#33384a");
      } else {
        s += Arte.px(0, 30, 64, 10, "#3f8a3f");
        s += Arte.px(0, 28, 64, 3, "#4fae4f");
      }
      if (tipo === "antorcha") {
        s += Arte.px(30, 14, 2, 12, "#8a5a2a");
        s += Arte.px(29, 10, 4, 4, "#ffb03a");
        s += Arte.px(30, 7, 2, 3, "#ffd66b");
      }
      if (tipo === "esmeralda") {
        [[14, 16], [26, 12], [38, 18], [48, 14]].forEach(function (p) {
          s += Arte.px(p[0], p[1], 5, 5, "#2ee6a0");
          s += Arte.px(p[0] + 1, p[1] + 1, 2, 2, "#7df5c6");
        });
      }
      if (tipo === "cueva") { s += Arte.px(24, 12, 16, 16, "#0a0d18"); }
      if (tipo === "amigo" || tipo === "ayuda" || tipo === "felices") {
        s += Arte.px(18, 16, 8, 14, "#6ea8ff") + Arte.px(19, 10, 6, 6, "#f2c49b");
        s += Arte.px(38, 16, 8, 14, "#ffb03a") + Arte.px(39, 10, 6, 6, "#d9a173");
      }
      if (tipo === "cometa") {
        s += '<path d="M32 6 L40 14 L32 24 L24 14 Z" fill="#ff6b5e"/>';
        s += '<path d="M32 24 L32 32" stroke="#eef1ff" stroke-width="1" fill="none"/>';
      }
      if (tipo === "lago") { s += Arte.px(8, 30, 48, 8, "#3f8ad6"); }
      if (tipo === "arbol") {
        s += Arte.px(30, 18, 4, 12, "#6b4a2a");
        s += Arte.px(24, 8, 16, 12, "#2f7a3f");
        s += '<path d="M40 12 L46 8 L44 14 Z" fill="#ff6b5e"/>';
      }
      return s + "</svg>";
    },

    dinero: function (c, tam) {
      if (c.tipo === "billete") {
        return '<svg viewBox="0 0 48 24" width="' + tam + '" height="' + (tam / 2) +
          '" shape-rendering="crispEdges" role="img" aria-label="' + c.nombre + '">' +
          Arte.px(0, 0, 48, 24, c.color) + Arte.px(2, 2, 44, 20, "#e9f0e6") +
          Arte.px(4, 4, 40, 16, c.color) +
          '<text x="24" y="16" text-anchor="middle" font-size="10" font-family="monospace" ' +
          'font-weight="bold" fill="#e9f0e6">$' + (c.v / 100) + '</text></svg>';
      }
      var r = { penny: 11, nickel: 12, dime: 10, quarter: 13 }[c.id] || 12;
      return '<svg viewBox="0 0 28 28" width="' + tam + '" height="' + tam +
        '" role="img" aria-label="' + c.nombre + '">' +
        '<circle cx="14" cy="14" r="' + r + '" fill="' + c.color + '"/>' +
        '<circle cx="14" cy="14" r="' + (r - 2) + '" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1"/>' +
        '<text x="14" y="17" text-anchor="middle" font-size="8" font-family="monospace" ' +
        'font-weight="bold" fill="rgba(0,0,0,.65)">' + c.v + '</text></svg>';
    },

    objeto: function (icono, tam) {
      var col = { manzana: "#ff6b5e", pan: "#d9a35a", antorcha: "#ffb03a",
                  pico: "#9aa3ad", escudo: "#8a6a4a", zanahoria: "#ff9a3a",
                  bote: "#8a5a2a", farol: "#ffd66b" }[icono] || "#6ea8ff";
      return '<svg viewBox="0 0 16 16" width="' + tam + '" height="' + tam +
        '" shape-rendering="crispEdges" aria-hidden="true">' +
        Arte.px(3, 3, 10, 10, col) + Arte.px(4, 4, 3, 3, "rgba(255,255,255,.35)") +
        Arte.px(3, 11, 10, 2, "rgba(0,0,0,.25)") + '</svg>';
    },

    forma: function (f, tam) {
      var c = "#6ea8ff", s = '<svg viewBox="0 0 100 100" width="' + tam + '" height="' + tam +
        '" role="img" aria-label="' + f.en + '">';
      var m = { triangle: '<polygon points="50,12 90,85 10,85" fill="' + c + '"/>',
        square: '<rect x="18" y="18" width="64" height="64" fill="' + c + '"/>',
        rectangle: '<rect x="10" y="28" width="80" height="44" fill="' + c + '"/>',
        pentagon: '<polygon points="50,10 92,40 76,88 24,88 8,40" fill="' + c + '"/>',
        hexagon: '<polygon points="30,12 70,12 92,50 70,88 30,88 8,50" fill="' + c + '"/>',
        circle: '<circle cx="50" cy="50" r="38" fill="' + c + '"/>',
        cube: '<polygon points="22,34 50,20 78,34 78,70 50,84 22,70" fill="' + c + '"/>' +
              '<polygon points="22,34 50,48 78,34 50,20" fill="#9cc4ff"/>' +
              '<polygon points="50,48 78,34 78,70 50,84" fill="#4a86e0"/>',
        sphere: '<circle cx="50" cy="50" r="38" fill="' + c + '"/>' +
                '<ellipse cx="38" cy="38" rx="12" ry="9" fill="rgba(255,255,255,.35)"/>',
        cone: '<polygon points="50,14 84,76 16,76" fill="' + c + '"/>' +
              '<ellipse cx="50" cy="76" rx="34" ry="10" fill="#4a86e0"/>',
        cylinder: '<rect x="20" y="26" width="60" height="48" fill="' + c + '"/>' +
                  '<ellipse cx="50" cy="26" rx="30" ry="10" fill="#9cc4ff"/>' +
                  '<ellipse cx="50" cy="74" rx="30" ry="10" fill="#4a86e0"/>',
        pyramid: '<polygon points="50,14 86,78 14,78" fill="' + c + '"/>' +
                 '<polygon points="50,14 86,78 50,64" fill="#4a86e0"/>'
      }[f.id] || '';
      return s + m + "</svg>";
    },

    grafBarras: function (g) {
      var W = 320, H = 200, izq = 34, abajo = 34, arriba = 14;
      var max = g.max || Math.max.apply(null, g.datos.map(function (d) { return d.v; })) + 1;
      var altoUtil = H - abajo - arriba;
      var anchoUtil = W - izq - 12;
      var pasoX = anchoUtil / g.datos.length;
      var col = ["#2ee6a0", "#6ea8ff", "#ffb03a", "#ff6b5e", "#b98cff"];
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' +
              g.titulo + '">';
      // grilla y ticks
      for (var v = 0; v <= max; v++) {
        var y = arriba + altoUtil - (v / max) * altoUtil;
        s += '<line x1="' + izq + '" y1="' + y + '" x2="' + (W - 8) + '" y2="' + y +
             '" stroke="#3a446b" stroke-width="1"/>';
        s += '<text x="' + (izq - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" ' +
             'fill="#93a0c8" font-family="monospace">' + v + '</text>';
      }
      g.datos.forEach(function (d, k) {
        var h = (d.v / max) * altoUtil;
        var x = izq + k * pasoX + pasoX * 0.22;
        var w = pasoX * 0.56;
        var y = arriba + altoUtil - h;
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
             '" fill="' + col[k % col.length] + '"/>';
        s += '<text x="' + (x + w / 2) + '" y="' + (H - abajo + 16) + '" text-anchor="middle" ' +
             'font-size="11" fill="#eef1ff" font-family="inherit">' + d.et + '</text>';
      });
      s += '<line x1="' + izq + '" y1="' + (arriba + altoUtil) + '" x2="' + (W - 8) + '" y2="' +
           (arriba + altoUtil) + '" stroke="#eef1ff" stroke-width="2"/>';
      s += '<line x1="' + izq + '" y1="' + arriba + '" x2="' + izq + '" y2="' +
           (arriba + altoUtil) + '" stroke="#eef1ff" stroke-width="2"/>';
      return s + "</svg>";
    },

    pictograma: function (g) {
      var col = ["#ffcc4d", "#6ea8ff", "#93a0c8", "#eef1ff", "#2ee6a0"];
      var s = '<div class="picto">';
      s += '<p class="picto-unidad">' + U.esc(g.unidad || "") + '</p>';
      g.datos.forEach(function (d, k) {
        s += '<div class="picto-fila"><span class="picto-et">' + U.esc(d.et) + '</span><span class="picto-iconos">';
        for (var i = 0; i < d.v; i++) {
          s += '<svg viewBox="0 0 10 10" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true">' +
               '<rect x="1" y="1" width="8" height="8" fill="' + col[k % col.length] + '"/>' +
               '<rect x="2" y="2" width="3" height="3" fill="rgba(255,255,255,.4)"/></svg>';
        }
        s += '</span></div>';
      });
      return s + "</div>";
    },

    tenFrame: function (n) {
      var s = '<svg viewBox="0 0 106 46" width="100%" shape-rendering="crispEdges" aria-hidden="true">';
      var puesto = 0;
      for (var marco = 0; marco < 2; marco++) {
        for (var f = 0; f < 2; f++) {
          for (var c = 0; c < 5; c++) {
            var x = marco * 54 + c * 10, y = f * 20;
            s += '<rect x="' + x + '" y="' + y + '" width="10" height="20" fill="none" stroke="#3a446b"/>';
            if (puesto < n) {
              s += '<circle cx="' + (x + 5) + '" cy="' + (y + 10) + '" r="3.4" fill="#2ee6a0"/>';
              puesto++;
            }
          }
        }
      }
      return s + "</svg>";
    },

    numberBond: function (total, a, b) {
      return '<svg viewBox="0 0 120 80" width="100%" aria-hidden="true">' +
        '<line x1="60" y1="26" x2="28" y2="56" stroke="#93a0c8" stroke-width="2"/>' +
        '<line x1="60" y1="26" x2="92" y2="56" stroke="#93a0c8" stroke-width="2"/>' +
        '<rect x="42" y="4" width="36" height="24" rx="4" fill="#2c3455" stroke="#6ea8ff"/>' +
        '<text x="60" y="21" text-anchor="middle" font-size="14" fill="#eef1ff" font-family="monospace">' + total + '</text>' +
        '<rect x="8" y="52" width="34" height="24" rx="4" fill="#2c3455" stroke="#2ee6a0"/>' +
        '<text x="25" y="69" text-anchor="middle" font-size="14" fill="#eef1ff" font-family="monospace">' + a + '</text>' +
        '<rect x="78" y="52" width="34" height="24" rx="4" fill="#2c3455" stroke="#2ee6a0"/>' +
        '<text x="95" y="69" text-anchor="middle" font-size="14" fill="#eef1ff" font-family="monospace">' + b + '</text>' +
        '</svg>';
    },

    rectaNumerica: function (a, b, op) {
      var inicio = a, medio = op === "+" ? 10 : Math.max(0, a - b), fin = op === "+" ? a + b : a - b;
      var lo = Math.min(inicio, fin) - 1, hi = Math.max(inicio, fin) + 1;
      function px(v) { return 10 + (v - lo) / (hi - lo) * 140; }
      return '<svg viewBox="0 0 160 62" width="100%" aria-hidden="true">' +
        '<line x1="10" y1="46" x2="150" y2="46" stroke="#eef1ff" stroke-width="2"/>' +
        '<line x1="' + px(inicio) + '" y1="42" x2="' + px(inicio) + '" y2="50" stroke="#eef1ff" stroke-width="2"/>' +
        '<line x1="' + px(fin) + '" y1="42" x2="' + px(fin) + '" y2="50" stroke="#eef1ff" stroke-width="2"/>' +
        '<path d="M' + px(inicio) + ' 42 Q ' + ((px(inicio) + px(fin)) / 2) + ' 12 ' + px(fin) + ' 42" ' +
        'fill="none" stroke="#2ee6a0" stroke-width="2"/>' +
        '<text x="' + px(inicio) + '" y="60" text-anchor="middle" font-size="10" fill="#93a0c8" font-family="monospace">' + inicio + '</text>' +
        '<text x="' + px(fin) + '" y="60" text-anchor="middle" font-size="10" fill="#93a0c8" font-family="monospace">' + fin + '</text>' +
        '<text x="' + ((px(inicio) + px(fin)) / 2) + '" y="14" text-anchor="middle" font-size="11" fill="#2ee6a0" font-family="monospace">' +
        op + b + '</text></svg>';
    },

    contarAdelante: function (a, b) {
      var s = '<svg viewBox="0 0 160 34" width="100%" shape-rendering="crispEdges" aria-hidden="true">';
      var n = Math.min(b, 6);
      s += '<rect x="2" y="8" width="20" height="18" rx="3" fill="#2ee6a0"/>' +
           '<text x="12" y="21" text-anchor="middle" font-size="11" fill="#101319" font-family="monospace">' + a + '</text>';
      for (var i = 1; i <= n; i++) {
        s += '<rect x="' + (2 + i * 22) + '" y="8" width="20" height="18" rx="3" fill="#2c3455" stroke="#3a446b"/>' +
             '<text x="' + (12 + i * 22) + '" y="21" text-anchor="middle" font-size="11" fill="#eef1ff" font-family="monospace">' + (a + i) + '</text>';
      }
      return s + "</svg>";
    }
  };

  /* ==========================================================================
     EXPORT
     ======================================================================== */

  global.JUEGOS = {
    lecturaPalabras: lecturaPalabras,
    sopaLetras: sopaLetras,
    spelling: spelling,
    cuento: cuento,
    operaciones: operaciones,
    problemas: problemas,
    monedas: monedas,
    graficas: graficas,
    formas: formas,
    Arte: Arte,
    ui: ui
  };

})(window);
