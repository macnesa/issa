import ReactApexChart from "react-apexcharts";

export default function Bubble() {

  function generateData(baseval, count, yrange) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = new Date(baseval);
      var y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
      var z = Math.floor(Math.random() * (40 - 10 + 1)) + 10;

      series.push({ x: x, y: y, z: z });
      baseval += 86400000;
      i++;
    }
    return series;
  }

  const state = {

    series: [{
      name: 'Bubble1',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 1, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Bubble2',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 1, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Bubble3',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 1, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Bubble4',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    }],
    options: {
      chart: {
        height: 350,
        type: 'bubble',
        animations: {
          enabled: false
        },
        sparkline: {
          enabled: false
        },
        dropShadow: {
          enabled: null
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 0.8
      },
      title: {
        text: 'Simple Bubble Chart'
      },
      plotOptions: {
        bubble: {
          center: {
            x: '50%',
            y: '50%'
          }
        }
      }
    },


  }

  return (

    <div id="chart">
      <ReactApexChart options={state.options} series={state.series} type="bubble" height={350} />
    </div>
  )
}
