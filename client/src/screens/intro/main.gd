extends Node2D

func _process(delta: float) -> void:
	$Timer/Label.text = str($Timer.time_left)

func _on_timer_timeout() -> void:
	get_parent().change_screen(Globals.scn_game)

func _input(event: InputEvent) -> void:
	# Skip intro on space or click
	if event.is_action_pressed("ui_accept") or (event is InputEventMouseButton and event.pressed):
		$Timer.stop()
		_on_timer_timeout()
