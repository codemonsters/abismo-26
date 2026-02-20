extends Camera3D

@export var target: Node3D  # Asigna aquí tu nodo Jugador desde el inspector
@export var smooth_speed: float = 5.0
@export var offset: Vector3 = Vector3(20, 0, 0) # Ajusta la distancia (X, Y, Z)
var map_length = 48

func _physics_process(delta):
	if target:
		# Calculamos dónde debería estar la cámara
		var target_pos = target.global_position + offset
		target_pos.x = offset.x
		target_pos.y = 3
		# hace que la camara no se mueva llegado el final del mundo
		if target_pos.z <= -map_length/2 + 9.5:
			target_pos.z = -14.5
		elif target_pos.z >= map_length/2 - 9:
			target_pos.z = 16.75
		# Movemos la cámara suavemente hacia esa posición usando interpolación lineal (Lerp)
		global_position = global_position.lerp(target_pos, smooth_speed * delta)
