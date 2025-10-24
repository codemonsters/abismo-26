# README

Shooter colaborativo multijugador en línea ambientado en las profundidades del mar.

El repositorio está compuesto por dos proyectos:
* [Cliente](client): Juego hecho con Godot. Usa Rapier para las físicas deterministas y Netfox para la predicción y el rollback.
* [Servidor](server): Hecho con Node.js. Se comunica con los clientes a través de WebSocket y almacena la información en una base de datos SQLite.

## Git

Normas de estilo para los mensajes de los commits:

* Empezar con mayúscula.
* Estar escrito en modo imperativo (como si dieras una orden).
* No terminar con un punto.
* Claro y conciso. limitarse a un máximo de 50 caracteres.

Mensajes commit de ejemplo:

* Añade paginación a la lista de usuarios
* Corrige el error de validación en el formulario de contacto
* Evita la división por cero en el cálculo de estadísticas
* Resuelve el desbordamiento de texto en la barra lateral
* Impide que usuarios no autenticados vean la página de perfil
* Simplifica la lógica del script 'UserController'
* Extrae el componente 'Avatar' a un archivo independiente
* Renombra la variable 'usr' a 'usuario' para mayor claridad
* Actualiza el README con nuevas instrucciones de instalación
* Corrige erratas en la guía de contribución (CONTRIBUTING.md)
* Elimina el archivo 'user.gd' (ya no se usa)
* Modifica '.gitignore' para que ignore la carpeta '/dist'
