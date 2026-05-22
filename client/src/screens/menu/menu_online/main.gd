extends Node2D

signal change_window_requested(window, next_window)
signal change_screen_requested(scene, next_scene)

var prev_window

func after_back_pressed():
	$"/root/Main/ServerPopup".ls_disconnect()


func _on_button_join_as_guest_pressed() -> void:
	pass # Replace with function body.
