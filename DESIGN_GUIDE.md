# Guía de escala y diseño — juego del pingüino

Nov 27, 2026 · @Alejandro

**Regla de oro: 1 cubo de Blockbench (16 px) = 1 metro en Godot = 1 casilla del nivel.** Si todo encaja en esa cuadrícula, no hace falta medir nada.

## Las 8 reglas

1. **16 px = 1 m.** No escaléis nada en Godot. Si algo no cuadra, se arregla en Blockbench.
2. **Todo lo que choca mide múltiplos de 4 px (0,25 m).** Snap de 4 px en Blockbench y de 0,25 en Godot, siempre activado.
3. **Todo el juego pasa en Z = 0.** Lo demás va en los planos de profundidad (más abajo) y sin colisiones.
4. **Todos los personajes miran a la derecha** (eje +X de Godot).
5. **Dónde va el origen:** el pingüino, en el centro del cuerpo (así gira bien al nadar); todo lo demás, en la base, para que se apoye solo en el suelo.
6. **Colisiones con formas simples, nunca con el modelo.** Caminando, una cápsula; nadando, una esfera (por mucho que gire, nunca se mete en una pared).
7. **Las piezas se tocan, no se pisan.** Nunca dos cosas ocupando el mismo hueco.
8. **El escenario se hace con GridMap.** Una casilla, una pieza: así es imposible solapar.

## Medidas para hacer niveles

El pingüino mide 1 m (16 px) de alto, camina lento y salta muy poco. Con eso:

| Obstáculo | ¿Se pasa? |
| --- | --- |
| Escalón de 0,25 m (4 px) | Sí, andando |
| Bloque de 0,5 m (8 px) | Sí, saltando |
| Muro de 1 m (16 px) o más | No |
| Hueco de 0,5 m | Sí, saltando |
| Hueco de 1 m o más | No |
| Pasillo de agua de 2 m de ancho | Sí, y se puede girar en cualquier punto |
| Paso de agua de 1,5 m | Solo en tramos rectos |

Son valores de partida: probadlos con el pingüino y ajustadlos si hace falta.

## Los planos de profundidad

El camino tiene 5 casillas de fondo: tres planos de 1 casilla, dos casillas más de bloques y, al final, el telón. La cámara está delante (Z positiva) mirando hacia el fondo.

| Plano | Posición Z | Qué va ahí | ¿Colisión? |
| --- | --- | --- | --- |
| 1. Delantero | +1 | Adornos (hierba, rocas pequeñas, carteles) | No |
| 2. Juego | 0 | Pingüino, items, obstáculos, enemigos y el suelo que se pisa | Sí |
| 3. Trasero | −1 | Más adornos (árboles, casetas, hielo) | No |
| Relleno | −2 y −3 | Solo los bloques del escenario, para que se vean gruesos | No |
| Telón | −3,55 | Una imagen 2D vertical de fondo | No |

Los bloques del escenario ocupan las 5 casillas, de Z = +1,5 a Z = −3,5. El telón va un poquito detrás del final de los bloques (−3,55 en vez de −3,5) para que no parpadee al coincidir con ellos.

### Cómo montarlo en Godot

- **Dos GridMap por nivel.** `GridMap_juego` solo usa la fila Z = 0, con piezas que tienen colisión. `GridMap_fondo` usa las filas +1, −1, −2 y −3, con piezas sin colisión.
- **Cada bloque, en dos versiones** en la MeshLibrary: `tile_hielo` (con colisión) y `tile_hielo_deco` (sin colisión). Se ven igual; solo cambia si choca.
- **Adornos:** escenas sueltas, colocadas con snap en su plano.
- **Telón:** un MeshInstance3D con un QuadMesh (o un Sprite3D) en Z = −3,55, con material sin sombreado (*unshaded*) para que la luz no lo cambie. Tiene que ser más ancho y alto que lo que ve la cámara: comprobadlo en los dos extremos del nivel.
- **Si el telón es pixel art,** usad también 16 px por metro: un telón de 40 m de ancho mide 640 px.

### Para que se vea bien

- **Que el plano delantero no tape al pingüino:** adornos bajos (menos de 0,5 m) o pocos y separados. Por la perspectiva, lo de delante se ve más grande.
- **Cámara en perspectiva**, a unos 8 m o más del plano de juego. Es lo que da la sensación de profundidad; si está muy cerca, los adornos delanteros se ven enormes.
- **Un poco más oscuro o azulado cuanto más al fondo.** Ayuda a distinguir de un vistazo lo que se puede tocar de lo que es decorado.

## Trucos que ahorran trabajo

- **Archivo plantilla en Blockbench** con el pingüino y un cubo de 1 m de referencia. Cada modelo nuevo empieza ahí.
- **Colisiones desde Blockbench:** si un cubo se llama `algo-colonly`, Godot lo convierte en colisión invisible al importar.
- **Escena "galería"** con el pingüino junto a todas las piezas: de un vistazo se ve si algo está fuera de escala.

## Configurar las herramientas (se hace una vez)

### Blockbench

| Dónde | Qué poner | Para qué |
| --- | --- | --- |
| Nuevo proyecto | *Generic Model* (modelo genérico) | Sin las limitaciones de los formatos de Minecraft |
| Settings > Snapping > Grid Resolution | 4 | Mover y redimensionar en pasos de 4 px (0,25 m). Con 16 serían pasos de 1 px |
| Settings > Snapping (tamaños con Shift y Ctrl) | 16 y 32 | Pasos finos solo para detalles, manteniendo pulsada la tecla |
| Settings > Grid | Activar *Block Grid* | Ver las casillas de 1 m mientras modeláis |
| File > Export > glTF | Exportar como .glb, escala por defecto | Comprobad una vez que un cubo de 16 px llega a Godot midiendo 1 m |

### Godot

| Dónde | Qué poner | Para qué |
| --- | --- | --- |
| Visor 3D > Transform > Configure Snap | Traslación 0,25 · Rotación 90 · Escala 10 % | Colocar todo en la rejilla sin mirar números |
| Visor 3D, icono del imán (*Use Snap*) | Siempre activado | Que el snap anterior funcione |
| GridMap > Cell | Size 1 × 1 × 1 · Center Y desactivado | Una pieza por casilla, apoyada en el suelo |
| Panel Import del .glb | Root Scale 1 | No reescalar los modelos |
| Materiales de los modelos | Texture Filter: *Nearest* | Píxeles nítidos en vez de borrosos |
| Project Settings > Layer Names > 3D Physics | 1 Escenario · 2 Pingüino · 3 Enemigos · 4 Items · 5 Agua | Ver nombres en vez de números al configurar colisiones |
| Camera3D | Projection: *Perspective* | La sensación de profundidad de los planos |

Los nombres de los menús pueden cambiar un poco según la versión de cada programa y si lo tenéis en español.
