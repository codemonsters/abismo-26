extends Node3D

func _on_play_offline_pressed() -> void:
	var game = Globals.scn_game.instantiate()
	var intro = Globals.scn_intro.instantiate()
	game.next_scene = self
	intro.next_scene = game
	get_parent().change_screen(intro)


func _on_play_online_pressed() -> void:
	var online_menu = Globals.scn_menu_online.instantiate()
	online_menu.prev_scene = self
	get_parent().change_screen(online_menu)


func _on_timer_intro_timeout() -> void:
	var intro = Globals.scn_intro.instantiate()
	intro.next_scene = self
	get_parent().change_screen(intro)
