// Error "esperado" provocado por una petición incorrecta del cliente. El dispatcher lo captura y
// responde al cliente con { cmd, success: false, data: { details: message } }
class ProtocolError extends Error {}

module.exports = { ProtocolError };
