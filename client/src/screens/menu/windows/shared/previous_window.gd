extends Node2D

func _on_button_pressed() -> void:
	get_parent().emit_signal("change_window_requested", get_parent().prev_window, null)
