const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ProtocolError } = require('../../modules/exceptions.js');

describe('ProtocolError', () => {
    it('es un Error con el mensaje indicado', () => {
        const ex = new ProtocolError('Room not found');
        assert.ok(ex instanceof Error);
        assert.ok(ex instanceof ProtocolError);
        assert.equal(ex.message, 'Room not found');
    });

    it('se distingue de un Error genérico', () => {
        assert.equal(new Error('x') instanceof ProtocolError, false);
    });
});
