extends Node

class_name LobbiesServer

@export var websocket_url = "ws://127.0.0.1:9090"

signal ls_connection_closed
signal ls_connected
signal logged_in(success: bool, details: String)
signal lobby_created(success: bool, details: String)
signal rooms_received(rooms: Array)
signal room_joined(success: bool, details: String)
signal room_destroyed(room_name: String, owner: String, reason: String)
signal rooms_changed
signal new_room_available(room_name: String)
signal match_start_failed(details: String)
signal match_started(host_ip: String, host_port: int, host_username: String)

var _wsc = WebSocketClient.new()
var _button_pressed_callback

func _ready() -> void:
	_wsc.message_received.connect(on_ls_message_received)
	_wsc.connected_to_server.connect(on_ls_connected)
	_wsc.connection_closed.connect(on_ls_connection_closed)

func _process(delta: float) -> void:
	_wsc.poll()

func _show_modal_window(text, button_text, button_pressed_callback):
	_button_pressed_callback = button_pressed_callback
	$ColorRect/ColorRect2/RichTextLabel.text = text
	$ColorRect/ColorRect2/Button.text = button_text
	$ColorRect/ColorRect2/Button.disabled = false
	get_node("/root/Main/ModalWindowRoot/ServerPopup").visible = true

func ls_connect():
	_show_modal_window("Conectando al servidor...", "Cancelar", on_cancel_pressed)
	_wsc.connect_to_url(websocket_url)

func ls_disconnect():
	_wsc.close()

func ls_send_message(message):
	if _wsc.get_socket().get_ready_state() != WebSocketPeer.STATE_OPEN:
		print("WARNING: no conectado al servidor de lobbies, mensaje no enviado: ", message)
		return
	_wsc.send(message)

# Envía un comando { "cmd": cmd, "data": data } al servidor de lobbies
func ls_send_command(cmd: String, data: Dictionary = {}):
	ls_send_message(JSON.stringify({ "cmd": cmd, "data": data }))
	
func on_ls_connected():
	print("lobby server: conectado")
	get_node("/root/Main/ModalWindowRoot/ServerPopup").visible = false
	ls_connected.emit()
	
func on_ls_connection_closed():
	print("lobby server: desconectado")
	ls_connection_closed.emit()
	
func _on_button_pressed() -> void:
	print("funciona")
	_button_pressed_callback.call()
	
func on_cancel_pressed():
	self.visible = false

# Muestra un mensaje informativo en la ventana modal (se cierra con el botón Aceptar)
func show_message(text: String):
	_show_modal_window(text, "Aceptar", on_cancel_pressed)
	
func on_ls_message_received(message: String):
	var message_dict = JSON.parse_string(message)
	if typeof(message_dict) != TYPE_DICTIONARY or not message_dict.has("cmd"):
		print("WARNING: mensaje mal formado ignorado: ", message)
		return
	var data = message_dict.get("data", {})
	if typeof(data) != TYPE_DICTIONARY:
		data = {}
	match message_dict["cmd"]:
		"login":
			var result = _parse_success_details(message_dict)
			logged_in.emit(result.success, result.details)
		"create_and_join_room":
			var result = _parse_success_details(message_dict)
			lobby_created.emit(result.success, result.details)
		"join_room":
			var result = _parse_success_details(message_dict)
			room_joined.emit(result.success, result.details)
		"get_rooms":
			if message_dict.get("success") == true:
				var rooms = data.get("rooms", [])
				rooms_received.emit(rooms if typeof(rooms) == TYPE_ARRAY else [])
		"new_room_available":
			new_room_available.emit(str(data.get("name", "")))
		"rooms_changed":
			rooms_changed.emit()
		"room_destroyed":
			room_destroyed.emit(str(data.get("name", "")), str(data.get("owner", "")), str(data.get("reason", "")))
		"start_match":
			var result = _parse_success_details(message_dict)
			if not result.success:
				match_start_failed.emit(result.details)
		"match_started":
			parse_match_started_message(data)
		"leave_current_room", "player_joined_current_room", "player_left_current_room", "player_kicked_from_current_room", "room_message":
			pass # de momento no se usan
		_:
			print("WARNING: mensaje con comando desconocido ignorado: ", message)

# Devuelve { "success": bool, "details": String } a partir de una respuesta del servidor
func _parse_success_details(message_dict: Dictionary) -> Dictionary:
	var details = ""
	var data = message_dict.get("data", {})
	if typeof(data) == TYPE_DICTIONARY and data.has("details"):
		details = str(data["details"])
	return { "success": message_dict.get("success") == true, "details": details }

func parse_match_started_message(data: Dictionary):
	var host_ip = str(data.get("host_ip", ""))
	var host_port = int(data.get("host_port", 0))
	var host_username = str(data.get("host_username", ""))
	if host_ip == "" or host_port <= 0:
		print("WARNING: mensaje match_started sin host_ip o host_port: ", data)
		return
	Globals.online_match = {
		"is_host": host_username != "" and host_username == Globals.username,
		"host_ip": host_ip,
		"host_port": host_port,
	}
	match_started.emit(host_ip, host_port, host_username)
