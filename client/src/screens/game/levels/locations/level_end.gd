extends Area3D

signal level_complete

func _on_body_entered(body: Node3D) -> void:
	if body.is_in_group("players"):
		print("level complete!!")
		emit_signal("level_complete")
