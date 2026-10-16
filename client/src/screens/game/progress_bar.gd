extends ProgressBar

func _ready() -> void:
	value = 100
	pass
 
func set_percentage(percentage : float):
	value = percentage
