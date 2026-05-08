extends Node

class_name LobbiesServer

@export var websocket_url = "ws://127.0.0.1:9090"

var _wsc = WebSocketClient.new()

func _ready() -> void:
	_wsc.message_received.connect(on_message_received)
	_wsc.connected_to_server.connect(on_connect)
	_wsc.connection_closed.connect(on_connection_closed)

func _process(delta: float) -> void:
	_wsc.poll()

func _show_modal_window(text, button_text):
		$ColorRect/ColorRect2/RichTextLabel.text = text
		$ColorRect/ColorRect2/Button.text = button_text
		get_node("/root/Main/ServerPopup").visible = true

func ls_connect():
	_show_modal_window("Conectando al servidor...", "Cancelar")
	_wsc.connect_to_url(websocket_url)

func on_message_received():
	pass
	
func on_connect():
	get_node("/root/Main/ServerPopup").visible = false
	#TODO emitir mensaje para cambiar al siguiente menu
	
func on_connection_closed():
	pass
