const { v4: uuidv4 } = require('uuid');
const { Peer } = require('./peer.js');
const { ProtocolError } = require('./exceptions.js');
const { RESERVED_USERNAMES, isValidName } = require('./validation.js');

const MAX_PEERS = 100;
const MAX_ROOMS = 25;
const MAX_PLAYERS_PER_ROOM = 20;

class Room {
    constructor(name, owner) {
        this.name = name;
        this.owner = owner;
        this.players = new Set();
    }

    toJSON() {
        return {
            room_name: this.name,
            owner: this.owner.username,
            number_of_players: this.players.size,
            players: [...this.players].map(p => p.username)
        };
    }

    // envía una notificación a todos los jugadores de la habitación (salvo a 'except')
    broadcast(cmd, data, except) {
        for (const p of this.players) {
            if (p !== except) {
                p.send(cmd, data);
            }
        }
    }
}

// Estado del lobby (peers conectados y habitaciones) y reglas de negocio. Todo vive en memoria.
// Los métodos lanzan ProtocolError cuando la petición no es válida.
class Lobby {
    constructor() {
        this.peers = new Set();
        this.rooms = new Map();     // nombre -> Room
    }

    addPeer(ws, ipAddress) {
        if (this.peers.size >= MAX_PEERS) {
            throw new ProtocolError("Too many peers connected");
        }
        const peer = new Peer(uuidv4(), ws, ipAddress);
        this.peers.add(peer);
        return peer;
    }

    // si el peer estaba en una habitación la abandona (y si era su propietario, la habitación se destruye)
    removePeer(peer) {
        if (peer.room) {
            this.leaveRoom(peer);
        }
        this.peers.delete(peer);
    }

    getPeerByUsername(username) {
        for (const p of this.peers) {
            if (p.username === username) {
                return p;
            }
        }
        return undefined;
    }

    login(peer, username) {
        if (peer.username) {
            throw new ProtocolError("You are already logged in");
        }
        if (username === '') {
            throw new ProtocolError("Missing username");
        }
        if (!isValidName(username)) {
            throw new ProtocolError("Username format not valid");
        }
        if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
            throw new ProtocolError("Username not allowed");
        }
        if (this.getPeerByUsername(username)) {
            throw new ProtocolError("Username already taken");
        }
        peer.username = username;
    }

    getRoom(name) {
        const room = this.rooms.get(name);
        if (!room) {
            throw new ProtocolError("Room not found");
        }
        return room;
    }

    // habitación en la que está el peer
    roomOf(peer) {
        if (!peer.room) {
            throw new ProtocolError("You are not in a room");
        }
        return peer.room;
    }

    // habitación de la que el peer es propietario
    ownedRoomOf(peer) {
        const room = this.roomOf(peer);
        if (room.owner !== peer) {
            throw new ProtocolError("You are not the room owner");
        }
        return room;
    }

    createRoom(owner, name) {
        if (name === '') {
            throw new ProtocolError("Missing room_name");
        }
        if (!isValidName(name)) {
            throw new ProtocolError("Room name format not allowed");
        }
        if (owner.room) {
            throw new ProtocolError("You are already in a room");
        }
        if (this.rooms.has(name)) {
            throw new ProtocolError("Room name already taken");
        }
        if (this.rooms.size >= MAX_ROOMS) {
            throw new ProtocolError("Maximum number of rooms reached");
        }
        const room = new Room(name, owner);
        this.rooms.set(name, room);
        this.joinRoom(owner, name);
        return room;
    }

    joinRoom(peer, name) {
        if (name === '') {
            throw new ProtocolError("Missing room name");
        }
        if (peer.room) {
            throw new ProtocolError("You are already in a room");
        }
        const room = this.getRoom(name);
        if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
            throw new ProtocolError("The room is full");
        }
        room.players.add(peer);
        peer.room = room;
        room.broadcast('player_joined_current_room', { username: peer.username }, peer);
        return room;
    }

    // si quien abandona es el propietario, la habitación se destruye y se avisa al resto de jugadores
    leaveRoom(peer) {
        const room = this.roomOf(peer);
        const destroyed = room.owner === peer;
        if (destroyed) {
            this.rooms.delete(room.name);
            for (const p of room.players) {
                p.room = null;
            }
            room.broadcast('room_destroyed', { name: room.name }, peer);
            console.debug(`Room "${room.name}" destroyed because its owner "${peer}" left`);
        } else {
            room.players.delete(peer);
            peer.room = null;
            console.debug(`"${peer}" left the room "${room.name}"`);
        }
        return { room, destroyed };
    }

    kick(owner, username) {
        const room = this.ownedRoomOf(owner);
        if (username === owner.username) {
            throw new ProtocolError("You cannot kick yourself (leave the room instead)");
        }
        const kicked = [...room.players].find(p => p.username === username);
        if (!kicked) {
            throw new ProtocolError(`Username ${username} is not in room ${room.name}`);
        }
        room.broadcast('player_kicked_from_current_room', { username }, owner);
        room.players.delete(kicked);
        kicked.room = null;
        return room;
    }

    // envía una notificación a todos los peers que hayan hecho login (salvo a 'except')
    broadcastLoggedIn(cmd, data, except) {
        for (const p of this.peers) {
            if (p.username && p !== except) {
                p.send(cmd, data);
            }
        }
    }
}

module.exports = { Lobby, Room };
