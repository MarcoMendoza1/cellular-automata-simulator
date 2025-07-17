////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Variables globales

const CELL_SIZE = 10;
let app;
let root = document.getElementById("simulador");
let header = document.getElementById("header");
let vivas = document.getElementById("liveCells");
let iteracion = document.getElementById("iteracion");

let simulador;
let grid;
let conCells;
let contorno;

let tam = 100;
let cells = new Array(tam).fill().map(() => new Array(tam).fill(0)); // 0 = blanco, 1 = negro (ocupado)
let hormiga = {
  x: Math.floor(tam / 2),  // posición inicial en el centro de la cuadrícula
  y: Math.floor(tam / 2),
  dir: 0, // dirección inicial: 0 = arriba, 1 = derecha, 2 = abajo, 3 = izquierda
  sprite: null // Este será el objeto gráfico de la hormiga
};

const baseTexture = PIXI.Texture.WHITE;

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Funciones para el simulador (acciones, funcionalidades)

function addCell(cord, color) {
  let aux = cord.split(',');
  let x = parseInt(aux[0]);
  let y = parseInt(aux[1]);

  let cell = new PIXI.Sprite(baseTexture);
  cell.x = x * (CELL_SIZE + 1) + 1.5;
  cell.y = y * (CELL_SIZE + 1) + 1.5;
  cell.width = CELL_SIZE;
  cell.height = CELL_SIZE;
  cell.alpha = 0.9;
  cell.tint = color;
  cell.visible = true;
  conCells.addChild(cell);
}

function drawAnt() {
  // Asegurarse de que la hormiga no se mueva fuera de los límites
  hormiga.x = (hormiga.x + tam) % tam;
  hormiga.y = (hormiga.y + tam) % tam;

  let color = cells[hormiga.x][hormiga.y] === 0 ? 0x000000 : 0xFFFFFF; // Blanco o negro dependiendo del estado de la celda
  cells[hormiga.x][hormiga.y] = 1 - cells[hormiga.x][hormiga.y]; // Cambiar color de la celda (blanco a negro, negro a blanco)
  addCell(hormiga.x + ',' + hormiga.y, color); // Actualizamos la celda

  // Gira la hormiga
  if (color === 0xFFFFFF) { // Si la celda es blanca, gira a la derecha
    hormiga.dir = (hormiga.dir + 1) % 4;
  } else { // Si la celda es negra, gira a la izquierda
    hormiga.dir = (hormiga.dir + 3) % 4;
  }

  // Mueve la hormiga
  if (hormiga.dir === 0) {
    hormiga.y = (hormiga.y - 1 + tam) % tam; // Arriba
  } else if (hormiga.dir === 1) {
    hormiga.x = (hormiga.x + 1) % tam; // Derecha
  } else if (hormiga.dir === 2) {
    hormiga.y = (hormiga.y + 1) % tam; // Abajo
  } else {
    hormiga.x = (hormiga.x - 1 + tam) % tam; // Izquierda
  }

  // Dibuja la hormiga en su nueva posición
  if (!hormiga.sprite) {
    // Creamos la hormiga como una celda con un tinte amarillo
    hormiga.sprite = new PIXI.Sprite(baseTexture);
    hormiga.sprite.x = hormiga.x * (CELL_SIZE + 1) + 1.5;
    hormiga.sprite.y = hormiga.y * (CELL_SIZE + 1) + 1.5;
    hormiga.sprite.width = CELL_SIZE;
    hormiga.sprite.height = CELL_SIZE;
    hormiga.sprite.alpha = 0.9;
    hormiga.sprite.tint = 0xFFFF00; // Color amarillo para la hormiga
    hormiga.sprite.visible = true;
    conCells.addChild(hormiga.sprite);
  } else {
    // Actualiza la posición de la hormiga
    hormiga.sprite.x = hormiga.x * (CELL_SIZE + 1) + 1.5;
    hormiga.sprite.y = hormiga.y * (CELL_SIZE + 1) + 1.5;
  }

  // Mostrar la siguiente iteración
  iteracion.value = ind;
  ind++;
}

function siguienteIteracion() {
  drawAnt();
}

function reiniciarSimulador() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Simulación detenida.");
  }

  ind = 0;
  hormiga = { x: Math.floor(tam / 2), y: Math.floor(tam / 2), dir: 0, sprite: null }; // Reiniciar la hormiga en el centro
  cells = new Array(tam).fill().map(() => new Array(tam).fill(0)); // Restablecer todas las celdas a blancas
  conCells.removeChildren(); // Limpiar la pantalla
  simulador.x = root.clientWidth / 2 - conGrid.width / 2;
  simulador.y = root.clientHeight / 2 - conGrid.height / 2;

  buildGrid(grid, tam, tam); // Dibujar el grid
}

