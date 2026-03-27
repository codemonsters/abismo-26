extends Node3D

signal change_screen_requested(scene, next_scene)

func _ready() -> void:
	var main_menu = Globals.screen_menu_main.instantiate()
	change_window(main_menu)

#TODO nuevo change screen desde aquí que instancie al menú actual
func change_window(window, next_window = null):
	if $Camera3D.get_node_or_null("current_window") != null: $Camera3D.remove_child($Camera3D.get_node("current_window"))
	window.name = "current_window"
	if window.has_signal("change_window_requested"):
		window.change_window_requested.connect(change_window)
	if window.has_signal("change_screen_requested"):
		window.change_screen_requested.connect(emit_change_scene)
	if next_window:
		window.next_scene = next_window
	$Camera3D.add_child(window)

func emit_change_scene(scene, next_scene):
	emit_signal("change_screen_requested", scene, next_scene)
