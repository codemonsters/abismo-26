extends RefCounted
## Utilidades para mostrar la lista de habitaciones que devuelve el comando get_rooms del servidor de
## lobbies. Cada habitación es un diccionario { room_name, owner, number_of_players, players }.
## Se usa con preload() desde las pantallas lobby_list y lobby.


## Rellena `item_list` con las habitaciones. Los metadatos de cada fila contienen el nombre de la
## habitación. Si `current_room_name` no está vacío, esa habitación se marca como la actual.
static func fill_room_list(item_list: ItemList, rooms: Array, current_room_name := "") -> void:
	var selected_room_name := get_selected_room_name(item_list)
	item_list.clear()
	for room in rooms:
		if typeof(room) != TYPE_DICTIONARY or not room.has("room_name"):
			continue
		var room_name := str(room["room_name"])
		var players := int(room.get("number_of_players", 0))
		var text := "%s (%d %s)" % [room_name, players, "jugador" if players == 1 else "jugadores"]
		if room_name == current_room_name:
			text += " - estás aquí"
		var index := item_list.add_item(text)
		item_list.set_item_metadata(index, room_name)
		if room_name == selected_room_name:
			item_list.select(index) # conservamos la selección al refrescar


## Nombre de la habitación seleccionada en `item_list` ("" si no hay ninguna)
static func get_selected_room_name(item_list: ItemList) -> String:
	var selected := item_list.get_selected_items()
	if selected.is_empty():
		return ""
	return str(item_list.get_item_metadata(selected[0]))


## Devuelve la habitación en la que está `username` ({} si no está en ninguna)
static func find_room_of(rooms: Array, username: String) -> Dictionary:
	for room in rooms:
		if typeof(room) == TYPE_DICTIONARY and username in room.get("players", []):
			return room
	return {}
