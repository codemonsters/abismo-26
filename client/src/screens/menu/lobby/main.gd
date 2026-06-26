extends Node2D

signal change_window_requested(window, next_window)
signal change_screen_requested(scene, next_scene)

var prev_window

func _on_iniciar_partida_pressed() -> void:
	assert(false, "NO IMPLEMENTADO")
	var message_dict = {
		"cmd": "start_match"
	}
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_send_message(JSON.stringify(message_dict))
