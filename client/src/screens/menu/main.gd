extends Node3D

signal change_screen_requested(scene, next_scene)

func _ready() -> void:
	var main_menu = Globals.screen_menu_main.instantiate()
	change_window(main_menu)

func change_window(window, next_window = null):
	if get_node_or_null("current_window") != null: remove_child(get_node("current_window"))
	window.name = "current_window"
	print(window.get_script())
	window.change_window_requested.connect(change_window)
	window.change_screen_requested.connect(emit_change_scene)
	if next_window:
		window.next_scene = next_window
	add_child(window)

func emit_change_scene(scene, next_scene):
	emit_signal("change_screen_requested", scene, next_scene)
