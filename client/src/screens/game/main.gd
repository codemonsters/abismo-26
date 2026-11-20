extends Node3D

signal change_screen_requested(scene, next_scene)
signal level_passed
var gravity = ProjectSettings.get_setting(&"physics/3d/default_gravity") * 2.5

@onready var camera = $Environment/Camera3D
var current_level_number = 0
var levels = []	# lista con los paths de las escenas que usamos como niveles
var next_scene

func _ready():
	for state in $States.get_children():
		state.disable()
	for level_number in range(1, 5):
		var number = "0" + str(level_number)
		var level_path = "res://screens/game/levels/level" + number + "/main.tscn"
		levels.append(level_path)
	$States/LevelLoading.enable()
	start_network()



func _process(delta):
	if Input.is_action_just_pressed("space"):
		level_passed.emit()


# Segundos que espera un cliente online antes de conectarse, para dar tiempo al host a abrir el puerto
const ONLINE_CLIENT_JOIN_DELAY := 1.0

# Offline (Globals.online_match vacío): hacemos de host local, como siempre.
# Online: el propietario de la habitación hace de host y el resto se conecta a él.
func start_network():
	var online_match: Dictionary = Globals.online_match
	Globals.online_match = {} # para que una partida offline posterior no herede esta configuración
	if online_match.is_empty():
		host()
		return
	# si el propietario de la habitación abandona el servidor de lobbies, volvemos al menú online
	$"/root/Main/ModalWindowRoot/ServerPopup".room_destroyed.connect(_on_online_room_destroyed)
	if online_match.is_host:
		$"UI/Network Popup/LAN Bootstrapper".host_on(online_match.host_port)
	else:
		await get_tree().create_timer(ONLINE_CLIENT_JOIN_DELAY).timeout
		$"UI/Network Popup/LAN Bootstrapper".join_to(online_match.host_ip, online_match.host_port)


func host():
	$"UI/Network Popup/LAN Bootstrapper".host()


func _on_online_room_destroyed(_room_name: String, _owner: String, _reason: String) -> void:
	# el aviso al jugador lo muestra la pantalla del lobby, que también vuelve a la lista de habitaciones
	leave_online_match()


# Cierra la conexión de la partida y vuelve a la pantalla de menú (next_scene)
func leave_online_match() -> void:
	var peer = multiplayer.multiplayer_peer
	if peer != null:
		peer.close()
	multiplayer.multiplayer_peer = null
	NetworkTime.stop()
	emit_signal("change_screen_requested", next_scene, null)
	queue_free()


func _on_level_passed() -> void:
	for child in $CurrentLevel.get_children():
		child.queue_free()
	current_level_number += 1
	if current_level_number >= 1:
		gravity = ProjectSettings.get_setting(&"physics/3d/default_gravity") * 0.2
	var current_level = load(levels[current_level_number])
	var current_scene = current_level.instantiate()
	$CurrentLevel.add_child(current_scene)
