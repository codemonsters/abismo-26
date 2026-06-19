extends Node3D

func _on_area_3d_body_entered(body: Node3D) -> void:
	print("here")
	if body.is_in_group("players"):
		print("player")
		$blockbench_export/AnimationPlayer.play("one at a time")
