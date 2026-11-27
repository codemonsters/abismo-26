# Backend / Servidor del Juego

Enlaces con ejemplos:
* https://dev.to/codesphere/getting-started-with-web-sockets-in-nodejs-49n0
* https://ably.com/blog/web-app-websockets-nodejs

## Preparación del entorno de desarrollo

### Linux y Mac

Desde server/src:

1. Instalar NodeJS y NPM: ``src$ yay -S npm nodejs``
2. Inicializar Node y crear el archivo package.json: ``src$ npm init -y``
3. Instalar las librerías necesarias (ws es una implementación de websocket, nodemon reinicia automáticamente el servidor Node cuando detecta cambios en el código, better-sqlite3 permite trabajar de manera síncrona con bases de datos SQLite3): ``src$ npm install ws nodemon uuid@latest better-sqlite3``

### Windows

Desde server/src en una terminal PowerShell:

1. Instalar fnm (Fast Node Manager): ``src$ winget install Schniz.fnm``
2. Instalar Node.js: ``fnm install 23``
3. Inicializar Node y crear el archivo package.json: ``src$ npm.cmd init -y``
4. Instalar las librerías necesarias: ``src$ npm.cmd install ws nodemon uuid@latest better-sqlite3``

## Ejecutar el servidor

``lobby-server$ npm start`` (o ``node main.js``; el puerto se puede cambiar con la variable de entorno ``PORT``)

Se puede acceder a él desde la URL: ``ws://127.0.0.1:9090``

## Despliegue con Docker Compose en un servidor Arch Linux

El servidor de lobbies se puede ejecutar como un contenedor Docker gestionado con Docker Compose. En nuestro caso se ejecuta en el NAS de la red local (``192.168.0.11``), y los clientes se conectan a ``ws://192.168.0.11:9090``, que es el valor por defecto de ``websocket_url`` en ``client/src/lobbies_server/main.gd``. Para desarrollar en local se puede cambiar a ``ws://127.0.0.1:9090`` desde el inspector de Godot.

Archivos que intervienen:

* ``Dockerfile``: construye la imagen con Node.js 24 e instala solo las dependencias de producción (``npm ci --omit=dev``). Copia ``main.js`` y ``modules/`` y arranca con ``node main.js`` en el puerto ``9090``, sin privilegios (usuario ``node``).
* ``.dockerignore``: evita que ``node_modules``, ``database.sqlite``, los tests y los scripts entren en la imagen.
* ``scripts/github.sh`` y ``scripts/deploy.sh``: actualizan el código desde GitHub y vuelven a desplegar el contenedor (ver más abajo).

### 1. Preparar el servidor Arch Linux (una sola vez)

Instalar Docker, el plugin de Compose y Git:

```sh
sudo pacman -Syu docker docker-compose docker-buildx git
```

Arrancar Docker y hacer que se inicie con el sistema:

```sh
sudo systemctl enable --now docker.service
```

Opcionalmente, para usar ``docker`` sin ``sudo``, añadir el usuario al grupo ``docker`` y volver a iniciar sesión. Ten en cuenta que pertenecer a este grupo equivale a tener permisos de root.

```sh
sudo usermod -aG docker $USER
```

Comprobar que todo funciona:

```sh
docker version
docker compose version
```

### 2. Descargar el código

En la carpeta donde está el ``docker-compose.yaml`` del servidor (si no existe, crea una carpeta para él, por ejemplo ``~/docker``), clonar el repositorio:

```sh
cd ~/docker            # carpeta del docker-compose.yaml
git clone <url-del-repo> abismo-26
```

Los scripts de despliegue suponen esta estructura:

```
~/docker/
├── docker-compose.yaml
└── abismo-26/
    └── lobby-server/
```

### 3. Añadir el servicio al docker-compose.yaml

Añadir dentro de ``services:``. Si el archivo es nuevo, empieza con la línea ``services:``.

```yaml
  abismo-lobby:
    build: ./abismo-26/lobby-server
    container_name: abismo-lobby
    restart: unless-stopped
    environment:
      - PORT=9090
    ports:
      - "9090:9090"
```

