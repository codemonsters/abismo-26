extends Node3D

func _on_area_3d_body_entered(body: Node3D) -> void:
	if body.is_in_group("players"):
		print("player")
		$blockbench_export/AnimationPlayer.play("one at a time")
		#el siguiente churro de código es para que las dos animaciones no se ejecuten a la vez
		await get_tree().create_timer($blockbench_export/AnimationPlayer.current_animation_length + 0.15).timeout
		$blockbench_export/AnimationPlayer.play("hit the floor")
