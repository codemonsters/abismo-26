extends Node2D

func _on_button_pressed() -> void:
	get_parent().emit_signal("change_screen_requested", get_parent().prev_scene, null)
