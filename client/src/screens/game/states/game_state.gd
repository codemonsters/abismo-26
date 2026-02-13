extends Node
class_name GameState

'''
func _notification(what):
	match what:
		NOTIFICATION_ENTER_TREE: enter()
		NOTIFICATION_EXIT_TREE: exit()
'''

func enable():
	process_mode = Node.PROCESS_MODE_INHERIT
	enter()

func disable():
	exit()
	process_mode = Node.PROCESS_MODE_DISABLED

func enter():
	pass

func exit():
	pass
