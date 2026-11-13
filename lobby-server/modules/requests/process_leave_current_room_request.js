function processLeaveCurrentRoomRequest(json, peer, server) {
    // esta petición no necesita objeto 'data'
    console.log("Leave current room request received");

    const {room_name, room_destroyed, removed_usernames} = server.leave_current_room(peer);

    peer.ws.send(JSON.stringify({
        'cmd': 'leave_current_room',
        'success': true,
        'data': { 'name': room_name }
    }));

    if (!room_destroyed) {
        console.debug(`"${peer.username}" left the room "${room_name}"`);
        return;
    }

    // la habitación ha sido destruida: avisamos al resto de jugadores que estaban en ella
    server.notify_room_destroyed(room_name, removed_usernames, peer.username);
    console.debug(`"${room_name}" destroyed because "${peer.username}" was the owner and left`);
}

module.exports = { processLeaveCurrentRoomRequest };
