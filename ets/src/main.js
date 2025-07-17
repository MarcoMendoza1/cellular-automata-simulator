

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Variables globales

const CELL_SIZE = 10;

let app;

let root = document.getElementById("simulador");
let header = document.getElementById("header");
let vivas = document.getElementById("liveCells");
let hormigas = document.getElementById("liveAnts");
let iteracion = document.getElementById("iteracion");
let inputTipoHormiga = document.getElementById("tipoHormiga");
let entropia = document.getElementById("entropia");

let simulador;
let grid;
let conCells;
let conGrid;
let contorno;

let tam;
let col=0xFFFFFF;
let antsColors = [0xFFFF00,0x0000FF,0x00FF00,0xFF0000];
let cv = 0;
let ca = 0;

// Iteraciones de la cuadricula, indicador del paso actual
let ind = 0;
let liveAnts = new Array(0);
let liveCells = new Map();
let cells = [[]];
let ants  = [[]]; //tipos en orden: obrera,soldado,reproductora

let modo = "nulo";
let giro = [3,1];   //giros de 90 grados a la izquierda dependiendo de casilla muerta o viva
let probabilidad = [.33,.33,.33];
let tipoHormiga = 0;
let modoHormigas = 0;   //0: una hormiga, 1: 4 tipos de hormiga
let cantHormigas = [0,0,0,0]

let cellGraph = new PIXI.Graphics()
                  .setFillStyle({ color: 'white',alpha:.4 })
                  .rect(0, 0, 1, 1)
                  .fill()
                  .stroke({ color: 0xffffff, pixelLine: true });
let cellContext;

// Textura de las celulas pre-creada para aumentar eficiencia
const baseTexture = PIXI.Texture.WHITE;

let ready = true;


////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Funciones para el simulador (acciones, funcionalidades)

