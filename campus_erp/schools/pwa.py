"""Install assets for the HTTPS-served Campus ERP PWA.

Never cache authenticated pages or API data: only the static shell and icons may
be cached by the service worker.
"""
import math
import struct
import zlib
from functools import lru_cache
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def manifest(request):
    response = JsonResponse({
        "id": "/", "name": "Campus ERP — School Management", "short_name": "Campus ERP",
        "description": "Multi-school administration for authorised staff and families",
        "start_url": "/", "scope": "/", "display": "standalone",
        "background_color": "#f8fafc", "theme_color": "#274b67",
        "icons": [
            {"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
            {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"},
        ],
    }, content_type="application/manifest+json")
    response["Cache-Control"] = "public, max-age=3600"
    return response

def chunk(code, data):
    return struct.pack(">I", len(data)) + code + data + struct.pack(">I", zlib.crc32(code + data) & 0xFFFFFFFF)

@lru_cache(maxsize=2)
def icon_png(size):
    # Tiny dependency-free PNG renderer: navy square and a white letter C.
    rows = []
    for y in range(size):
        line = bytearray()
        for x in range(size):
            dx = (x - size / 2) / (size / 2)
            dy = (y - size / 2) / (size / 2)
            radius = math.hypot(dx, dy)
            # Broad, recognizable C centred in a generous safe area.
            mark = .36 <= radius <= .63 and not (dx > .15 and abs(dy) < .39)
            line.extend((248, 250, 252, 255) if mark else (39, 75, 103, 255))
        rows.append(b"\x00" + bytes(line))
    header = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return header + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(b"".join(rows), 6)) + chunk(b"IEND", b"")

@require_GET
def icon(request, size):
    if size not in (192, 512):
        return HttpResponse(status=404)
    response = HttpResponse(icon_png(size), content_type="image/png")
    response["Cache-Control"] = "public, max-age=86400"
    return response

@require_GET
def service_worker(request):
    script = r"""
const CACHE = 'campus-erp-static-v1';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Sensitive pages, user sessions, and all /api/ responses are NEVER cached.
  if (!url.pathname.startsWith('/static/') && !url.pathname.startsWith('/icons/')) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req);
    if (hit) return hit;
    const response = await fetch(req);
    if (response.ok) await cache.put(req, response.clone());
    return response;
  }));
});
"""
    response = HttpResponse(script, content_type="application/javascript; charset=utf-8")
    response["Cache-Control"] = "no-store"
    response["Service-Worker-Allowed"] = "/"
    return response
