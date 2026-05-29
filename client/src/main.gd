extends Node2D

func _ready() -> void:
	var screen_menu = Globals.screen_menu.instantiate()
	change_screen(screen_menu)

func change_screen(scene, next_scene = null):
	if get_node_or_null("ScreenRoot/current_screen") != null: $ScreenRoot.remove_child(get_node("ScreenRoot/current_screen"))
	scene.name = "current_screen"
	if scene.has_signal("change_screen_requested"):
		scene.change_screen_requested.connect(change_screen) #TODO: probar for child in get_tree()
	if next_scene:
		scene.next_scene = next_scene
	$ScreenRoot.add_child(scene)
