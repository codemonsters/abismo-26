extends Node3D

var next_scene

func _ready():
	host()

func host():
	$"UI/Network Popup/LAN Bootstrapper".host()