//Todo, hacer que solo pinte celdas, no registre ants o liveCells 
function addCell(cord){
  cv++;
  vivas.value = cv;
  let aux = cord.split(',');
  let x = aux[0];
  let y = aux[1];

  let cell;

  if(cells[x][y] === false){

    cell = new PIXI.Sprite(baseTexture);

    cell.i=x;
    cell.j=y;

    cell.x=x * (CELL_SIZE + 1)+1.5;
    cell.y=y * (CELL_SIZE + 1)+1.5;

    cell.width = 8;
    cell.height = 8;
    cell.alpha = .9;
    cell.tint = (col);
    cell.visible=true;

    cells[x][y] = cell;
    conCells.addChild(cell);
    liveCells.set(cord,cell);
  }else{
    cell = cells[x][y];
    cell.visible = true;
    liveCells.set(cord,cell);
  }
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

//tipos en orden (empieza en 0): obrera,soldado,reproductora
function addAnt(cord,type){
  ca++;
  hormigas.value = ca;

  let aux = cord.split(',');
  let x = parseInt(aux[0]);
  let y = parseInt(aux[1]);

  let cell;

  cell = new PIXI.Sprite(baseTexture);

  cell.i=x;
  cell.j=y;
  cell.dir = 0;
  cell.type = type;
  cell.t_aislamiento = 0;
  ants[x][y][type]++;
  cantHormigas[type]++;

  cell.x=x * (CELL_SIZE + 1)+2;
  cell.y=y * (CELL_SIZE + 1)+2;
  cell.zIndex = 1000;

  cell.width = 7;
  cell.height = 7;
  cell.alpha = 1.0;
  cell.tint = antsColors[type];
  cell.visible=true;

  liveAnts.push(cell);
  conCells.addChild(cell);
}

function removeAnt(ind){
  ca--;
  hormigas.value = ca;

  let act = liveAnts[ind];
  ants[act.i][act.j][act.type]--;
  cantHormigas[act.type]--;

  conCells.removeChild(liveAnts[ind]);

  liveAnts[ind].destroy();
  liveAnts.splice(ind,1);  
}

// onClick de cada celula
function onTap(cord,isAnt){
  // history[history.length-1][this.i][this.j]=cells[this.i][this.j].visible=!cells[this.i][this.j].visible;
  if(!isAnt){
    if(liveCells.has(cord)){
      removeCell(cord);
    }else{
      addCell(cord);
    }

  }else{
    let ind = liveAnts.findIndex( (a) => {
      let c = `${a.i},${a.j}`;
      return c == cord;
    });
    if(ind != -1){/////////////////////////////////////////////////////////
      removeAnt(ind);
    }else{
      addAnt(cord,tipoHormiga);
    }
  }
  updateLastData();
  //updateLastData();
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

function elegirTipoHormiga(){
  let r = Math.random(); 

  if (r < probabilidad[0]) return 0;
  else if (r < probabilidad[0] + probabilidad[1]) return 1;
  else return 2;
}

function cambiarColorTablero(color){
  app.renderer.background.color=color;
}

// Generar siguiente iteracion
function siguienteIteracion(){
  ready = false;
  function contarVecinasPorTipo(i, j, rango) {
    const conteo = [0, 0, 0, 0]; // obrera, soldado, reproductora, reina

    for (let dx = -rango; dx <= rango; dx++) {
      for (let dy = -rango; dy <= rango; dy++) {
        if (dx === 0 && dy === 0) continue;

        let ni = i + dx;
        let nj = j + dy;

        if (modo === "toro") {
          if(ni == -1 ) ni = tam-1;
          if(nj == -1 ) nj = tam-1;

          if(ni == tam ) ni = 0;
          if(nj == tam ) nj = 0;

        } else {
          if (ni < 0 || nj < 0 || ni >= tam || nj >= tam) continue;
        }

        for (let tipo = 0; tipo < 4; tipo++) {
          conteo[tipo] += ants[ni][nj][tipo];
        }
      }
    }

    return conteo;
  }

  let vis = new Set();
  let del = [];
  let add = [];

  ind++;
  iteracion.value = ind;

  liveAnts.forEach( (val,ind) => {
    let cord = `${val.i},${val.j}`;
    let viva = liveCells.has(cord);

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Verificar superviviencia cuando hay 4 hormigas

    if(modoHormigas == 1){
      let vecinas = contarVecinasPorTipo(val.i, val.j, 5);

      if (val.type === 0) { // Obrera
        if (vecinas[0] === 0) {
          del.push(val); // muere si no hay obreras cerca
          return;
        }
      } else if (val.type === 1) { // Soldado
        if (vecinas[1] > 6) { // por ejemplo: si hay más de 6 soldados cercanos
          del.push(val);
          return;
        }
      } else if (val.type === 2) { // Reproductora
        if (/*vecinas[0] + vecinas[1] + vecinas[2] +*/ vecinas[3] === 0) {
          val.t_aislamiento++;
        } else {
          val.t_aislamiento = 0;
        }

        if (val.t_aislamiento > 10) {
          del.push(val); // muere por aislamiento
          return;

        }

        if (vecinas[3] > 0 && Math.random() < 0.1) {
          let t = elegirTipoHormiga();
          add.push({i:val.i,j:val.j,tipo:t});
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////

    val.dir = (val.dir + giro[(viva)?1:0])%4;

    ants[val.i][val.j][val.type]--;

    let nuevaCol  = val.i;
    let nuevaFila = val.j;

    if(val.dir == 0){
      nuevaFila--;
    }else if(val.dir == 1){
      nuevaCol--;
    }else if(val.dir == 2){
      nuevaFila++;
    }else if(val.dir == 3){
      nuevaCol++;
    }

    if(modo == "toro"){
      if(nuevaCol == -1 ) nuevaCol = tam-1;
      if(nuevaFila == -1 ) nuevaFila = tam-1;

      if(nuevaCol == tam ) nuevaCol = 0;
      if(nuevaFila == tam ) nuevaFila = 0;
    }else if(modo=="nulo"){
      if(nuevaCol < 0 || nuevaFila < 0 || nuevaCol >= tam || nuevaFila >= tam){
        del.push(val);
        return;
      }
    }

    if(!vis.has(cord)){
      vis.add(cord);
    }

    val.i = nuevaCol;
    val.j = nuevaFila;

    ants[val.i][val.j][val.type]++;

    val.x = nuevaCol * (CELL_SIZE + 1)+2;
    val.y = nuevaFila * (CELL_SIZE + 1)+2;

    
  });

  del.forEach( (val) => {
    removeAnt(liveAnts.indexOf(val));
  });

  add.forEach( (val,ind) => {
    let cord = `${val.i},${val.j}`;
    addAnt(cord,val.tipo);
  });

  vis.forEach( (value) => {
    if(liveCells.has(value)){
      removeCell(value);
    }else{
      addCell(value);
    }
  });

  ready = true;
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

  ants = Array.from({ length: tam }, () =>
    Array.from({ length: tam }, () => [0, 0, 0, 0])
  );

  contorno.clear();  

  simulador.x=root.clientWidth/2 - conGrid.width/2;
  simulador.y=root.clientHeight/2 - conGrid.height/2;

  contorno.rect(0,0,(CELL_SIZE + 1)*tam - .01,(CELL_SIZE + 1)*tam - .01)
          .stroke({ color: "red", pixelLine: true, width: 1 })
          .fill({ color: "red", pixelLine: true, width: 1,alpha:.05 });;

  simulador.hitArea = new PIXI.Rectangle(0, 0, conGrid.width,conGrid.height);

  while(liveAnts.length > 0) removeAnt(0);
  cantHormigas = [0,0,0,0];

  resetChart();
}

function cambiarRegla(){
  
}

function tableroAleatorio(){
  reiniciarSimulador();
  for(let i=0; i<tam; i++){
    for(let j=0; j<tam; j++){
      if(Math.random() < 0.5){
        addCell(String(i) + ',' + String(j));
      }
    }
  }
  updateLastData();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Inicializacion del simulador

(async () => {
  tam = 100;

  cells = new Array(tam);
  for(let i = 0; i<tam; i++)cells[i] = new Array(tam).fill(false);

  ants = Array.from({ length: tam }, () =>
    Array.from({ length: tam }, () => [0, 0, 0, 0])
  );


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

      onTap(i + "," + j,event.ctrlKey);

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

document.getElementById("colorAlive").addEventListener("change", function() {
  console.log("Color cambiado.");
  let nuevo = parseInt(this.value.substring(1),16);

  cambiarColor(nuevo);
  col=nuevo;

});

function cambiarColorHormiga(type,value){
  data.datasets[type].borderColor = value;

  console.log("Color cambiado.");
  let nuevo = parseInt(value.substring(1),16);

  antsColors[type] = nuevo;

  liveAnts.forEach(element => {
    if(element.type == type)
      element.tint = antsColors[type];
  });

}

document.getElementById("colorObrera").addEventListener("change", function() {
  cambiarColorHormiga(0,this.value);
});

document.getElementById("colorSoldado").addEventListener("change", function() {
  cambiarColorHormiga(1,this.value);
});

document.getElementById("colorReproductura").addEventListener("change", function() {
  cambiarColorHormiga(2,this.value);
});

document.getElementById("colorReina").addEventListener("change", function() {
  cambiarColorHormiga(3,this.value);
});

document.getElementById("density-ant-0").addEventListener("change", function() {
  probabilidad[0] = parseFloat(this.value)/100;
  entropia.innerHTML = String( -(probabilidad[0] * Math.log2(probabilidad[0]) + probabilidad[1] * Math.log2(probabilidad[1]) + probabilidad[2] * Math.log2(probabilidad[2])) )
});

document.getElementById("density-ant-1").addEventListener("change", function() {
  probabilidad[1] = parseFloat(this.value)/100;
  entropia.innerHTML = String( -(probabilidad[0] * Math.log2(probabilidad[0]) + probabilidad[1] * Math.log2(probabilidad[1]) + probabilidad[2] * Math.log2(probabilidad[2])) )
});

document.getElementById("density-ant-2").addEventListener("change", function() {
  probabilidad[2] = parseFloat(this.value)/100;
  entropia.innerHTML = String( -(probabilidad[0] * Math.log2(probabilidad[0]) + probabilidad[1] * Math.log2(probabilidad[1]) + probabilidad[2] * Math.log2(probabilidad[2])) )
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
  if (!intervalId) { // Si no se está ejecutando ya
    intervalId = setInterval(() => {
      if(ready) siguienteIteracion();
    }, 10); // 200 ms por generación
    console.log("Simulación iniciada.");
  }
});

// Detener simulación
document.getElementById("stopBtn").addEventListener("click", function() {
  console.log("Simulación detenida.");
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

function cambiarModoHormigas(m){
  if(m == 0){
    modoHormigas = 0;
    inputTipoHormiga.selectedIndex = 0;
    inputTipoHormiga.disabled = true;
    
    liveAnts.forEach( (ant) => {
      if(ant.type != 0){
        ants[ant.i][ant.j][ant.type]--;
        ants[ant.i][ant.j][0]++;

        cantHormigas[ant.type]--;
        cantHormigas[0]++;

        ant.type = 0;
        ant.tint = antsColors[0];
      }
    });
    updateLastData();
  }else{
    modoHormigas = 1;
    inputTipoHormiga.disabled = false;
  }
}

//Cambiar tipos de hormiga
document.getElementById("modoHormigas0").addEventListener("click", function() {
  console.log("Modo cambiado a una hormiga.");
  cambiarModoHormigas(0);
});

document.getElementById("modoHormigas1").addEventListener("click", function() {
  console.log("Modo cambiado a 4 hormigas.");
  cambiarModoHormigas(1);
});


// Cambiar modo de frontera
document.getElementById("frontera").addEventListener("change", function() {
  modo = this.value;
  console.log(modo);
});

document.getElementById("tipoHormiga").addEventListener("change", function() {
  tipoHormiga = parseInt(this.value);
  console.log(tipoHormiga);
});

document.getElementById("downloadBtn").addEventListener("click", function () {
  function obtenerTablero(){
    let txt = "" + String(tam) + " " + String(tam) + '\n' + modoHormigas + '\n' + modo + "\n" + String(liveCells.size) + "\n" + String(liveAnts.length) + "\n";
    liveCells.forEach( (val,key) => {
      let aux = key.split(',');
      let col = parseInt(aux[0]);
      let fila = parseInt(aux[1]);

      txt = txt + String(col) + " " + String(fila) + "\n";
    });

    liveAnts.forEach( (val,ind) => {
      txt = txt + String(val.i) + " " + String(val.j) + " " + String(val.type) + "\n";
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
      let aux,numCells,numAnts;
      let txt = e.target.result;
      
      const numbers = txt.match(/[a-zA-Z0-9/]+/g);
      //Separado por numeros

      console.log(numbers)
      if(numbers[0] == numbers[1]){
        tam = parseInt(numbers[0]);
        document.getElementById("num").value=tam;
      }else return;

      aux = numbers[2];
      cambiarModoHormigas(parseInt(aux));

      if(numbers[3] == "nulo" || numbers[3] == "toro"){
        modo = numbers[3];
        document.getElementById("frontera").value = numbers[3];
      }

      numCells = parseInt(numbers[4]);
      numAnts = parseInt(numbers[5]);

      reiniciarSimulador();

      let i = 6;
      for(; i<(6+numCells*2); i=i+2){
        addCell(String(numbers[i] + "," + numbers[i+1]));
      }

      for(; i<(numbers.length-1); i=i+3){
        addAnt(String(numbers[i] + "," + numbers[i+1]),parseInt(numbers[i+2]));
      }

      updateLastData();

    };
    reader.readAsText(file);
  }
});

document.getElementById("aleatorio").addEventListener("click", tableroAleatorio);

// Cargar archivo
/*document.getElementById("load").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    console.log("Archivo seleccionado:", file.name);
  }
});*/


