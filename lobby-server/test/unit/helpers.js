// Utilidades compartidas por los tests unitarios.
const { mock } = require('node:test');
const { Lobby } = require('../../modules/lobby.js');

// Sustituto de un WebSocket de la librería 'ws': guarda (ya parseados) los mensajes enviados
class FakeWs {
    constructor() {
        this.OPEN = 1;
        this.CLOSED = 3;
        this.readyState = this.OPEN;
        this.sent = [];
    }
    send(raw) {
        this.sent.push(JSON.parse(raw));
    }
}

// mensajes recibidos por un peer (opcionalmente, solo los de un cmd)
function messages(peer, cmd) {
    return peer.ws.sent.filter(m => cmd === undefined || m.cmd === cmd);
}

// último mensaje recibido por un peer
function lastMessage(peer) {
    return peer.ws.sent.at(-1);
}

function clearMessages(...peers) {
    for (const p of peers) {
        p.ws.sent.length = 0;
    }
}

// crea un peer conectado al lobby (y con login hecho si se indica un nombre de usuario)
function addPeer(lobby, username, ipAddress = '192.168.1.10') {
    const peer = lobby.addPeer(new FakeWs(), ipAddress);
    if (username) {
        lobby.login(peer, username);
    }
    return peer;
}

// crea un lobby con varios peers con login hecho; devuelve { lobby, alice, bob, ... }
function setupLobby(...usernames) {
    const lobby = new Lobby();
    const result = { lobby };
    for (const name of usernames) {
        result[name] = addPeer(lobby, name);
    }
    return result;
}

// silencia el log del servidor durante los tests del fichero que lo llame
function silenceConsole() {
    for (const method of ['log', 'debug', 'error']) {
        mock.method(console, method, () => {});
    }
}

module.exports = { FakeWs, messages, lastMessage, clearMessages, addPeer, setupLobby, silenceConsole };
