extends Node3D

var next_scene
@onready var camera = $Environment/Camera3D

func _ready():
	var levels = []
	for level_number in range(1, 5):
		var number = "0" + str(level_number)
		var level_path = "res://screens/game/levels/level" + number + "/main.tscn"
		levels.append(level_path)
		#var current_level = load(level_path)
		#var current_scene = current_level.instantiate()
		#$CurrentLevel.add_child(current_scene)
	host()
	
func _process(delta):
	pass

func host():
	$"UI/Network Popup/LAN Bootstrapper".host()
