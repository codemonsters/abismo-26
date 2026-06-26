extends Node2D

signal change_window_requested(window, next_window)
signal change_screen_requested(scene, next_scene)

var prev_window

func _ready() -> void:
	$"/root/Main/ModalWindowRoot/ServerPopup".lobby_created.connect(on_lobby_created)
	$LobbyName.call_deferred("grab_focus")

func _on_button_create_lobby_pressed() -> void:
	_send_create_lobby_request($LobbyName.text)

func _on_lobby_name_text_submitted(new_text: String) -> void:
	_send_create_lobby_request(new_text)

func _send_create_lobby_request(lobby_name):
	if len(lobby_name) < 1:
		show_error_message("Falta el nombre de la partida")
	else:
		show_error_message("")
		var message_dict = {
			"cmd": "create_and_join_room",
			"data": { "room_name": lobby_name }
		}
		$"/root/Main/ModalWindowRoot/ServerPopup".ls_send_message(JSON.stringify(message_dict))
		
func show_error_message(message):
	$ErrorMessage.text = message

func on_lobby_created(success: bool, details: String):
	if success:
		var menu_lobby = Globals.screen_menu_lobby.instantiate()
		menu_lobby.prev_window = self
		emit_signal("change_window_requested", menu_lobby, null)
	else:
		show_error_message(details)
