

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Variables globales

const CELL_SIZE = 10;

let app;

let root = document.getElementById("simulador");
let header = document.getElementById("header");
let vivas = document.getElementById("liveCells");
let iteracion = document.getElementById("iteracion");
let regla = document.getElementById("rule");

let simulador;
let grid;
let conCells;
let conGrid;
let contorno;

let tam;
let col=0xFFFFFF;
let cv = 0;

// Iteraciones de la cuadricula, indicador del paso actual
let ind = 0;
let liveCells = new Map();
let cells = [[]];
let modo = "nulo";

let reglaB = [false,false,false,false,false,false,false,false,false];
let reglaS = [false,false,false,false,false,false,false,false,false];
let reglaStr = "b3/s23";
let newCells = new Set(); //Celulas relevantes

let cellGraph = new PIXI.Graphics()
                  .setFillStyle({ color: 'white',alpha:.4 })
                  .rect(0, 0, 1, 1)
                  .fill()
                  .stroke({ color: 0xffffff, pixelLine: true });
let cellContext;

// Textura de las celulas pre-creada para aumentar eficiencia
const baseTexture = PIXI.Texture.WHITE;



////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Funciones para el simulador (acciones, funcionalidades)

function addCell(cord){
  cv++;
  vivas.value = cv;
  let aux = cord.split(',');
  let x = aux[0];
  let y = aux[1];

  let cell;

  if(cells[x][y] === false){

    cell = new PIXI.Sprite(baseTexture);

    cell.x=x * (CELL_SIZE + 1)+1.5;
    cell.y=y * (CELL_SIZE + 1)+1.5;

    cell.width = 8;
    cell.height = 8;
    cell.alpha = .9;
    cell.tint = (col);
    cell.visible=true;

    cells[x][y] = cell;
    conCells.addChild(cell);
  }else{
    cell = cells[x][y];
    cell.visible = true;
  }

  liveCells.set(cord,cell);
}

function removeCell(cord){
  let aux = cord.split(',');
  let x = aux[0];
  let y = aux[1];

  cells[x][y].visible = false;
  liveCells.delete(cord);

  cv--;
  vivas.value = cv;
}

// onClick de cada celula
function onTap(cord){
  // history[history.length-1][this.i][this.j]=cells[this.i][this.j].visible=!cells[this.i][this.j].visible;
  
  if(liveCells.has(cord)){
    removeCell(cord);
  }else{
    addCell(cord);
  }
  updateLastData();
}

function buildGrid(graphics, cols, rows){
  graphics.clear();
  for (let i = 0; i < cols + 1; i++)
  {
      graphics
          .moveTo(i * (CELL_SIZE + 1), 0)
          .lineTo(i * (CELL_SIZE + 1), (CELL_SIZE + 1) * rows);
  }

  for (let i = 0; i < rows + 1; i++)
  {
      graphics
          .moveTo(0, i * (CELL_SIZE + 1))
          .lineTo((CELL_SIZE + 1)*cols, i * (CELL_SIZE + 1));
  }
  graphics.stroke({ color: 0xffffff, pixelLine: true, width: 1,alpha:.2 });


  return graphics;
}

// Cambiar color de las celulas
function cambiarColor(color){
  liveCells.forEach( (val,key) => {
    val.tint=color;
  });
}

function cambiarColorTablero(color){
  app.renderer.background.color=color;
}

// Generar siguiente iteracion
function siguienteIteracion(){
  ind++;
  iteracion.value = ind;
  newCells.clear();

  // Función para contar los vecinos vivos de una celda
  function obteneVecinos(cord) {
    let aux = cord.split(',');
    let col = parseInt(aux[0]);
    let fila = parseInt(aux[1]);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let nuevaFila = fila + j;
        let nuevaCol = col + i;

        if(modo == "toro"){
          if(nuevaCol == -1 ) nuevaCol = tam-1;
          if(nuevaFila == -1 ) nuevaFila = tam-1;

          if(nuevaCol == tam ) nuevaCol = 0;
          if(nuevaFila == tam ) nuevaFila = 0;
        }else if(modo=="nulo"){
          if(nuevaCol < 0 || nuevaFila < 0 || nuevaCol >= tam || nuevaFila >= tam) continue;
        }

        const cord = nuevaCol + "," + nuevaFila;
        newCells.add(cord);
      }
    }
  }

  //regresa el numero de vecinos vivos de una celula
  function obteneVecinosVivos(cord) {
    let aux = cord.split(',');
    let col = parseInt(aux[0]);
    let fila = parseInt(aux[1]);
    let contador = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if(i==0 && j==0) continue;
        let nuevaFila = fila + j;
        let nuevaCol = col + i;

        if(modo == "toro"){
          if(nuevaCol == -1 ) nuevaCol = tam-1;
          if(nuevaFila == -1 ) nuevaFila = tam-1;

          if(nuevaCol == tam ) nuevaCol = 0;
          if(nuevaFila == tam ) nuevaFila = 0;
        }

        const cord = nuevaCol + "," + nuevaFila;
        
        if(liveCells.has(cord)){
          contador++;
        }
      }
    }
    return contador;
  }

  liveCells.forEach( (val,key) => {
    obteneVecinos(key);
  });

  let newLiveCells = [];
  let deadCells = [];

  newCells.forEach( (val) => {
    let cont = obteneVecinosVivos(val);
    if(liveCells.has(val)){ //celula viva
      if(!reglaS[cont-1]){ //muere
        deadCells.push(val);
      }

    }else{  //muerta
      if(reglaB[cont-1]){  //vive
        newLiveCells.push(val);
      }
    }
  });

  deadCells.forEach( (val) => {
    removeCell(val);
  });

  newLiveCells.forEach( (val) => {
    addCell(val);
  });

  updateGraphic();
}

