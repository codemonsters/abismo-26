extends Node2D

signal navigate_to(scene: PackedScene)	# Señal para notificar a Main.tscn que queremos apilar un nuevo submenú
signal navigate_back

const ONLINE_MAIN_SUBMENU = preload("res://screens/menu/submenus/online_main/main.tscn")	# Carga previa del submenú de juego online
const PLAY_OFFLINE_SCENE = "res://screens/game/main.tscn"	# Ruta a la escena principal del juego offline

func _on_play_offline_pressed() -> void:
	get_tree().change_scene_to_file(PLAY_OFFLINE_SCENE)

func _on_play_online_pressed() -> void:
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_connect()
	navigate_to.emit(ONLINE_MAIN_SUBMENU)	# Notifica a Main.tscn para que apile el submenú online

func _on_timer_intro_timeout() -> void:
	var intro = Globals.screen_intro.instantiate()
	intro.next_scene = get_parent().get_parent()
	emit_signal("change_screen_requested", intro, null)
