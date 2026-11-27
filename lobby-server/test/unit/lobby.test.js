const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Lobby, Room } = require('../../modules/lobby.js');
const { Peer } = require('../../modules/peer.js');
const { ProtocolError } = require('../../modules/exceptions.js');
const { FakeWs, messages, clearMessages, addPeer, setupLobby, silenceConsole } = require('./helpers.js');

silenceConsole();

const MAX_PEERS = 100;
const MAX_ROOMS = 25;
const MAX_PLAYERS_PER_ROOM = 20;

// comprueba que fn lanza un ProtocolError con ese mensaje
function assertProtocolError(fn, message) {
    assert.throws(fn, ex => ex instanceof ProtocolError && ex.message === message);
}

describe('Room', () => {
    let lobby, alice, bob, carol, room;
    beforeEach(() => {
        ({ lobby, alice, bob, carol } = setupLobby('alice', 'bob', 'carol'));
        room = new Room('room1', alice);
        room.players.add(alice).add(bob).add(carol);
    });

    it('toJSON devuelve el formato del protocolo', () => {
        assert.deepEqual(room.toJSON(), {
            room_name: 'room1',
            owner: 'alice',
            number_of_players: 3,
            players: ['alice', 'bob', 'carol']
        });
    });

    it('JSON.stringify usa toJSON', () => {
        assert.deepEqual(JSON.parse(JSON.stringify(room)), room.toJSON());
    });

    it('broadcast envía la notificación a todos los jugadores', () => {
        room.broadcast('hello', { x: 1 });
        for (const p of [alice, bob, carol]) {
            assert.deepEqual(messages(p), [{ cmd: 'hello', data: { x: 1 } }]);
        }
    });

    it('broadcast no envía la notificación al jugador indicado en except', () => {
        room.broadcast('hello', {}, bob);
        assert.equal(messages(alice).length, 1);
        assert.equal(messages(bob).length, 0);
        assert.equal(messages(carol).length, 1);
    });

    it('broadcast no envía nada a quien no está en la habitación', () => {
        const dave = addPeer(lobby, 'dave');
        room.broadcast('hello', {});
        assert.equal(messages(dave).length, 0);
    });
});

