extends Node2D

signal change_window_requested(window, next_window)
signal change_screen_requested(scene, next_scene)

var prev_window

func _ready() -> void:
	$"/root/Main/ModalWindowRoot/ServerPopup".logged_in.connect(on_logged_in)
	$"TabContainer/Jugar como invitado/GuestUsername".call_deferred("grab_focus")
	show_error_message("")

func after_back_pressed():
	$"/root/Main/ModalWindowRoot/ServerPopup".ls_disconnect()

func show_error_message(message):
	$"TabContainer/Jugar como invitado/ErrorMessage".text = message

func _on_button_join_as_guest_pressed() -> void:
	_send_guest_login_request($"TabContainer/Jugar como invitado/GuestUsername".text)

func _on_guest_username_text_submitted(new_text: String) -> void:
	_send_guest_login_request(new_text)

func _send_guest_login_request(username):
	if len(username) < 1:
		show_error_message("Introduce tu nombre de usuario")
	else:
		show_error_message("")
		var message_dict = {
			"cmd": "login",
			"data": { "username": username }
		}
		$"/root/Main/ModalWindowRoot/ServerPopup".ls_send_message(JSON.stringify(message_dict))

func _on_guest_username_text_changed(new_text: String) -> void:
	show_error_message("")
	
func on_logged_in(success: bool, details: String):
	if success:
		var menu_lobby_list = Globals.screen_menu_lobby_list.instantiate()
		menu_lobby_list.prev_window = self
		emit_signal("change_window_requested", menu_lobby_list, null)
	else:
		show_error_message(details)
