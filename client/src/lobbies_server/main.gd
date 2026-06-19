extends Node

class_name LobbiesServer

@export var websocket_url = "ws://127.0.0.1:9090"

signal ls_connection_closed
signal ls_connected
signal logged_in(success: bool, details: String)

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
	_wsc.send(message)
	
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
	
func on_ls_message_received(message: String):
	var message_dict = JSON.parse_string(message)
	if message_dict.has("cmd"):
		var cmd = message_dict["cmd"]
		if cmd == "logged_in":
			parse_logged_in_message(message_dict)
		else:
			print("WARNING: mensaje con comando desconocido ignorado: ", message)

func parse_logged_in_message(message_dict: Dictionary):
	var success = false
	if message_dict.has("success"):
		success = message_dict["success"]
		if success != true: success = false

	var details = null
	if message_dict.has("data"):
		var data = message_dict["data"]
		if data.has("details"):
			details = data["details"]
	
	if details != null:
		logged_in.emit(success, details)
