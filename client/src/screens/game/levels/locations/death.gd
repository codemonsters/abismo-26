extends Area3D
# Called when the node enters the scene tree for the first time.
func _ready():
	add_to_group("enemigos")
# Called every frame. 'delta' is the elapsed time since the previous frame.
func _on_area_3d_body_entered(body: Area3D) -> void:
	if body.is_in_group("players") or body.is_in_group("enemies"):
		body.apply_damage(100)
