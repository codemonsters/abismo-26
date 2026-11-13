extends SubMenu

func _on_iniciar_partida_pressed() -> void:
	var message_dict = {
		"cmd": "start_match"
	}
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_send_message(JSON.stringify(message_dict))
	assert(false, "NO IMPLEMENTADO")