function reiniciarSimulador(){
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Simulación detenida.");
  }

  ind = 0;
  cv = 0;

  iteracion.value = ind;
  vivas.value = cv;

  buildGrid(grid, tam, tam);

  liveCells.forEach( (val,key) => {
    val.visible = false;
  });
  liveCells.clear();

  cells = new Array(tam);
  for(let i = 0; i<tam; i++)cells[i] = new Array(tam).fill(false);

  contorno.clear();  

  simulador.x=root.clientWidth/2 - conGrid.width/2;
  simulador.y=root.clientHeight/2 - conGrid.height/2;

  contorno.rect(0,0,(CELL_SIZE + 1)*tam - .01,(CELL_SIZE + 1)*tam - .01)
          .stroke({ color: "red", pixelLine: true, width: 1 })
          .fill({ color: "red", pixelLine: true, width: 1,alpha:.05 });;

  simulador.hitArea = new PIXI.Rectangle(0, 0, conGrid.width,conGrid.height);

  regla.disabled = false;
  resetChart();
}

function cambiarRegla(){
  let aux = regla.value.split('/');

  if(aux.length != 2 || aux[0][0] != 'b' || aux[1][0] != "s" || aux[0].length <= 1 || aux[1].length <= 1) {
    console.log(regla.oldValue);
    regla.value = regla.oldValue;
    return false;
  }else{
    console.log(regla.value);
    regla.oldValue = regla.value;
  }

  aux[0] = aux[0].substring(1);
  aux[1] = aux[1].substring(1);

  console.log(aux);

  reglaB.fill(false);
  reglaS.fill(false);

  for(let i = 0;i<aux[0].length;i++){
    let x = parseInt(aux[0][i]);
    if(isNaN(x)){
      regla.value = regla.oldValue;
      return false;
    }
    reglaB[x-1] = true;
  }

  for(let i = 0;i<aux[1].length;i++){
    let x = parseInt(aux[1][i]);
    if(isNaN(x)){
      regla.value = regla.oldValue;
      return false;
    }
    reglaS[x-1] = true;
  }

  reglaStr = regla.value;
  regla.oldValue = regla.value;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Inicializacion del simulador

(async () => {
  tam = 100;

  cells = new Array(tam);
  for(let i = 0; i<tam; i++)cells[i] = new Array(tam).fill(false);

  reglaB[3] = true;
  reglaS[2] = true;
  reglaS[3] = true;
  regla.oldValue = reglaStr;

  app = new PIXI.Application();
  globalThis.__PIXI_APP__ = app;

  await app.init({ resizeTo: root, preference:"webgpu" });
  app.ticker.maxFPS = 45;
  app.ticker.minFPS = 1;

  simulador = new PIXI.Container();
  conGrid = new PIXI.Container();
  grid = buildGrid(new PIXI.Graphics(),tam,tam);
  grid.hitArea = new PIXI.Rectangle(0, 0, grid.width,grid.height);

  contorno = new PIXI.Graphics().rect(0,0,(CELL_SIZE + 1)*tam - .01,(CELL_SIZE + 1)*tam - .01)
                           .stroke({ color: "red", pixelLine: true, width: 1 })
                           .fill({ color: "red", pixelLine: true, width: 1,alpha:.05 });


  conGrid.addChild(grid,contorno);

  simulador.addChild(conGrid);
  simulador.eventMode = "static";
  simulador.hitArea = new PIXI.Rectangle(0, 0, conGrid.width,conGrid.height);
  simulador.on("pointertap",(event)=>{
      
      let x=( (event.x-viewport.x)/viewport.scale.x) - simulador.x;
      let y=( (event.y-header.clientHeight -viewport.y)/viewport.scale.y) - simulador.y;

      let i = Math.floor(x/(CELL_SIZE + 1));
      let j = Math.floor(y/(CELL_SIZE + 1));

      onTap(i + "," + j);

      console.log(x,y);
      console.log(i, j);

  });

  simulador.x=root.clientWidth/2 - conGrid.width/2;
  simulador.y=root.clientHeight/2 - conGrid.height/2;
  
  conCells = new PIXI.Container();
  conCells.interactiveChildren = false;
  simulador.addChild(conCells);

  cellContext = app.renderer.generateTexture(cellGraph);

  // create viewport
  const viewport = new Viewport({
    // screenWidth: app.canvas.width,
    // screenHeight: app.canvas.height,
    // worldWidth: 1000,
    // worldHeight: 1000,
    stopPropagation:true,
    passiveWheel:false,
    threshold:20,    
    events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  });
  
  // activate plugins
  viewport.drag({
    // keyToPress:["ControlLeft"],
    // ignoreKeyToPressOnTouch:true,
  }).wheel().pinch();

  viewport.on("zoomed-end", () => {
    if(viewport.scale.x < 0.70){
      grid.renderable  = false;
    }else{
      grid.renderable  = true;
    }
  });

  viewport.on("drag-start", () => {
    simulador.eventMode = "none";
  });

  viewport.on("drag-end", () => {
    simulador.eventMode = "static";
  });

  viewport.on("pinch-start", () => {
    simulador.eventMode = "none";
  });

  viewport.on("pinch-end", () => {
    simulador.eventMode = "static";
  });

  // add a red box
  viewport.addChild(simulador);
  // add the viewport to the stage
  app.stage.addChild(viewport);

  root.appendChild(app.canvas);
})();


////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Listeners

document.getElementById("num").addEventListener('change', (e) => {
  tam = parseInt(e.target.value);;

  reiniciarSimulador();
});


document.getElementById("colorAlive").addEventListener("change", function() {
  console.log("Color cambiado.");
  let nuevo = parseInt(this.value.substring(1),16);

  cambiarColor(nuevo);
  col=nuevo;

});

document.getElementById("colorTablero").addEventListener("change", function() {
  console.log("Color de tablero cambiado.");
  let nuevo = parseInt(this.value.substring(1),16);

  cambiarColorTablero(nuevo);

});

// Paso único
document.getElementById("stepBtn").addEventListener("click", function() {
  console.log("Iteración paso a paso ejecutada.");
  siguienteIteracion();
  app.renderer.render(app.stage);
  
  //actualizarCelulas();

});

let intervalId = null;

// Iniciar simulación continua
document.getElementById("playBtn").addEventListener("click", function() {
  console.log("Simulación iniciada.");
  regla.disabled = true;
  if (!intervalId) { // Si no se está ejecutando ya
    intervalId = setInterval(() => {
      siguienteIteracion();
      app.renderer.render(app.stage);
    }, 20); // 200 ms por generación
    console.log("Simulación iniciada.");
  }
});

// Detener simulación
document.getElementById("stopBtn").addEventListener("click", function() {
  console.log("Simulación detenida.");
  regla.disabled = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Simulación detenida.");
  }
});

