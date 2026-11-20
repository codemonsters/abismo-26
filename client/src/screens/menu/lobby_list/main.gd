extends SubMenu
## Menú principal del juego online: lista de habitaciones creadas, unirse a una o crear una nueva.

const RoomListUtils = preload("res://screens/menu/shared/room_list_utils.gd")

var _joining := false # true mientras esperamos la respuesta a un join_room

# Se guarda al entrar en el árbol: esta pantalla puede recibir señales del servidor estando fuera del
# árbol (durante la partida), y desde fuera del árbol no se pueden usar rutas absolutas.
@onready var _server_node: Node = $"/root/Main/ModalWindowRoot/ServerPopup"

func _server() -> Node:
	return _server_node

func _ready() -> void:
	var server = _server()
	server.rooms_received.connect(_on_rooms_received)
	server.room_joined.connect(_on_room_joined)
	server.rooms_changed.connect(_refresh_if_visible)
	# al volver a esta pantalla (por ejemplo, tras salir de una habitación) refrescamos la lista
	visibility_changed.connect(_refresh_if_visible)
	show_error_message("")
	refresh_rooms()

func show_error_message(message: String) -> void:
	$ErrorMessage.text = message

func refresh_rooms() -> void:
	_server().ls_send_command("get_rooms")

func _refresh_if_visible() -> void:
	if is_visible_in_tree():
		refresh_rooms()

func _on_rooms_received(rooms: Array) -> void:
	RoomListUtils.fill_room_list($RoomList, rooms)

func _on_create_lobby_button_pressed() -> void:
	push(Globals.screen_menu_create_lobby)

func _on_refresh_button_pressed() -> void:
	show_error_message("")
	refresh_rooms()

func _on_join_button_pressed() -> void:
	var room_name := RoomListUtils.get_selected_room_name($RoomList)
	if room_name == "":
		show_error_message("Selecciona una partida")
		return
	_join(room_name)

func _on_room_list_item_activated(index: int) -> void:
	_join(str($RoomList.get_item_metadata(index)))

func _join(room_name: String) -> void:
	if _joining:
		return
	_joining = true
	show_error_message("")
	_server().ls_send_command("join_room", { "name": room_name })

func _on_room_joined(success: bool, details: String) -> void:
	if not _joining:
		return
	_joining = false
	if success:
		push(Globals.screen_menu_lobby)
	else:
		show_error_message(details)
		refresh_rooms()
