# Cliente

## TODO

Definir:

1. Una sola unidad para todo
1 bloque de Blockbench (16 px) = 1 metro en Godot. Al exportar a glTF/GLB, Blockbench aplica por defecto una escala que hace coincidir 16 unidades con 1 m. Comprobadlo una vez con un cubo de 16×16×16 y dejadlo fijo para siempre.
Un submúltiplo mínimo: decidid que nada mida menos de, por ejemplo, 0,5 m (8 px) o 0,25 m (4 px) en las medidas que afectan al gameplay. Los detalles decorativos pueden ser más finos, pero los volúmenes jugables siempre en múltiplos de ese valor.
Misma densidad de texel en todos los modelos: por ejemplo, 16 px de textura por metro. Así nada parece “de otra escala” aunque esté bien medido.

2. Un documento de métricas de gameplay (antes de modelar)

Es la tabla que manda sobre todo lo demás, y se mide en unidades de rejilla:

Altura y anchura del personaje (y de su cápsula de colisión).
Altura y distancia máximas de salto.
Altura de escalón que se sube sin saltar.
Altura mínima de techo, ancho mínimo de hueco o pasillo, ancho de puerta.
Tamaños estándar de plataforma (1, 2, 4 m…).

Si diseñáis el personaje para que encaje en números redondos (por ejemplo, salto máximo de 3 m), los niveles salen solos.

3. Plantillas de referencia en Blockbench
Un archivo plantilla con el personaje de referencia (silueta), un cubo de 1 m y una plataforma estándar. Todos los modelos nuevos parten de esa plantilla y la referencia se borra u oculta antes de exportar.
Activad la rejilla y el snap de Blockbench a vuestro submúltiplo y no los desactivéis para los volúmenes principales.

4. Origen (pivote) y orientación coherentes
Personajes y props: origen en la base, centrado (bottom-center), con el modelo apoyado en Y = 0. Así, al colocarlos, “tocan el suelo” sin ajustar nada.
Piezas de nivel (tiles): elegid un criterio (esquina o centro de la celda) y usadlo en todas.
Frente del modelo: en Godot “delante” es −Z. Decidid hacia dónde mira cada modelo en Blockbench y que sea igual en todos.

5. El plano 2.5D y los carriles de profundidad
Fijad el plano de juego (por ejemplo, XY con Z = 0 y la cámara mirando a lo largo de Z).
Si hay profundidad jugable, usad carriles Z discretos (Z = 0, −2, −4…). Los objetos de fondo van en carriles sin colisión.
Bloquead el eje de profundidad en los cuerpos físicos que no deban salirse del plano (axis lock en RigidBody3D, o restricción en el script del CharacterBody3D).

6. Niveles modulares sobre rejilla
Construid los niveles con un kit modular: piezas en múltiplos de la rejilla que encajan entre sí.
Usad GridMap + MeshLibrary en Godot para el escenario estático: colocar piezas se vuelve pintar en una cuadrícula, y es imposible que dos piezas ocupen la misma celda.
Para lo que no vaya en GridMap, configurad el snap del editor (traslación 0,5 o 1 m, rotación 90° o 15°) y no lo quitéis.
Haced primero un blockout con cajas grises, probad el nivel y modelad después.

7. Colisiones: separadas de la malla visual
La malla visual puede ser detallada; la colisión, formas simples (caja, cápsula, esfera). Nada de colisiones trimesh para objetos móviles.
Truco útil: Godot interpreta sufijos en los nombres de los nodos al importar un glTF. Un cubo llamado algo-colonly se convierte en colisión invisible (-convcolonly lo hace convexo). Podéis modelar la colisión en Blockbench con cubos, alineada a la rejilla, y viaja con el modelo.
Colisiones del nivel contiguas, nunca solapadas. Los suelos formados por muchas cajas juntas pueden hacer que el personaje “tropiece” en las uniones. Mejor fusionar los tramos largos en una sola forma, o usar una cápsula con bordes redondeados en el personaje.
La colisión de los props puede ser ligeramente más pequeña que su parte visual: así se evitan contactos raros cuando se colocan pegados.

8. Cómo evitar que dos cuerpos nazcan en el mismo sitio
Spawns con marcadores (Marker3D) colocados a ras de suelo, con un pequeño margen vertical.
Si generáis objetos por código, comprobad antes si el hueco está libre (una consulta de forma con PhysicsDirectSpaceState3D.intersect_shape).
Usad capas y máscaras de colisión desde el principio (jugador, enemigos, escenario, objetos, triggers), para que lo que no debe interactuar no se empuje.

9. Escala 1 siempre, en todas partes
Nunca escaléis modelos en Godot. Si algo no cuadra, se corrige en Blockbench y se reexporta. La escala no uniforme da problemas a las físicas y rompe la coherencia.
Lo mismo con las rotaciones arbitrarias en piezas de nivel: solo múltiplos de 90°.

10. Cada modelo, una escena lista para usar
Cread una escena .tscn (o una escena heredada del .glb) por cada prop o personaje, que incluya la malla, la colisión y el cuerpo físico. En los niveles se instancia la escena, nunca el modelo suelto.
Mantened una escena de galería de escala: el personaje junto a todas las piezas del kit. Sirve para revisar de un vistazo que todo está proporcionado.

11. Nombres y estructura de carpetas
Prefijos por tipo (chr_, prop_, tile_, fx_) y medidas en el nombre de las piezas modulares (tile_suelo_2x1, tile_muro_1x3).
Una misma estructura de grupos en el outliner de Blockbench (por ejemplo, visual, col), para que la exportación y la importación sean predecibles.

12. Que lo compruebe una máquina, no vosotros
Un script @tool o de importación en Godot que avise si un modelo tiene escala distinta de 1, el origen fuera de la base, medidas que no son múltiplos de la rejilla o le falta colisión.
Así las reglas se cumplen solas y solo os preocupáis cuando salta un aviso.

Si queréis, lo convierto en un documento de guía de estilo para el equipo, con una tabla de métricas para rellenar con los valores de vuestro personaje.

## Enlaces de interés

* Videotutorial completo de Blockbench (modelado, texturizado y animación): [LEARN BLOCKBENCH - The FULL ArtsByKev Series](https://www.youtube.com/watch?v=7nZx5hqr_1s)
* Videotutorial básico sobre animación: [BLOCKBENCH for BEGINNERS - Make Animation Rigs](https://www.youtube.com/watch?v=d79OSoeKJx0&t=21s)
