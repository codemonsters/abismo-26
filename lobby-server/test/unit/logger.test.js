const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { RotatingFile, setupFileLogging, parseSize } = require('../../modules/logger.js');
const { setupLogFileFromEnv } = require('../../main.js');

const read = file => fs.readFileSync(file, 'utf8');

describe('parseSize', () => {
    it('acepta bytes y sufijos k, m y g', () => {
        assert.equal(parseSize('1000'), 1000);
        assert.equal(parseSize('512k'), 512 * 1024);
        assert.equal(parseSize('5M'), 5 * 1024 ** 2);
        assert.equal(parseSize('1gb'), 1024 ** 3);
        assert.equal(parseSize('1.5k'), 1536);
    });

    it('usa el valor por defecto si no hay valor', () => {
        assert.equal(parseSize(undefined, 42), 42);
        assert.equal(parseSize('', 42), 42);
    });

    it('lanza un error con un valor no válido', () => {
        assert.throws(() => parseSize('mucho'), /Invalid size/);
        assert.throws(() => parseSize('-5m'), /Invalid size/);
    });
});

describe('logger', () => {
    let dir, file, restore;
    const originalConsole = { ...console };

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lobby-logger-'));
        file = path.join(dir, 'logs', 'server.log');
        restore = null;
        for (const method of ['log', 'info', 'debug', 'warn', 'error']) console[method] = () => {};
    });

    afterEach(() => {
        if (restore) restore();
        Object.assign(console, originalConsole);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    describe('RotatingFile', () => {
        it('crea la carpeta y añade al final de un archivo existente', () => {
            let out = new RotatingFile(file, { maxSize: 1000, maxFiles: 2 });
            out.write('uno\n');
            out.close();
            out = new RotatingFile(file, { maxSize: 1000, maxFiles: 2 });
            out.write('dos\n');
            out.close();
            assert.equal(read(file), 'uno\ndos\n');
        });

        it('rota al superar el tamaño máximo y conserva como mucho maxFiles archivos antiguos', () => {
            const out = new RotatingFile(file, { maxSize: 10, maxFiles: 2 });
            for (const line of ['aaaaaaaa\n', 'bbbbbbbb\n', 'cccccccc\n', 'dddddddd\n']) out.write(line);
            out.close();
            assert.equal(read(file), 'dddddddd\n');
            assert.equal(read(`${file}.1`), 'cccccccc\n');
            assert.equal(read(`${file}.2`), 'bbbbbbbb\n');
            assert.equal(fs.existsSync(`${file}.3`), false);
        });

        it('con maxFiles 0 vacía el archivo en lugar de guardar copias', () => {
            const out = new RotatingFile(file, { maxSize: 10, maxFiles: 0 });
            out.write('aaaaaaaa\n');
            out.write('bbbbbbbb\n');
            out.close();
            assert.equal(read(file), 'bbbbbbbb\n');
            assert.deepEqual(fs.readdirSync(path.dirname(file)), ['server.log']);
        });

        it('escribe una línea más grande que maxSize en un archivo vacío', () => {
            const out = new RotatingFile(file, { maxSize: 4, maxFiles: 1 });
            out.write('demasiado largo\n');
            out.close();
            assert.equal(read(file), 'demasiado largo\n');
        });

        it('rechaza parámetros no válidos', () => {
            assert.throws(() => new RotatingFile(file, { maxSize: 0, maxFiles: 1 }));
            assert.throws(() => new RotatingFile(file, { maxSize: 10, maxFiles: -1 }));
            assert.throws(() => new RotatingFile(file, { maxSize: 10, maxFiles: NaN }));
        });
    });

    describe('setupFileLogging', () => {
        it('guarda en el archivo cada llamada a console con marca de tiempo y nivel, y sigue llamando al original', () => {
            const shown = [];
            console.log = (...args) => shown.push(args);
            restore = setupFileLogging({ file, now: () => new Date('2026-01-02T03:04:05.000Z') });
            console.log('Peer %s connected', 'p1');
            console.debug('debug');
            console.warn('warn');
            console.error('error', new Error('boom').message);
            assert.deepEqual(shown, [['Peer %s connected', 'p1']]);
            assert.equal(read(file),
                '2026-01-02T03:04:05.000Z [INFO] Peer p1 connected\n' +
                '2026-01-02T03:04:05.000Z [DEBUG] debug\n' +
                '2026-01-02T03:04:05.000Z [WARN] warn\n' +
                '2026-01-02T03:04:05.000Z [ERROR] error boom\n');
        });

        it('restore deja console como estaba', () => {
            const original = console.log;
            restore = setupFileLogging({ file });
            assert.notEqual(console.log, original);
            restore();
            restore = null;
            assert.equal(console.log, original);
        });
    });

    describe('setupLogFileFromEnv', () => {
        it('no hace nada sin LOG_FILE', () => {
            assert.equal(setupLogFileFromEnv({}), null);
            assert.equal(fs.existsSync(path.dirname(file)), false);
        });

        it('activa el log en archivo con los límites de las variables de entorno', () => {
            restore = setupLogFileFromEnv({ LOG_FILE: file, LOG_MAX_SIZE: '100', LOG_MAX_FILES: '1' });
            assert.equal(typeof restore, 'function');
            for (let i = 0; i < 10; i++) console.log('0123456789012345678901234567890123456789');
            assert.ok(fs.statSync(file).size <= 100);
            assert.ok(fs.existsSync(`${file}.1`));
            assert.equal(fs.existsSync(`${file}.2`), false);
        });

        it('si la configuración no es válida avisa y sigue sin archivo', () => {
            const errors = [];
            console.error = (...args) => errors.push(args.join(' '));
            assert.equal(setupLogFileFromEnv({ LOG_FILE: file, LOG_MAX_SIZE: 'mucho' }), null);
            assert.match(errors[0], /Could not set up log file/);
        });
    });
});
