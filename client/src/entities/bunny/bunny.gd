extends Node3D

@export var velocidad := 5.0

var direccion := 1.0

@onready var ray = $RayCast3D

func _process(delta):

	# mover
	position.x += velocidad * direccion * delta
