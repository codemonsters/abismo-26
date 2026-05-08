extends Camera3D

@export var target: Node3D  # Asigna aquí tu nodo Jugador desde el inspector
@export var smooth_speed: float = 5.0
@export var offset: Vector3 = Vector3(20, 0, 0) # Ajusta la distancia (X, Y, Z)
var map_length = 114.9

func _physics_process(delta):
	if target:
		# Calculamos dónde debería estar la cámara
		var target_pos = target.global_position + offset
		target_pos.x = offset.x
		target_pos.y = 6
		# hace que la camara no se mueva llegado el final del mundo
		"""if target_pos.z <= -map_length:
			target_pos.z = -114.9
		elif target_pos.z >= 0:
			target_pos.z = 0"""
		target_pos.z = clamp(target_pos.z, -map_length, 0)
		rotation_degrees.x = -10
		# Movemos la cámara suavemente hacia esa posición usando interpolación lineal (Lerp)
		global_position = global_position.lerp(target_pos, smooth_speed * delta)
