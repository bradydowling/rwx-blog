"use strict";

// This worker is registered from the game directory, so its scope does not
// alter the Gatsby blog's own offline behavior.
const CACHE = "slimeba-jam-v1";
const ASSETS = [
  "./", "./web/game.js?v=mobile1", "./web/mobile.js?v=mobile1", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png",
  "./assets/duck_quack.wav",
  ...["1f448", "1f449", "1f44d", "1f4aa", "1f590", "1f918", "261d", "270c"]
    .map(code => `./assets/emoji/${code}.png`),
  ...[
    "backboard_1", "backboard_2", "backboard_3", "ball_bounce",
    "bonk_voice_1", "bonk_voice_2", "bonk_voice_3", "bonk_voice_4",
    "rim_hit", "shoe_squeak_1", "shoe_squeak_2", "swish_1", "swish_2",
    "swish_3", "throw_grunt_1", "throw_grunt_2", "throw_grunt_3",
  ].map(name => `./assets/sfx/${name}.wav`),
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("slimeba-jam-") && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== "GET" || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      return await cache.match(request) || (request.mode === "navigate" ? await cache.match("./") : undefined) || Response.error();
    }
  }));
});
