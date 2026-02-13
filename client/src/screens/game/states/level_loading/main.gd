extends "res://screens/game/states/game_state.gd"
class_name LevelLoadingState

var scene_path	# La escena del nivel que vamos a jugar

func enter():
	print("Entering Level Loading")
	$Timer.start()
	scene_path = get_parent().get_parent().levels[get_parent().get_parent().current_level_number]
	# Iniciamos la carga asíncrona del nivel
	var error = ResourceLoader.load_threaded_request(scene_path)
	if error != OK:
		print("ERROR: no se puede cargar el nivel" + scene_path)


func exit():
	print("Exiting Level Loading")


func _process(delta):
	if $Timer.is_stopped():
		var progress = []
		var status = ResourceLoader.load_threaded_get_status(scene_path, progress)
		match status:
			#ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			#	print("Cargando: ", progress[0] * 100, "%")
			ResourceLoader.THREAD_LOAD_LOADED:
				# Carga finalizada
				var new_scene_resource = ResourceLoader.load_threaded_get(scene_path)
				var instance = new_scene_resource.instantiate()
				$"../../CurrentLevel".add_child(instance)
				$"../LevelIntro".enable()
				disable()
			ResourceLoader.THREAD_LOAD_FAILED:
				print("ERROR: Error mientras se cargaba el nivel actual.")
	else:
		$ColorRect.color.a = $Timer.time_left / $Timer.wait_time
