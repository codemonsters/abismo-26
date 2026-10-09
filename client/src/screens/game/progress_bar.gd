#extends ProgressBar
#
#var vida_inicial: float = 50
#
#func _ready() -> void:
	#value = vida_inicial
#
#func recibir_daño(Daño : float):
	#if value > 0:
		#value -= Daño
	#elif value <= 0:
		#pass
	#
	
extends ProgressBar

@export var vida_inicial: float = 50.0

func _ready() -> void:
	max_value = vida_inicial
	value = vida_inicial

func recibir_daño(daño: float) -> void:
	value = maxf(value - daño, 0.0)
	queue_redraw()
	print("Value actual: ", value)
