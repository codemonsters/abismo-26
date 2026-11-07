extends SubMenu

# Pantalla del menú (nodo screens/menu/main.gd, padre de los submenús) a la que
# se vuelve al terminar la intro o la partida.
func _menu_screen() -> Node:
	return get_parent()

func _on_play_offline_pressed() -> void:
	var game = Globals.screen_game.instantiate()
	var intro = Globals.screen_intro.instantiate()
	game.next_scene = _menu_screen()
	intro.next_scene = game
	emit_signal("change_screen_requested", intro, null)

func _on_play_online_pressed() -> void:
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_connect()
	push(Globals.screen_menu_online)

func _on_timer_intro_timeout() -> void:
	$TimerIntro.start() # se rearma para la próxima vez que el menú quede inactivo
	var intro = Globals.screen_intro.instantiate()
	intro.next_scene = _menu_screen()
	emit_signal("change_screen_requested", intro, null)
