extends Camera3D

@export var target: Node3D  # Asigna aquí tu nodo Jugador desde el inspector
@export var smooth_speed: float = 5.0
@export var offset: Vector3 = Vector3(0, 0, 20) # Ajusta la distancia (X, Y, Z)

func _physics_process(delta):
	if target:
		# Calculamos dónde debería estar la cámara
		var target_pos = target.global_position + offset
		
		# Opcional: Para un 2.5D estricto (side-scroller), 
		# quizás quieras bloquear el eje Z o Y para que la cámara no tiemble.
		target_pos.z = offset.z  # Descomenta esto para fijar la profundidad
		
		# Movemos la cámara suavemente hacia esa posición usando interpolación lineal (Lerp)
		global_position = global_position.lerp(target_pos, smooth_speed * delta)
