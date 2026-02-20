extends "res://screens/game/states/game_state.gd"
class_name LevelIntroState

func _ready():
	$IntroTip.visible = false

	
func enter():
	print("Entering Level Intro")
	$IntroTip.set_position(Vector2(0, -40))
	$AnimationPlayer.play("Enter")


func exit():
	print("Exiting Level Intro")


func _process(delta):
	pass


func _physics_process(delta):
	pass
