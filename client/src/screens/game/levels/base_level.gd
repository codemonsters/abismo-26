extends Node

signal level_complete

func complete_level():
	emit_signal("level_complete")

func _ready():
	if not Engine.is_editor_hint():
		for location in $Locations.get_children():
			location.visible = false
