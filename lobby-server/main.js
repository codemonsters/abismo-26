const WebSocket = require('ws');
const { Lobby } = require('./modules/lobby.js');
const { dispatch } = require('./modules/dispatcher.js');
const { ProtocolError } = require('./modules/exceptions.js');
const { getFirstNonLocalIPAddress } = require('./modules/aux.js');

function startServer(port) {
    const lobby = new Lobby();
    const wss = new WebSocket.Server({ port });

    wss.on('connection', function connection(ws, req) {
        let peer;
        try {
            peer = lobby.addPeer(ws, req.socket.remoteAddress.replace('::ffff:', ''));
        } catch (ex) {
            const known = ex instanceof ProtocolError;
            console.log(`Connection refused: ${known ? ex.message : ex}`);
            ws.close(known ? 4000 : 1011, known ? ex.message : 'Internal server error');
            return;
        }
        console.log(`Peer connected (id: ${peer.id}, ip address: ${peer.ipAddress})`);

        ws.on('message', (data, isBinary) => dispatch(lobby, peer, isBinary ? data : data.toString()));

        ws.on('close', (code, reason) => {
            console.log(`Peer disconnected (${peer}, code: ${code}, reason: ${reason.toString()})`);
            try {
                lobby.removePeer(peer);
            } catch (ex) {
                console.error(`Unexpected error disconnecting peer ${peer}:`, ex);
            }
        });
    });

    return { wss, lobby };
}

if (require.main === module) {
    const port = Number(process.env.PORT) || 9090;
    startServer(port);
    const ip = getFirstNonLocalIPAddress();
    console.log("Server listening on IP address %s and port %d (ws://%s:%d)", ip, port, ip, port);
}

module.exports = { startServer };
