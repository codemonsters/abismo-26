// Registro en archivo con rotación por tamaño.
// Si se activa (ver main.js, variable de entorno LOG_FILE), todo lo que se escribe con console.log/info/debug/warn/error
// se sigue mostrando por consola y además se añade al archivo con marca de tiempo y nivel.
// Cuando el archivo va a superar maxSize bytes se rota: archivo -> archivo.1 -> archivo.2 ... y se borra el que pase de maxFiles,
// de modo que como mucho se ocupan maxSize * (maxFiles + 1) bytes.
const fs = require('fs');
const path = require('path');
const util = require('util');

const LEVELS = { log: 'INFO', info: 'INFO', debug: 'DEBUG', warn: 'WARN', error: 'ERROR' };

// "5242880", "512k", "5m", "1g" (sin distinguir mayúsculas, con o sin "b" al final) -> bytes
function parseSize(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const match = /^\s*(\d+(?:\.\d+)?)\s*([kmg]?)b?\s*$/i.exec(String(value));
    if (!match) {
        throw new Error(`Invalid size: "${value}"`);
    }
    const multiplier = { '': 1, k: 1024, m: 1024 ** 2, g: 1024 ** 3 }[match[2].toLowerCase()];
    return Math.floor(Number(match[1]) * multiplier);
}

class RotatingFile {
    constructor(filename, { maxSize, maxFiles }) {
        if (!(maxSize > 0)) throw new Error('maxSize must be greater than 0');
        if (!(Number.isInteger(maxFiles) && maxFiles >= 0)) throw new Error('maxFiles must be an integer >= 0');
        this.filename = filename;
        this.maxSize = maxSize;
        this.maxFiles = maxFiles;
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        this._open();
    }

    _open() {
        this.fd = fs.openSync(this.filename, 'a');
        this.size = fs.fstatSync(this.fd).size;
    }

    _rotate() {
        fs.closeSync(this.fd);
        if (this.maxFiles === 0) {
            fs.rmSync(this.filename, { force: true });
        } else {
            fs.rmSync(`${this.filename}.${this.maxFiles}`, { force: true });
            for (let i = this.maxFiles - 1; i >= 1; i--) {
                const from = `${this.filename}.${i}`;
                if (fs.existsSync(from)) fs.renameSync(from, `${this.filename}.${i + 1}`);
            }
            fs.renameSync(this.filename, `${this.filename}.1`);
        }
        this._open();
    }

    write(text) {
        const buffer = Buffer.from(text);
        if (this.size > 0 && this.size + buffer.length > this.maxSize) {
            this._rotate();
        }
        fs.writeSync(this.fd, buffer);
        this.size += buffer.length;
    }

    close() {
        if (this.fd !== null) {
            fs.closeSync(this.fd);
            this.fd = null;
        }
    }
}

// Duplica la salida de console en un RotatingFile. Devuelve una función que deja console como estaba y cierra el archivo.
function setupFileLogging({ file, maxSize = 5 * 1024 ** 2, maxFiles = 5, now = () => new Date() }) {
    const out = new RotatingFile(file, { maxSize, maxFiles });
    const originals = {};
    for (const [method, level] of Object.entries(LEVELS)) {
        originals[method] = console[method];
        console[method] = (...args) => {
            originals[method].apply(console, args);
            try {
                out.write(`${now().toISOString()} [${level}] ${util.format(...args)}\n`);
            } catch (ex) {
                originals.error.call(console, 'Could not write to log file:', ex.message);
            }
        };
    }
    return function restore() {
        Object.assign(console, originals);
        out.close();
    };
}

module.exports = { RotatingFile, setupFileLogging, parseSize };
