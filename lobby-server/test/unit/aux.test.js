const { describe, it, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const { getFirstNonLocalIPAddress } = require('../../modules/aux.js');

function iface(address, family = 'IPv4', internal = false) {
    return { address, family, internal };
}

describe('getFirstNonLocalIPAddress', () => {
    afterEach(() => mock.restoreAll());

    it('devuelve la primera IPv4 que no es interna', () => {
        mock.method(os, 'networkInterfaces', () => ({
            lo: [iface('127.0.0.1', 'IPv4', true), iface('::1', 'IPv6', true)],
            eth0: [iface('fe80::1', 'IPv6'), iface('192.168.1.20')],
            wlan0: [iface('10.0.0.5')]
        }));
        assert.equal(getFirstNonLocalIPAddress(), '192.168.1.20');
    });

    it('ignora 127.0.0.1 aunque no esté marcada como interna', () => {
        mock.method(os, 'networkInterfaces', () => ({
            weird: [iface('127.0.0.1')],
            eth0: [iface('172.16.0.3')]
        }));
        assert.equal(getFirstNonLocalIPAddress(), '172.16.0.3');
    });

    it('ignora las direcciones IPv6 y las internas', () => {
        mock.method(os, 'networkInterfaces', () => ({
            docker: [iface('172.17.0.1', 'IPv4', true)],
            eth0: [iface('2001:db8::1', 'IPv6')]
        }));
        assert.equal(getFirstNonLocalIPAddress(), undefined);
    });

    it('devuelve undefined si no hay interfaces', () => {
        mock.method(os, 'networkInterfaces', () => ({}));
        assert.equal(getFirstNonLocalIPAddress(), undefined);
    });

    it('devuelve un string o undefined con las interfaces reales de la máquina', () => {
        const ip = getFirstNonLocalIPAddress();
        assert.ok(ip === undefined || typeof ip === 'string');
    });
});
