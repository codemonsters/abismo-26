const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { dispatch } = require('../../modules/dispatcher.js');
const { commands } = require('../../modules/commands.js');
const { ProtocolError } = require('../../modules/exceptions.js');
const { lastMessage, messages, addPeer, setupLobby, silenceConsole } = require('./helpers.js');

silenceConsole();

function send(lobby, peer, msg) {
    dispatch(lobby, peer, typeof msg === 'string' ? msg : JSON.stringify(msg));
    return lastMessage(peer);
}

describe('dispatch', () => {
    let lobby, peer;
    beforeEach(() => {
        ({ lobby } = setupLobby());
        peer = addPeer(lobby);
    });

    describe('mensajes mal formados', () => {
        it('responde con error si el mensaje no es JSON', () => {
            for (const msg of ['', 'hola', '{cmd: login}', '{"cmd": "login"']) {
                assert.deepEqual(send(lobby, peer, msg),
                    { cmd: '', success: false, data: { details: 'Message not in JSON format' } }, msg);
            }
        });

        it('responde con error si el JSON no es un objeto', () => {
            for (const msg of ['null', '42', '"login"', 'true', '[]', '[{"cmd":"login"}]']) {
                assert.deepEqual(send(lobby, peer, msg),
                    { cmd: '', success: false, data: { details: 'Message must be a JSON object' } }, msg);
            }
        });

        it('responde con error si falta cmd o no es un string', () => {
            for (const msg of [{}, { cmd: 42 }, { cmd: null }, { cmd: ['login'] }]) {
                assert.deepEqual(send(lobby, peer, msg),
                    { cmd: '', success: false, data: { details: 'Unknown command: ' } }, JSON.stringify(msg));
            }
        });

        it('responde con error si el comando no existe', () => {
            assert.deepEqual(send(lobby, peer, { cmd: 'foo' }),
                { cmd: 'foo', success: false, data: { details: 'Unknown command: foo' } });
        });

        it('no trata como comandos las propiedades heredadas de Object', () => {
            for (const cmd of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf']) {
                assert.deepEqual(send(lobby, peer, `{"cmd": "${cmd}"}`),
                    { cmd, success: false, data: { details: `Unknown command: ${cmd}` } }, cmd);
            }
        });

        it('acepta mensajes binarios (Buffer) con JSON', () => {
            dispatch(lobby, peer, Buffer.from(JSON.stringify({ cmd: 'login', data: { username: 'alice' } })));
            assert.equal(lastMessage(peer).success, true);
            assert.equal(peer.username, 'alice');
        });

        it('cada mensaje recibe exactamente una respuesta', () => {
            send(lobby, peer, 'basura');
            send(lobby, peer, { cmd: 'login', data: { username: 'alice' } });
            send(lobby, peer, { cmd: 'get_rooms' });
            assert.deepEqual(messages(peer).map(m => m.cmd), ['', 'login', 'get_rooms']);
        });
    });

    describe('login obligatorio', () => {
        it('rechaza cualquier comando salvo login antes de hacer login', () => {
            for (const cmd of Object.keys(commands).filter(c => c !== 'login')) {
                assert.deepEqual(send(lobby, peer, { cmd }),
                    { cmd, success: false, data: { details: 'Please login first' } }, cmd);
            }
        });

        it('comprueba que el comando existe antes que el login', () => {
            assert.equal(send(lobby, peer, { cmd: 'foo' }).data.details, 'Unknown command: foo');
        });

        it('permite el resto de comandos tras hacer login', () => {
            send(lobby, peer, { cmd: 'login', data: { username: 'alice' } });
            assert.deepEqual(send(lobby, peer, { cmd: 'get_rooms' }), { cmd: 'get_rooms', success: true, data: { rooms: [] } });
        });

        it('un login fallido no cuenta como login', () => {
            send(lobby, peer, { cmd: 'login', data: { username: 'x' } });
            assert.equal(send(lobby, peer, { cmd: 'get_rooms' }).data.details, 'Please login first');
        });
    });

    describe('respuestas', () => {
        it('envía { cmd, success: true, data } con lo que devuelve el comando', () => {
            assert.deepEqual(send(lobby, peer, { cmd: 'login', data: { username: 'alice' } }),
                { cmd: 'login', success: true, data: { details: 'Anonymous login successful' } });
        });

        it('convierte un ProtocolError en { cmd, success: false, data: { details } }', () => {
            assert.deepEqual(send(lobby, peer, { cmd: 'login', data: { username: 'admin' } }),
                { cmd: 'login', success: false, data: { details: 'Username not allowed' } });
        });

        it('usa {} como data si falta o no es un objeto', () => {
            const received = [];
            const spy = mock.method(commands.login, 'run', (l, p, data) => { received.push(data); return {}; });
            try {
                for (const data of [undefined, null, 'x', 5, ['a'], true]) {
                    send(lobby, peer, data === undefined ? { cmd: 'login' } : { cmd: 'login', data });
                }
            } finally {
                spy.mock.restore();
            }
            assert.deepEqual(received, [{}, {}, {}, {}, {}, {}]);
        });

        it('pasa al comando el lobby, el peer y data', () => {
            const spy = mock.method(commands.login, 'run', () => ({}));
            try {
                send(lobby, peer, { cmd: 'login', data: { username: 'alice', extra: 1 } });
                assert.deepEqual(spy.mock.calls[0].arguments, [lobby, peer, { username: 'alice', extra: 1 }]);
            } finally {
                spy.mock.restore();
            }
        });
    });

    describe('errores inesperados', () => {
        let errorSpy;
        beforeEach(() => {
            commands.__boom = { requiresLogin: false, run() { throw new TypeError('bug!'); } };
            errorSpy = mock.method(console, 'error', () => {});
        });
        afterEach(() => {
            delete commands.__boom;
            errorSpy.mock.restore();
        });

        it('responde "Internal server error" sin dar detalles y sin lanzar la excepción', () => {
            assert.doesNotThrow(() => dispatch(lobby, peer, '{"cmd": "__boom"}'));
            assert.deepEqual(lastMessage(peer), { cmd: '__boom', success: false, data: { details: 'Internal server error' } });
        });

        it('registra el error con console.error', () => {
            send(lobby, peer, { cmd: '__boom' });
            assert.equal(errorSpy.mock.callCount(), 1);
            assert.ok(errorSpy.mock.calls[0].arguments.some(a => a instanceof TypeError));
        });

        it('un ProtocolError no se registra como error inesperado', () => {
            commands.__boom.run = () => { throw new ProtocolError('expected'); };
            assert.equal(send(lobby, peer, { cmd: '__boom' }).data.details, 'expected');
            assert.equal(errorSpy.mock.callCount(), 0);
        });
    });
});
