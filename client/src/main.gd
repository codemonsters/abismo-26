extends Node2D

func _ready() -> void:
	change_screen(Globals.scn_main_menu)

func change_screen(scene):
	if get_node_or_null("current_screen") != null: remove_child(get_node("current_screen"))
	var s = scene.instantiate()
	s.name = "current_screen"
	add_child(s)
