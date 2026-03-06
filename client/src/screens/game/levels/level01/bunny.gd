extends Node3D
extends CharacterBody3D

func _ready():
	position = Vector3(0, 1, 13)

func _rollback_tick(delta, _tick, _is_fresh):
	# Add the gravity.
	if not is_on_floor():
		velocity.y -= gravity * delta

	if velocity.z < 0:
		$blockbench_export.rotation_degrees.y = 0
	elif velocity.z > 0:
		$blockbench_export.rotation_degrees.y = -180
		
	if is_on_floor():
			$blockbench_export/AnimationPlayer.play("jumping_walking")
			velocity.y = 3.5
