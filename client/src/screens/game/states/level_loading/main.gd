extends "res://screens/game/states/game_state.gd"
class_name LevelLoadingState

func enter():
	print("Entering Level Loading")
	var current_level = load(get_parent().get_parent().levels[get_parent().get_parent().current_level_number])
	var current_scene = current_level.instantiate()
	$"../../CurrentLevel".add_child(current_scene)


func exit():
	print("Exiting Level Loading")


func process(_delta):
	get_parent().set_state("level_intro")


func physics_process(_delta):
	pass
