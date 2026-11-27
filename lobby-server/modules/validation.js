const RESERVED_USERNAMES = ['admin', 'administrator', 'administrador', 'codemonsters', 'guest', 'root'];

// mismas reglas para nombres de usuario y de habitación
function isValidName(name) {
    return typeof name === 'string' && /^[a-zA-Z0-9ñÑ]{3,20}$/.test(name);
}

// Los nombres de usuario y de habitación no distinguen mayúsculas y minúsculas ('Alice' y 'alice' son
// el mismo usuario). Se guardan tal y como se escribieron, pero se comparan con esta clave.
function nameKey(name) {
    return name.toLowerCase();
}

function sameUsername(a, b) {
    return typeof a === 'string' && typeof b === 'string' && nameKey(a) === nameKey(b);
}

// devuelve el valor si es un string, o '' en caso contrario
function str(value) {
    return typeof value === 'string' ? value : '';
}

module.exports = { RESERVED_USERNAMES, isValidName, nameKey, sameUsername, str };
