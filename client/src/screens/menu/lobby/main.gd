extends SubMenu

var _match_starting := false # true desde que llega match_started (para no arrancar dos veces)
var _in_room := true         # false cuando la habitación ya no existe (no hace falta abandonarla)

func _server() -> Node:
	return $"/root/Main/ModalWindowRoot/ServerPopup"

func _ready() -> void:
	var server = _server()
	server.match_started.connect(_on_match_started)
	server.match_start_failed.connect(_on_match_start_failed)
	server.room_destroyed.connect(_on_room_destroyed)
	show_error_message("")

func show_error_message(message: String) -> void:
	$ErrorMessage.text = message

func _on_iniciar_partida_pressed() -> void:
	show_error_message("")
	_server().ls_send_command("start_match")

func _on_match_start_failed(details: String) -> void:
	show_error_message(details)

# Llega a todos los jugadores de la habitación (también al propietario). ServerPopup ya ha guardado en
# Globals.online_match si somos el host o a qué ip/puerto tenemos que conectarnos; la pantalla de juego
# lo lee al arrancar. La conexión con el servidor de lobbies se mantiene abierta durante la partida.
func _on_match_started(host_ip: String, host_port: int, host_username: String) -> void:
	if _match_starting:
		return
	_match_starting = true
	print("Partida iniciada por %s (%s:%d)" % [host_username, host_ip, host_port])
	var game = Globals.screen_game.instantiate()
	game.next_scene = get_parent() # al terminar la partida se vuelve al menú
	emit_signal("change_screen_requested", game, null)

func _on_room_destroyed(_room_name: String) -> void:
	_in_room = false
	pop()

func on_popped() -> void:
	if _in_room:
		_server().ls_send_command("leave_current_room")
