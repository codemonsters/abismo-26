extends Node3D

signal escafandra_recogida

func _process(delta):
	rotate(Vector3(0, 1, 0), delta * 5)


func _on_area_3d_body_entered(body: Node3D) -> void:
	if body.is_in_group("players"):
		queue_free()
		escafandra_recogida.emit()
