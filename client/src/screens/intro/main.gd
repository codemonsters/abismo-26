extends Node2D

signal change_screen_requested(scene, next_scene)

var next_scene

func _process(delta: float) -> void:
	$Timer/Label.text = str($Timer.time_left)

func _on_timer_timeout() -> void:
	emit_signal("change_screen_requested", next_scene, null)

func _input(event: InputEvent) -> void:
	# Skip intro on space or click
	if event.is_action_pressed("ui_accept") or (event is InputEventMouseButton and event.pressed):
		$Timer.stop()
		_on_timer_timeout()
