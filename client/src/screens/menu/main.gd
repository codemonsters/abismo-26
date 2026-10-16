extends Node3D

const INITIAL_SUBMENU = preload("res://screens/menu/submenus/main/main.tscn")

@onready var menu_container: Control = $MenuContainer

var _stack: Array[Control] = []

func _ready() -> void:
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_connection_closed.connect(on_ls_connection_closed)
	submenu_push(INITIAL_SUBMENU)

func submenu_push(menu_scene: PackedScene) -> void:
	if not _stack.is_empty():
		var current_menu = _stack.back()
		current_menu.process_mode = Node.PROCESS_MODE_DISABLED
		current_menu.visible = false

	var new_menu = menu_scene.instantiate() as Control
	
	if new_menu.has_signal("navigate_to"):
		new_menu.navigate_to.connect(_on_submenu_navigate_to)
	if new_menu.has_signal("navigate_back"):
		new_menu.navigate_back.connect(_on_submenu_navigate_back)

	menu_container.add_child(new_menu)
	_stack.append(new_menu)

func submenu_pop() -> void:
	if _stack.size() <= 1:
		return

	var current_menu = _stack.pop_back()
	current_menu.queue_free()

	var previous_menu = _stack.back()
	previous_menu.process_mode = Node.PROCESS_MODE_INHERIT
	previous_menu.visible = true

func _on_submenu_navigate_to(scene: PackedScene) -> void:
	submenu_push(scene)

func _on_submenu_navigate_back() -> void:
	submenu_pop()

func on_ls_connection_closed():
	submenu_push(INITIAL_SUBMENU)
