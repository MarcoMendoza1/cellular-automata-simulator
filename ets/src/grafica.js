
const canva = document.getElementById("graph-canva");
let labels = [0];
let modalOpen = false;

let data = {
  labels: labels,
  datasets: [
    {
      label: 'Obreras',
      data: [{x:0, y:0}],
      borderColor: 'rgba(217, 255, 0, 1)',
      backgroundColor: 'rgba(168, 198, 0, 1)',
      normalized:true
    },
    {
      label: 'Soldado',
      data: [{x:0, y:0}],
      borderColor: '#0000FF',
      backgroundColor: '#0101adff',
      normalized:true
    },
    {
      label: 'Reproductoras',
      data: [{x:0, y:0}],
      borderColor: '#00FF00',
      backgroundColor: '#00b000ff',
      normalized:true
    },
    {
      label: 'Reinas',
      data: [{x:0, y:0}],
      borderColor: '#FF0000',
      backgroundColor: '#ac0000ff',
      normalized:true
    }
  ]
}

const config = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    animation: false,
    parsing:false,
    normalized:true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff' // Text color for the legend
        }
      },
      title: {
        display: true,
        text: 'Densidad poblacional de las hormigas',
        color:'white'
      },
      customCanvasBackgroundColor: {
        color: 'white',
      },
      tooltip: {
        backgroundColor: '#333333', // Tooltip background
        titleColor: '#ffffff', // Tooltip title color
        bodyColor: '#ffffff' // Tooltip body color
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff' // X-axis labels color
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)' // X-axis grid lines color
        }
      },
      y: {
        min: 0,
        suggestedMax: tam,
        ticks: {
          color: '#ffffff' // Y-axis labels color
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)' // Y-axis grid lines color
        }
      }
    },
    elements: {
        point: {
            radius: 2.5 // default to disabled in all datasets
        }
    }
  },
};

//onTap
function updateLastData(){
  for(let i = 0;i<=3;i++){
    data.datasets[i].data[ind].y = cantHormigas[i];
  }
}

function resetChart(){
  data.labels = [0];

  for(let i = 0;i<=3;i++){
    data.datasets[i].data = [{x:0, y:0}];
  }

}

function updateGraphic(forceUpdate) {
  data.labels.push(ind);

  for(let i = 0;i<=3;i++){
    data.datasets[i].data.push({x:ind, y:cantHormigas[i]});
  }

  if(modalOpen && (forceUpdate || ind%10 == 0 ) )
    chart.update();
}

let chart = new Chart(canva,config);

document.getElementById("graph-close-btn").addEventListener("click", () => {
  document.getElementById("graph-modal").style.display = "none";
  modalOpen = false;
});

document.getElementById("graph-open").addEventListener("click", () => {
  document.getElementById("graph-modal").style.display = "flex";
  modalOpen = true;
  chart.update();
});