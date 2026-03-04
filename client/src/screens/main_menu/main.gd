extends Node3D

'''
Efecto de agua "Simple Water in Godot - Godot 4 Tutorial" (autor: Omogonix): https://www.youtube.com/watch?v=Ej_RyOG3d0c
'''

func _ready() -> void:
	$Water/AnimationPlayer.play("water_flow")


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
