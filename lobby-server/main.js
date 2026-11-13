const PORT = 9090;

const WebSocket = require('ws');
const wss = new WebSocket.Server({port: PORT});
const {ServerBaseException, ProtocolException} = require("./modules/exceptions.js");
const {getFirstNonLocalIPAddress} = require("./modules/aux.js");
const {server} = require("./modules/server.js");

function sendError(ws, cmd, details) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            'cmd': cmd,
            'success': false,
            'data': {'details': details}
        }));
    }
}

wss.on('connection', function connection(ws, req) {
    let peer;
    try {
        peer = server.connect_peer_by_websocket(ws);
        peer.ip_address = req.socket.remoteAddress.replace('::ffff:', '');
        console.log(`Peer connected (id: ${peer.id}, ip addres: ${peer.ip_address})`);
    } catch(ex) {
        if (ex instanceof ServerBaseException) {
            console.log(`Connection refused: ${ex.message}`);
            ws.close(4000, ex.message);
        } else {
            console.error("Unexpected error accepting connection:", ex);
            ws.close(1011, "Internal server error");
        }
        return;
    }

    ws.on('message', function message(data, isBinary) {
        const message = isBinary ? data : data.toString();
        try {
            server.processRequest(message, peer);
        } catch (ex) {
            if (ex instanceof ProtocolException) {
                sendError(ws, ex.cmd, ex.message);
                console.log(`Error processing "${ex.cmd}" request from ${peer.id}. Reason: ${ex.message}\n`);
            } else if (ex instanceof ServerBaseException) {
                sendError(ws, ex.cmd || '', ex.message);
                console.log(`Error processing request from ${peer.id}. Reason: ${ex.message}\n`);
            } else {
                // Error inesperado (bug del servidor): lo registramos pero no dejamos que tumbe el proceso
                sendError(ws, '', 'Internal server error');
                console.error(`Unexpected error processing request from ${peer.id}:`, ex);
            }
        }
    });

    ws.on("close", function close(code, data) {
        console.log(`Peer disconnected (id: ${peer.id}, code: ${code}, reason: ${data.toString()})`);
        try {
            server.disconnect_peer(peer);
        } catch (ex) {
            console.error(`Unexpected error disconnecting peer ${peer.id}:`, ex);
        }
    });
});

console.log("Server listening on IP address %s and port %d (ws://%s:%d)", getFirstNonLocalIPAddress(), PORT, getFirstNonLocalIPAddress(), PORT);

// TODO: llamar a db.close() cuando se detiene el servidor
