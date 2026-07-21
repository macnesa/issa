import ReactApexChart from "react-apexcharts";

export default function LineChart(props) {
  const { data } = props;
  const Scoresname = data.map((each) => each.category);
  const scores = data.map((each) => each.value);

  const KKM = data[0].Lesson.KKM;

  // Mendapatkan lebar layar saat ini
  var lebarLayar = window.innerWidth;

  // Mencetak lebar layar ke console
  // console.log("Lebar layar: " + lebarLayar + "px");

  
  const series = {
    monthDataSeries1: {
      name: Scoresname,
      value: scores,
    },
  };
  
  console.log(series, "noel");
  const state = {
    series: [
      {
        name: "Nilai",
        data: series.monthDataSeries1.value,
      },
    ],
    options: {
      chart: {
        type: "area",
        height: 350,
        width: 800,
        zoom: {
          enabled: false,
        },
        // foreColor: "#fff",
        fontFamily: "montserrat",
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        colors: ["#a033c4"],
      },
      title: {
        // text: "Fundamental Analysis of Stocks",
        align: "left",
      },
      subtitle: {
        text: "Overview",
        align: "left",
      },

      // grid: {
      //   show: true,
      //   borderColor: '#ccc',
      //   strokeDashArray: 5,
      //   position: 'back',
      //   xaxis: {
      //     lines: {
      //       show: true
      //     }
      //   },
      //   yaxis: {
      //     lines: {
      //       show: true
      //     }
      //   },
      // },

      labels: series.monthDataSeries1.name,
      xaxis: {
        type: "category",
      },
      yaxis: {
        opposite: true,
        min: 0,
        max: 100,
      },
      legend: {
        horizontalAlign: "left",
      },
      annotations: {
        yaxis: [
          {
            y: KKM, // nilai batas
            borderColor: "#a61f31", // warna garis batas
            label: {
              borderColor: "#a61f31",
              style: {
                color: "#fff",
                background: "#a61f31",
              },
              text: "KKM",
            },
          },
        ],
      },
    },
  };

  return (
    <>
      {/* <div id="chart" className="grid mt-4   justify-center max-w-screen-xl mx-auto border border-red-400 "> */}
      <ReactApexChart
        className=" w-full border-black"
        options={state.options}
        series={state.series}
        type="area"
        height={250}
        width={lebarLayar - 20}
      />
      {/* </div> */}
    </>
  );
}
