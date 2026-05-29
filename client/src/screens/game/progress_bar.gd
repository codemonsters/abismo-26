extends ProgressBar

var vida_inicial: float = 100

func _ready() -> void:
	value = vida_inicial

func Recibir_daño(Daño : float):
	if value > 0:
		value -= Daño
		if value <= 0:
			pass #programar muerte
	
