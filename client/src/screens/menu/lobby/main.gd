extends SubMenu
## Habitación en la que está el jugador: lista de jugadores de la habitación y botón para que el
## propietario inicie la partida. Para cambiarse a otra habitación hay que volver a la lista de
## habitaciones (al volver atrás se abandona la habitación actual).

const RoomListUtils = preload("res://screens/menu/shared/room_list_utils.gd")

var _match_starting := false # true desde que llega match_started (para no arrancar dos veces)
var _in_room := true         # false cuando ya no estamos en la habitación (no hace falta abandonarla)
var _current_room := {}      # habitación actual, tal como la devuelve get_rooms

# Se guarda al entrar en el árbol: esta pantalla puede recibir señales del servidor estando fuera del
# árbol (durante la partida), y desde fuera del árbol no se pueden usar rutas absolutas.
@onready var _server_node: Node = $"/root/Main/ModalWindowRoot/ServerPopup"

func _server() -> Node:
	return _server_node

func _ready() -> void:
	var server = _server()
	server.match_started.connect(_on_match_started)
	server.match_start_failed.connect(_on_match_start_failed)
	server.room_destroyed.connect(_on_room_destroyed)
	server.rooms_received.connect(_on_rooms_received)
	server.rooms_changed.connect(_refresh_if_visible)
	$IniciarPartida.disabled = true # hasta saber si somos el propietario
	show_error_message("")
	refresh_rooms()

func show_error_message(message: String) -> void:
	$ErrorMessage.text = message

func refresh_rooms() -> void:
	_server().ls_send_command("get_rooms")

func _refresh_if_visible() -> void:
	if is_visible_in_tree():
		refresh_rooms()

func _on_refresh_button_pressed() -> void:
	show_error_message("")
	refresh_rooms()

func _on_rooms_received(rooms: Array) -> void:
	if not _in_room:
		return
	_current_room = RoomListUtils.find_room_of(rooms, Globals.username)
	if _current_room.is_empty():
		# el servidor dice que ya no estamos en ninguna habitación (por ejemplo, nos han expulsado)
		_leave_screen("Ya no estás en la sala.")
		return
	$PlayersTitle.text = "Jugadores en la sala «%s»" % _current_room.room_name
	var player_list: ItemList = $PlayerList
	player_list.clear()
	for player in _current_room.get("players", []):
		var text := str(player)
		if player == _current_room.get("owner"):
			text += " (propietario)"
		if player == Globals.username:
			text += " (tú)"
		player_list.add_item(text)
	$IniciarPartida.disabled = _current_room.get("owner") != Globals.username

# --- Inicio de la partida

func _on_iniciar_partida_pressed() -> void:
	show_error_message("")
	_server().ls_send_command("start_match")

func _on_match_start_failed(details: String) -> void:
	show_error_message(details)

# Llega a todos los jugadores de la habitación (también al propietario). ServerPopup ya ha guardado en
# Globals.online_match si somos el host o a qué ip/puerto tenemos que conectarnos; la pantalla de juego
# lo lee al arrancar. La conexión con el servidor de lobbies se mantiene abierta durante la partida.
func _on_match_started(host_ip: String, host_port: int, host_username: String) -> void:
	if _match_starting or not _in_room:
		return
	_match_starting = true
	print("Partida iniciada por %s (%s:%d)" % [host_username, host_ip, host_port])
	var game = Globals.screen_game.instantiate()
	game.next_scene = get_parent() # al terminar la partida se vuelve al menú
	emit_signal("change_screen_requested", game, null)

# --- Salir de la habitación

# El propietario ha abandonado la habitación o se ha desconectado del servidor: la habitación ya no
# existe, así que avisamos y volvemos al menú principal del juego online (la lista de habitaciones).
# Si estamos jugando, la propia pantalla de juego se encarga de volver al menú.
func _on_room_destroyed(room_name: String, owner: String, reason: String) -> void:
	if not _in_room:
		return
	_in_room = false
	var who := "El propietario de la sala «%s»" % room_name
	if owner != "":
		who += " (%s)" % owner
	if reason == "owner_disconnected":
		_leave_screen(who + " se ha desconectado del servidor. La sala se ha cerrado.")
	else:
		_leave_screen(who + " ha abandonado la sala. La sala se ha cerrado.")

func _leave_screen(message: String) -> void:
	_in_room = false
	_server().show_message(message)
	pop()

func on_popped() -> void:
	if _in_room:
		_server().ls_send_command("leave_current_room")
