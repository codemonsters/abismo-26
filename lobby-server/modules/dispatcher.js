const { ProtocolError } = require('./exceptions.js');
const { commands } = require('./commands.js');

function parseMessage(msg) {
    let json;
    try {
        json = JSON.parse(msg);
    } catch (e) {
        throw new ProtocolError("Message not in JSON format");
    }
    if (json === null || typeof json !== 'object' || Array.isArray(json)) {
        throw new ProtocolError("Message must be a JSON object");
    }
    return json;
}

function runCommand(lobby, peer, json, cmd) {
    const command = Object.hasOwn(commands, cmd) ? commands[cmd] : undefined;
    if (!command) {
        throw new ProtocolError(`Unknown command: ${cmd}`);
    }
    if (command.requiresLogin !== false && !peer.username) {
        throw new ProtocolError("Please login first");
    }
    const data = (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) ? json.data : {};
    return command.run(lobby, peer, data);
}

// procesa un mensaje recibido de un peer y le envía la respuesta (de éxito o de error)
function dispatch(lobby, peer, msg) {
    let cmd = '';
    try {
        const json = parseMessage(msg);
        cmd = typeof json.cmd === 'string' ? json.cmd : '';
        console.debug(`[${peer}] ${cmd}`);
        const result = runCommand(lobby, peer, json, cmd);
        peer.send(cmd, result, true);
    } catch (ex) {
        if (ex instanceof ProtocolError) {
            console.log(`[${peer}] Error processing "${cmd}": ${ex.message}`);
            peer.send(cmd, { details: ex.message }, false);
        } else {
            // error inesperado (bug del servidor): lo registramos pero no dejamos que tumbe el proceso
            console.error(`[${peer}] Unexpected error processing "${cmd}":`, ex);
            peer.send(cmd, { details: 'Internal server error' }, false);
        }
    }
}

module.exports = { dispatch };
