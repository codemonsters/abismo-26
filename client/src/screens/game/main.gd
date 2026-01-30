extends Node3D

var next_scene
@onready var camera = $Environment/Camera3D
signal level_passed
var level_index = 0
var levels = []

var current_state_scene: GameState
var gamestate_scenes = {
	"game_over": preload("res://screens/game/states/game_over/main.tscn"),
	"ingame_menu": preload("res://screens/game/states/ingame_menu/main.tscn"),
	"level_complete": preload("res://screens/game/states/level_complete/main.tscn"),
	"level_intro": preload("res://screens/game/states/level_intro/main.tscn"),
	"level_loading": preload("res://screens/game/states/level_loading/main.tscn"),
	"level_transition": preload("res://screens/game/states/level_transition/main.tscn"),
	"playing": preload("res://screens/game/states/playing/main.tscn")
}

func set_state(state_name):
	if current_state_scene != null:
		current_state_scene.exit()
	
	var pepe = gamestate_scenes[state_name]
	var new_state = gamestate_scenes[state_name].instantiate()
	current_state_scene = new_state
	current_state_scene.enter()
	

func _ready():
	for level_number in range(1, 5):
		var number = "0" + str(level_number)
		var level_path = "res://screens/game/levels/level" + number + "/main.tscn"
		levels.append(level_path)
	var current_level = load(levels[level_index])
	var current_scene = current_level.instantiate()
	$CurrentLevel.add_child(current_scene)
	host()
	set_state("level_loading")


func _process(delta):
	if Input.is_action_just_pressed("space"):
		level_passed.emit()
	current_state_scene.process(delta)


func physics_process(delta):
	current_state_scene.physics_process(delta)
	
	
func host():
	$"UI/Network Popup/LAN Bootstrapper".host()


func _on_level_passed() -> void:
	for child in $CurrentLevel.get_children():
		child.queue_free()
	level_index += 1
	var current_level = load(levels[level_index])
	var current_scene = current_level.instantiate()
	$CurrentLevel.add_child(current_scene)
