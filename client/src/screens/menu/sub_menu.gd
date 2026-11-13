class_name SubMenu
extends Node2D
## Clase base de los submenús (main_menu, menu_online, lobby_list, create_lobby, lobby...).
##
## Un submenú no sabe quién es el anterior ni el siguiente: solo pide al gestor
## de la pila (screens/menu/main.gd) que abra otro submenú encima ([method push])
## o que se cierre el actual ([method pop]).

## Pide abrir `scene` encima de este submenú.
signal push_requested(scene: PackedScene)
## Pide cerrar este submenú y volver al anterior.
signal pop_requested
## Pide sustituir este submenú por `scene` (equivale a pop + push, sin pasar por el anterior).
signal replace_requested(scene: PackedScene)
## Pide cambiar de pantalla completa (intro, juego...). Lo reenvía el menú hasta main.gd.
signal change_screen_requested(scene, next_scene)


func push(scene: PackedScene) -> void:
	push_requested.emit(scene)


func pop() -> void:
	pop_requested.emit()


func replace(scene: PackedScene) -> void:
	replace_requested.emit(scene)


## Se llama cuando este submenú sale de la pila (botón volver, o vuelta forzada
## al menú principal). Sobrescribir para limpiar recursos. Después se libera.
func on_popped() -> void:
	pass
