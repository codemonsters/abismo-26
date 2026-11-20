const RESERVED_USERNAMES = ['admin', 'administrator', 'administrador', 'codemonsters', 'guest', 'root'];

// mismas reglas para nombres de usuario y de habitación
function isValidName(name) {
    return typeof name === 'string' && /^[a-zA-Z0-9ñÑ]{3,20}$/.test(name);
}

// devuelve el valor si es un string, o '' en caso contrario
function str(value) {
    return typeof value === 'string' ? value : '';
}

module.exports = { RESERVED_USERNAMES, isValidName, str };
