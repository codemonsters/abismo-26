extends Node2D

func _ready() -> void:
	var main_menu = Globals.scn_main_menu.instantiate()
	change_screen(main_menu)

func change_screen(scene, next_scene = null):
	if get_node_or_null("current_screen") != null: remove_child(get_node("current_screen"))
	scene.name = "current_screen"
	if next_scene:
		scene.next_scene = next_scene
	add_child(scene)