* ``restart: unless-stopped`` hace que el contenedor se vuelva a arrancar solo si se cae o si se reinicia el servidor (siempre que ``docker.service`` esté habilitado).
* Para usar otro puerto, cambiar ``PORT`` y la parte derecha de ``ports``. Para publicarlo en otro puerto del host basta con cambiar la parte izquierda, por ejemplo ``"9191:9090"``.
* **No debe ponerse detrás de un proxy inverso (Traefik, Nginx, Caddy...)**: el servidor usa la IP de origen de cada conexión para enviar ``host_ip`` en ``match_started``, y con un proxy todos los clientes tendrían la IP del proxy. Publicando el puerto directamente, Docker conserva la IP real de los clientes de la red local.
* Todavía no hace falta ningún volumen, porque la base de datos SQLite no se usa (ver ``modules/database.js``). Cuando se use, habrá que añadir un volumen para que ``database.sqlite`` no se pierda al recrear el contenedor.

### 4. Arrancar el servidor

```sh
cd ~/docker
docker compose up -d --build abismo-lobby
```

Comprobar que está en marcha:

```sh
docker compose ps abismo-lobby
docker compose logs -f abismo-lobby     # Ctrl+C para salir
```

En el log debe aparecer ``Server listening on IP address ... and port 9090``. La IP de esa línea es la interna del contenedor (172.x.x.x); es normal.

### 5. Firewall

Docker abre por su cuenta los puertos publicados en sus reglas de iptables/nftables, pero si el servidor tiene un firewall activo hay que permitir el puerto 9090 desde la red local:

* ufw: ``sudo ufw allow from 192.168.0.0/24 to any port 9090 proto tcp``
* firewalld: ``sudo firewall-cmd --permanent --add-port=9090/tcp && sudo firewall-cmd --reload``

### 6. Probar la conexión

Desde otro equipo de la red local:

```sh
npx wscat -c ws://192.168.0.11:9090
> {"cmd":"login","data":{"username":"test"}}
< {"cmd":"login","success":true,"data":{"details":"Anonymous login successful"}}
```

En ``docker compose logs abismo-lobby`` la línea ``Peer connected`` debe mostrar la IP real del equipo (``192.168.0.x``). Si muestra una IP ``172.x.x.x``, hay un proxy de por medio o el puerto no está publicado como se indica arriba, y ``host_ip`` llegará mal a los clientes.

### 7. Actualizar a una nueva versión

Desde la carpeta del ``docker-compose.yaml``:

```sh
./abismo-26/lobby-server/scripts/github.sh --pull   # descarga los cambios de GitHub
./abismo-26/lobby-server/scripts/deploy.sh          # reconstruye la imagen y recrea el contenedor
```

* ``github.sh --pull`` hace ``git fetch`` y ``git pull --ff-only`` en la rama actual y muestra los commits descargados. Si hay cambios locales sin commitear, se detiene sin tocar nada. ``github.sh --help`` muestra la ayuda.
* ``deploy.sh`` construye la imagen nueva (si el build falla, el contenedor anterior sigue funcionando), detiene el contenedor, lo vuelve a crear, borra las imágenes antiguas y muestra el estado y las últimas líneas del log. Si el ``docker-compose.yaml`` está en otra carpeta o el servicio tiene otro nombre: ``COMPOSE_DIR=/ruta/al/compose SERVICE=otro-nombre ./abismo-26/lobby-server/scripts/deploy.sh``.

### Comandos útiles

| Acción | Comando |
| --- | --- |
| Ver el log en directo | ``docker compose logs -f abismo-lobby`` |
| Reiniciar | ``docker compose restart abismo-lobby`` |
| Detener | ``docker compose stop abismo-lobby`` |
| Arrancar | ``docker compose start abismo-lobby`` |
| Eliminar el contenedor | ``docker compose rm -sf abismo-lobby`` |
| Abrir una shell dentro | ``docker compose exec abismo-lobby sh`` |

### Problemas habituales

