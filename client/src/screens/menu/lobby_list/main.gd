extends Node2D

signal change_window_requested(window, next_window)
signal change_screen_requested(scene, next_scene)

var prev_window

func _on_create_lobby_button_pressed() -> void:
	var menu_create_lobby = Globals.screen_menu_create_lobby.instantiate()
	menu_create_lobby.prev_window = self
	emit_signal("change_window_requested", menu_create_lobby, null)
