# README

Shooter colaborativo multijugador en línea ambientado en las profundidades del mar.

El repositorio está compuesto por dos proyectos:
* [Cliente](client): Juego hecho con Godot. Usa Rapier para las físicas deterministas y Netfox para la predicción y el rollback.
* [Servidor](server): Hecho con Node.js. Se comunica con los clientes a través de WebSocket y almacena la información en una base de datos SQLite.

## Ideas para el Argumento

🧊 1. La Corriente Congelada

Un fenómeno extraño está enfriando el océano desde las profundidades, provocando que los glaciares se agrieten y el hogar de los pingüinos se desmorone.
Los pingüinos descienden nivel a nivel para encontrar la fuente del frío —un antiguo artefacto polar que ha despertado en el fondo del mar— y detenerlo antes de que congele todo el planeta.

Tema: aventura épica, ecología, misterio polar.

⚡ 2. La Energía del Abismo

Los humanos abandonaron una estación submarina experimental que ahora libera energía tóxica y transforma a las criaturas marinas en monstruos.
Los pingüinos, guardianes naturales del equilibrio polar, bajan al abismo para sellar los reactores y restaurar la armonía del océano.

Tema: tecnología, contaminación, heroísmo animal.

🐧 3. La Tribu del Hielo

Una antigua profecía pingüina dice que “quien descienda al corazón del océano despertará al Guardián del Mar y traerá el equilibrio entre hielo y agua”.
Los pingüinos guerreros deben atravesar las hordas marinas y superar pruebas en cada nivel hasta llegar al corazón del océano, donde aguarda el Guardián.

Tema: mitología, honor, naturaleza mística.

🪸 4. Rescate en el Abismo

Un grupo de pingüinos exploradores fue capturado por una reina medusa que gobierna los mares profundos.
Sus compañeros deben descender nivel a nivel, enfrentando a sus esbirros, para liberar a los prisioneros y escapar antes de que la reina libere su enjambre hacia la superficie.

Tema: acción y rescate, ritmo rápido, motivación emocional.

🌍 5. El Último Hielo

El deshielo global ha hecho que los pingüinos busquen refugio en el fondo del océano, donde creen que existe un “núcleo de hielo eterno”.
Pero cada nivel está custodiado por criaturas que también luchan por sobrevivir. No se trata solo de vencer, sino de decidir si los pingüinos podrán convivir con ellas o conquistarlas.

Tema: supervivencia, dilemas morales, cambio climático.

## Ideas para Nombre del Juego

In Deep (In a dangerous, vulnerable, or troublesome situation or position, especially that which could be beyond one's abilities to resolve)

1. Tono épico y cinematográfico

Abyss Core

Echoes of the Deep

Frozen Descent

Penguins of the Abyss

The Depth Reactor

Cryo Abyss

Tides of the Frozen Core

Project DeepZero

Ideales si el juego tiene una historia profunda o estética tipo metroidvania o aventura narrativa.

🐧 2. Tono de acción y aventura

Deep Dive: Arctic Strike

Penguin Protocol

Operation: Abyss Freeze

Cold Core

Deepfall

Into the Blue Abyss

Reactor Run

Enfocados en dinamismo, progresión por niveles y combate contra hordas.

💡 3. Tono más divertido o accesible (para público general o infantil)

Pingüinos al Abismo

Aventura Submarina Pingüina

Deep Splash!

Los Guardianes del Hielo

Pingu Dive!

Hielo vs Tentáculos

PenguMission: Deep Rescue

Funcionan bien si el juego tiene estilo cartoon, humor o cooperativo.

🌌 4. Tono misterioso o de ciencia ficción

Below the Ice

Cryo Reactor

The Frozen Signal

Depth Code: Polar Zero

Echo Protocol

Under the Frozen Sea

🇪🇸 Nombres cortos en español

Abismo

Profundo

Inmersión

Helio (juego de palabras entre “hielo” y “helium”)

Frialdad

Descenso

Hielo

Polar

Abyssal (forma híbrida que suena internacional)

Núcleo

Gélido

Profundis (latinismo que suena misterioso)

Submar (de “submarino”)

🇬🇧 Nombres cortos en inglés

Abyss

Deepfall

Frostcore

ColdDive

Downfall

SubZero

DeepCore

Below

Frozen

Cryo

Deepend (juego con “deep end”)

Under

Frostline

⚡ 1. Compactos y con sonido moderno

CryoPenguin — directo, simple y reconocible.

CryoWing — alude a las alas del pingüino y su misión.

CryoDive — descenso al frío abismo.

CryoCore — el núcleo helado (puede aludir al reactor).

CryoFall — caída hacia lo congelado; oscuro y elegante.

CryoBorn — “nacido del hielo”, suena épico.

CryoGuard — protector del hielo, heroico.

🧊 2. Con enfoque más temático o narrativo

Cryo Expedition — si los pingüinos son exploradores.

Cryo Protocol — suena a operación secreta o científica.

Cryo Legion — si son varios pingüinos guerreros.

Cryo Descent — descenso al abismo helado.

Cryo Domain — dominio del hielo, sugiere ambientación oscura.

🐧 3. Con guiños más “pingüinos + frío” (más originales o simbólicos)

CryoPuffin — si quieres algo más simpático o sutilmente irónico.

Cryonid — híbrido de “cryo” y “android” o “pinguinoide”, para pingüinos tecnificados.

CryoFlap — referencia a su movimiento característico.

Cryonix — suena misterioso y tecnológico, ideal como nombre de organización o amenaza.

CryoBeak — “pico helado”, oscuro y memorable.

CryoTide — mareas gélidas, si el juego tiene elementos oceánicos fuertes.

💡 Top 5 más potentes (según tono oscuro y evocador):

CryoCore — perfecto si el reactor o energía es central.

CryoDescent — refleja la misión al abismo.

CryoGuard — identidad heroica, sin perder el tono serio.

CryoTide — suena mítico y oceánico.

Cryonix — misterioso, tecnológico y original.

## Git

Normas de estilo para los mensajes de los commits:

* Empezar con mayúscula.
* Estar escrito en modo imperativo (como si dieras una orden).
* No terminar con un punto.
* Claro y conciso. limitarse a un máximo de 50 caracteres.

Mensajes commit de ejemplo:

* Añade paginación a la lista de usuarios
* Corrige el error de validación en el formulario de contacto
* Evita la división por cero en el cálculo de estadísticas
* Resuelve el desbordamiento de texto en la barra lateral
* Impide que usuarios no autenticados vean la página de perfil
* Simplifica la lógica del script 'UserController'
* Extrae el componente 'Avatar' a un archivo independiente
* Renombra la variable 'usr' a 'usuario' para mayor claridad
* Actualiza el README con nuevas instrucciones de instalación
* Corrige erratas en la guía de contribución (CONTRIBUTING.md)
* Elimina el archivo 'user.gd' (ya no se usa)
* Modifica '.gitignore' para que ignore la carpeta '/dist'
