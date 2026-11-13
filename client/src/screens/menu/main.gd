extends Node3D
## Gestiona la pila de submenús. El último elemento de `_stack` es el visible.
##
## - push(scene): apila un submenú nuevo encima del actual.
## - pop(): desapila el actual y vuelve al anterior.
## - replace(scene): sustituye el actual por otro (al volver atrás se salta el sustituido).
## - pop_to_root(): desapila todo hasta el menú principal.

signal change_screen_requested(scene, next_scene)

var _stack: Array = [] # de submenús (nodos con el script SubMenu)


func _ready() -> void:
	push(Globals.screen_menu_main)
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_connection_closed.connect(_on_ls_connection_closed)


func push(scene: PackedScene) -> void:
	var menu = scene.instantiate()
	if not menu.has_signal("push_requested"):
		var script: Script = menu.get_script()
		var detail := "el nodo raíz no tiene script"
		if script != null:
			var base := script.get_base_script()
			detail = "script=%s | primera línea=«%s» | compila=%s | script base=%s" % [
				script.resource_path,
				script.source_code.get_slice("\n", 0).strip_edges(),
				script.can_instantiate(),
				base.resource_path if base else "ninguno"]
		var msg := "'%s' no es un submenú (no hereda de SubMenu). %s" % [scene.resource_path, detail]
		push_error(msg)
		menu.free()
		return
	menu.push_requested.connect(push)
	menu.pop_requested.connect(pop)
	menu.replace_requested.connect(replace)
	menu.change_screen_requested.connect(_forward_screen_change)
	if not _stack.is_empty():
		_set_active(_stack.back(), false)
	_stack.push_back(menu)
	add_child(menu)


func pop() -> void:
	if _stack.size() <= 1:
		return # el menú principal es la base de la pila, no se desapila
	var menu = _stack.pop_back()
	_set_active(_stack.back(), true)
	menu.on_popped()
	menu.queue_free()


func replace(scene: PackedScene) -> void:
	if _stack.size() <= 1:
		return # el menú principal es la base de la pila, no se sustituye
	var old = _stack.pop_back()
	old.on_popped()
	old.queue_free()
	push(scene) # el de debajo ya estaba oculto y pausado


func _on_ls_connection_closed() -> void:
	pop_to_root()


func pop_to_root() -> void:
	while _stack.size() > 1:
		pop()


# Los submenús que quedan debajo en la pila se ocultan y se pausan (así, por
# ejemplo, el temporizador de intro del menú principal no corre en segundo plano).
func _set_active(menu: Node, active: bool) -> void:
	menu.visible = active
	menu.process_mode = Node.PROCESS_MODE_INHERIT if active else Node.PROCESS_MODE_DISABLED


func _forward_screen_change(scene, next_scene) -> void:
	change_screen_requested.emit(scene, next_scene)
