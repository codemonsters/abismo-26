extends Node2D

func _on_button_pressed() -> void:
	get_parent().get_parent().change_screen(get_parent().prev_screen)
