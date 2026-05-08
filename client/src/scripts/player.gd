extends CharacterBody3D
signal disparando
@export var speed := 5.0
@export var input: PlayerInput

# vamos a hacer que pueda tener armas
var weapons = [
	nothing,
	pistol,
	principal_w
]
var pistol = ""
var nothing = ""
var principal_w = ""
var weapon = 0

var held_wep_stats: Firearm = null

# Get the gravity from the project settings to be synced with RigidBody nodes.
var gravity = ProjectSettings.get_setting(&"physics/3d/default_gravity")


func _ready():
	position = Vector3(0, 2, 0)
	
	if input == null:
		input = $Input
		

func _rollback_tick(delta, _tick, _is_fresh):

	# Add the gravity.
	if not is_on_floor():
		velocity.y -= gravity * delta

	var input_dir = input.movement
	var direction = (transform.basis * Vector3(0, 0, input_dir.z)).normalized()
	if direction:
		velocity.z = direction.z * speed
		if is_on_floor():
			if weapon == 0:
				$blockbench_export/AnimationPlayer.play("walk")
			elif weapon == 1 or weapon == 2:
				$blockbench_export/AnimationPlayer.play("walk with gun")
	else:
		velocity.z = move_toward(velocity.z, 0, speed)
		if is_on_floor():
			if weapon == 0:
				$blockbench_export/AnimationPlayer.play("stand by")
			elif weapon == 1 or weapon == 2:
				$blockbench_export/AnimationPlayer.play("stand by with gun")
	
	if velocity.z < 0:
		$blockbench_export.rotation_degrees.y = 0
	elif velocity.z > 0:
		$blockbench_export.rotation_degrees.y = -180
		
	if is_on_floor():
		if Input.is_action_pressed("up_arrow"):
			if weapon == 0:
				$blockbench_export/AnimationPlayer.play("jump")
			elif weapon == 1 or weapon == 2:
				$blockbench_export/AnimationPlayer.play("jump with gun")
			velocity.y = 3.5
			
	if Input.is_action_pressed("slot1"):
		weapon = 1
	elif Input.is_action_pressed("slot2"):
		weapon = 2
	else:
		weapon = 0
	
	# vamos a hacer que puedas disparar
	if Input.is_action_pressed("disparar"):
		disparando.emit()
	
	# move_and_slide assumes physics delta
	# multiplying velocity by NetworkTime.physics_factor compensates for it
	velocity *= NetworkTime.physics_factor
	
	# FORZAR el eje X a cero para evitar "drifting"
	velocity.x = 0
	move_and_slide()
	global_position.x = 0
	velocity /= NetworkTime.physics_factor
	
	
	
	
