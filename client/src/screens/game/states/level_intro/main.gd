extends "res://screens/game/states/game_state.gd"
class_name LevelIntroState

func enter():
	print("Entering Level Intro")
	$IntroTip.set_position(Vector2(0, -40))
	var tween = get_tree().create_tween()
	tween.set_parallel(true)
	tween.tween_property($IntroTip, "position", Vector2(0, 648), 3.0)
	tween.tween_property($IntroTip, "modulate", Color(1, 1, 1, 0), 3.0)
	tween.finished.connect(_on_tween_finished)

func exit():
	print("Exiting Level Intro")

func _process(delta):
	pass

func _physics_process(delta):
	pass

func _on_tween_finished():
	$"../Playing".enable()
	disable()
