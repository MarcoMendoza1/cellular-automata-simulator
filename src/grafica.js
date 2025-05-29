
const canva = document.getElementById("graph-canva");
let labels = [0];
let modalOpen = false;

let data = {
  labels: labels,
  datasets: [
    {
      label: 'Celulas Vivas',
      data: [{x:0, y:0}],
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54,162,235,.5)',
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
        text: 'Chart.js Line Chart',
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
  data.datasets[0].data[ind].y = liveCells.size;
}

function resetChart(){
  data.labels = [0];
  data.datasets[0].data = [{x:0, y:0}];

}

function updateGraphic(forceUpdate) {
  data.labels.push(ind);

  data.datasets[0].data.push({x:ind, y:liveCells.size});

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