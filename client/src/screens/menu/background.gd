extends Node3D

'''
Efecto de agua "Simple Water in Godot - Godot 4 Tutorial" (autor: Omogonix): https://www.youtube.com/watch?v=Ej_RyOG3d0c
'''

'''
func _ready():
	var mat = $Water/MeshInstance3D.get_active_material(0)
	var noise_tex: NoiseTexture2D = mat.albedo_texture

	if noise_tex:
		await get_tree().process_frame  # asegurar que se ha generado

		var img = noise_tex.get_image()
		img.save_png("res://screens/menu/water_texture_baked.png")
'''
