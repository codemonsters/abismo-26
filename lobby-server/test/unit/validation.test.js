const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { RESERVED_USERNAMES, isValidName, nameKey, sameUsername, str } = require('../../modules/validation.js');

describe('isValidName', () => {
    it('acepta nombres alfanuméricos de 3 a 20 caracteres', () => {
        for (const name of ['abc', 'alice', 'Player42', '123', 'a'.repeat(20)]) {
            assert.equal(isValidName(name), true, name);
        }
    });

    it('acepta la ñ y la Ñ', () => {
        assert.equal(isValidName('ñandu'), true);
        assert.equal(isValidName('ÑOÑO'), true);
    });

    it('rechaza nombres demasiado cortos o demasiado largos', () => {
        for (const name of ['', 'a', 'ab', 'a'.repeat(21)]) {
            assert.equal(isValidName(name), false, name);
        }
    });

    it('rechaza espacios, símbolos y otros caracteres no ASCII', () => {
        for (const name of ['ali ce', ' alice', 'alice ', 'ali_ce', 'ali-ce', 'alice!', 'josé', 'ali\nce', '<script>']) {
            assert.equal(isValidName(name), false, JSON.stringify(name));
        }
    });

    it('rechaza valores que no son strings', () => {
        for (const value of [undefined, null, 12345, ['alice'], { name: 'alice' }, true]) {
            assert.equal(isValidName(value), false, String(value));
        }
    });
});

describe('nameKey', () => {
    it('da la misma clave a nombres que solo se diferencian en mayúsculas', () => {
        assert.equal(nameKey('Room1'), nameKey('rOOM1'));
        assert.equal(nameKey('Ñandu'), nameKey('ñANDU'));
    });

    it('da claves distintas a nombres distintos', () => {
        assert.notEqual(nameKey('room1'), nameKey('room2'));
    });
});

describe('sameUsername', () => {
    it('no distingue mayúsculas y minúsculas', () => {
        assert.equal(sameUsername('alice', 'alice'), true);
        assert.equal(sameUsername('Alice', 'aLICE'), true);
        assert.equal(sameUsername('Ñandu', 'ñANDU'), true);
    });

    it('distingue nombres diferentes', () => {
        assert.equal(sameUsername('alice', 'alice2'), false);
        assert.equal(sameUsername('alice', 'bob'), false);
    });

    it('devuelve false si alguno no es un string (p. ej. un peer sin login)', () => {
        assert.equal(sameUsername(null, null), false);
        assert.equal(sameUsername(null, 'alice'), false);
        assert.equal(sameUsername('alice', undefined), false);
        assert.equal(sameUsername(undefined, undefined), false);
    });
});

describe('str', () => {
    it('devuelve el valor si es un string', () => {
        assert.equal(str('hola'), 'hola');
        assert.equal(str(''), '');
    });

    it("devuelve '' si el valor no es un string", () => {
        for (const value of [undefined, null, 0, 42, true, [], ['a'], {}, () => 'a']) {
            assert.equal(str(value), '');
        }
    });
});

describe('RESERVED_USERNAMES', () => {
    it('está en minúsculas (el lobby compara con username.toLowerCase())', () => {
        for (const name of RESERVED_USERNAMES) {
            assert.equal(name, name.toLowerCase());
        }
    });

    it('incluye los nombres reservados básicos', () => {
        for (const name of ['admin', 'root', 'guest']) {
            assert.ok(RESERVED_USERNAMES.includes(name), name);
        }
    });
});
