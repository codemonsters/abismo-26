extends Node3D

signal change_screen_requested(scene, next_scene)

func _on_play_offline_pressed() -> void:
	var game = Globals.screen_game.instantiate()
	var intro = Globals.screen_intro.instantiate()
	game.next_scene = get_parent().get_parent()
	intro.next_scene = game
	emit_signal("change_screen_requested", intro, null)


func _on_play_online_pressed() -> void:
	var online_menu = Globals.screen_menu_online.instantiate()
	online_menu.prev_scene = get_parent().get_parent()
	emit_signal("change_screen_requested", online_menu, null)


func _on_timer_intro_timeout() -> void:
	var intro = Globals.screen_intro.instantiate()
	intro.next_scene = get_parent().get_parent()
	emit_signal("change_screen_requested", intro, null)