* **``Cannot connect to the Docker daemon``**: Docker no está arrancado (``sudo systemctl start docker``) o el usuario no está en el grupo ``docker`` (usar ``sudo`` o volver a iniciar sesión tras el ``usermod``).
* **``unknown shorthand flag: 'd'`` o ``docker: 'compose' is not a docker command``**: falta el paquete ``docker-compose``.
* **``Bind for 0.0.0.0:9090 failed: port is already allocated``**: otro proceso usa el puerto 9090 (``sudo ss -ltnp | grep 9090``). Hay que pararlo o publicar el servicio en otro puerto.
* **Los clientes no conectan**: comprobar que el contenedor está ``running``, que el firewall permite el puerto y que ``websocket_url`` del cliente apunta a la IP del servidor.

## Tests

Los tests usan el runner integrado de Node (``node:test``), así que no necesitan dependencias adicionales.

* ``lobby-server$ npm test``: ejecuta los tests unitarios y después el test de humo.
* ``lobby-server$ npm run test:unit``: solo los tests unitarios (``test/unit/*.test.js``). Hay un fichero por módulo; ``test/unit/helpers.js`` incluye un ``FakeWs`` que guarda los mensajes enviados a cada peer, para comprobar respuestas y notificaciones sin abrir conexiones reales. ``server.test.js`` sí arranca un servidor real en un puerto libre para probar ``main.js``.
* ``lobby-server$ npm run test:smoke``: test de humo (``test/smoke.js``), que arranca el servidor en un puerto libre y recorre todo el protocolo con varios clientes WebSocket.

Al añadir un comando nuevo a ``modules/commands.js``, añadir también sus tests en ``test/unit/commands.test.js`` (el test que comprueba la lista de comandos fallará hasta hacerlo).

## Organización del código

* ``main.js``: arranca el servidor WebSocket y conecta sus eventos con el lobby y el dispatcher.
* ``modules/lobby.js``: estado del lobby en memoria (peers y habitaciones) y reglas de negocio (clases ``Lobby`` y ``Room``).
* ``modules/commands.js``: tabla con los comandos del protocolo. Cada comando recibe ``(lobby, peer, data)`` y devuelve el ``data`` de la respuesta de éxito, o lanza un ``ProtocolError``.
* ``modules/dispatcher.js``: parsea los mensajes, comprueba que el peer haya hecho login (salvo en ``login``) y envía la respuesta de éxito o de error.
* ``modules/peer.js``: un cliente conectado (``peer.send(cmd, data)`` envía un mensaje).
* ``modules/validation.js``, ``modules/exceptions.js``, ``modules/aux.js``: utilidades.
* ``modules/database.js``: perfiles de usuarios registrados (todavía no se usa).

Para añadir un comando nuevo basta con añadir una entrada en ``modules/commands.js``.

## Protocolo Comunicaciones entre Clientes y Servidor WebSocket

Para comunicarse, los clientes y el servidor intercambian mensajes en formato json con dos atributos:

```json
{
    "cmd": "nombre_del_comando",
    "data": {diccionario_con_argumentos}
}
```

### login

Tras iniciar la conexión del WebSocket, el cliente debe identificarse con el comando "login"

Los nombres de usuario no distinguen mayúsculas y minúsculas: si ``Matador53`` está conectado, nadie puede entrar como ``matador53``. El servidor guarda el nombre tal y como se escribió en el login y es el que reciben los demás jugadores.

Solicitud anónima de ejemplo:

```json
{
    "cmd": "login",
    "data": { "username": "matador53" }
}
```

Solicitud de usuario registrado de ejemplo:
```json
{
    "cmd": "login",
    "data": { "username": "matador53", "password": "0cc175b9c0f1b6a831c399e269772661" }
}
```

Respuesta OK:

```json
{
    "cmd": "login",
    "success": true,
    "data": {}
}
```

Respuesta con error:

```json
{
    "cmd": "login",
    "success": false,
    "data": { "details": "username already taken" }
}
```

### create_and_join_room

Cada cliente identificado pueden crear como máximo una habitación. Tras crearla, el propietario entrará automáticamente en ella.

Los nombres de habitación no distinguen mayúsculas y minúsculas: si existe ``Room1`` no se puede crear ``room1``, y ``join_room`` o ``get_room_details`` con ``ROOM1`` se refieren a ``Room1``. El servidor guarda el nombre tal y como lo escribió quien creó la habitación, y es el que aparece en todas las respuestas y notificaciones.

Solicitud de ejemplo:

```json
{
    "cmd": "create_and_join_room",
    "data": { "room_name": "room1" }
}
```

Respuesta OK:

```json
{
    "cmd": "create_and_join_room",
    "success": true,
    "data": {}
}
```

Respuesta con error:

```json
{
    "cmd": "create_and_join_room",
    "success": false,
    "data": { "details": "room name already used" }
}
```

Inmediatamente después de que un usuario cree una habitación, el servidor envia un mensaje como este al resto de clientes conectados y autentificados (tanto como invitado como con registro) informando sobre la creación de la habitación:

```json
{
    "cmd": "new_room_available",
    "data": { "name": "room1" }
}
```

### rooms_changed

Cada vez que cambia la lista de habitaciones o los jugadores de alguna de ellas (se crea o destruye una habitación, o un jugador entra, sale, es expulsado o se desconecta), el servidor envía esta notificación a todos los clientes que hayan hecho login, para que vuelvan a pedir la lista con ``get_rooms`` si la están mostrando:

```json
{
    "cmd": "rooms_changed",
    "data": {}
}
```

### join_room

Los clientes que previamente hayan hecho login y que no sean propietarios de una habitación, pueden entrar en otra habitación

Solicitud de ejemplo:

```json
{
    "cmd": "join_room",
    "data": { "name": "room1" }
}
```

Respuesta OK:

```json
{
    "cmd": "join_room",
    "success": true,
    "data": {}
}
```

Respuesta con error:

```json
{
    "cmd": "join_room",
    "success": false,
    "data": { "details": "The room is full" }
}
```

Inmediatamente después de que un jugador entre en una habitación, el servidor envía un mensaje como este al resto de los jugadores de la misma habitación:

```json
{
    "cmd": "player_joined_current_room",
    "data": { "username": "matador53" }
}
```

### get_rooms

Solicita al servidor una lista con información sobre todas las habitaciones actuales.

Solicitud de ejemplo:

```json
{
    "cmd": "get_rooms"
}
```

Respuesta OK:

```json
{
    "cmd": "get_rooms",
    "success": true,
    "data": {
        "rooms":
            [
                {
                    "room_name": "room1",
                    "owner": "matador53",
                    "number_of_players": 3,
                    "players": ["matador53", "player1", "player2"]
                },
                {
                    "room_name": "test_room",
                    "owner": "player43",
                    "number_of_players": 1,
                    "players": ["player43"]
                }
            ]
        }
}
```

TODO: Añadir la siguiente información sobre cada habitación: "map": "map1", "mode": "classic", "playing": false, "owner_ip": "192.168.0.1", "owner_port": "7000"

Respuesta con error:

```json
{
    "cmd": "get_rooms",
    "success": false,
    "data": { "details": "Please login first" }
}
```

### leave_current_room

Los jugadores que estén en una habitación pueden abandonarla enviando este mensaje. Si quien abandona es el propietario, la habitación será eliminada (ver más abajo).

Solicitud de ejemplo:

```json
{
    "cmd": "leave_current_room"
}
```

Respuesta OK:

```json
{
    "cmd": "leave_current_room",
    "success": true,
    "data": { "name": "room1" }
}
```

Respuesta con error:

```json
{
    "cmd": "leave_current_room",
    "success": false,
    "data": { "details": "You are not in a room" }
}
```

Si quien abandona la habitación no es su propietario, el resto de jugadores de la habitación recibirán este mensaje:

```json
{
    "cmd": "player_left_current_room",
    "data": { "username": "matador53", "reason": "left" }
}
```

Si quien abandona la habitación es su propietario, esta será destruida, echando a todos los jugadores que estén en ella. Además, cada uno de los demás jugadores recibirán el siguiente menaje:

```json
{
    "cmd": "room_destroyed",
    "data": { "name": "room1", "owner": "player43", "reason": "owner_left" }
}
```

Lo mismo ocurre cuando un jugador se desconecta del servidor (cerrando el juego o por un problema de red) estando en una habitación: en ese caso ``reason`` vale ``"disconnected"`` en ``player_left_current_room`` y ``"owner_disconnected"`` en ``room_destroyed``.

### get_room_details

Los usuarios logeados pueden solicita al servidor detalles sobre el estado actual de cualquier habitación.

Solicitud de ejemplo:

```json
{
    "cmd": "get_room_details",
    "data": {"room_name": "room1"}
}
```

Respuesta OK:

```json
{
    "cmd": "get_room_details",
    "success": true,
    "data": {
        "room_name": "room1",
        "owner": "player43",
        "number_of_players": 2,
        "players": [
            "matador53",
            "matador54"
        ]
    }
}
```

TODO: Añadir los siguientes datos a la información de cada habituación: "map": "map1", "mode": "infection", "playing": true, "owner_ip": "192.168.0.2", "owner_port": "7000"

Respuesta con error:

```json
{
    "cmd": "get_room_details",
    "success": false,
    "data": { "details": "Room not found" }
}
```

### kick_from_current_room

El propietario de una habitación puede echar a un jugador de ella. El nombre no distingue mayúsculas y minúsculas; en las notificaciones se usa el nombre con el que el jugador hizo login.

Solicitud de ejemplo:

```json
{
    "cmd": "kick_from_current_room",
    "data": { "username": "matador53" }
}
```

Respuesta OK:

```json
{
    "cmd": "kick_from_current_room",
    "success": true,
    "data": {}
}
```

Respuesta con error:

```json
{
    "cmd": "kick_from_current_room",
    "success": false,
    "data": { "details": "You are not the room owner" }
}
```

Si un jugador es echado de una habitación, tanto el jugador que fue echado como los demás jugadores de la habitación recibirán  un mensaje como este:

```json
{
    "cmd": "player_kicked_from_current_room",
    "data": { "username": "matador53" }
}
```

### send_message_to_current_room

Envía un mensaje de texto que recibirán el resto de jugadores de la misma habitación.

Solicitud de ejemplo:

```json
{
    "cmd": "send_message_to_current_room",
    "data": { "message": "Hello world!" }
}
```

Respuesta OK:

```json
{
    "cmd": "send_message_to_current_room",
    "success": true,
    "data": {}
}
```

Respuesta con error:

```json
{
    "cmd": "send_message_to_current_room",
    "success": false,
    "data": { "details": "You are not in a room" }
}
```

Tras el envío de un mensaje, el resto de los jugadores de la habitación recibirán un mensaje como este:

```json
{
    "cmd": "room_message",
    "data": { "from": "matador53", "message": "Hello world!" }
}
```

### start_match

El propietario de una habitación debe enviar este mensaje al servidor en el momento que quiera que el juego comience.

Solicitud de ejemplo:

```json
{
    "cmd": "start_match"
}
```

Respuesta OK:

```json
{
    "cmd": "start_match",
    "success": true,
    "data": {}
}
```

Respuesta con error:

```json
{
    "cmd": "start_match",
    "success": false,
    "data": { "details": "You are not the room owner" }
}
```

Antes de que el servidor envíe la anterior respuesta, cada uno de los jugadores de la habitación recibirá un mensaje como el siguiente, en el cual se incluye la ip y el puerto al que tendrán que conectarse para unirse a la partida:

```json
{
    "cmd": "match_started",
    "data": { "host_ip": "192.168.0.1", "host_port": 7000, "host_username": "matador53" }
}
```

``host_username`` es el nombre del propietario de la habitación, que es quien actúa como servidor de la partida: el cliente cuyo nombre coincida debe crear el servidor (escuchando en ``host_port``) y el resto conectarse a ``host_ip:host_port``. Si el propietario está conectado desde la misma máquina que el servidor de lobbies (IP de loopback), ``host_ip`` será la IP de red local de esa máquina.
