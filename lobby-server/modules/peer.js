class Peer {
    constructor(id, ws, ipAddress) {
        this.id = id;
        this.ws = ws;
        this.ipAddress = ipAddress;
        this.username = null;   // null mientras no haya hecho login
        this.room = null;       // habitación en la que está (instancia de Room) o null
    }

    // envía un mensaje { cmd, success, data } al cliente (success se omite en las notificaciones)
    send(cmd, data = {}, success) {
        if (this.ws.readyState !== this.ws.OPEN) {
            return;
        }
        const msg = { cmd };
        if (success !== undefined) {
            msg.success = success;
        }
        msg.data = data;
        this.ws.send(JSON.stringify(msg));
    }

    toString() {
        return this.username ?? this.id;
    }
}

module.exports = { Peer };