describe('Lobby', () => {
    describe('addPeer', () => {
        it('crea un Peer con un id único y lo añade al lobby', () => {
            const lobby = new Lobby();
            const ws = new FakeWs();
            const peer = lobby.addPeer(ws, '10.0.0.1');
            const other = lobby.addPeer(new FakeWs(), '10.0.0.2');
            assert.ok(peer instanceof Peer);
            assert.equal(peer.ws, ws);
            assert.equal(peer.ipAddress, '10.0.0.1');
            assert.match(peer.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
            assert.notEqual(peer.id, other.id);
            assert.ok(lobby.peers.has(peer));
            assert.equal(lobby.peers.size, 2);
        });

        it(`rechaza más de ${MAX_PEERS} peers`, () => {
            const lobby = new Lobby();
            for (let i = 0; i < MAX_PEERS; i++) {
                lobby.addPeer(new FakeWs(), 'ip');
            }
            assertProtocolError(() => lobby.addPeer(new FakeWs(), 'ip'), 'Too many peers connected');
            assert.equal(lobby.peers.size, MAX_PEERS);
        });

        it('admite un peer nuevo cuando otro se desconecta', () => {
            const lobby = new Lobby();
            const peers = [];
            for (let i = 0; i < MAX_PEERS; i++) {
                peers.push(lobby.addPeer(new FakeWs(), 'ip'));
            }
            lobby.removePeer(peers[0]);
            assert.doesNotThrow(() => lobby.addPeer(new FakeWs(), 'ip'));
        });
    });

    describe('login', () => {
        let lobby, peer;
        beforeEach(() => {
            lobby = new Lobby();
            peer = addPeer(lobby);
        });

        it('asigna el nombre de usuario al peer', () => {
            lobby.login(peer, 'alice');
            assert.equal(peer.username, 'alice');
            assert.equal(lobby.getPeerByUsername('alice'), peer);
        });

        it('rechaza un segundo login', () => {
            lobby.login(peer, 'alice');
            assertProtocolError(() => lobby.login(peer, 'bob'), 'You are already logged in');
            assert.equal(peer.username, 'alice');
        });

        it('rechaza un nombre vacío', () => {
            assertProtocolError(() => lobby.login(peer, ''), 'Missing username');
        });

        it('rechaza nombres con formato no válido', () => {
            for (const name of ['ab', 'a'.repeat(21), 'ali ce', 'alice!', 'josé']) {
                assertProtocolError(() => lobby.login(peer, name), 'Username format not valid');
            }
            assert.equal(peer.username, null);
        });

        it('rechaza nombres reservados, sin distinguir mayúsculas', () => {
            for (const name of ['admin', 'ADMIN', 'Root', 'guest', 'CodeMonsters']) {
                assertProtocolError(() => lobby.login(peer, name), 'Username not allowed');
            }
        });

        it('rechaza nombres ya usados por otro peer', () => {
            lobby.login(addPeer(lobby), 'alice');
            assertProtocolError(() => lobby.login(peer, 'alice'), 'Username already taken');
            assert.equal(peer.username, null);
        });

        it('no distingue mayúsculas y minúsculas al comprobar si el nombre está usado', () => {
            lobby.login(addPeer(lobby), 'Alice');
            for (const name of ['alice', 'ALICE', 'aLiCe', 'Alice']) {
                assertProtocolError(() => lobby.login(peer, name), 'Username already taken');
            }
            lobby.login(addPeer(lobby), 'Ñandu');
            assertProtocolError(() => lobby.login(peer, 'ñANDU'), 'Username already taken');
            assert.equal(peer.username, null);
        });

        it('guarda el nombre tal y como se escribió', () => {
            lobby.login(peer, 'AlIcE');
            assert.equal(peer.username, 'AlIcE');
        });

        it('el nombre queda libre cuando su peer se desconecta', () => {
            const old = addPeer(lobby, 'alice');
            lobby.removePeer(old);
            lobby.login(peer, 'alice');
            assert.equal(peer.username, 'alice');
        });
    });

    describe('getPeerByUsername', () => {
        it('devuelve el peer o undefined', () => {
            const { lobby, alice } = setupLobby('alice');
            addPeer(lobby); // peer sin login
            assert.equal(lobby.getPeerByUsername('alice'), alice);
            assert.equal(lobby.getPeerByUsername('bob'), undefined);
        });

        it('no distingue mayúsculas y minúsculas', () => {
            const { lobby, Alice } = setupLobby('Alice');
            assert.equal(lobby.getPeerByUsername('alice'), Alice);
            assert.equal(lobby.getPeerByUsername('ALICE'), Alice);
        });

        it('no confunde a los peers sin login con un nombre null', () => {
            const lobby = new Lobby();
            addPeer(lobby);
            assert.equal(lobby.getPeerByUsername(undefined), undefined);
        });
    });

    describe('getRoom / roomOf / ownedRoomOf', () => {
        let lobby, alice, bob, carol, room;
        beforeEach(() => {
            ({ lobby, alice, bob, carol } = setupLobby('alice', 'bob', 'carol'));
            room = lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
        });

        it('getRoom devuelve la habitación por su nombre', () => {
            assert.equal(lobby.getRoom('room1'), room);
            assertProtocolError(() => lobby.getRoom('nope'), 'Room not found');
        });

        it('getRoom no distingue mayúsculas y minúsculas', () => {
            assert.equal(lobby.getRoom('ROOM1'), room);
            assert.equal(lobby.getRoom('Room1'), room);
        });

        it('roomOf devuelve la habitación del peer', () => {
            assert.equal(lobby.roomOf(alice), room);
            assert.equal(lobby.roomOf(bob), room);
            assertProtocolError(() => lobby.roomOf(carol), 'You are not in a room');
        });

        it('ownedRoomOf solo devuelve la habitación a su propietario', () => {
            assert.equal(lobby.ownedRoomOf(alice), room);
            assertProtocolError(() => lobby.ownedRoomOf(bob), 'You are not the room owner');
            assertProtocolError(() => lobby.ownedRoomOf(carol), 'You are not in a room');
        });
    });

    describe('createRoom', () => {
        let lobby, alice, bob, anonymous;
        beforeEach(() => {
            ({ lobby, alice, bob } = setupLobby('alice', 'bob'));
            anonymous = addPeer(lobby);
        });

        it('crea la habitación con el creador como propietario y único jugador', () => {
            const room = lobby.createRoom(alice, 'room1');
            assert.ok(room instanceof Room);
            assert.equal(lobby.rooms.get('room1'), room);
            assert.equal(room.owner, alice);
            assert.deepEqual([...room.players], [alice]);
            assert.equal(alice.room, room);
        });

        it('avisa con rooms_changed a todos los peers con login (también al creador)', () => {
            lobby.createRoom(alice, 'room1');
            assert.deepEqual(messages(alice), [{ cmd: 'rooms_changed', data: {} }]);
            assert.deepEqual(messages(bob), [{ cmd: 'rooms_changed', data: {} }]);
            assert.deepEqual(messages(anonymous), []);
        });

        it('rechaza un nombre vacío', () => {
            assertProtocolError(() => lobby.createRoom(alice, ''), 'Missing room_name');
        });

        it('rechaza nombres con formato no válido', () => {
            for (const name of ['ab', 'a'.repeat(21), 'my room', 'room#1']) {
                assertProtocolError(() => lobby.createRoom(alice, name), 'Room name format not allowed');
            }
            assert.equal(lobby.rooms.size, 0);
        });

        it('rechaza crear una habitación estando ya en otra', () => {
            lobby.createRoom(alice, 'room1');
            assertProtocolError(() => lobby.createRoom(alice, 'room2'), 'You are already in a room');
            lobby.joinRoom(bob, 'room1');
            assertProtocolError(() => lobby.createRoom(bob, 'room2'), 'You are already in a room');
            assert.equal(lobby.rooms.size, 1);
        });

        it('rechaza nombres de habitación ya usados', () => {
            lobby.createRoom(alice, 'room1');
            assertProtocolError(() => lobby.createRoom(bob, 'room1'), 'Room name already taken');
            assert.equal(bob.room, null);
        });

        it('no distingue mayúsculas y minúsculas al comprobar si el nombre está usado', () => {
            lobby.createRoom(alice, 'Room1');
            for (const name of ['room1', 'ROOM1', 'rOoM1']) {
                assertProtocolError(() => lobby.createRoom(bob, name), 'Room name already taken');
            }
            assert.equal(lobby.rooms.size, 1);
        });

        it('guarda el nombre tal y como se escribió', () => {
            const room = lobby.createRoom(alice, 'MiSala');
            assert.equal(room.name, 'MiSala');
            assert.equal(room.toJSON().room_name, 'MiSala');
        });

        it(`rechaza más de ${MAX_ROOMS} habitaciones`, () => {
            for (let i = 0; i < MAX_ROOMS; i++) {
                lobby.createRoom(addPeer(lobby, `owner${i}`), `room${i}`);
            }
            assertProtocolError(() => lobby.createRoom(alice, 'onemore'), 'Maximum number of rooms reached');
            assert.equal(alice.room, null);
            assert.equal(lobby.rooms.size, MAX_ROOMS);
        });

        it('no deja estado a medias si la creación falla', () => {
            lobby.createRoom(alice, 'room1');
            clearMessages(alice, bob);
            assert.throws(() => lobby.createRoom(bob, 'room1'));
            assert.deepEqual(messages(alice), []);
            assert.deepEqual(messages(bob), []);
        });
    });

    describe('joinRoom', () => {
        let lobby, alice, bob, carol, anonymous, room;
        beforeEach(() => {
            ({ lobby, alice, bob, carol } = setupLobby('alice', 'bob', 'carol'));
            anonymous = addPeer(lobby);
            room = lobby.createRoom(alice, 'room1');
            clearMessages(alice, bob, carol);
        });

        it('añade al peer a la habitación', () => {
            assert.equal(lobby.joinRoom(bob, 'room1'), room);
            assert.equal(bob.room, room);
            assert.deepEqual([...room.players], [alice, bob]);
        });

        it('avisa a los jugadores que ya estaban, pero no al que entra', () => {
            lobby.joinRoom(bob, 'room1');
            clearMessages(alice, bob);
            lobby.joinRoom(carol, 'room1');
            assert.deepEqual(messages(alice, 'player_joined_current_room'), [{ cmd: 'player_joined_current_room', data: { username: 'carol' } }]);
            assert.deepEqual(messages(bob, 'player_joined_current_room'), [{ cmd: 'player_joined_current_room', data: { username: 'carol' } }]);
            assert.deepEqual(messages(carol, 'player_joined_current_room'), []);
        });

        it('avisa con rooms_changed a todos los peers con login', () => {
            lobby.joinRoom(bob, 'room1');
            for (const p of [alice, bob, carol]) {
                assert.equal(messages(p, 'rooms_changed').length, 1, p.username);
            }
            assert.deepEqual(messages(anonymous), []);
        });

        it('rechaza un nombre vacío', () => {
            assertProtocolError(() => lobby.joinRoom(bob, ''), 'Missing room name');
        });

        it('no distingue mayúsculas y minúsculas', () => {
            assert.equal(lobby.joinRoom(bob, 'ROOM1'), room);
            assert.equal(bob.room, room);
        });

        it('rechaza unirse a una habitación que no existe', () => {
            assertProtocolError(() => lobby.joinRoom(bob, 'nope'), 'Room not found');
            assert.equal(bob.room, null);
        });

        it('rechaza unirse estando ya en una habitación (incluida la misma)', () => {
            lobby.joinRoom(bob, 'room1');
            assertProtocolError(() => lobby.joinRoom(bob, 'room1'), 'You are already in a room');
            assertProtocolError(() => lobby.joinRoom(alice, 'room1'), 'You are already in a room');
            lobby.createRoom(carol, 'room2');
            assertProtocolError(() => lobby.joinRoom(bob, 'room2'), 'You are already in a room');
            assert.equal(room.players.size, 2);
        });

        it(`rechaza unirse a una habitación con ${MAX_PLAYERS_PER_ROOM} jugadores`, () => {
            for (let i = 1; i < MAX_PLAYERS_PER_ROOM; i++) {
                lobby.joinRoom(addPeer(lobby, `player${i}`), 'room1');
            }
            assert.equal(room.players.size, MAX_PLAYERS_PER_ROOM);
            assertProtocolError(() => lobby.joinRoom(bob, 'room1'), 'The room is full');
            assert.equal(bob.room, null);
            assert.equal(room.players.size, MAX_PLAYERS_PER_ROOM);
        });
    });

    describe('leaveRoom', () => {
        let lobby, alice, bob, carol, dave, room;
        beforeEach(() => {
            ({ lobby, alice, bob, carol, dave } = setupLobby('alice', 'bob', 'carol', 'dave'));
            room = lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            lobby.joinRoom(carol, 'room1');
            clearMessages(alice, bob, carol, dave);
        });

        it('rechaza salir si el peer no está en una habitación', () => {
            assertProtocolError(() => lobby.leaveRoom(dave), 'You are not in a room');
        });

        describe('un jugador que no es el propietario', () => {
            it('sale de la habitación, que sigue existiendo', () => {
                const result = lobby.leaveRoom(bob);
                assert.deepEqual(result, { room, destroyed: false });
                assert.equal(bob.room, null);
                assert.deepEqual([...room.players], [alice, carol]);
                assert.equal(lobby.rooms.get('room1'), room);
            });

            it('se avisa al resto con player_left_current_room (reason: left)', () => {
                lobby.leaveRoom(bob);
                const expected = [{ cmd: 'player_left_current_room', data: { username: 'bob', reason: 'left' } }];
                assert.deepEqual(messages(alice, 'player_left_current_room'), expected);
                assert.deepEqual(messages(carol, 'player_left_current_room'), expected);
                assert.deepEqual(messages(bob, 'player_left_current_room'), []);
            });

            it('con disconnected = true la razón es "disconnected"', () => {
                lobby.leaveRoom(bob, true);
                assert.deepEqual(messages(alice, 'player_left_current_room')[0].data, { username: 'bob', reason: 'disconnected' });
            });

            it('avisa con rooms_changed a los demás peers con login, pero no al que sale', () => {
                lobby.leaveRoom(bob);
                for (const p of [alice, carol, dave]) {
                    assert.equal(messages(p, 'rooms_changed').length, 1, p.username);
                }
                assert.deepEqual(messages(bob), []);
            });

            it('puede volver a entrar después', () => {
                lobby.leaveRoom(bob);
                assert.equal(lobby.joinRoom(bob, 'room1'), room);
            });
        });

        describe('el propietario', () => {
            it('destruye la habitación y saca a todos los jugadores', () => {
                const result = lobby.leaveRoom(alice);
                assert.deepEqual(result, { room, destroyed: true });
                assert.equal(lobby.rooms.has('room1'), false);
                for (const p of [alice, bob, carol]) {
                    assert.equal(p.room, null, p.username);
                }
            });

            it('se avisa al resto con room_destroyed (reason: owner_left)', () => {
                lobby.leaveRoom(alice);
                const expected = [{ cmd: 'room_destroyed', data: { name: 'room1', owner: 'alice', reason: 'owner_left' } }];
                assert.deepEqual(messages(bob, 'room_destroyed'), expected);
                assert.deepEqual(messages(carol, 'room_destroyed'), expected);
                assert.deepEqual(messages(alice, 'room_destroyed'), []);
                assert.deepEqual(messages(dave, 'room_destroyed'), []);
            });

            it('con disconnected = true la razón es "owner_disconnected"', () => {
                lobby.leaveRoom(alice, true);
                assert.equal(messages(bob, 'room_destroyed')[0].data.reason, 'owner_disconnected');
            });

            it('avisa con rooms_changed a los demás peers con login, pero no al propietario', () => {
                lobby.leaveRoom(alice);
                for (const p of [bob, carol, dave]) {
                    assert.equal(messages(p, 'rooms_changed').length, 1, p.username);
                }
                assert.deepEqual(messages(alice), []);
            });

            it('el nombre queda libre aunque la habitación se creara con otra capitalización', () => {
                lobby.leaveRoom(alice);
                const recreated = lobby.createRoom(bob, 'ROOM1');
                lobby.createRoom(carol, 'Room2');
                lobby.leaveRoom(carol);
                assert.deepEqual([...lobby.rooms.values()], [recreated]);
                assert.equal(lobby.getRoom('room1').name, 'ROOM1');
            });

            it('el nombre de la habitación queda libre y los jugadores pueden crear o unirse a otras', () => {
                lobby.leaveRoom(alice);
                lobby.createRoom(bob, 'room1');
                assert.doesNotThrow(() => lobby.joinRoom(carol, 'room1'));
                assert.doesNotThrow(() => lobby.createRoom(alice, 'room2'));
            });
        });
    });

    describe('removePeer', () => {
        it('elimina del lobby a un peer sin login', () => {
            const lobby = new Lobby();
            const peer = addPeer(lobby);
            lobby.removePeer(peer);
            assert.equal(lobby.peers.has(peer), false);
        });

        it('si el peer estaba en una habitación, la abandona como desconectado', () => {
            const { lobby, alice, bob } = setupLobby('alice', 'bob');
            const room = lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            clearMessages(alice);
            lobby.removePeer(bob);
            assert.equal(lobby.peers.has(bob), false);
            assert.deepEqual([...room.players], [alice]);
            assert.deepEqual(messages(alice, 'player_left_current_room')[0].data, { username: 'bob', reason: 'disconnected' });
        });

        it('si el peer era propietario, la habitación se destruye', () => {
            const { lobby, alice, bob } = setupLobby('alice', 'bob');
            lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            lobby.removePeer(alice);
            assert.equal(lobby.rooms.size, 0);
            assert.equal(bob.room, null);
            assert.equal(messages(bob, 'room_destroyed')[0].data.reason, 'owner_disconnected');
        });

        it('no envía nada al peer que se desconecta', () => {
            const { lobby, alice, bob } = setupLobby('alice', 'bob');
            lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            clearMessages(alice, bob);
            lobby.removePeer(bob);
            assert.deepEqual(messages(bob), []);
        });
    });

    describe('kick', () => {
        let lobby, alice, bob, carol, dave, room;
        beforeEach(() => {
            ({ lobby, alice, bob, carol, dave } = setupLobby('alice', 'bob', 'carol', 'dave'));
            room = lobby.createRoom(alice, 'room1');
            lobby.joinRoom(bob, 'room1');
            lobby.joinRoom(carol, 'room1');
            clearMessages(alice, bob, carol, dave);
        });

        it('saca al jugador de la habitación', () => {
            assert.deepEqual(lobby.kick(alice, 'bob'), { room, kicked: bob });
            assert.equal(bob.room, null);
            assert.deepEqual([...room.players], [alice, carol]);
            assert.equal(lobby.rooms.get('room1'), room);
        });

        it('avisa al expulsado y al resto de jugadores, pero no al propietario', () => {
            lobby.kick(alice, 'bob');
            const expected = [{ cmd: 'player_kicked_from_current_room', data: { username: 'bob' } }];
            assert.deepEqual(messages(bob, 'player_kicked_from_current_room'), expected);
            assert.deepEqual(messages(carol, 'player_kicked_from_current_room'), expected);
            assert.deepEqual(messages(alice, 'player_kicked_from_current_room'), []);
            assert.deepEqual(messages(dave, 'player_kicked_from_current_room'), []);
        });

        it('avisa con rooms_changed a todos los peers con login', () => {
            lobby.kick(alice, 'bob');
            for (const p of [alice, bob, carol, dave]) {
                assert.equal(messages(p, 'rooms_changed').length, 1, p.username);
            }
        });

        it('el expulsado puede volver a entrar', () => {
            lobby.kick(alice, 'bob');
            assert.equal(lobby.joinRoom(bob, 'room1'), room);
        });

        it('rechaza la expulsión si quien la pide no está en una habitación', () => {
            assertProtocolError(() => lobby.kick(dave, 'bob'), 'You are not in a room');
        });

        it('rechaza la expulsión si quien la pide no es el propietario', () => {
            assertProtocolError(() => lobby.kick(bob, 'carol'), 'You are not the room owner');
            assert.equal(carol.room, room);
        });

        it('el propietario no puede expulsarse a sí mismo', () => {
            assertProtocolError(() => lobby.kick(alice, 'alice'), 'You cannot kick yourself (leave the room instead)');
            assertProtocolError(() => lobby.kick(alice, 'ALICE'), 'You cannot kick yourself (leave the room instead)');
            assert.equal(alice.room, room);
        });

        it('no distingue mayúsculas y minúsculas y notifica el nombre con el que hizo login', () => {
            assert.deepEqual(lobby.kick(alice, 'BoB'), { room, kicked: bob });
            assert.equal(bob.room, null);
            assert.deepEqual(messages(bob, 'player_kicked_from_current_room')[0].data, { username: 'bob' });
            assert.deepEqual(messages(carol, 'player_kicked_from_current_room')[0].data, { username: 'bob' });
        });

        it('rechaza expulsar a alguien que no está en la habitación', () => {
            assertProtocolError(() => lobby.kick(alice, 'dave'), 'Username dave is not in room room1');
            assertProtocolError(() => lobby.kick(alice, 'nobody'), 'Username nobody is not in room room1');
        });

        it('no permite expulsar a jugadores de otra habitación', () => {
            lobby.createRoom(dave, 'room2');
            const eve = addPeer(lobby, 'eve');
            lobby.joinRoom(eve, 'room2');
            assertProtocolError(() => lobby.kick(alice, 'eve'), 'Username eve is not in room room1');
            assert.equal(eve.room, lobby.getRoom('room2'));
        });
    });

    describe('broadcastLoggedIn / notifyRoomsChanged', () => {
        let lobby, alice, bob, anonymous;
        beforeEach(() => {
            ({ lobby, alice, bob } = setupLobby('alice', 'bob'));
            anonymous = addPeer(lobby);
        });

        it('broadcastLoggedIn solo envía a los peers con login', () => {
            lobby.broadcastLoggedIn('hello', { x: 1 });
            assert.deepEqual(messages(alice), [{ cmd: 'hello', data: { x: 1 } }]);
            assert.deepEqual(messages(bob), [{ cmd: 'hello', data: { x: 1 } }]);
            assert.deepEqual(messages(anonymous), []);
        });

        it('broadcastLoggedIn no envía al peer indicado en except', () => {
            lobby.broadcastLoggedIn('hello', {}, alice);
            assert.deepEqual(messages(alice), []);
            assert.equal(messages(bob).length, 1);
        });

        it('notifyRoomsChanged envía rooms_changed', () => {
            lobby.notifyRoomsChanged(bob);
            assert.deepEqual(messages(alice), [{ cmd: 'rooms_changed', data: {} }]);
            assert.deepEqual(messages(bob), []);
        });
    });
});
