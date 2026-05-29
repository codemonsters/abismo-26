extends Node3D

signal change_screen_requested(scene, next_scene)

var main_menu

func _ready() -> void:
	main_menu = Globals.screen_menu_main.instantiate()
	change_window(main_menu)
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_connection_closed.connect(on_ls_connection_closed)

func change_window(window, next_window = null):
	if get_node_or_null("current_window") != null: remove_child(get_node("current_window"))
	window.name = "current_window"
	window.change_window_requested.connect(change_window)
	window.change_screen_requested.connect(emit_change_scene)
	if next_window:
		window.next_scene = next_window
	add_child(window)

func emit_change_scene(scene, next_scene):
	emit_signal("change_screen_requested", scene, next_scene)

func on_ls_connection_closed():
	change_window(main_menu)
