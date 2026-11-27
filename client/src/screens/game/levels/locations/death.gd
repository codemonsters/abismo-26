extends Area3D
# Called when the node enters the scene tree for the first time.

# Called every frame. 'delta' is the elapsed time since the previous frame.
var v = null

func _ready():
	var module = -10.0
	v = Vector3.UP * module
	var angle = randf_range(-30.0, 30.0)
	v = v.rotated(Vector3.UP, deg_to_rad(angle))

func _on_body_entered(body: Node3D) -> void:
	if body.is_in_group("players") or body.is_in_group("enemies"):
		body.apply_damage(100, v)
		
