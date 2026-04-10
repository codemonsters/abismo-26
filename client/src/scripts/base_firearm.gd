extends Resource
class_name Firearm

@export var id: String = "LoremIpsum"

@export_group("Projectile")
@export var damage: float = 2
@export var spread: float = 0.5
@export var pellets: int = 1

@export_group("Reload")
@export var capacity: int = 10
@export var reload: float = 0.5
