extends Node3D

signal level_passed

@onready var camera = $Environment/Camera3D
var current_level_number = 0
var levels = []	# lista con los paths de las escenas que usamos como niveles
var next_scene

func _ready():
	for state in $States.get_children():
		state.disable()
	for level_number in range(1, 5):
		var number = "0" + str(level_number)
		var level_path = "res://screens/game/levels/level" + number + "/main.tscn"
		levels.append(level_path)
	$States/LevelLoading.enable()
	host()


func _process(delta):
	if Input.is_action_just_pressed("space"):
		level_passed.emit()


func host():
	$"UI/Network Popup/LAN Bootstrapper".host()


func _on_level_passed() -> void:
	for child in $CurrentLevel.get_children():
		child.queue_free()
	current_level_number += 1
	var current_level = load(levels[current_level_number])
	var current_scene = current_level.instantiate()
	$CurrentLevel.add_child(current_scene)
