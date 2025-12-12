extends Node3D

var next_scene
@onready var camera = $Environment/Camera3D

func _ready():
	host()

func host():
	$"UI/Network Popup/LAN Bootstrapper".host()
