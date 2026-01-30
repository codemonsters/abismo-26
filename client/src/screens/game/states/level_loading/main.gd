extends "res://screens/game/states/game_state.gd"
class_name LevelLoadingState

func enter():
	print("Entering Level Loading")

func exit():
	print("Exiting Level Loading")

func process(_delta):
	get_parent().set_state("level_intro")

func physics_process(_delta):
	pass
