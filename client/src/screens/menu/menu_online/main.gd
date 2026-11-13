extends SubMenu

const DISCONNECT_TIMEOUT := 2.0

var _leaving := false # true mientras nos desconectamos al pulsar volver

func _ready() -> void:
	$"/root/Main/ModalWindowRoot/ServerPopup".logged_in.connect(on_logged_in)
	$"TabContainer/Jugar como invitado/GuestUsername".call_deferred("grab_focus")
	show_error_message("")

# Al volver, primero nos desconectamos del servidor y solo entonces salimos de la pila.
func pop() -> void:
	if _leaving:
		return
	_leaving = true
	var server = $"/root/Main/ModalWindowRoot/ServerPopup"
	server.ls_send_message(JSON.stringify({ "cmd": "disconnect" }))
	# El mensaje se envía en el siguiente poll() del socket: esperamos un par de
	# fotogramas para que salga antes de cerrar la conexión.
	await get_tree().process_frame
	await get_tree().process_frame
	# Esperamos a que la conexión se cierre (o DISCONNECT_TIMEOUT como máximo,
	# por si el servidor no responde). Lo que ocurra antes reanuda la espera.
	var timer := get_tree().create_timer(DISCONNECT_TIMEOUT)
	server.ls_connection_closed.connect(timer.timeout.emit, CONNECT_ONE_SHOT)
	server.ls_disconnect()
	await timer.timeout
	super.pop()

func show_error_message(message):
	$"TabContainer/Jugar como invitado/ErrorMessage".text = message

func _on_button_join_as_guest_pressed() -> void:
	_send_guest_login_request($"TabContainer/Jugar como invitado/GuestUsername".text)

func _on_guest_username_text_submitted(new_text: String) -> void:
	_send_guest_login_request(new_text)

func _send_guest_login_request(username):
	if _leaving:
		return
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
	if _leaving:
		return
	if success:
		push(Globals.screen_menu_lobby_list)
	else:
		show_error_message(details)
