extends Node2D

func _on_button_pressed() -> void:
	get_parent().change_screen(Globals.menu_offline)


func _on_button_2_pressed() -> void:
	get_parent().change_screen(Globals.menu_online)
