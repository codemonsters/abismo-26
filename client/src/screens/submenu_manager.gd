class_name SubmenuManager

extends Node

@export var menu_container: Control
@export var initial_menu: PackedScene

# Pila para almacenar las escenas de los submenús activos
var _stack: Array[Control] = []

func _ready() -> void:
	if initial_menu:
		push(initial_menu)

# Añade un nuevo submenú a la pila y lo muestra
func push(menu_scene: PackedScene) -> void:
	# Opcional: pausar o desactivar la entrada del menú actual superior
	if not _stack.is_empty():
		var current_menu = _stack.back()
		current_menu.process_mode = Node.PROCESS_MODE_DISABLED
		current_menu.visible = false

	# Instanciar y añadir el nuevo submenú
	var new_menu = menu_scene.instantiate() as Control
	menu_container.add_child(new_menu)
	_stack.append(new_menu)

# Vuelve al submenú anterior eliminando el actual de la pila
func pop() -> void:
	if _stack.size() <= 1:
		print("No se puede hacer pop: estás en el menú raíz.")
		return

	# Sacar y destruir el menú actual
	var current_menu = _stack.pop_back()
	current_menu.queue_free()

	# Reactivar el menú anterior que queda en la cima de la pila
	var previous_menu = _stack.back()
	previous_menu.process_mode = Node.PROCESS_MODE_INHERIT
	previous_menu.visible = true

# Vacía la pila y carga un menú raíz (útil para volver al inicio drásticamente)
func change_root(menu_scene: PackedScene) -> void:
	while not _stack.is_empty():
		var menu = _stack.pop_back()
		menu.queue_free()
	
	push(menu_scene)
