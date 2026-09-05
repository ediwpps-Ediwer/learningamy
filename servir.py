#!/usr/bin/env python3
"""
Servidor local para probar Block Quest en la PC.

Por qué hace falta un servidor y no basta con abrir index.html:
  · El micrófono solo funciona en HTTPS o en localhost. Un archivo abierto
    con doble clic (file://) no califica, y el juego de lectura no anda.
  · El Service Worker (modo sin internet) tampoco se registra desde file://.

localhost SÍ cuenta como contexto seguro, así que acá funciona todo.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading

PUERTO = 8790
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self):
        # sin caché: al recargar siempre se ve el cambio
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, formato, *args):
        if "GET" in (args[0] if args else ""):
            sys.stdout.write("  %s\n" % (args[0],))


def main():
    if not os.path.isdir(RAIZ):
        print("No encuentro la carpeta 'web' junto a este archivo.")
        sys.exit(1)

    socketserver.TCPServer.allow_reuse_address = True
    try:
        servidor = socketserver.TCPServer(("127.0.0.1", PUERTO), Handler)
    except OSError as e:
        print("No se pudo abrir el puerto %d: %s" % (PUERTO, e))
        print("Puede que ya haya otra ventana del juego abierta.")
        sys.exit(1)

    url = "http://localhost:%d/" % PUERTO
    print("")
    print("  BLOCK QUEST")
    print("  " + "-" * 46)
    print("  Abrí esto en Chrome:  " + url)
    print("")
    print("  El micrófono funciona porque es localhost.")
    print("  Para cerrar: Ctrl+C, o cerrá esta ventana.")
    print("")

    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor cerrado.")
        servidor.shutdown()


if __name__ == "__main__":
    main()
