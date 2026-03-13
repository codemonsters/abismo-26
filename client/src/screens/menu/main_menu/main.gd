extends Node3D

func _on_play_offline_pressed() -> void:
	var game = Globals.screen_game.instantiate()
	var intro = Globals.screen_intro.instantiate()
	game.next_scene = get_parent().get_parent()
	intro.next_scene = game
	get_parent().get_parent().get_parent().change_screen(intro)


func _on_play_online_pressed() -> void:
	var online_menu = Globals.screen_menu_online.instantiate()
	online_menu.prev_scene = get_parent().get_parent()
	get_parent().get_parent().get_parent().change_screen(online_menu)


func _on_timer_intro_timeout() -> void:
	var intro = Globals.screen_intro.instantiate()
	intro.next_scene = get_parent().get_parent()
	get_parent().get_parent().get_parent().change_screen(intro)
