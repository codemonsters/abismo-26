// Base de datos para los perfiles de usuarios registrados.
// TODO: todavía no se usa: el estado del lobby (invitados y habitaciones) vive en memoria (ver lobby.js).
// Cuando se implemente el login de usuarios registrados, llamar a open() al arrancar y close() al detener el servidor.
const BetterSqlite3 = require('better-sqlite3');

const SQLITE_FILENAME = "database.sqlite";

function open(filename = SQLITE_FILENAME) {
    const db = new BetterSqlite3(filename);
    db.prepare("CREATE TABLE IF NOT EXISTS profiles (player_id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(30) UNIQUE, password VARCHAR(32), last_connection_timestamp DATETIME NOT NULL, account_creation_timestamp DATETIME, account_verified BOOLEAN)").run();
    return db;
}

module.exports = { open };
