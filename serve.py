#!/usr/bin/env python3
# Dev server Polara — no-cache + multi-thread.
# Kenapa: python -m http.server (default) bikin browser nyimpen CSS/JS lama
# (harus hard-refresh terus) DAN single-thread (gambar gede sering gagal load
# pas banyak request bareng). Server ini kirim header no-store + threaded → tiap
# reload selalu ambil versi terbaru, dan banyak gambar bisa di-load barengan.
#
# Pakai: python serve.py [port]   (default 5510). Stop: Ctrl+C.
import http.server, socketserver, os, sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5510


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, *args):
        pass  # senyap biar terminal bersih


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


with Server(('127.0.0.1', PORT), Handler) as httpd:
    print(f'Polara jalan di  http://localhost:{PORT}   (no-cache · Ctrl+C buat stop)')
    httpd.serve_forever()
