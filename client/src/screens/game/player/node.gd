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
	var anim_player = %blockbench_export.get_node("AnimationPlayer")
	
	match current_state:
		MOVINGSTATE.IDLE:
			player.velocity.z = 0
			anim_player.play("stand by") #get_parent().get_child(blockbench_export).get_child(AnimationPlayer).play("stand by")
		MOVINGSTATE.RUNNING:
			player.velocity.z = player.direction.z * player.speed
			anim_player.play("walk")
			if player.velocity.z < 0:
				$blockbench_export.rotation_degrees.y = 0
			elif player.velocity.z > 0:
				$blockbench_export.rotation_degrees.y = -180
		MOVINGSTATE.JUMPING:
			anim_player.play("jump")
			player.velocity.y = player.jump_power
		MOVINGSTATE.FALLING:
			player.velocity.y -= player.gravity * player.delta
