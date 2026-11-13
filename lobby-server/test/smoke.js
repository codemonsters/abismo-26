// Test de humo: arranca el servidor en un puerto libre y recorre el flujo completo del protocolo.
// Uso: npm test
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const { startServer } = require('../main.js');

class Client {
    constructor(port) {
        this.ws = new WebSocket(`ws://127.0.0.1:${port}`);
        this.inbox = [];
        this.waiters = [];
        this.ws.on('message', raw => {
            this.inbox.push(JSON.parse(raw.toString()));
            this.waiters.splice(0).forEach(w => w());
        });
    }
    open() { return new Promise(r => this.ws.once('open', r)); }
    send(cmd, data) { this.ws.send(JSON.stringify(data ? { cmd, data } : { cmd })); }
    // espera (y consume) el siguiente mensaje con ese cmd
    async next(cmd) {
        const deadline = Date.now() + 2000;
        while (true) {
            const i = this.inbox.findIndex(m => m.cmd === cmd);
            if (i >= 0) return this.inbox.splice(i, 1)[0];
            if (Date.now() > deadline) throw new Error(`timeout waiting for "${cmd}"; inbox: ${JSON.stringify(this.inbox)}`);
            await new Promise(r => { this.waiters.push(r); setTimeout(r, 50); });
        }
    }
    async request(cmd, data) { this.send(cmd, data); return this.next(cmd); }
    close() { this.ws.close(); return new Promise(r => this.ws.once('close', r)); }
}

async function connect(port) {
    const c = new Client(port);
    await c.open();
    return c;
}

async function main() {
    const { wss } = startServer(0);
    await new Promise(r => wss.once('listening', r));
    const port = wss.address().port;
    console.log = () => {};     // silenciamos el log del servidor
    console.debug = () => {};

    const [alice, bob, carol] = await Promise.all([connect(port), connect(port), connect(port)]);

    // errores genéricos
    let r = await alice.request('get_rooms');
    assert.deepEqual(r, { cmd: 'get_rooms', success: false, data: { details: 'Please login first' } });
    r = await alice.request('foo');
    assert.equal(r.success, false);

    // login
    r = await alice.request('login', { username: 'alice' });
    assert.deepEqual(r, { cmd: 'login', success: true, data: { details: 'Anonymous login successful' } });
    r = await bob.request('login', { username: 'alice' });
    assert.equal(r.data.details, 'Username already taken');
    assert.equal((await bob.request('login', { username: 'bob' })).success, true);
    assert.equal((await carol.request('login', { username: 'carol' })).success, true);

    // create_and_join_room
    r = await alice.request('create_and_join_room', { room_name: 'room1' });
    assert.equal(r.success, true);
    assert.equal(r.data.room_name, 'room1');
    assert.deepEqual((await bob.next('new_room_available')).data, { name: 'room1' });
    assert.deepEqual((await carol.next('new_room_available')).data, { name: 'room1' });

    // join_room
    assert.equal((await bob.request('join_room', { name: 'room1' })).success, true);
    assert.deepEqual((await alice.next('player_joined_current_room')).data, { username: 'bob' });
    assert.equal((await carol.request('join_room', { name: 'room1' })).success, true);
    await alice.next('player_joined_current_room');
    await bob.next('player_joined_current_room');

    r = await bob.request('get_room_details', { room_name: 'room1' });
    assert.deepEqual(r.data, { room_name: 'room1', owner: 'alice', number_of_players: 3, players: ['alice', 'bob', 'carol'] });
    r = await bob.request('get_rooms');
    assert.equal(r.data.rooms.length, 1);

    // send_message_to_current_room
    assert.equal((await bob.request('send_message_to_current_room', { message: 'hola' })).success, true);
    assert.deepEqual((await alice.next('room_message')).data, { from: 'bob', message: 'hola' });
    assert.deepEqual((await carol.next('room_message')).data, { from: 'bob', message: 'hola' });

    // kick_from_current_room
    r = await bob.request('kick_from_current_room', { username: 'carol' });
    assert.equal(r.data.details, 'You are not the room owner');
    assert.equal((await alice.request('kick_from_current_room', { username: 'carol' })).success, true);
    assert.deepEqual((await carol.next('player_kicked_from_current_room')).data, { username: 'carol' });
    await bob.next('player_kicked_from_current_room');
    assert.equal((await carol.request('leave_current_room')).success, false);

    // start_match
    assert.equal((await bob.request('start_match')).success, false);
    assert.equal((await alice.request('start_match')).success, true);
    assert.equal((await alice.next('match_started')).data.host_port, 7000);
    await bob.next('match_started');

    // el propietario se desconecta: la habitación se destruye
    await alice.close();
    assert.deepEqual((await bob.next('room_destroyed')).data, { name: 'room1' });
    assert.deepEqual((await bob.request('get_rooms')).data, { rooms: [] });

    // el nombre de usuario queda libre tras la desconexión
    const alice2 = await connect(port);
    assert.equal((await alice2.request('login', { username: 'alice' })).success, true);

    await Promise.all([bob.close(), carol.close(), alice2.close()]);
    wss.close();
    process.stdout.write('smoke test OK\n');
}

main().catch(err => {
    process.stderr.write(`smoke test FAILED: ${err.stack}\n`);
    process.exit(1);
});
