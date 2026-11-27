const WebSocket = require('ws');
const { Lobby } = require('./modules/lobby.js');
const { dispatch } = require('./modules/dispatcher.js');
const { ProtocolError } = require('./modules/exceptions.js');
const { getFirstNonLocalIPAddress } = require('./modules/aux.js');
const { setupFileLogging, parseSize } = require('./modules/logger.js');

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

// Si está definida LOG_FILE, la salida de console se guarda también en ese archivo, rotándolo al llegar a LOG_MAX_SIZE
// (por defecto 5m) y conservando LOG_MAX_FILES archivos antiguos (por defecto 5). Si no se puede abrir, se sigue sin archivo.
function setupLogFileFromEnv(env = process.env) {
    if (!env.LOG_FILE) {
        return null;
    }
    try {
        const restore = setupFileLogging({
            file: env.LOG_FILE,
            maxSize: parseSize(env.LOG_MAX_SIZE, 5 * 1024 ** 2),
            maxFiles: env.LOG_MAX_FILES === undefined || env.LOG_MAX_FILES === '' ? 5 : Number(env.LOG_MAX_FILES),
        });
        console.log(`Logging to file ${env.LOG_FILE}`);
        return restore;
    } catch (ex) {
        console.error(`Could not set up log file "${env.LOG_FILE}", logging only to console: ${ex.message}`);
        return null;
    }
}

if (require.main === module) {
    setupLogFileFromEnv();
    const port = Number(process.env.PORT) || 9090;
    startServer(port);
    const ip = getFirstNonLocalIPAddress();
    console.log("Server listening on IP address %s and port %d (ws://%s:%d)", ip, port, ip, port);
}

module.exports = { startServer, setupLogFileFromEnv };
