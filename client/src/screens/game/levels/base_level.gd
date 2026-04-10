extends Node

signal level_complete

func complete_level():
	emit_signal("level_complete")
