
import ReactApexChart from "react-apexcharts";
import Chart from "react-apexcharts"

export default function HeatMap() {

  function generateData(length, options) {
    const { min, max } = options;
    const data = [];

    for (let i = 0; i < length; i++) {
      const value = Math.floor(Math.random() * (max - min + 1) + min);
      data.push(value);
    }

    return data;
  }

  const state = {

    series: [{
      name: 'Jan',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'Feb',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'Mar',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'Apr',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'May',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'Jun',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'Jul',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'Aug',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    },
    {
      name: 'Sep',
      data: generateData(20, {
        min: -30,
        max: 55
      })
    }
    ],
    options: {
      chart: {
        height: "300px",
        width: "500px",
        type: 'heatmap',
      },
      plotOptions: {
        heatmap: {
          squareSize: 10,
          shadeIntensity: 0.5,
          radius: 0,
          useFillColorAsStroke: false,
          colorScale: {
            cellHeight: 20, // mengatur tinggi kotak
            cellWidth: 20, // mengatur lebar kotak
            ranges: [{
              from: -30,
              to: -10,
              name: 'low',
              color: '#ab717f'
            },
            {
              from: -9,
              to: 55,
              name: 'medium',
              color: '#7981b8'
            }
            ]
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 5
      },
      title: {
        text: 'HeatMap Chart with Color Range'
      },
    },


  };



  return (
    <>
      <div id="chart" className="w-[640px] h-[330px] ">
        <ReactApexChart options={state.options} series={state.series} type="heatmap" height={350} />
      </div>

    </>
  )
}



