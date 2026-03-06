extends Node3D

func _ready():
	position = Vector3(0, 1, 13)

func _rollback_tick(delta, _tick, _is_fresh):
	if not is_on_floor():
		velocity.y -= gravity * delta

	var input_dir = input.movement
	var direction = (transform.basis * Vector3(0, 0, input_dir.z)).normalized()
	$blockbench_export/AnimationPlayer.play("jumping_walking")
