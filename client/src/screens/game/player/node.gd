extends Node

@onready var player:CharacterBody3D = self.owner

enum MOVINGSTATE {
	IDLE, 
	RUNNING,
	JUMPING,
	DEAD,
	FALLING
}
var current_state:MOVINGSTATE = MOVINGSTATE.IDLE

func _physics_process(delta):
	match current_state:
		MOVINGSTATE.IDLE:
			player.velocity.z = 0
			$blockbench_export/AnimationPlayer.play("stand by")
		MOVINGSTATE.RUNNING:
			player.velocity.z = player.direction.z * player.speed
			$blockbench_export/AnimationPlayer.play("walk")
			if player.velocity.z < 0:
				$blockbench_export.rotation_degrees.y = 0
			elif player.velocity.z > 0:
				$blockbench_export.rotation_degrees.y = -180
		MOVINGSTATE.JUMPING:
			$blockbench_export/AnimationPlayer.play("jump")
			player.velocity.y = player.jump_power
		MOVINGSTATE.FALLING:
			player.velocity.y -= player.gravity * player.delta
