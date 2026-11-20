extends SubMenu

var _joining := false # true mientras esperamos la respuesta a un join_room

func _server() -> Node:
	return $"/root/Main/ModalWindowRoot/ServerPopup"

func _ready() -> void:
	var server = _server()
	server.rooms_received.connect(_on_rooms_received)
	server.room_joined.connect(_on_room_joined)
	server.new_room_available.connect(func(_room_name): _refresh_if_visible())
	server.room_destroyed.connect(func(_room_name): _refresh_if_visible())
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
	var room_list: ItemList = $RoomList
	room_list.clear()
	for room in rooms:
		if typeof(room) != TYPE_DICTIONARY or not room.has("room_name"):
			continue
		var room_name := str(room["room_name"])
		var players := int(room.get("number_of_players", 0))
		var index := room_list.add_item("%s (%d %s)" % [room_name, players, "jugador" if players == 1 else "jugadores"])
		room_list.set_item_metadata(index, room_name)

func _on_create_lobby_button_pressed() -> void:
	push(Globals.screen_menu_create_lobby)

func _on_refresh_button_pressed() -> void:
	show_error_message("")
	refresh_rooms()

func _on_join_button_pressed() -> void:
	var selected: PackedInt32Array = $RoomList.get_selected_items()
	if selected.is_empty():
		show_error_message("Selecciona una partida")
		return
	_join(selected[0])

func _on_room_list_item_activated(index: int) -> void:
	_join(index)

func _join(index: int) -> void:
	if _joining:
		return
	_joining = true
	show_error_message("")
	_server().ls_send_command("join_room", { "name": $RoomList.get_item_metadata(index) })

func _on_room_joined(success: bool, details: String) -> void:
	if not _joining:
		return
	_joining = false
	if success:
		push(Globals.screen_menu_lobby)
	else:
		show_error_message(details)
		refresh_rooms()
