extends Node2D

func _on_button_pressed() -> void:
	if get_parent().has_method("after_back_pressed"):
		get_parent().after_back_pressed()
	get_parent().emit_signal("change_window_requested", get_parent().prev_window, null)
