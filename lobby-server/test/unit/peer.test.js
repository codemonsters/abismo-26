const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Peer } = require('../../modules/peer.js');
const { FakeWs } = require('./helpers.js');

describe('Peer', () => {
    it('se crea sin login y fuera de cualquier habitación', () => {
        const ws = new FakeWs();
        const peer = new Peer('id-1', ws, '10.0.0.1');
        assert.equal(peer.id, 'id-1');
        assert.equal(peer.ws, ws);
        assert.equal(peer.ipAddress, '10.0.0.1');
        assert.equal(peer.username, null);
        assert.equal(peer.room, null);
    });

    describe('send', () => {
        it('envía una respuesta de éxito { cmd, success: true, data }', () => {
            const peer = new Peer('id', new FakeWs(), 'ip');
            peer.send('login', { details: 'ok' }, true);
            assert.deepEqual(peer.ws.sent, [{ cmd: 'login', success: true, data: { details: 'ok' } }]);
        });

        it('envía una respuesta de error { cmd, success: false, data }', () => {
            const peer = new Peer('id', new FakeWs(), 'ip');
            peer.send('login', { details: 'fail' }, false);
            assert.deepEqual(peer.ws.sent, [{ cmd: 'login', success: false, data: { details: 'fail' } }]);
        });

        it('omite success en las notificaciones', () => {
            const peer = new Peer('id', new FakeWs(), 'ip');
            peer.send('rooms_changed', { a: 1 });
            assert.deepEqual(peer.ws.sent, [{ cmd: 'rooms_changed', data: { a: 1 } }]);
            assert.equal(Object.hasOwn(peer.ws.sent[0], 'success'), false);
        });

        it('usa {} como data por defecto', () => {
            const peer = new Peer('id', new FakeWs(), 'ip');
            peer.send('rooms_changed');
            assert.deepEqual(peer.ws.sent, [{ cmd: 'rooms_changed', data: {} }]);
        });

        it('envía los campos en el orden cmd, success, data', () => {
            const raw = [];
            const ws = { OPEN: 1, readyState: 1, send: s => raw.push(s) };
            new Peer('id', ws, 'ip').send('x', {}, true);
            assert.equal(raw[0], '{"cmd":"x","success":true,"data":{}}');
        });

        it('no envía nada si el WebSocket no está abierto', () => {
            const ws = new FakeWs();
            ws.readyState = ws.CLOSED;
            new Peer('id', ws, 'ip').send('rooms_changed', {});
            assert.deepEqual(ws.sent, []);
        });
    });

    describe('toString', () => {
        it('devuelve el id mientras no haya hecho login', () => {
            assert.equal(String(new Peer('id-1', new FakeWs(), 'ip')), 'id-1');
        });

        it('devuelve el nombre de usuario tras el login', () => {
            const peer = new Peer('id-1', new FakeWs(), 'ip');
            peer.username = 'alice';
            assert.equal(`${peer}`, 'alice');
        });
    });
});
