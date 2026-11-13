extends Node3D

var v = null

func _ready():
	add_to_group("enemigos")
	var module = 10.0
	v = Vector3.UP * module
	var angle = randf_range(-30.0, 30.0)
	v = v.rotated(Vector3.UP, deg_to_rad(angle))


func _on_area_3d_body_entered(body: Node3D) -> void:
	if body.is_in_group("players"):
		body.apply_damage(10, v)
