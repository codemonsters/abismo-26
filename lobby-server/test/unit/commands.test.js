const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const { commands } = require('../../modules/commands.js');
const { ProtocolError } = require('../../modules/exceptions.js');
const { messages, clearMessages, addPeer, setupLobby, silenceConsole } = require('./helpers.js');

silenceConsole();

function assertProtocolError(fn, message) {
    assert.throws(fn, ex => ex instanceof ProtocolError && ex.message === message);
}

function run(cmd, lobby, peer, data = {}) {
    return commands[cmd].run(lobby, peer, data);
}

describe('commands', () => {
    it('solo login se puede usar sin haber hecho login', () => {
        for (const [name, command] of Object.entries(commands)) {
            assert.equal(command.requiresLogin === false, name === 'login', name);
            assert.equal(typeof command.run, 'function', name);
        }
    });

    it('incluye todos los comandos del protocolo', () => {
        assert.deepEqual(Object.keys(commands).sort(), [
            'create_and_join_room', 'get_room_details', 'get_rooms', 'join_room', 'kick_from_current_room',
            'leave_current_room', 'login', 'send_message_to_current_room', 'start_match'
        ]);
    });

    describe('login', () => {
        let lobby, peer;
        beforeEach(() => {
            ({ lobby } = setupLobby());
            peer = addPeer(lobby);
        });

        it('hace login como invitado', () => {
            assert.deepEqual(run('login', lobby, peer, { username: 'alice' }), { details: 'Anonymous login successful' });
            assert.equal(peer.username, 'alice');
        });

        it('acepta una contraseña vacía o que no sea un string', () => {
            assert.doesNotThrow(() => run('login', lobby, peer, { username: 'alice', password: '' }));
            const other = addPeer(lobby);
            assert.doesNotThrow(() => run('login', lobby, other, { username: 'bob', password: 1234 }));
        });

        it('rechaza el login con contraseña (usuarios registrados todavía no soportados)', () => {
            assertProtocolError(() => run('login', lobby, peer, { username: 'alice', password: 'secret' }),
                'Currently only guest login is supported');
            assert.equal(peer.username, null);
        });

        it('rechaza un nombre que solo se diferencia en mayúsculas de uno conectado', () => {
            run('login', lobby, addPeer(lobby), { username: 'Alice' });
            assertProtocolError(() => run('login', lobby, peer, { username: 'alice' }), 'Username already taken');
        });

        it('trata un username que no es string como si faltara', () => {
            assertProtocolError(() => run('login', lobby, peer, {}), 'Missing username');
            assertProtocolError(() => run('login', lobby, peer, { username: 12345 }), 'Missing username');
            assertProtocolError(() => run('login', lobby, peer, { username: ['alice'] }), 'Missing username');
        });
    });

    describe('create_and_join_room', () => {
        let lobby, alice, bob;
        beforeEach(() => ({ lobby, alice, bob } = setupLobby('alice', 'bob')));

        it('crea la habitación y devuelve su nombre', () => {
            assert.deepEqual(run('create_and_join_room', lobby, alice, { room_name: 'room1' }),
                { details: 'Room created successfully', room_name: 'room1' });
            assert.equal(lobby.getRoom('room1').owner, alice);
        });

        it('avisa con new_room_available a los demás peers con login, pero no al creador', () => {
            const anonymous = addPeer(lobby);
            run('create_and_join_room', lobby, alice, { room_name: 'room1' });
            assert.deepEqual(messages(bob, 'new_room_available'), [{ cmd: 'new_room_available', data: { name: 'room1' } }]);
            assert.deepEqual(messages(alice, 'new_room_available'), []);
            assert.deepEqual(messages(anonymous), []);
        });

        it('rechaza un nombre que solo se diferencia en mayúsculas de una habitación existente', () => {
            run('create_and_join_room', lobby, alice, { room_name: 'Room1' });
            assertProtocolError(() => run('create_and_join_room', lobby, bob, { room_name: 'room1' }), 'Room name already taken');
        });

        it('no avisa de nada si la creación falla', () => {
            assertProtocolError(() => run('create_and_join_room', lobby, alice, {}), 'Missing room_name');
            assertProtocolError(() => run('create_and_join_room', lobby, alice, { room_name: 42 }), 'Missing room_name');
            assert.deepEqual(messages(bob), []);
        });
    });

    describe('join_room', () => {
        let lobby, alice, bob;
        beforeEach(() => {
            ({ lobby, alice, bob } = setupLobby('alice', 'bob'));
            lobby.createRoom(alice, 'room1');
        });

        it('une al peer a la habitación indicada en data.name', () => {
            assert.deepEqual(run('join_room', lobby, bob, { name: 'room1' }),
                { details: 'Room joined successfully', room_name: 'room1' });
            assert.equal(bob.room, lobby.getRoom('room1'));
        });

        it('no distingue mayúsculas y minúsculas y devuelve el nombre original', () => {
            assert.deepEqual(run('join_room', lobby, bob, { name: 'ROOM1' }),
                { details: 'Room joined successfully', room_name: 'room1' });
        });

        it('rechaza la petición sin nombre o con uno que no existe', () => {
            assertProtocolError(() => run('join_room', lobby, bob, {}), 'Missing room name');
            assertProtocolError(() => run('join_room', lobby, bob, { room_name: 'room1' }), 'Missing room name');
            assertProtocolError(() => run('join_room', lobby, bob, { name: 'room2' }), 'Room not found');
        });
    });

    describe('get_rooms', () => {
        it('devuelve una lista vacía si no hay habitaciones', () => {
            const { lobby, alice } = setupLobby('alice');
            assert.deepEqual(run('get_rooms', lobby, alice), { rooms: [] });
        });

        it('devuelve todas las habitaciones en orden de creación', () => {
            const { lobby, alice, bob, carol } = setupLobby('alice', 'bob', 'carol');
            lobby.createRoom(alice, 'room1');
            lobby.createRoom(bob, 'room2');
            lobby.joinRoom(carol, 'room2');
            assert.deepEqual(run('get_rooms', lobby, alice), {
                rooms: [
                    { room_name: 'room1', owner: 'alice', number_of_players: 1, players: ['alice'] },
                    { room_name: 'room2', owner: 'bob', number_of_players: 2, players: ['bob', 'carol'] }
                ]
            });
        });
    });

    describe('get_room_details', () => {
        it('devuelve los detalles de la habitación (aunque el peer no esté en ella)', () => {
            const { lobby, alice, bob } = setupLobby('alice', 'bob');
            lobby.createRoom(alice, 'room1');
            assert.deepEqual(run('get_room_details', lobby, bob, { room_name: 'room1' }),
                { room_name: 'room1', owner: 'alice', number_of_players: 1, players: ['alice'] });
        });

        it('no distingue mayúsculas y minúsculas y devuelve el nombre original', () => {
            const { lobby, alice } = setupLobby('alice');
            lobby.createRoom(alice, 'MiSala');
            assert.equal(run('get_room_details', lobby, alice, { room_name: 'misala' }).room_name, 'MiSala');
        });

        it('rechaza habitaciones que no existen', () => {
            const { lobby, alice } = setupLobby('alice');
            assertProtocolError(() => run('get_room_details', lobby, alice, { room_name: 'nope' }), 'Room not found');
            assertProtocolError(() => run('get_room_details', lobby, alice, {}), 'Room not found');
        });
    });

    describe('leave_current_room', () => {
        it('devuelve el nombre de la habitación abandonada', () => {
            const { lobby, alice, bob } = setupLobby('alice', 'bob');
            lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            assert.deepEqual(run('leave_current_room', lobby, bob), { name: 'room1' });
            assert.deepEqual(run('leave_current_room', lobby, alice), { name: 'room1' });
            assert.equal(lobby.rooms.size, 0);
        });

        it('rechaza la petición si el peer no está en una habitación', () => {
            const { lobby, alice } = setupLobby('alice');
            assertProtocolError(() => run('leave_current_room', lobby, alice), 'You are not in a room');
        });
    });

    describe('kick_from_current_room', () => {
        it('expulsa al jugador y lo indica en details', () => {
            const { lobby, alice, bob } = setupLobby('alice', 'bob');
            lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            assert.deepEqual(run('kick_from_current_room', lobby, alice, { username: 'bob' }),
                { details: 'Username "bob" was kicked from room "room1"' });
            assert.equal(bob.room, null);
        });

        it('usa en details el nombre con el que el jugador hizo login', () => {
            const { lobby, alice, Bob } = setupLobby('alice', 'Bob');
            lobby.createRoom(alice, 'room1');
            lobby.joinRoom(Bob, 'room1');
            assert.deepEqual(run('kick_from_current_room', lobby, alice, { username: 'bob' }),
                { details: 'Username "Bob" was kicked from room "room1"' });
        });

        it('trata un username que no es string como vacío', () => {
            const { lobby, alice } = setupLobby('alice');
            lobby.createRoom(alice, 'room1');
            assertProtocolError(() => run('kick_from_current_room', lobby, alice, { username: 7 }), 'Username  is not in room room1');
        });
    });

    describe('send_message_to_current_room', () => {
        let lobby, alice, bob, carol, dave;
        beforeEach(() => {
            ({ lobby, alice, bob, carol, dave } = setupLobby('alice', 'bob', 'carol', 'dave'));
            lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            lobby.joinRoom(carol, 'room1');
            clearMessages(alice, bob, carol, dave);
        });

        it('envía el mensaje al resto de jugadores de la habitación', () => {
            assert.deepEqual(run('send_message_to_current_room', lobby, bob, { message: 'hola' }), {});
            const expected = [{ cmd: 'room_message', data: { from: 'bob', message: 'hola' } }];
            assert.deepEqual(messages(alice), expected);
            assert.deepEqual(messages(carol), expected);
            assert.deepEqual(messages(bob), []);
            assert.deepEqual(messages(dave), []);
        });

        it('rechaza mensajes vacíos o que no son strings', () => {
            assertProtocolError(() => run('send_message_to_current_room', lobby, bob, {}), 'Missing message');
            assertProtocolError(() => run('send_message_to_current_room', lobby, bob, { message: '' }), 'Missing message');
            assertProtocolError(() => run('send_message_to_current_room', lobby, bob, { message: { text: 'hola' } }), 'Missing message');
            assert.deepEqual(messages(alice), []);
        });

        it('rechaza el mensaje si el peer no está en una habitación', () => {
            assertProtocolError(() => run('send_message_to_current_room', lobby, dave, { message: 'hola' }), 'You are not in a room');
        });
    });

    describe('start_match', () => {
        let lobby, alice, bob, carol;
        beforeEach(() => {
            mock.method(os, 'networkInterfaces', () => ({ eth0: [{ family: 'IPv4', address: '192.168.1.50', internal: false }] }));
            ({ lobby } = setupLobby());
            alice = addPeer(lobby, 'alice', '10.0.0.7');
            bob = addPeer(lobby, 'bob');
            carol = addPeer(lobby, 'carol');
            lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            clearMessages(alice, bob, carol);
        });
        afterEach(() => mock.restoreAll());

        it('avisa a todos los jugadores, incluido el propietario, con los datos del host', () => {
            assert.deepEqual(run('start_match', lobby, alice), {});
            const expected = [{ cmd: 'match_started', data: { host_ip: '10.0.0.7', host_port: 7000, host_username: 'alice' } }];
            assert.deepEqual(messages(alice), expected);
            assert.deepEqual(messages(bob), expected);
            assert.deepEqual(messages(carol), []);
        });

        for (const loopback of ['127.0.0.1', '::1', 'localhost']) {
            it(`si el propietario se conecta desde ${loopback}, usa la IP de red local del servidor`, () => {
                alice.ipAddress = loopback;
                run('start_match', lobby, alice);
                assert.equal(messages(bob, 'match_started')[0].data.host_ip, '192.168.1.50');
            });
        }

        it('si el servidor no tiene IP de red local, usa la de loopback', () => {
            mock.method(os, 'networkInterfaces', () => ({}));
            alice.ipAddress = '127.0.0.1';
            run('start_match', lobby, alice);
            assert.equal(messages(bob, 'match_started')[0].data.host_ip, '127.0.0.1');
        });

        it('solo el propietario puede empezar la partida', () => {
            assertProtocolError(() => run('start_match', lobby, bob), 'You are not the room owner');
            assertProtocolError(() => run('start_match', lobby, carol), 'You are not in a room');
            assert.deepEqual(messages(alice), []);
        });
    });
});
