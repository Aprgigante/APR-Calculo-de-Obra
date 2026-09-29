const CACHE_NAME = "apr-calculo-obra-v2-auth";

const ARQUIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


self.addEventListener("install", function(event) {

    event.waitUntil(

        caches.open(CACHE_NAME).then(function(cache) {

            return cache.addAll(ARQUIVOS);

        })

    );

});


self.addEventListener("activate", function(event) {

    event.waitUntil(

        caches.keys().then(function(chaves) {

            return Promise.all(

                chaves.map(function(chave) {

                    if (chave !== CACHE_NAME) {

                        return caches.delete(chave);

                    }

                })

            );

        })

    );

});


self.addEventListener("fetch", function(event) {

    event.respondWith(

        caches.match(event.request).then(function(resposta) {

            return resposta || fetch(event.request);

        })

    );

});