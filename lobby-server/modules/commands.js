const { ProtocolError } = require('./exceptions.js');
const { str } = require('./validation.js');
const { getFirstNonLocalIPAddress } = require('./aux.js');

const MATCH_HOST_PORT = 7000;
const LOOPBACK_ADDRESSES = ['127.0.0.1', '::1', 'localhost'];

// IP a la que deben conectarse los demás jugadores para unirse a la partida del peer. Si el peer está
// en la misma máquina que el servidor de lobbies, su IP vista desde aquí es la de loopback, que no les
// sirve a los jugadores de otras máquinas: en ese caso se usa la IP de la red local de esta máquina.
function matchHostIP(peer) {
    if (LOOPBACK_ADDRESSES.includes(peer.ipAddress)) {
        return getFirstNonLocalIPAddress() ?? peer.ipAddress;
    }
    return peer.ipAddress;
}

// Comandos que pueden enviar los clientes. Cada comando recibe (lobby, peer, data) y devuelve el
// objeto 'data' de la respuesta de éxito; para indicar un error basta con lanzar un ProtocolError.
// Salvo que se indique requiresLogin: false, el dispatcher exige que el peer haya hecho login.
const commands = {
    login: {
        requiresLogin: false,
        run(lobby, peer, data) {
            if (str(data.password) !== '') {
                throw new ProtocolError("Currently only guest login is supported"); // TODO: login de usuarios registrados
            }
            lobby.login(peer, str(data.username));
            return { details: 'Anonymous login successful' };
        }
    },

    create_and_join_room: {
        run(lobby, peer, data) {
            const roomName = str(data.room_name);
            lobby.createRoom(peer, roomName);
            lobby.broadcastLoggedIn('new_room_available', { name: roomName }, peer);
            return { details: 'Room created successfully', room_name: roomName };
        }
    },

    join_room: {
        run(lobby, peer, data) {
            const room = lobby.joinRoom(peer, str(data.name));
            return { details: 'Room joined successfully', room_name: room.name };
        }
    },

    get_rooms: {
        run(lobby) {
            return { rooms: [...lobby.rooms.values()].map(room => room.toJSON()) };
        }
    },

    get_room_details: {
        run(lobby, peer, data) {
            return lobby.getRoom(str(data.room_name)).toJSON();
        }
    },

    leave_current_room: {
        run(lobby, peer) {
            const { room } = lobby.leaveRoom(peer);
            return { name: room.name };
        }
    },

    kick_from_current_room: {
        run(lobby, peer, data) {
            const username = str(data.username);
            const room = lobby.kick(peer, username);
            return { details: `Username "${username}" was kicked from room "${room.name}"` };
        }
    },

    send_message_to_current_room: {
        run(lobby, peer, data) {
            const message = str(data.message);
            if (message === '') {
                throw new ProtocolError("Missing message");
            }
            lobby.roomOf(peer).broadcast('room_message', { from: peer.username, message }, peer);
            return {};
        }
    },

    start_match: {
        run(lobby, peer) {
            const room = lobby.ownedRoomOf(peer);
            room.broadcast('match_started', {
                host_ip: matchHostIP(peer),
                host_port: MATCH_HOST_PORT,
                host_username: room.owner.username
            });
            return {};
        }
    }
};

module.exports = { commands };
