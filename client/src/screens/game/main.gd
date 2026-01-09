extends Node3D

var next_scene
@onready var camera = $Environment/Camera3D
var current_level_number = 0

func _ready():
	# TODO: Instanciar el nivel correcto (por defecto el 1)
	var levels = []
	for level_number in range(1, 5):
		var number = "0" + str(level_number)
		var level_path = "res://screens/game/levels/level" + number + "/main.tscn"
		
	var level01 = load("res://screens/game/levels/level01/main.tscn")
	var level02 = load("res://screens/game/levels/level02/main.tscn")
	var level03 = load("res://screens/game/levels/level02/main.tscn")
	var level04 = load("res://screens/game/levels/level04/main.tscn")

	var currentscene = levels[current_level_number].instantiate()
	$CurrentLevel.add_child(currentscene)
	host()

func host():
	$"UI/Network Popup/LAN Bootstrapper".host()
