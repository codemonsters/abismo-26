extends Node3D

func _ready():
	add_to_group("enemigos")


func _on_area_3d_body_entered(body: Node3D) -> void:
	if body.is_in_group("players"):
		body.apply_damage(10)
