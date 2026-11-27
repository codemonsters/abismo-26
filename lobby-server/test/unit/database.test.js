const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const database = require('../../modules/database.js');

const NOW = '2026-01-01 00:00:00';

describe('database.open', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lobby-db-'));
    after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

    it('crea la tabla profiles con las columnas esperadas', () => {
        const db = database.open(':memory:');
        try {
            const columns = db.prepare("PRAGMA table_info(profiles)").all().map(c => c.name);
            assert.deepEqual(columns, ['player_id', 'username', 'email', 'password',
                'last_connection_timestamp', 'account_creation_timestamp', 'account_verified']);
        } finally {
            db.close();
        }
    });

    it('se puede abrir varias veces el mismo fichero sin perder los datos', () => {
        const file = path.join(tmpDir, 'test.sqlite');
        let db = database.open(file);
        db.prepare("INSERT INTO profiles (username, last_connection_timestamp) VALUES (?, ?)").run('alice', NOW);
        db.close();

        db = database.open(file);
        try {
            assert.deepEqual(db.prepare("SELECT username FROM profiles").all(), [{ username: 'alice' }]);
        } finally {
            db.close();
        }
    });

    it('asigna player_id automáticamente', () => {
        const db = database.open(':memory:');
        try {
            const insert = db.prepare("INSERT INTO profiles (username, last_connection_timestamp) VALUES (?, ?)");
            const a = insert.run('alice', NOW).lastInsertRowid;
            const b = insert.run('bob', NOW).lastInsertRowid;
            assert.ok(b > a);
        } finally {
            db.close();
        }
    });

    it('no permite nombres de usuario ni emails repetidos', () => {
        const db = database.open(':memory:');
        try {
            const insert = db.prepare("INSERT INTO profiles (username, email, last_connection_timestamp) VALUES (?, ?, ?)");
            insert.run('alice', 'alice@example.com', NOW);
            assert.throws(() => insert.run('alice', 'other@example.com', NOW), /UNIQUE/);
            assert.throws(() => insert.run('bob', 'alice@example.com', NOW), /UNIQUE/);
        } finally {
            db.close();
        }
    });

    it('exige username y last_connection_timestamp', () => {
        const db = database.open(':memory:');
        try {
            assert.throws(() => db.prepare("INSERT INTO profiles (last_connection_timestamp) VALUES (?)").run(NOW), /NOT NULL/);
            assert.throws(() => db.prepare("INSERT INTO profiles (username) VALUES (?)").run('alice'), /NOT NULL/);
        } finally {
            db.close();
        }
    });
});
