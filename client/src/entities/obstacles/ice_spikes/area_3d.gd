extends Area3D

@export var damage_amount = 20

func _on_body_entered(body):
	if get_overlapping_bodies(1) == $CollisionShape3D:
			$Environment/Camera3D/hud_canva/ProgressBar.Recibir_daño(damage_amount)
