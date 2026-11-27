// Tests de main.js: arrancan un servidor real en un puerto libre y conectan clientes WebSocket
const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const { startServer } = require('../../main.js');
const { Lobby } = require('../../modules/lobby.js');
const { ProtocolError } = require('../../modules/exceptions.js');
const { FakeWs, silenceConsole } = require('./helpers.js');

silenceConsole();

function connect(port) {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.inbox = [];
    ws.on('message', raw => ws.inbox.push(JSON.parse(raw.toString())));
    return ws;
}

function once(emitter, event) {
    return new Promise(resolve => emitter.once(event, (...args) => resolve(args)));
}

// espera a que se cumpla la condición (o falla tras 2 s)
async function until(condition) {
    const deadline = Date.now() + 2000;
    while (!condition()) {
        if (Date.now() > deadline) throw new Error('timeout');
        await new Promise(r => setTimeout(r, 5));
    }
}

describe('startServer', () => {
    let wss, lobby, port, clients;
    beforeEach(async () => {
        ({ wss, lobby } = startServer(0));
        await once(wss, 'listening');
        port = wss.address().port;
        clients = [];
    });
    afterEach(async () => {
        mock.restoreAll();
        silenceConsole();
        for (const c of clients) c.terminate();
        await new Promise(r => wss.close(r));
    });

    function client() {
        const c = connect(port);
        clients.push(c);
        return c;
    }

    it('devuelve el servidor y un lobby vacío', () => {
        assert.ok(wss instanceof WebSocket.Server);
        assert.ok(lobby instanceof Lobby);
        assert.equal(lobby.peers.size, 0);
    });

    it('añade un peer al lobby por cada conexión, con su IP sin el prefijo ::ffff:', async () => {
        const c = client();
        await once(c, 'open');
        await until(() => lobby.peers.size === 1);
        const [peer] = lobby.peers;
        assert.equal(peer.ipAddress, '127.0.0.1');
        assert.equal(peer.username, null);
    });

    it('enruta los mensajes al dispatcher y responde al cliente', async () => {
        const c = client();
        await once(c, 'open');
        c.send(JSON.stringify({ cmd: 'login', data: { username: 'alice' } }));
        await until(() => c.inbox.length === 1);
        assert.deepEqual(c.inbox[0], { cmd: 'login', success: true, data: { details: 'Anonymous login successful' } });
    });

    it('acepta mensajes binarios', async () => {
        const c = client();
        await once(c, 'open');
        c.send(Buffer.from(JSON.stringify({ cmd: 'login', data: { username: 'alice' } })), { binary: true });
        await until(() => c.inbox.length === 1);
        assert.equal(c.inbox[0].success, true);
    });

    it('elimina el peer del lobby (y de su habitación) cuando se desconecta', async () => {
        const owner = client();
        const guest = client();
        await Promise.all([once(owner, 'open'), once(guest, 'open')]);
        owner.send(JSON.stringify({ cmd: 'login', data: { username: 'alice' } }));
        guest.send(JSON.stringify({ cmd: 'login', data: { username: 'bob' } }));
        await until(() => owner.inbox.length === 1 && guest.inbox.length === 1);
        owner.send(JSON.stringify({ cmd: 'create_and_join_room', data: { room_name: 'room1' } }));
        await until(() => lobby.rooms.size === 1);

        owner.close();
        await until(() => lobby.peers.size === 1);
        assert.equal(lobby.rooms.size, 0);
        assert.equal(lobby.getPeerByUsername('alice'), undefined);
    });

    it('rechaza la conexión con código 4000 si el lobby está lleno', async () => {
        mock.method(lobby, 'addPeer', () => { throw new ProtocolError('Too many peers connected'); });
        const c = client();
        const [code, reason] = await once(c, 'close');
        assert.equal(code, 4000);
        assert.equal(reason.toString(), 'Too many peers connected');
    });

    it('rechaza la conexión con código 1011 ante un error inesperado', async () => {
        mock.method(lobby, 'addPeer', () => { throw new Error('bug'); });
        const c = client();
        const [code, reason] = await once(c, 'close');
        assert.equal(code, 1011);
        assert.equal(reason.toString(), 'Internal server error');
        assert.equal(lobby.peers.size, 0);
    });

    it('rechaza la conexión número 101 con el lobby lleno de verdad', async () => {
        for (let i = 0; i < 100; i++) {
            lobby.addPeer(new FakeWs(), 'ip');
        }
        const c = client();
        const [code] = await once(c, 'close');
        assert.equal(code, 4000);
    });

    it('un error al eliminar el peer no tumba el servidor', async () => {
        const errorSpy = mock.method(console, 'error', () => {});
        mock.method(lobby, 'removePeer', () => { throw new Error('bug'); });
        const c = client();
        await once(c, 'open');
        c.close();
        await until(() => errorSpy.mock.callCount() === 1);

        const other = client();
        await once(other, 'open');
        other.send(JSON.stringify({ cmd: 'login', data: { username: 'bob' } }));
        await until(() => other.inbox.length === 1);
        assert.equal(other.inbox[0].success, true);
    });
});