function buildGrid(graphics, cols, rows) {
  graphics.clear();
  for (let i = 0; i < cols + 1; i++) {
    graphics.moveTo(i * (CELL_SIZE + 1), 0).lineTo(i * (CELL_SIZE + 1), (CELL_SIZE + 1) * rows);
  }

  for (let i = 0; i < rows + 1; i++) {
    graphics.moveTo(0, i * (CELL_SIZE + 1)).lineTo((CELL_SIZE + 1) * cols, i * (CELL_SIZE + 1));
  }
  graphics.stroke({ color: 0xffffff, pixelLine: true, width: 1, alpha: .2 });
  return graphics;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Inicialización del simulador

(async () => {
  // Inicializar la cuadrícula (celdas)
  cells = new Array(tam).fill().map(() => new Array(tam).fill(0)); // Restablecer las celdas

  // Crear el canvas de PIXI
  app = new PIXI.Application();
  globalThis.__PIXI_APP__ = app;

  await app.init({ resizeTo: root, preference: "webgpu" });
  app.ticker.maxFPS = 35;
  app.ticker.minFPS = 1;

  // Crear contenedor para la cuadrícula
  simulador = new PIXI.Container();
  conGrid = new PIXI.Container();
  grid = buildGrid(new PIXI.Graphics(), tam, tam);
  grid.hitArea = new PIXI.Rectangle(0, 0, grid.width, grid.height);

  contorno = new PIXI.Graphics().rect(0, 0, (CELL_SIZE + 1) * tam - .01, (CELL_SIZE + 1) * tam - .01)
    .stroke({ color: "red", pixelLine: true, width: 1 })
    .fill({ color: "red", pixelLine: true, width: 1, alpha: .05 });

  conGrid.addChild(grid, contorno);
  simulador.addChild(conGrid);
  simulador.eventMode = "static";

  // Crear el contenedor `conCells` aquí para evitar el error de undefined
  conCells = new PIXI.Container();
  conCells.interactiveChildren = false;
  simulador.addChild(conCells);

  // Dibujar la hormiga en el centro cuando el tablero es inicializado
  hormiga.sprite = new PIXI.Sprite(baseTexture);
  hormiga.sprite.x = hormiga.x * (CELL_SIZE + 1) + 1.5;
  hormiga.sprite.y = hormiga.y * (CELL_SIZE + 1) + 1.5;
  hormiga.sprite.width = CELL_SIZE;
  hormiga.sprite.height = CELL_SIZE;
  hormiga.sprite.alpha = 0.9;
  hormiga.sprite.tint = 0xFFFF00; // Color amarillo para la hormiga
  hormiga.sprite.visible = true;
  conCells.addChild(hormiga.sprite);

  simulador.on("pointertap", (event) => {
    let x = ((event.x - viewport.x) / viewport.scale.x) - simulador.x;
    let y = ((event.y - header.clientHeight - viewport.y) / viewport.scale.y) - simulador.y;

    let i = Math.floor(x / (CELL_SIZE + 1));
    let j = Math.floor(y / (CELL_SIZE + 1));
  });

  simulador.x = root.clientWidth / 2 - conGrid.width / 2;
  simulador.y = root.clientHeight / 2 - conGrid.height / 2;

  const viewport = new Viewport({ stopPropagation: true, passiveWheel: false, threshold: 20, events: app.renderer.events });
  viewport.drag().wheel().pinch();
  viewport.addChild(simulador);
  app.stage.addChild(viewport);

  root.appendChild(app.canvas);
})();

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Listeners

document.getElementById("stepBtn").addEventListener("click", function () {
  siguienteIteracion();
  app.renderer.render(app.stage);
});

let intervalId = null;

document.getElementById("playBtn").addEventListener("click", function () {
  console.log("Simulación iniciada.");
  if (!intervalId) {
    intervalId = setInterval(() => {
      siguienteIteracion();
      app.renderer.render(app.stage);
    }, 20);
  }
});

document.getElementById("stopBtn").addEventListener("click", function () {
  console.log("Simulación detenida.");
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

document.getElementById("clearBtn").addEventListener("click", function () {
  reiniciarSimulador();
});
