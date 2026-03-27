extends Node
class_name Level
## Nodo base para niveles, contiene funciones genericas.

@export var level_id: String = "LoremIpsum"
@export var exit: Area3D

signal change_level

func ok():
	print("abejas")

func _ready():
	print("HELP ME")
	exit.body_entered.connect(change_level.emit)
	exit.body_entered.connect(ok)
