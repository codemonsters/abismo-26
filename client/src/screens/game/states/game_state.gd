extends Node
class_name GameState

func _notification(what):
	match what:
		NOTIFICATION_ENTER_TREE: enter()
		NOTIFICATION_EXIT_TREE: exit()

func enter():
	pass

func exit():
	pass

func process(_delta):
	pass

func physics_process(_delta):
	pass
