/* ============================================================================
   EFECTOS — lo que hace que se sienta un juego y no un examen
   ----------------------------------------------------------------------------
   Sonido sintetizado en el momento (sin archivos, sin descargas), partículas,
   rachas y un compañero que reacciona.

   Una regla atraviesa todo esto: el acierto suena fuerte, brillante y arriba;
   el error suena suave, corto y grave. Nunca estridente. Gabriel ya está 113
   puntos abajo en lectura — el sonido de equivocarse no puede sentirse como un
   castigo o deja de jugar.
   ========================================================================== */

(function (global) {
  "use strict";

  /* ==========================================================================
     SONIDO — osciladores de Web Audio, estilo consola de 8 bits
     ======================================================================== */

  var Sonido = (function () {
    var ctx = null, maestro = null, activo = true;

    /* Los navegadores móviles no dejan sonar hasta que el usuario toca algo.
       Se despierta con el primer toque y queda listo. */
    function despertar() {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        maestro = ctx.createGain();
        maestro.gain.value = 0.22;
        maestro.connect(ctx.destination);
      } catch (e) { ctx = null; }
      return ctx;
    }
    ["pointerdown", "keydown"].forEach(function (ev) {
      global.addEventListener(ev, function () { despertar(); }, { once: true });
    });

    /* una nota */
    function nota(frec, cuando, dura, tipo, vol) {
      if (!ctx || !activo) return;
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = tipo || "triangle";
      o.frequency.setValueAtTime(frec, ctx.currentTime + cuando);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + cuando);
      g.gain.exponentialRampToValueAtTime(vol || 0.5, ctx.currentTime + cuando + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + cuando + dura);
      o.connect(g); g.connect(maestro);
      o.start(ctx.currentTime + cuando);
      o.stop(ctx.currentTime + cuando + dura + 0.02);
    }

    /* barrido de frecuencia, para deslizamientos */
    function barrido(de, a, cuando, dura, tipo, vol) {
      if (!ctx || !activo) return;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo || "sine";
      o.frequency.setValueAtTime(de, ctx.currentTime + cuando);
      o.frequency.exponentialRampToValueAtTime(a, ctx.currentTime + cuando + dura);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + cuando);
      g.gain.exponentialRampToValueAtTime(vol || 0.4, ctx.currentTime + cuando + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + cuando + dura);
      o.connect(g); g.connect(maestro);
      o.start(ctx.currentTime + cuando);
      o.stop(ctx.currentTime + cuando + dura + 0.02);
    }

    var API = {
      encender: function (v) { activo = v !== false; },
      despertar: despertar,

      /* acierto: arpegio ascendente, brillante */
      acierto: function () {
        despertar();
        nota(523.25, 0, 0.09, "triangle", 0.5);   // C5
        nota(659.25, 0.07, 0.09, "triangle", 0.5); // E5
        nota(783.99, 0.14, 0.16, "triangle", 0.55); // G5
      },

      /* error: dos notas graves, cortas y suaves. Nunca áspero. */
      error: function () {
        despertar();
        nota(220, 0, 0.10, "sine", 0.30);
        nota(174.61, 0.09, 0.16, "sine", 0.26);
      },

      /* casi: una nota media que se queda colgada, "te faltó poco" */
      casi: function () {
        despertar();
        nota(440, 0, 0.10, "triangle", 0.38);
        nota(523.25, 0.09, 0.18, "triangle", 0.34);
      },

      /* esmeralda que entra */
      moneda: function () {
        despertar();
        nota(987.77, 0, 0.05, "square", 0.28);
        nota(1318.51, 0.05, 0.11, "square", 0.24);
      },

      /* racha: cuanto más larga, más agudo */
      combo: function (n) {
        despertar();
        var base = 523.25 * Math.pow(1.122, Math.min(n, 10));
        nota(base, 0, 0.06, "square", 0.30);
        nota(base * 1.5, 0.06, 0.12, "square", 0.28);
      },

      /* nivel completo: fanfarria corta */
      nivel: function () {
        despertar();
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          nota(f, i * 0.10, 0.22, "triangle", 0.5);
        });
      },

      /* bloque que se rompe */
      bloque: function () {
        despertar();
        barrido(320, 90, 0, 0.16, "square", 0.22);
      },

      /* clic del metrónomo, para el modo a ritmo */
      tic: function (fuerte) {
        despertar();
        nota(fuerte ? 1046.5 : 784, 0, 0.035, "square", fuerte ? 0.22 : 0.13);
      },

      /* palabra que aparece */
      aparece: function () {
        despertar();
        nota(880, 0, 0.04, "sine", 0.18);
      },

      /* cuenta regresiva */
      cuenta: function (ultimo) {
        despertar();
        nota(ultimo ? 880 : 587.33, 0, ultimo ? 0.25 : 0.10, "triangle", 0.4);
      }
    };
    return API;
  })();

  /* ==========================================================================
     PARTÍCULAS — esmeraldas que saltan del elemento que acertaste
     ======================================================================== */

  var Particulas = (function () {
    var capa = null;

    function capaLista() {
      if (capa && document.body.contains(capa)) return capa;
      capa = document.createElement("div");
      capa.className = "capa-particulas";
      capa.setAttribute("aria-hidden", "true");
      document.body.appendChild(capa);
      return capa;
    }

    function reducido() {
      return global.matchMedia &&
             global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    /* estalla desde el centro de `el` */
    function estallar(el, cuantas, color) {
      if (!el || reducido()) return;
      var c = capaLista();
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var n = cuantas || 12;

      for (var i = 0; i < n; i++) {
        (function (i) {
          var p = document.createElement("span");
          p.className = "particula";
          p.style.background = color || "#2ee6a0";
          p.style.left = cx + "px";
          p.style.top = cy + "px";
          var ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
          var vel = 70 + Math.random() * 90;
          var dx = Math.cos(ang) * vel;
          var dy = Math.sin(ang) * vel - 40;   // sesgo hacia arriba
          var giro = (Math.random() - 0.5) * 540;
          c.appendChild(p);
          requestAnimationFrame(function () {
            p.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + giro + "deg) scale(.3)";
            p.style.opacity = "0";
          });
          setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 760);
        })(i);
      }
    }

    /* número flotante: "+3" saliendo del elemento */
    function flotar(el, texto, color) {
      if (!el) return;
      var c = capaLista();
      var r = el.getBoundingClientRect();
      var f = document.createElement("span");
      f.className = "flotante";
      f.textContent = texto;
      if (color) f.style.color = color;
      f.style.left = (r.left + r.width / 2) + "px";
      f.style.top = (r.top + 6) + "px";
      c.appendChild(f);
      requestAnimationFrame(function () {
        f.style.transform = "translate(-50%,-56px)";
        f.style.opacity = "0";
      });
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 900);
    }

    function sacudir(el) {
      if (!el || reducido()) return;
      el.classList.remove("sacude");
      void el.offsetWidth;
      el.classList.add("sacude");
    }

    return { estallar: estallar, flotar: flotar, sacudir: sacudir };
  })();

  /* ==========================================================================
     RACHA — acertar seguido multiplica las esmeraldas
     El multiplicador es lo que convierte una lista de ejercicios en algo que
     da ganas de seguir: la próxima respuesta vale más que la anterior.
     ======================================================================== */

  var Racha = (function () {
    var n = 0, mejor = 0;

    function multiplicador() {
      if (n >= 10) return 4;
      if (n >= 6) return 3;
      if (n >= 3) return 2;
      return 1;
    }
    return {
      acierto: function () { n++; if (n > mejor) mejor = n; return n; },
      fallo: function () { n = 0; },
      valor: function () { return n; },
      mejor: function () { return mejor; },
      multiplicador: multiplicador,
      reiniciar: function () { n = 0; mejor = 0; }
    };
  })();

  /* ==========================================================================
     COMPA — un bloque vivo que mira, festeja y se desanima con él
     Arte original. Sirve para que el fracaso tenga una cara amable en vez de
     una cruz roja.
     ======================================================================== */

  var Compa = {
    animos: ["normal", "feliz", "ups", "fiesta", "pensando"],

    svg: function (animo, tam) {
      tam = tam || 64;
      var cuerpo = "#2ee6a0", oscuro = "#1c9468", ojo = "#101319";
      if (animo === "ups") { cuerpo = "#93a0c8"; oscuro = "#5f6b7c"; }
      if (animo === "fiesta") { cuerpo = "#ffcc4d"; oscuro = "#d9a92e"; }

      var ojos, boca = "";
      if (animo === "feliz" || animo === "fiesta") {
        ojos = '<path d="M6 9 q1.5 -2 3 0" stroke="' + ojo + '" stroke-width="1.4" fill="none"/>' +
               '<path d="M15 9 q1.5 -2 3 0" stroke="' + ojo + '" stroke-width="1.4" fill="none"/>';
        boca = '<path d="M9 13 q3 3 6 0" stroke="' + ojo + '" stroke-width="1.4" fill="none"/>';
      } else if (animo === "ups") {
        ojos = '<rect x="6" y="9" width="3" height="1.6" fill="' + ojo + '"/>' +
               '<rect x="15" y="9" width="3" height="1.6" fill="' + ojo + '"/>';
        boca = '<path d="M9 15 q3 -2.5 6 0" stroke="' + ojo + '" stroke-width="1.4" fill="none"/>';
      } else if (animo === "pensando") {
        ojos = '<rect x="6" y="8" width="3" height="3" fill="' + ojo + '"/>' +
               '<rect x="15" y="9" width="3" height="1.6" fill="' + ojo + '"/>';
        boca = '<rect x="10" y="14" width="4" height="1.4" fill="' + ojo + '"/>';
      } else {
        ojos = '<rect x="6" y="8" width="3" height="3" fill="' + ojo + '"/>' +
               '<rect x="15" y="8" width="3" height="3" fill="' + ojo + '"/>';
        boca = '<rect x="10" y="14" width="4" height="1.4" fill="' + ojo + '"/>';
      }

      var extra = animo === "fiesta"
        ? '<path d="M12 0 L14 4 L10 4 Z" fill="#ff6b5e"/>' : "";

      return '<svg viewBox="0 0 24 24" width="' + tam + '" height="' + tam +
        '" shape-rendering="crispEdges" class="compa compa-' + animo + '" aria-hidden="true">' +
        '<rect x="3" y="4" width="18" height="17" fill="' + cuerpo + '"/>' +
        '<rect x="3" y="18" width="18" height="3" fill="' + oscuro + '"/>' +
        '<rect x="4" y="5" width="4" height="3" fill="rgba(255,255,255,.30)"/>' +
        ojos + boca + extra + '</svg>';
    },

    /* cambia el ánimo de un contenedor y lo devuelve a normal solo */
    reaccionar: function (el, animo, tam, ms) {
      if (!el) return;
      el.innerHTML = Compa.svg(animo, tam || 56);
      clearTimeout(el._t);
      el._t = setTimeout(function () {
        el.innerHTML = Compa.svg("normal", tam || 56);
      }, ms || 1400);
    }
  };

  global.EFECTOS = {
    Sonido: Sonido,
    Particulas: Particulas,
    Racha: Racha,
    Compa: Compa
  };

})(window);
