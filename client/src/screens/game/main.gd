extends Node3D

var next_scene
@onready var camera = $Environment/Camera3D
signal level_passed
var level_index = 0
var levels = []

func _ready():
	for level_number in range(1, 5):
		var number = "0" + str(level_number)
		var level_path = "res://screens/game/levels/level" + number + "/main.tscn"
		levels.append(level_path)
	var current_level = load(levels[level_index])
	var current_scene = current_level.instantiate()
	$CurrentLevel.add_child(current_scene)
	host()
	 
func _process(delta):
	if Input.is_action_just_pressed("space"):
		level_passed.emit()

func host():
	$"UI/Network Popup/LAN Bootstrapper".host()



func _on_level_passed() -> void:
	for child in $CurrentLevel.get_children():
		child.queue_free()
	level_index += 1
	var current_level = load(levels[level_index])
	var current_scene = current_level.instantiate()
	$CurrentLevel.add_child(current_scene)
