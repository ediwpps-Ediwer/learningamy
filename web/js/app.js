/* ============================================================================
   APP — pantallas, avatar, diagnóstico, mundos y panel del papá
   ========================================================================== */

(function (global) {
  "use strict";

  var D = global.DATOS, N = global.NUCLEO, J = global.JUEGOS;
  var U = N.Util, Voz = N.Voz, Eco = N.Economia, Pro = N.Progreso, Alm = N.Almacen;

  var app, hud;

  /* ==========================================================================
     HUD — avatar, esmeraldas, racha
     ======================================================================== */

  function pintarHud() {
    var e = Alm.leer();
    hud.innerHTML =
      '<button class="hud-avatar" id="hudAvatar" aria-label="Mi personaje">' +
        N.Avatar.svg(e.jugador.avatar, 26) + '</button>' +
      '<span class="hud-nombre">' + U.esc(e.jugador.nombre || "Player") + '</span>' +
      '<span class="hud-sep"></span>' +
      '<span class="hud-esm" id="hudEsm">' + esmeraldaSvg(16) +
        '<b>' + e.esmeraldas + '</b></span>' +
      (e.racha.dias > 1 ? '<span class="hud-racha">🔥 ' + e.racha.dias + '</span>' : '') +
      '<button class="hud-papa" id="hudPapa" aria-label="Panel de papá">👤</button>';
    var a = document.getElementById("hudAvatar");
    if (a) a.addEventListener("click", function () { irA("casa"); });
    var p = document.getElementById("hudPapa");
    if (p) p.addEventListener("click", pedirPin);
  }

  function esmeraldaSvg(t) {
    return '<svg viewBox="0 0 12 12" width="' + t + '" height="' + t +
      '" shape-rendering="crispEdges" aria-hidden="true">' +
      '<path d="M6 1 L10 5 L6 11 L2 5 Z" fill="#2ee6a0"/>' +
      '<path d="M6 1 L8 5 L6 8 L4 5 Z" fill="#7df5c6"/></svg>';
  }

  N.Bus.en("esmeraldas", function (d) {
    var el = document.getElementById("hudEsm");
    if (!el) return;
    el.querySelector("b").textContent = d.total;
    if (d.ganadas > 0) {
      el.classList.remove("brilla");
      void el.offsetWidth;
      el.classList.add("brilla");
    }
  });

  /* ==========================================================================
     RUTAS
     ======================================================================== */

  var pantallas = {};
  var actual = null;

  function irA(nombre, datos) {
    actual = nombre;
    app.innerHTML = "";
    app.scrollTop = 0;
    pintarHud();
    (pantallas[nombre] || pantallas.casa)(app, datos || {});
  }

  /* ==========================================================================
     BIENVENIDA + AVATAR
     ======================================================================== */

  pantallas.bienvenida = function (el) {
    el.innerHTML =
      '<section class="portada">' +
        '<div class="portada-logo">' + logoSvg() + '</div>' +
        '<h1 class="portada-tit">BLOCK QUEST</h1>' +
        '<p class="portada-sub">Reading &amp; Math</p>' +
        '<div class="portada-acc"></div>' +
      '</section>';
    var acc = el.querySelector(".portada-acc");
    acc.appendChild(J.ui.boton("▶ PLAY", "btn-primario btn-grande", function () {
      Alm.ponerModo("local");
      rutear();
    }));
    acc.appendChild(J.ui.boton("Entrar con cuenta", "btn-fantasma", function () {
      Alm.ponerModo("cuenta");
      irA("entrar");
    }));
    var pie = document.createElement("p");
    pie.className = "nota portada-nota";
    pie.textContent = "Con un solo jugador, PLAY alcanza. Las cuentas hacen falta " +
      "cuando juega más de un chico en el mismo aparato.";
    el.querySelector(".portada").appendChild(pie);
  };

  /* --- entrar con usuario y contraseña ------------------------------------
     Con solo avatares, un chico se mete sin querer en la cuenta de otro y
     arruina los datos de los dos. Por eso: usuario y contraseña de verdad.
     Las cuentas las crea el adulto desde su panel — esa es la autorización. */

  var ERRORES = {
    "datos-incorrectos": "Usuario o contraseña incorrectos.",
    "usuario-invalido": "El usuario va sin espacios ni acentos, de 3 a 20 letras.",
    "usuario-ocupado": "Ese usuario ya existe. Elegí otro.",
    "clave-corta": "La contraseña necesita al menos 6 caracteres.",
    "sin-conexion": "No hay conexión con el servidor.",
    "falta-apagar-confirmacion":
      "Falta apagar la confirmación por correo en Supabase: " +
      "Authentication → Sign In / Providers → Email → Confirm email → OFF."
  };

  pantallas.entrar = function (el) {
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<div class="portada-logo">' + logoSvg() + '</div>' +
        '<h2 class="tit">Log in</h2>' +
        '<p class="sub">Escribí tu usuario y tu contraseña</p>' +
        '<form class="form-login" id="f">' +
          '<div class="campo">' +
            '<label for="u">Username</label>' +
            '<input id="u" class="entrada" autocomplete="username" ' +
              'autocapitalize="none" autocorrect="off" spellcheck="false" ' +
              'maxlength="20" placeholder="gabriel">' +
          '</div>' +
          '<div class="campo">' +
            '<label for="c">Password</label>' +
            '<div class="campo-clave">' +
              '<input id="c" class="entrada" type="password" ' +
                'autocomplete="current-password" maxlength="40">' +
              '<button type="button" class="ver-clave" id="ver">👁</button>' +
            '</div>' +
          '</div>' +
          '<p class="error" id="err" hidden></p>' +
          '<button class="btn btn-primario btn-grande" type="submit" id="go">Enter</button>' +
        '</form>' +
        '<p class="nota">¿No tenés cuenta? La crea papá desde su panel.</p>' +
      '</section>';

    var err = el.querySelector("#err");
    el.querySelector("#ver").addEventListener("click", function () {
      var c = el.querySelector("#c");
      c.type = c.type === "password" ? "text" : "password";
    });

    el.querySelector("#f").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var b = el.querySelector("#go");
      err.hidden = true;
      b.disabled = true; b.textContent = "Entrando…";
      N.Auth.entrar(el.querySelector("#u").value, el.querySelector("#c").value)
        .then(function (r) {
          if (r.ok) {
            Alm.olvidar();
            Alm.adoptarRemoto();
            return rutear();
          }
          err.textContent = ERRORES[r.error] || r.error;
          err.hidden = false;
          b.disabled = false; b.textContent = "Enter";
        });
    });
  };

  pantallas.avatar = function (el, datos) {
    var e = Alm.leer();
    var a = e.jugador.avatar || N.Avatar.porDefecto();

    el.innerHTML =
      '<section class="pantalla">' +
        '<h2 class="tit">Make your character</h2>' +
        '<p class="sub">Armá tu personaje</p>' +
        '<div class="avatar-vista" id="vista"></div>' +
        '<div class="avatar-opts" id="opts"></div>' +
        '<div class="campo">' +
          '<label for="nom">Your name</label>' +
          '<input id="nom" class="entrada" maxlength="14" placeholder="Gabriel" value="' +
            U.esc(e.jugador.nombre || N.Auth.miNombre() || "") + '">' +
        '</div>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';

    var vista = el.querySelector("#vista");
    var opts = el.querySelector("#opts");

    function repintar() { vista.innerHTML = N.Avatar.svg(a, 120); }
    repintar();

    /* Piel y ojos siempre libres: eso es quién es él, no un premio.
       Pelo, ropa y sombreros se desbloquean con esmeraldas — le dan algo que
       comprar YA, sin tener que esperar a que papá apruebe un canje. */
    var LIBRES = { piel: 99, ojos: 99, pelo: 3, ropa: 3, sombrero: 2 };
    var PRECIO = { pelo: 30, ropa: 30, sombrero: 60 };

    function desbloqueados(cual) {
      var e2 = Alm.leer();
      e2.desbloqueado = e2.desbloqueado || {};
      return e2.desbloqueado[cual] || [];
    }
    function tiene(cual, i) {
      return i < LIBRES[cual] || desbloqueados(cual).indexOf(i) >= 0;
    }
    function comprar(cual, i, alHacer) {
      var precio = PRECIO[cual];
      if (!confirm("¿Desbloquear esto por " + precio + " esmeraldas?\n\nTenés " +
                   Eco.total() + ".")) return;
      if (!Eco.gastar(precio)) {
        alert("Te faltan " + (precio - Eco.total()) + " esmeraldas. ¡Seguí jugando!");
        return;
      }
      var e2 = Alm.leer();
      e2.desbloqueado = e2.desbloqueado || {};
      e2.desbloqueado[cual] = (e2.desbloqueado[cual] || []).concat([i]);
      Alm.guardar();
      global.EFECTOS.Sonido.nivel();
      alHacer();
    }

    [["piel", "Skin", N.Avatar.piel],
     ["pelo", "Hair", N.Avatar.pelo],
     ["ojos", "Eyes", N.Avatar.ojos],
     ["ropa", "Shirt", N.Avatar.ropa]].forEach(function (par) {
      var cual = par[0];
      var fila = document.createElement("div");
      fila.className = "opt-fila";
      fila.innerHTML = '<span class="opt-et">' + par[1] + '</span>';
      var caja = document.createElement("div");
      caja.className = "opt-colores";

      function pintarCaja() {
        caja.innerHTML = "";
        par[2].forEach(function (c, i) {
          var libre = tiene(cual, i);
          var b = document.createElement("button");
          b.className = "swatch" + (a[cual] === i ? " sel" : "") + (libre ? "" : " trabado");
          b.style.background = c;
          b.setAttribute("aria-label", par[1] + " " + (i + 1) + (libre ? "" : " · bloqueado"));
          if (!libre) b.innerHTML = '<span class="candado">' + PRECIO[cual] + '</span>';
          b.addEventListener("click", function () {
            if (!tiene(cual, i)) return comprar(cual, i, function () {
              a[cual] = i; pintarCaja(); repintar();
            });
            a[cual] = i;
            caja.querySelectorAll(".swatch").forEach(function (x) { x.classList.remove("sel"); });
            b.classList.add("sel");
            global.EFECTOS.Sonido.tic(true);
            repintar();
          });
          caja.appendChild(b);
        });
      }
      pintarCaja();
      fila.appendChild(caja);
      opts.appendChild(fila);
    });

    // sombrero
    var filaS = document.createElement("div");
    filaS.className = "opt-fila";
    filaS.innerHTML = '<span class="opt-et">Hat</span>';
    var cajaS = document.createElement("div");
    cajaS.className = "opt-colores";
    function pintarSombreros() {
      cajaS.innerHTML = "";
      N.Avatar.sombrero.forEach(function (s, i) {
        var libre = tiene("sombrero", i);
        var b = document.createElement("button");
        b.className = "pastilla" + (a.sombrero === i ? " sel" : "") + (libre ? "" : " trabado");
        b.textContent = s === "ninguno" ? "—" : s;
        if (!libre) b.innerHTML += ' <span class="candado">' + PRECIO.sombrero + '</span>';
        b.addEventListener("click", function () {
          if (!tiene("sombrero", i)) return comprar("sombrero", i, function () {
            a.sombrero = i; pintarSombreros(); repintar();
          });
          a.sombrero = i;
          cajaS.querySelectorAll(".pastilla").forEach(function (x) { x.classList.remove("sel"); });
          b.classList.add("sel");
          global.EFECTOS.Sonido.tic(true);
          repintar();
        });
        cajaS.appendChild(b);
      });
    }
    pintarSombreros();
    filaS.appendChild(cajaS);
    opts.appendChild(filaS);

    el.querySelector("#acc").appendChild(
      J.ui.boton("Ready →", "btn-primario btn-grande", function () {
        var e2 = Alm.leer();
        e2.jugador.avatar = a;
        e2.jugador.nombre = (el.querySelector("#nom").value || "Player").trim();
        if (!e2.jugador.creado) e2.jugador.creado = Date.now();
        Alm.guardar();
        irA(e2.diagnostico.hecho ? "casa" : "introDiag");
      }));
  };

  function logoSvg() {
    return '<svg viewBox="0 0 48 32" width="150" height="100" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="2" y="14" width="44" height="16" fill="#3f8a3f"/>' +
      '<rect x="2" y="12" width="44" height="3" fill="#4fae4f"/>' +
      '<path d="M12 4 L16 8 L12 14 L8 8 Z" fill="#2ee6a0"/>' +
      '<path d="M24 2 L29 8 L24 15 L19 8 Z" fill="#2ee6a0"/>' +
      '<path d="M36 4 L40 8 L36 14 L32 8 Z" fill="#2ee6a0"/>' +
      '<path d="M24 2 L26.5 8 L24 11 L21.5 8 Z" fill="#7df5c6"/></svg>';
  }

  /* ==========================================================================
     DIAGNÓSTICO — 7 pruebas cortas que dicen desde dónde arrancar
     Diseñado sobre los datos reales: no empieza por lo que ya domina.
     ======================================================================== */

  var DIAG = [
    { id: "sight-1", tit: "Palabras conocidas 1", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.SIGHT[1].concat(D.SIGHT[2]), 8), modo: "practica" }; } },
    { id: "sight-2", tit: "Palabras conocidas 2", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.SIGHT[3].concat(D.SIGHT[4]), 8), modo: "practica" }; } },
    { id: "cvc", tit: "Decodificar CVC", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.NONSENSE.cvc, 8), modo: "practica" }; } },
    { id: "cvce", tit: "Decodificar CVCe", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.NONSENSE.cvce, 8), modo: "practica" }; } },
    { id: "spelling", tit: "Escribir palabras", juego: "spelling",
      cfg: function () { return { items: U.tomar(D.MODULO3.spellingSemana, 5) }; } },
    { id: "operaciones", tit: "Sumas y restas", juego: "operaciones",
      cfg: function () { return { items: U.tomar(D.ECUACIONES_CLASE, 6), estrategia: false }; } },
    { id: "graficas", tit: "Leer gráficas", juego: "graficas",
      cfg: function () { return { grafica: D.GRAFICAS[0], cuantas: 4 }; } },
    { id: "formas", tit: "Formas", juego: "formas",
      cfg: function () { return { rondas: 5 }; } }
  ];

  pantallas.introDiag = function (el) {
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<h2 class="tit">Let\'s see what you know</h2>' +
        '<p class="sub">Vamos a ver qué sabés. No es un examen — no se puede perder.</p>' +
        '<ul class="lista-diag">' +
          DIAG.map(function (d, i) {
            return '<li><span class="n">' + (i + 1) + '</span>' + U.esc(d.tit) + '</li>';
          }).join("") +
        '</ul>' +
        '<p class="nota">Podés parar cuando quieras y seguir después.</p>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';
    el.querySelector("#acc").appendChild(
      J.ui.boton("▶ Empezar", "btn-primario btn-grande", function () {
        irA("diag", { paso: 0 });
      }));
    el.querySelector("#acc").appendChild(
      J.ui.boton("Saltar por ahora", "btn-fantasma", function () { irA("casa"); }));
  };

  pantallas.diag = function (el, datos) {
    var paso = datos.paso || 0;
    if (paso >= DIAG.length) return cerrarDiag(el);
    var d = DIAG[paso];

    var barra = document.createElement("div");
    barra.className = "diag-barra";
    barra.innerHTML = '<div class="diag-relleno" style="width:' +
      Math.round(paso / DIAG.length * 100) + '%"></div>' +
      '<span class="diag-txt">' + (paso + 1) + " / " + DIAG.length + " · " + U.esc(d.tit) + '</span>';
    el.appendChild(barra);

    var zona = document.createElement("div");
    el.appendChild(zona);

    J[d.juego].iniciar(zona, d.cfg(), function (res) {
      var e = Alm.leer();
      e.diagnostico.resultados[d.id] = {
        aciertos: res.aciertos, total: res.total,
        pct: res.total ? Math.round(res.aciertos / res.total * 100) : 0,
        cuando: Date.now()
      };
      Alm.guardar();
      irA("diag", { paso: paso + 1 });
    });
  };

  function cerrarDiag(el) {
    var e = Alm.leer();
    e.diagnostico.hecho = true;
    e.diagnostico.fecha = Date.now();
    Alm.guardar();
    Eco.dar(Eco.PAGOS.diagnosticoCompleto, "diagnostico");

    var r = e.diagnostico.resultados;
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<h2 class="tit">¡Listo!</h2>' +
        '<p class="sub">Esto es lo que vimos</p>' +
        '<div class="diag-tabla">' +
          DIAG.map(function (d) {
            var x = r[d.id];
            var pct = x ? x.pct : null;
            var col = pct === null ? "" : pct >= 80 ? "verde" : pct >= 50 ? "amarillo" : "rojo";
            return '<div class="diag-fila">' +
              '<span>' + U.esc(d.tit) + '</span>' +
              '<span class="diag-pct sem-' + col + '">' +
                (pct === null ? "—" : pct + "%") + '</span></div>';
          }).join("") +
        '</div>' +
        '<p class="nota">Papá puede ver el detalle completo en su panel.</p>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';
    el.querySelector("#acc").appendChild(
      J.ui.boton("Ir a jugar →", "btn-primario btn-grande", function () { irA("casa"); }));
  }

  /* ==========================================================================
     RETOS DEL DÍA
     Tres misiones que cambian cada día. Existen por una razón concreta: una
     lista de niveles siempre disponibles no da ningún motivo para abrir el
     juego HOY. Un reto que vence esta noche, sí.
     El progreso se calcula del historial que ya se guarda, no de contadores
     aparte — así nunca se desincroniza de lo que realmente hizo.
     ======================================================================== */

  var Retos = (function () {

    var CATALOGO = [
      { id: "verde10", icono: "🟢", meta: 10, pago: 20,
        tit: "10 palabras en verde",
        sub: "Leelas o escribilas bien a la primera",
        cuenta: function (e) { return semaforosHoy(e, "verde"); } },

      { id: "spell5", icono: "✏️", meta: 5, pago: 25,
        tit: "Escribí 5 palabras",
        sub: "En Spelling, sin usar la ayuda",
        cuenta: function (e) { return semaforosHoy(e, "verde", "encoding"); } },

      { id: "math15", icono: "🔢", meta: 15, pago: 20,
        tit: "15 aciertos en Math",
        sub: "En cualquier juego del mundo azul",
        cuenta: function (e) { return aciertosHoyMundo(e, "math"); } },

      { id: "niveles3", icono: "🏁", meta: 3, pago: 25,
        tit: "Terminá 3 niveles",
        sub: "Los que quieras, de los dos mundos",
        cuenta: function (e) { return sesionesHoy(e).length; } },

      { id: "cuento1", icono: "📖", meta: 1, pago: 20,
        tit: "Leé un cuento entero",
        sub: "Con la ronda Challenger al final",
        cuenta: function (e) {
          return sesionesHoy(e).filter(function (s) {
            return String(s.nivel).indexOf("cuento") === 0;
          }).length;
        } },

      { id: "carrera1", icono: "⚡", meta: 1, pago: 30,
        tit: "Corré un Speed Run",
        sub: "A la velocidad que quieras",
        cuenta: function (e) {
          return sesionesHoy(e).filter(function (s) { return s.nivel === "carrera"; }).length;
        } },

      { id: "sopa1", icono: "🔎", meta: 1, pago: 20,
        tit: "Ganá una sopa de letras",
        sub: "Encontrá todas las palabras",
        cuenta: function (e) {
          return sesionesHoy(e).filter(function (s) {
            return s.nivel === "sopa" && s.aciertos === s.total;
          }).length;
        } },

      { id: "esm50", icono: "💚", meta: 50, pago: 20,
        tit: "Ganá 50 esmeraldas",
        sub: "Sumando de todos los niveles de hoy",
        cuenta: function (e) {
          return sesionesHoy(e).reduce(function (s, x) { return s + (x.esmeraldas || 0); }, 0);
        } }
    ];

    function hoy() { return U.hoy(); }

    function sesionesHoy(e) {
      var h = hoy();
      return (e.sesiones || []).filter(function (s) {
        return new Date(s.t).toISOString().slice(0, 10) === h;
      });
    }

    function aciertosHoyMundo(e, mundo) {
      return sesionesHoy(e).filter(function (s) { return s.mundo === mundo; })
        .reduce(function (n, s) { return n + (s.aciertos || 0); }, 0);
    }

    function semaforosHoy(e, color, destrezaSolo) {
      var h = hoy(), n = 0;
      Object.keys(e.destrezas || {}).forEach(function (k) {
        if (destrezaSolo && k.indexOf(destrezaSolo) !== 0) return;
        (e.destrezas[k].historial || []).forEach(function (x) {
          if (x.semaforo === color &&
              new Date(x.t).toISOString().slice(0, 10) === h) n++;
        });
      });
      return n;
    }

    /* Los tres del día salen de la fecha, no del azar: así no cambian al
       recargar, y no se puede rerollear hasta que salga uno fácil. */
    function delDia() {
      var f = hoy();
      var semilla = 0;
      for (var i = 0; i < f.length; i++) semilla = (semilla * 31 + f.charCodeAt(i)) >>> 0;
      var bolsa = CATALOGO.slice(), elegidos = [];
      for (var k = 0; k < 3 && bolsa.length; k++) {
        semilla = (semilla * 1103515245 + 12345) >>> 0;
        elegidos.push(bolsa.splice(semilla % bolsa.length, 1)[0]);
      }
      return elegidos;
    }

    function estado() {
      var e = Alm.leer();
      if (!e.retos || e.retos.fecha !== hoy()) {
        e.retos = { fecha: hoy(), cobrados: [], cofre: false };
        Alm.guardar();
      }
      return delDia().map(function (r) {
        var hecho = Math.min(r.cuenta(e), r.meta);
        return {
          def: r,
          hecho: hecho,
          completo: hecho >= r.meta,
          cobrado: e.retos.cobrados.indexOf(r.id) >= 0
        };
      });
    }

    function cobrar(id) {
      var e = Alm.leer();
      if (e.retos.cobrados.indexOf(id) >= 0) return 0;
      var r = CATALOGO.filter(function (x) { return x.id === id; })[0];
      if (!r || r.cuenta(e) < r.meta) return 0;
      e.retos.cobrados.push(id);
      Alm.guardar();
      Eco.dar(r.pago, "reto");
      return r.pago;
    }

    function cofreListo() {
      var st = estado();
      var e = Alm.leer();
      return st.every(function (x) { return x.cobrado; }) && !e.retos.cofre;
    }

    function abrirCofre() {
      var e = Alm.leer();
      if (e.retos.cofre) return 0;
      e.retos.cofre = true;
      Alm.guardar();
      var premio = 40 + Math.floor(Math.random() * 40);
      Eco.dar(premio, "cofre");
      return premio;
    }

    return { estado: estado, cobrar: cobrar, cofreListo: cofreListo,
             abrirCofre: abrirCofre };
  })();

  /* dibuja la tarjeta de retos en la pantalla de inicio */
  function pintarRetos(cont) {
    var st = Retos.estado();
    var caja = document.createElement("section");
    caja.className = "retos";
    caja.innerHTML = '<h3 class="retos-tit">Retos de hoy</h3>';

    st.forEach(function (x) {
      var pct = Math.round(x.hecho / x.def.meta * 100);
      var d = document.createElement("div");
      d.className = "reto" + (x.cobrado ? " reto-cobrado" : x.completo ? " reto-listo" : "");
      d.innerHTML =
        '<span class="reto-icono">' + x.def.icono + '</span>' +
        '<span class="reto-txt">' +
          '<b>' + U.esc(x.def.tit) + '</b>' +
          '<em>' + U.esc(x.def.sub) + '</em>' +
          '<span class="reto-barra"><span class="reto-relleno" style="width:' + pct + '%"></span></span>' +
        '</span>' +
        '<span class="reto-der">' +
          (x.cobrado ? '<span class="reto-ok">✓</span>'
                     : '<span class="reto-n">' + x.hecho + '/' + x.def.meta + '</span>') +
        '</span>';

      if (x.completo && !x.cobrado) {
        var b = document.createElement("button");
        b.className = "btn btn-primario reto-btn";
        b.textContent = "+" + x.def.pago;
        b.addEventListener("click", function () {
          var g = Retos.cobrar(x.def.id);
          if (g) {
            global.EFECTOS.Sonido.nivel();
            global.EFECTOS.Particulas.estallar(b, 20);
            global.EFECTOS.Particulas.flotar(b, "+" + g, "#2ee6a0");
          }
          setTimeout(function () { irA("casa"); }, 700);
        });
        d.querySelector(".reto-der").appendChild(b);
      }
      caja.appendChild(d);
    });

    if (Retos.cofreListo()) {
      var cof = document.createElement("button");
      cof.className = "cofre";
      cof.innerHTML = '<span class="cofre-emoji">🎁</span>' +
        '<span>¡Los tres retos hechos!<em>Tocá para abrir el cofre</em></span>';
      cof.addEventListener("click", function () {
        var p = Retos.abrirCofre();
        global.EFECTOS.Sonido.nivel();
        global.EFECTOS.Particulas.estallar(cof, 30, "#ffcc4d");
        global.EFECTOS.Particulas.flotar(cof, "+" + p, "#ffcc4d");
        setTimeout(function () { irA("casa"); }, 900);
      });
      caja.appendChild(cof);
    }

    // van arriba de los mundos: lo primero que ve al abrir es qué hacer hoy
    var mundos = cont.querySelector(".mundos");
    if (mundos) cont.insertBefore(caja, mundos);
    else cont.appendChild(caja);
  }

  /* ==========================================================================
     CASA — elegir mundo
     ======================================================================== */

  pantallas.casa = function (el) {
    var e = Alm.leer();
    Eco.marcarDia();
    el.innerHTML =
      '<section class="pantalla">' +
        '<div class="saludo">' +
          '<div class="saludo-av">' + N.Avatar.svg(e.jugador.avatar, 72) + '</div>' +
          '<div><h2 class="tit-chico">Hi, ' + U.esc(e.jugador.nombre || "Player") + '</h2>' +
          '<p class="sub">Choose your world</p></div>' +
        '</div>' +
        '<div class="mundos">' +
          '<button class="mundo mundo-reading" data-m="reading">' +
            '<span class="mundo-icono">' + iconoLibro() + '</span>' +
            '<span class="mundo-nom">READING</span>' +
            '<span class="mundo-sub">Words · Stories · Spelling</span>' +
          '</button>' +
          '<button class="mundo mundo-math" data-m="math">' +
            '<span class="mundo-icono">' + iconoMate() + '</span>' +
            '<span class="mundo-nom">MATH</span>' +
            '<span class="mundo-sub">Facts · Money · Graphs</span>' +
          '</button>' +
        '</div>' +
        '<button class="tienda-btn" id="btienda">' + esmeraldaSvg(18) +
          ' Prize Shop · ' + e.esmeraldas + '</button>' +
      '</section>';
    pintarRetos(el.querySelector(".pantalla"));
    el.querySelectorAll(".mundo").forEach(function (b) {
      b.addEventListener("click", function () { irA("mundo", { mundo: b.dataset.m }); });
    });
    el.querySelector("#btienda").addEventListener("click", function () { irA("tienda"); });
  };

  function iconoLibro() {
    return '<svg viewBox="0 0 16 16" width="46" height="46" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="2" y="3" width="12" height="10" fill="#ffb03a"/>' +
      '<rect x="7" y="3" width="2" height="10" fill="#e0913a"/>' +
      '<rect x="3" y="5" width="3" height="1" fill="#5a3a22"/>' +
      '<rect x="3" y="7" width="3" height="1" fill="#5a3a22"/>' +
      '<rect x="10" y="5" width="3" height="1" fill="#5a3a22"/>' +
      '<rect x="10" y="7" width="3" height="1" fill="#5a3a22"/></svg>';
  }
  function iconoMate() {
    return '<svg viewBox="0 0 16 16" width="46" height="46" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="2" y="2" width="12" height="12" fill="#6ea8ff"/>' +
      '<rect x="4" y="7" width="4" height="1.5" fill="#12162a"/>' +
      '<rect x="5.25" y="5.75" width="1.5" height="4" fill="#12162a"/>' +
      '<rect x="9" y="7" width="4" height="1.5" fill="#12162a"/></svg>';
  }

  /* ==========================================================================
     MUNDO — lista de niveles
     ======================================================================== */

  /* --- las listas que puede correr en el Speed Run -------------------------
     Todas salen de los papeles que subió el papá. Cada una dice de cuál, para
     que se sepa qué se está practicando y no parezca contenido inventado. */

  function conjuntosDeLectura() {
    var cs = [];

    cs.push({
      id: "vce-semana",
      nombre: "Spelling de la semana",
      fuente: "Newsletter 7–11 sep · patrón vCe",
      items: D.MODULO3.spellingSemana.concat(D.MODULO3.vcePractica)
    });

    cs.push({
      id: "sight-actual",
      nombre: "Sight Words · Módulo " + D.MODULO_ACTUAL,
      fuente: D.MODULO_PATRON[D.MODULO_ACTUAL],
      items: D.SIGHT[D.MODULO_ACTUAL]
    });

    /* los módulos ya vistos, todos juntos: es su repaso acumulado */
    var vistos = [];
    for (var i = 1; i <= D.MODULO_ACTUAL; i++) vistos = vistos.concat(D.SIGHT[i]);
    cs.push({
      id: "sight-vistos",
      nombre: "Sight Words · Módulos 1 a " + D.MODULO_ACTUAL,
      fuente: "Lista oficial 26-27 · " + vistos.length + " palabras",
      items: vistos
    });

    cs.push({
      id: "nonsense-cvc",
      nombre: "Nonsense Words · CVC",
      fuente: "Sus hojas de CVC Nonsense Word Fluency",
      items: D.NONSENSE.cvc
    });

    cs.push({
      id: "nonsense-cvce",
      nombre: "Nonsense Words · CVCe",
      fuente: "Sus hojas de CVC and CVCE Nonsense Word Fluency",
      items: D.NONSENSE.cvce
    });

    /* lo que le viene costando: el conjunto más útil de todos */
    var cuestan = Pro.paraRepasar(60);
    if (cuestan.length >= 8) {
      var mapa = {};
      Object.keys(D.SIGHT).forEach(function (k) {
        D.SIGHT[k].forEach(function (w) { mapa[w.p] = w; });
      });
      D.NONSENSE.cvc.concat(D.NONSENSE.cvce).forEach(function (w) { mapa[w.p] = w; });
      D.MODULO3.spellingSemana.concat(D.MODULO3.vcePractica)
        .forEach(function (w) { mapa[w.p] = w; });
      cs.unshift({
        id: "cuestan",
        nombre: "Lo que le cuesta",
        fuente: cuestan.length + " palabras que salieron amarillas o rojas",
        destacado: true,
        items: cuestan.map(function (p) { return mapa[p] || { p: p }; })
      });
    }
    return cs;
  }

  function nivelesDe(mundo) {
    var e = Alm.leer();
    var repasar = Pro.paraRepasar(8);
    var lista = [];

    if (mundo === "reading") {
      lista.push({
        id: "vce-semana", tit: "Spelling: VCe", sub: "made · safe · time · like",
        etiqueta: "Esta semana en clase", prioridad: true,
        juego: "spelling", cfg: { items: D.MODULO3.spellingSemana }
      });
      lista.push({
        id: "sight-modulo-" + D.MODULO_ACTUAL,
        tit: "Sight Words " + D.MODULO_ACTUAL,
        sub: D.MODULO_PATRON[D.MODULO_ACTUAL],
        etiqueta: "Módulo de ahora",
        juego: "lecturaPalabras",
        cfg: function () {
          return { items: U.tomar(D.SIGHT[D.MODULO_ACTUAL], 10), modo: "practica" };
        }
      });
      lista.push({
        id: "sight-todos", tit: "All Sight Words",
        sub: "Los 12 módulos · " + D.SIGHT_TOTAL + " palabras",
        pantalla: "modulos"
      });
      lista.push({
        id: "carrera", tit: "Speed Run", sub: "Elegí la lista y la velocidad",
        etiqueta: (e.destrezas["record-ppm"] ? "Récord: " + e.destrezas["record-ppm"].mejor + " ppm" : "Nuevo"),
        juego: "lecturaPalabras",
        cfg: function () { return { modo: "carrera", conjuntos: conjuntosDeLectura() }; }
      });
      lista.push({
        id: "sopa", tit: "Word Search", sub: "Encontrá las palabras",
        juego: "sopaLetras",
        cfg: { items: U.tomar(D.MODULO3.vcePractica, 6), lado: 10, diagonales: true }
      });
      D.CUENTOS.forEach(function (c) {
        lista.push({
          id: "cuento-" + c.id, tit: c.titulo, sub: "Cuento + Challenger",
          juego: "cuento", cfg: { cuento: c }
        });
      });
      lista.push({
        id: "cvc-fluidez", tit: "Nonsense Words", sub: "Decodificación pura",
        juego: "lecturaPalabras",
        cfg: { items: U.tomar(D.NONSENSE.cvc, 10), modo: "practica" }
      });
      if (repasar.length >= 4) {
        lista.unshift({
          id: "repaso", tit: "Repaso", sub: repasar.slice(0, 4).join(" · "),
          etiqueta: "Lo que costó", prioridad: true,
          juego: "lecturaPalabras",
          cfg: { items: repasar.map(function (p) { return { p: p }; }), modo: "practica" }
        });
      }
    } else {
      lista.push({
        id: "graficas-semana", tit: "Bar & Picture Graphs", sub: "Leer datos",
        etiqueta: "Esta semana en clase", prioridad: true,
        juego: "graficas", cfg: { cuantas: 5 }
      });
      lista.push({
        id: "ecuaciones", tit: "Equation Cards", sub: "El hueco no siempre va al final",
        juego: "operaciones", cfg: { items: D.ECUACIONES_CLASE.slice() }
      });
      lista.push({
        id: "facts", tit: "Math Facts", sub: "Suma y resta hasta 20",
        juego: "operaciones", cfg: { cuantas: 10, max: 20 }
      });
      lista.push({
        id: "problemas", tit: "Word Problems", sub: "Paso a paso",
        juego: "problemas", cfg: { cuantas: 4 }
      });
      lista.push({
        id: "dinero-id", tit: "Coins & Bills", sub: "¿Cuánto vale?",
        juego: "monedas", cfg: { modo: "identificar", rondas: 6 }
      });
      lista.push({
        id: "dinero-contar", tit: "Count the Money", sub: "Sumá las monedas",
        juego: "monedas", cfg: { modo: "contar", rondas: 6 }
      });
      lista.push({
        id: "tienda-mate", tit: "The Shop", sub: "Comprar y dar vuelto",
        juego: "monedas", cfg: { modo: "tienda", rondas: 6 }
      });
      lista.push({
        id: "formas", tit: "Shapes", sub: "2D y 3D",
        etiqueta: "Lo más flojo en i-Ready", juego: "formas", cfg: { rondas: 8 }
      });
    }
    return lista;
  }

  pantallas.mundo = function (el, datos) {
    var mundo = datos.mundo || "reading";
    var lista = nivelesDe(mundo);
    var e = Alm.leer();

    el.innerHTML =
      '<section class="pantalla mundo-' + mundo + '-tema">' +
        '<button class="volver" id="volver">← Back</button>' +
        '<h2 class="tit">' + (mundo === "reading" ? "READING" : "MATH") + '</h2>' +
        '<div class="niveles" id="niveles"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () { irA("casa"); });

    var cont = el.querySelector("#niveles");
    lista.forEach(function (n) {
      var hechas = (e.destrezas[n.id] || {}).intentos || 0;
      var b = document.createElement("button");
      b.className = "nivel" + (n.prioridad ? " nivel-prio" : "");
      b.innerHTML =
        (n.etiqueta ? '<span class="nivel-tag">' + U.esc(n.etiqueta) + '</span>' : "") +
        '<span class="nivel-tit">' + U.esc(n.tit) + '</span>' +
        '<span class="nivel-sub">' + U.esc(n.sub) + '</span>';
      b.addEventListener("click", function () {
        if (n.pantalla) irA(n.pantalla, { mundo: mundo });
        else irA("jugar", { mundo: mundo, nivel: n });
      });
      cont.appendChild(b);
    });
  };

  /* --- los 12 módulos de sight words --------------------------------------
     360 palabras en total. Cada módulo agrupa un patrón fonético, así que
     elegir uno es elegir qué se practica, no solo qué palabras salen.        */

  pantallas.modulos = function (el, datos) {
    var e = Alm.leer();
    el.innerHTML =
      '<section class="pantalla">' +
        '<button class="volver" id="volver">← Back</button>' +
        '<h2 class="tit">Sight Words</h2>' +
        '<p class="sub">12 módulos · ' + D.SIGHT_TOTAL + ' palabras del año</p>' +
        '<div class="niveles" id="mods"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () {
      irA("mundo", { mundo: datos.mundo || "reading" });
    });

    var cont = el.querySelector("#mods");
    Object.keys(D.SIGHT).forEach(function (k) {
      var mod = parseInt(k, 10);
      var palabras = D.SIGHT[mod];
      // cuántas de este módulo ya domina
      var dom = palabras.filter(function (w) {
        var reg = e.palabras[w.p];
        return reg && reg.verde >= 2 && reg.ultima === "verde";
      }).length;
      var pct = Math.round(dom / palabras.length * 100);

      var b = document.createElement("button");
      b.className = "nivel" + (mod === D.MODULO_ACTUAL ? " nivel-prio" : "");
      b.innerHTML =
        (mod === D.MODULO_ACTUAL ? '<span class="nivel-tag">Módulo de ahora</span>' : "") +
        '<span class="nivel-tit">Module ' + mod + '</span>' +
        '<span class="nivel-sub">' + U.esc(D.MODULO_PATRON[mod] || "") + '</span>' +
        '<span class="mod-barra"><span class="mod-relleno" style="width:' + pct + '%"></span></span>' +
        '<span class="mod-n">' + dom + ' / ' + palabras.length + ' dominadas</span>';
      b.addEventListener("click", function () {
        irA("jugar", { mundo: "reading", nivel: {
          id: "sight-modulo-" + mod,
          tit: "Module " + mod,
          juego: "lecturaPalabras",
          cfg: { items: U.tomar(palabras, 10), modo: "practica" }
        }, volverA: "modulos" });
      });
      cont.appendChild(b);
    });
  };

  pantallas.jugar = function (el, datos) {
    var n = datos.nivel;
    if (!n) return irA("casa");

    // volver a donde se entró: al mundo, o a la lista de módulos
    function volver() {
      if (datos.volverA) irA(datos.volverA, { mundo: datos.mundo });
      else irA("mundo", { mundo: datos.mundo });
    }

    var barra = document.createElement("div");
    barra.className = "juego-barra";
    barra.innerHTML = '<button class="volver" id="salir">← Salir</button>';
    el.appendChild(barra);
    barra.querySelector("#salir").addEventListener("click", function () {
      volver();
    });

    var zona = document.createElement("div");
    el.appendChild(zona);

    var cfg = typeof n.cfg === "function" ? n.cfg() : n.cfg;
    J[n.juego].iniciar(zona, cfg, function (res) {
      Pro.registrar(n.id, res.total ? res.aciertos / res.total >= 0.7 : false,
        { item: n.tit });
      var e = Alm.leer();
      e.sesiones.push({ t: Date.now(), nivel: n.id, mundo: datos.mundo,
        aciertos: res.aciertos, total: res.total, esmeraldas: res.esmeraldas });
      if (e.sesiones.length > 200) e.sesiones.shift();
      Alm.guardar();
      if (Pro.hayFatiga(n.id)) {
        mostrarDescanso(el, function () { irA("mundo", { mundo: datos.mundo }); });
      } else {
        volver();
      }
    });
  };

  function mostrarDescanso(el, listo) {
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<h2 class="tit">Buen trabajo</h2>' +
        '<p class="sub">Ya jugaste bastante. Mañana seguimos y vas a rendir más.</p>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';
    el.querySelector("#acc").appendChild(J.ui.boton("OK", "btn-primario", listo));
  }

  /* ==========================================================================
     TIENDA DE PREMIOS
     ======================================================================== */

  pantallas.tienda = function (el) {
    var e = Alm.leer();
    el.innerHTML =
      '<section class="pantalla">' +
        '<button class="volver" id="volver">← Back</button>' +
        '<h2 class="tit">Prize Shop</h2>' +
        '<p class="sub">Tenés ' + e.esmeraldas + ' esmeraldas</p>' +
        '<div class="premios" id="premios"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () { irA("casa"); });
    var cont = el.querySelector("#premios");

    e.premios.forEach(function (p) {
      var puede = e.esmeraldas >= p.costo;
      var d = document.createElement("div");
      d.className = "premio" + (puede ? " puede" : "");
      d.innerHTML =
        '<span class="premio-emoji">' + (p.emoji || "🎁") + '</span>' +
        '<span class="premio-nom">' + U.esc(p.nombre) + '</span>' +
        '<span class="premio-costo">' + esmeraldaSvg(14) + ' ' + p.costo + '</span>';
      var b = document.createElement("button");
      b.className = "btn " + (puede ? "btn-primario" : "btn-fantasma");
      b.textContent = puede ? "Canjear" : "Faltan " + (p.costo - e.esmeraldas);
      b.disabled = !puede;
      b.addEventListener("click", function () {
        if (!confirm("¿Canjear «" + p.nombre + "» por " + p.costo + " esmeraldas?\n\nPapá tiene que aprobarlo.")) return;
        if (Eco.gastar(p.costo)) {
          var e2 = Alm.leer();
          e2.canjes.push({ t: Date.now(), premio: p.nombre, costo: p.costo, entregado: false });
          Alm.guardar();
          alert("¡Listo! Mostrale esto a papá.");
          irA("tienda");
        }
      });
      d.appendChild(b);
      cont.appendChild(d);
    });
  };

  /* ==========================================================================
     PANEL DEL PAPÁ
     ======================================================================== */

  function pedirPin() {
    // barrera simple: una cuenta que un chico de 7 no resuelve de memoria
    var a = U.entero(11, 19), b = U.entero(11, 19);
    var r = prompt("Panel de papá\n\n¿Cuánto es " + a + " × " + b + "?");
    if (r === null) return;
    if (parseInt(r, 10) === a * b) irA("panel");
    else alert("No es correcto.");
  }

  pantallas.panel = function (el) {
    var e = Alm.leer();
    el.innerHTML =
      '<section class="pantalla panel">' +
        '<button class="volver" id="volver">← Salir del panel</button>' +
        '<h2 class="tit">Panel de papá</h2>' +
        '<nav class="panel-tabs">' +
          '<button data-t="resumen" class="tab activo">Resumen</button>' +
          '<button data-t="destrezas" class="tab">Destrezas</button>' +
          '<button data-t="palabras" class="tab">Palabras</button>' +
          '<button data-t="premios" class="tab">Premios</button>' +
          '<button data-t="jugadores" class="tab">Jugadores</button>' +
          '<button data-t="ajustes" class="tab">Ajustes</button>' +
        '</nav>' +
        '<p class="panel-quien">' + (Alm.esPrueba() ? 'Modo <b>prueba</b>'
          : Alm.modo() === "cuenta" ? 'Sesión de <b>' + U.esc(N.Auth.miNombre() || "—") + '</b>'
          : 'Jugador <b>' + U.esc(Alm.leer().jugador.nombre || "—") + '</b> · sin cuenta') + '</p>' +
        '<div id="panelCuerpo"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () { irA("casa"); });
    var cuerpo = el.querySelector("#panelCuerpo");
    var tabs = el.querySelectorAll(".tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("activo"); });
        t.classList.add("activo");
        pintarTab(t.dataset.t);
      });
    });
    pintarTab("resumen");

    function pintarTab(cual) {
      var e = Alm.leer();
      if (cual === "resumen") return resumen(e);
      if (cual === "destrezas") return destrezas(e);
      if (cual === "palabras") return palabras(e);
      if (cual === "premios") return premios(e);
      if (cual === "jugadores") return jugadores();
      return ajustes(e);
    }

    /* --- cuentas y chicos a cargo ----------------------------------------- */
    function jugadores() {
      if (Alm.esPrueba()) {
        cuerpo.innerHTML = '<p class="nota">Estás en modo prueba, sin cuenta. ' +
          'Salí del modo prueba para administrar jugadores.</p>';
        return;
      }

      /* Sin cuenta: un solo jugador, todo en este aparato. */
      if (Alm.modo() !== "cuenta") {
        cuerpo.innerHTML =
          '<div class="tarjeta"><span class="tarjeta-et">Modo actual</span>' +
          '<span class="tarjeta-v">Un jugador</span>' +
          '<span class="tarjeta-s">sin cuenta · todo en este aparato</span></div>' +
          '<p class="nota">Así está bien mientras juegue Gabriel solo: no hay ' +
          'contraseña que escribir y funciona sin internet.</p>' +
          '<h3 class="panel-h3">¿Cuándo conviene pasar a cuentas?</h3>' +
          '<ul class="lista-simple">' +
            '<li>Cuando juegue más de un chico en el mismo aparato — sin cuentas ' +
            'se mezclan los progresos.</li>' +
            '<li>Cuando quieras seguir el progreso desde otro aparato.</li>' +
          '</ul>' +
          '<p class="nota">Requiere dos pasos en Supabase (crear la tabla y apagar ' +
          'la confirmación por correo). El progreso que ya tenga <b>no se pierde</b>: ' +
          'se sube a la cuenta nueva.</p>' +
          '<div class="acc" id="accModo"></div>';
        cuerpo.querySelector("#accModo").appendChild(
          J.ui.boton("Pasar a cuentas", "btn-suave", function () {
            if (!confirm(
              "Para usar cuentas hacen falta dos pasos en Supabase.\n\n" +
              "Si ya los hiciste, seguí. Si no, el juego no va a poder crear " +
              "cuentas todavía.\n\n¿Seguir?")) return;
            Alm.ponerModo("cuenta");
            irA("entrar");
          }));
        return;
      }

      var codigo = N.Auth.miCodigo();
      cuerpo.innerHTML =
        '<h3 class="panel-h3">Tu código de familia</h3>' +
        '<p class="codigo-familia">' + U.esc(codigo || "—") + '</p>' +
        '<p class="nota">Cuando crees la cuenta de un chico con este código, su ' +
        'progreso te aparece acá abajo. Él no puede ver el tuyo, y vos no podés ' +
        'modificar el suyo — solo leerlo. Eso es a propósito: si el adulto pudiera ' +
        'editar los resultados, los datos dejarían de servir para decidir qué ' +
        'trabajar.</p>' +
        '<h3 class="panel-h3">Crear una cuenta</h3>' +
        '<div class="crear-cuenta">' +
          '<input class="entrada" id="nu" placeholder="usuario (sin espacios)" ' +
            'autocapitalize="none" autocorrect="off" maxlength="20">' +
          '<input class="entrada" id="nn" placeholder="nombre visible" maxlength="14">' +
          '<input class="entrada" id="nc" placeholder="contraseña (6+)" maxlength="40">' +
          '<label class="ajuste"><input type="checkbox" id="nv" checked> ' +
            'Vincular a mi código para poder ver su progreso</label>' +
          '<p class="error" id="nerr" hidden></p>' +
        '</div>' +
        '<div class="acc" id="accCrear"></div>' +
        '<h3 class="panel-h3">Chicos a tu cargo</h3>' +
        '<div id="chicos"><p class="nota">Cargando…</p></div>';

      var nerr = cuerpo.querySelector("#nerr");
      cuerpo.querySelector("#accCrear").appendChild(
        J.ui.boton("Crear cuenta", "btn-primario", function () {
          var b = this;
          var u = cuerpo.querySelector("#nu").value.trim();
          var n = cuerpo.querySelector("#nn").value.trim();
          var c = cuerpo.querySelector("#nc").value;
          var v = cuerpo.querySelector("#nv").checked;
          nerr.hidden = true;

          if (!confirm(
            "Vas a crear la cuenta \"" + u + "\".\n\n" +
            "IMPORTANTE: al crearla, esta sesión pasa a ser la del chico. " +
            "Después vas a tener que volver a entrar con tu usuario.\n\n" +
            "Si el chico no es de tu familia, pedile permiso al padre o madre antes.\n\n" +
            "¿Continuar?")) return;

          b.disabled = true; b.textContent = "Creando…";
          N.Auth.crear(u, c, n || u, v ? codigo : null).then(function (r) {
            if (r.ok) {
              Alm.olvidar();
              alert("Cuenta creada.\n\nUsuario: " + u + "\nContraseña: " + c +
                    "\n\nAnotala. Ahora estás dentro de esa cuenta: armá el avatar " +
                    "y después salí para volver a la tuya.");
              return irA("avatar");
            }
            nerr.textContent = ERRORES[r.error] || r.error;
            nerr.hidden = false;
            b.disabled = false; b.textContent = "Crear cuenta";
          });
        }));

      N.Auth.misChicos().then(function (lista) {
        var cont = cuerpo.querySelector("#chicos");
        if (!cont) return;
        if (!lista.length) {
          cont.innerHTML = '<p class="nota">Todavía no hay ninguno vinculado.</p>';
          return;
        }
        cont.innerHTML = '<div class="jug-lista">' + lista.map(function (x) {
          var d = x.datos || {};
          var pal = d.palabras ? Object.keys(d.palabras).length : 0;
          var dom = d.palabras ? Object.keys(d.palabras).filter(function (p) {
            return d.palabras[p].verde >= 2 && d.palabras[p].ultima === "verde";
          }).length : 0;
          return '<div class="jug">' +
            '<span class="jug-av">' + N.Avatar.svg(d.jugador && d.jugador.avatar, 42) + '</span>' +
            '<span class="jug-info"><b>' + U.esc(x.nombre || x.usuario) + '</b>' +
            '<em>' + (d.esmeraldas || 0) + ' esmeraldas · ' + dom + ' de ' + pal +
            ' palabras dominadas' +
            (x.actualizado ? ' · ' + new Date(x.actualizado).toLocaleDateString() : "") +
            '</em></span></div>';
        }).join("") + '</div>';
      });
    }

    function resumen(e) {
      var hoy = U.hoy();
      var sesHoy = e.sesiones.filter(function (s) {
        return new Date(s.t).toISOString().slice(0, 10) === hoy;
      });
      var diag = e.diagnostico.resultados;
      var trad = e.traduccionesUsadas.slice(-40);

      cuerpo.innerHTML =
        '<div class="tarjetas">' +
          tarjeta("Esmeraldas", e.esmeraldas, "ganadas en total: " + e.esmeraldasGanadasTotal) +
          tarjeta("Racha", e.racha.dias + " días", "último día: " + (e.racha.ultimoDia || "—")) +
          tarjeta("Hoy", sesHoy.length + " niveles",
                  sesHoy.reduce(function (s, x) { return s + (x.esmeraldas || 0); }, 0) + " esmeraldas") +
          tarjeta("Récord lectura",
                  (e.destrezas["record-ppm"] ? e.destrezas["record-ppm"].mejor : "—") + " ppm",
                  "palabras por minuto") +
        '</div>' +
        (e.diagnostico.hecho ?
          '<h3 class="panel-h3">Diagnóstico</h3>' +
          '<div class="diag-tabla">' +
            DIAG.map(function (d) {
              var x = diag[d.id];
              var pct = x ? x.pct : null;
              var col = pct === null ? "" : pct >= 80 ? "verde" : pct >= 50 ? "amarillo" : "rojo";
              return '<div class="diag-fila"><span>' + U.esc(d.tit) + '</span>' +
                '<span class="diag-pct sem-' + col + '">' + (pct === null ? "—" : pct + "%") + '</span></div>';
            }).join("") + '</div>'
          : '<p class="nota">El diagnóstico todavía no se hizo.</p>') +
        '<h3 class="panel-h3">Vocabulario que tuvo que traducir</h3>' +
        (trad.length ?
          '<p class="nota">Estas son las consignas donde tocó el botón ES. Dice qué inglés todavía no tiene.</p>' +
          '<ul class="lista-simple">' + trad.slice(-12).reverse().map(function (t) {
            return '<li>' + U.esc(t.texto.slice(0, 90)) + '</li>';
          }).join("") + '</ul>'
          : '<p class="nota">Todavía no usó la traducción.</p>');
    }

    function tarjeta(t, v, s) {
      return '<div class="tarjeta"><span class="tarjeta-et">' + t + '</span>' +
        '<span class="tarjeta-v">' + v + '</span>' +
        '<span class="tarjeta-s">' + U.esc(s) + '</span></div>';
    }

    function destrezas(e) {
      var ids = Object.keys(e.destrezas).filter(function (k) { return k !== "record-ppm"; });
      if (!ids.length) return cuerpo.innerHTML = '<p class="nota">Todavía no hay datos.</p>';
      ids.sort(function (a, b) {
        var A = Pro.resumenDestreza(a), B = Pro.resumenDestreza(b);
        return (A.pct === null ? 999 : A.pct) - (B.pct === null ? 999 : B.pct);
      });
      cuerpo.innerHTML =
        '<p class="nota">Ordenado de peor a mejor: lo de arriba es donde hay que trabajar.</p>' +
        '<div class="destrezas">' + ids.map(function (id) {
          var r = Pro.resumenDestreza(id);
          var col = r.pct === null ? "" : r.pct >= 80 ? "verde" : r.pct >= 50 ? "amarillo" : "rojo";
          return '<div class="destreza">' +
            '<span class="destreza-id">' + U.esc(id) + '</span>' +
            '<div class="destreza-barra"><div class="destreza-relleno sem-fondo-' + col +
              '" style="width:' + (r.pct || 0) + '%"></div></div>' +
            '<span class="destreza-n">' + (r.pct === null ? "—" : r.pct + "%") +
              ' <em>(' + r.intentos + ')</em></span></div>';
        }).join("") + '</div>';
    }

    function palabras(e) {
      var todas = Object.keys(e.palabras);
      if (!todas.length) return cuerpo.innerHTML = '<p class="nota">Todavía no hay palabras.</p>';
      var dominadas = Pro.dominadas();
      var cuesta = Pro.paraRepasar(30);
      cuerpo.innerHTML =
        '<h3 class="panel-h3">Le cuestan (' + cuesta.length + ')</h3>' +
        '<div class="chips">' + cuesta.map(function (p) {
          var w = e.palabras[p];
          return '<span class="chip chip-' + (w.ultima || "rojo") + '" data-p="' + U.esc(p) + '">' +
            U.esc(p) + '</span>';
        }).join("") + '</div>' +
        '<h3 class="panel-h3">Ya las domina (' + dominadas.length + ')</h3>' +
        '<div class="chips">' + dominadas.map(function (p) {
          return '<span class="chip chip-verde">' + U.esc(p) + '</span>';
        }).join("") + '</div>' +
        '<p class="nota">Tocá una palabra que le costó para corregir el semáforo si vos la escuchaste bien.</p>';
      cuerpo.querySelectorAll(".chips .chip[data-p]").forEach(function (c) {
        c.addEventListener("click", function () {
          if (!confirm('¿Marcar "' + c.dataset.p + '" como bien dicha?')) return;
          Pro.registrarPalabra(c.dataset.p, "verde", null);
          pintarTab("palabras");
        });
      });
    }

    function premios(e) {
      cuerpo.innerHTML =
        '<h3 class="panel-h3">Premios disponibles</h3>' +
        '<div class="premios-edit" id="pe"></div>' +
        '<div class="acc" id="accPremio"></div>' +
        '<h3 class="panel-h3">Canjes pedidos</h3>' +
        (e.canjes.length ?
          '<ul class="lista-simple">' + e.canjes.slice().reverse().map(function (c, i) {
            return '<li>' + new Date(c.t).toLocaleDateString() + ' — ' + U.esc(c.premio) +
              ' (' + c.costo + ') ' + (c.entregado ? "✓ entregado" : "· pendiente") + '</li>';
          }).join("") + '</ul>'
          : '<p class="nota">Ninguno todavía.</p>');

      var pe = cuerpo.querySelector("#pe");
      e.premios.forEach(function (p, i) {
        var d = document.createElement("div");
        d.className = "premio-edit";
        d.innerHTML =
          '<input class="entrada" value="' + U.esc(p.nombre) + '" data-c="nombre">' +
          '<input class="entrada entrada-num" type="number" value="' + p.costo + '" data-c="costo">';
        var bq = document.createElement("button");
        bq.className = "btn btn-fantasma";
        bq.textContent = "Quitar";
        bq.addEventListener("click", function () {
          var e2 = Alm.leer(); e2.premios.splice(i, 1); Alm.guardar(); pintarTab("premios");
        });
        d.appendChild(bq);
        d.querySelectorAll("input").forEach(function (inp) {
          inp.addEventListener("change", function () {
            var e2 = Alm.leer();
            if (inp.dataset.c === "costo") e2.premios[i].costo = parseInt(inp.value, 10) || 0;
            else e2.premios[i].nombre = inp.value;
            Alm.guardar();
          });
        });
        pe.appendChild(d);
      });

      cuerpo.querySelector("#accPremio").appendChild(
        J.ui.boton("+ Agregar premio", "btn-suave", function () {
          var nom = prompt("Nombre del premio:");
          if (!nom) return;
          var c = parseInt(prompt("¿Cuántas esmeraldas cuesta?", "100"), 10);
          if (!c) return;
          var e2 = Alm.leer();
          e2.premios.push({ id: "r" + Date.now(), nombre: nom, costo: c, emoji: "🎁" });
          Alm.guardar(); pintarTab("premios");
        }));
    }

    function ajustes(e) {
      cuerpo.innerHTML =
        '<div class="ajustes">' +
          '<label class="ajuste"><input type="checkbox" id="aVoz"' +
            (e.ajustes.voz ? " checked" : "") + '> Voz encendida</label>' +
          '<label class="ajuste"><input type="checkbox" id="aAdulto"' +
            (e.ajustes.modoAdulto ? " checked" : "") +
            '> Modo adulto: yo marco la pronunciación (más preciso que el micrófono)</label>' +
        '</div>' +
        '<h3 class="panel-h3">Estado técnico</h3>' +
        '<ul class="lista-simple">' +
          '<li>Micrófono: ' + (Voz.hayMicrofono ? "disponible" : "NO disponible") + '</li>' +
          '<li>Voz en inglés: ' + (Voz.hayVozInglesa() ? "sí" : "NO") +
            (Voz.hayVozInglesa() && !Voz.esUS() ? " — <b>no es americana</b>, instalá English (United States)" : "") + '</li>' +
          '<li>Voces: ' + U.esc(Voz.vocesDisponibles().join(", ") || "ninguna") + '</li>' +
          '<li>Sincronización en la nube: ' + (Alm.esPrueba()
            ? "<b>apagada — estás en MODO PRUEBA</b>"
            : Alm.hayNube() ? "activa" : "no configurada") + '</li>' +
        '</ul>' +
        '<h3 class="panel-h3">Datos</h3>' +
        '<div class="acc" id="accDatos"></div>';

      cuerpo.querySelector("#aVoz").addEventListener("change", function () {
        var e2 = Alm.leer(); e2.ajustes.voz = this.checked; Alm.guardar();
      });
      cuerpo.querySelector("#aAdulto").addEventListener("change", function () {
        var e2 = Alm.leer(); e2.ajustes.modoAdulto = this.checked; Alm.guardar();
      });

      var accD = cuerpo.querySelector("#accDatos");
      accD.appendChild(J.ui.boton("Descargar progreso", "btn-suave", function () {
        var blob = new Blob([Alm.exportar()], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "progreso-gabriel-" + U.hoy() + ".json";
        a.click();
      }));
      accD.appendChild(J.ui.boton("Rehacer diagnóstico", "btn-suave", function () {
        if (!confirm("¿Volver a hacer el diagnóstico?")) return;
        var e2 = Alm.leer();
        e2.diagnostico = { hecho: false, fecha: null, resultados: {} };
        Alm.guardar(); irA("introDiag");
      }));
      accD.appendChild(J.ui.boton("Borrar todo", "btn-fantasma", function () {
        if (!confirm("¿Borrar TODO el progreso? No se puede deshacer.")) return;
        Alm.reiniciar(); irA("casa");
      }));
      if (Alm.modo() === "cuenta") {
        accD.appendChild(J.ui.boton("Cerrar sesión", "btn-fantasma", function () {
          if (!confirm("¿Cerrar la sesión y volver a la pantalla de entrada?")) return;
          N.Auth.salir().then(function () {
            Alm.olvidar();
            irA("entrar");
          });
        }));
      }
    }
  };

  /* ==========================================================================
     ARRANQUE
     ======================================================================== */

  /* Aviso permanente de modo prueba. Tiene que ser imposible de confundir:
     si el papá cree que está jugando en serio y no lo está, el diagnóstico
     que yo lea después va a estar vacío y no vamos a entender por qué. */
  function bannerPrueba() {
    var b = document.createElement("div");
    b.className = "banner-prueba";
    b.innerHTML =
      '<span class="bp-tag">MODO PRUEBA</span>' +
      '<span class="bp-txt">Nada de esto se guarda en el progreso de Gabriel</span>';
    var x = document.createElement("button");
    x.className = "bp-btn";
    x.textContent = "Borrar y salir";
    x.addEventListener("click", function () {
      if (!confirm("¿Borrar la partida de prueba y volver al juego real?")) return;
      Alm.borrarPrueba();
      location.href = location.pathname;
    });
    b.appendChild(x);
    document.body.insertBefore(b, document.body.firstChild);
  }

  function arrancar() {
    app = document.getElementById("app");
    hud = document.getElementById("hud");
    if (Alm.esPrueba()) { bannerPrueba(); return rutear(); }

    var m = Alm.modo();
    if (m === "local") return rutear();          // un jugador, sin cuenta
    if (m !== "cuenta") return irA("bienvenida"); // primera vez: que elija

    app.innerHTML = '<p class="cargando">Cargando…</p>';
    N.Auth.restaurar().then(function () {
      if (!N.Auth.haySesion()) return irA("entrar");
      Alm.adoptarRemoto();   // si otro aparato tiene más avance, se toma ese
      rutear();
    });
  }

  /* a dónde va alguien que ya entró */
  function rutear() {
    var e = Alm.leer();
    if (!e.jugador.avatar) irA("avatar");
    else if (!e.diagnostico.hecho) irA("introDiag");
    else irA("casa");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else { arrancar(); }

  global.APP = { irA: function (n, d) { irA(n, d); } };

})(window);