// Limpiar espacio celular
document.getElementById("clearBtn").addEventListener("click", function() {
  console.log("Espacio limpiado.");
  reiniciarSimulador();
});

// Guardar configuración
document.getElementById("saveBtn").addEventListener("click", function() {
  console.log("Guardando configuración.");
});

// Cambiar modo de frontera
document.getElementById("frontera").addEventListener("change", function() {
  modo = this.value;
  console.log(modo);
});

regla.addEventListener("focus", function() {
  this.oldValue = this.value;
});

// Cambiar regla
regla.addEventListener("change", cambiarRegla);


document.getElementById("downloadBtn").addEventListener("click", function () {
  function obtenerTablero(){
    let txt = "" + String(tam) + " " + String(tam) + '\n' + reglaStr + '\n' + modo + "\n";
    liveCells.forEach( (val,key) => {
      let aux = key.split(',');
      let col = parseInt(aux[0]);
      let fila = parseInt(aux[1]);

      txt = txt + String(col) + " " + String(fila) + "\n";
    });

    return txt;

  }

  const text = obtenerTablero();

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "archivo.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById("fileInput").addEventListener("input", function () {
  
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      //fileContent.textContent = e.target.result;
      let txt = e.target.result;
      
      const numbers = txt.match(/[a-zA-Z0-9/]+/g);

      console.log(numbers)
      if(numbers[0] == numbers[1]){
        tam = parseInt(numbers[0]);
        document.getElementById("num").value=tam;
      }else return;

      regla.value = numbers[2];
      cambiarRegla();

      if(numbers[3] == "nulo" || numbers[3] == "toro"){
        modo = numbers[3];
        document.getElementById("frontera").value = numbers[3];
      }

      reiniciarSimulador();

      for(let i = 4; i<(numbers.length-1); i=i+2){
        addCell(String(numbers[i] + "," + numbers[i+1]));
      }

      updateLastData();

    };
    reader.readAsText(file);
  }
});

// Cargar archivo
/*document.getElementById("load").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    console.log("Archivo seleccionado:", file.name);
  }
});*/


