extends ProgressBar

var vida_inicial: float = 50

func _ready() -> void:
	value = vida_inicial

func set_percentage(percentage : float):
	value = percentage 
