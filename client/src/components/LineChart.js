import ReactApexChart from "react-apexcharts";

export default function LineChart(props) {
  const { data } = props;
  const Scoresname = data.map((each) => each.category);
  const scores = data.map((each) => each.value);

  const KKM = data[0]?.lesson?.kkm;

  
  const series = {
    monthDataSeries1: {
      name: Scoresname,
      value: scores,
    },
  };
  
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
        fontFamily: "system-ui, sans-serif",
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        colors: ["#356d8d"],
      },
      title: {
        // text: "Fundamental Analysis of Stocks",
        align: "left",
      },
      subtitle: { text: "", align: "left" },

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
            borderColor: "#a84444", // warna garis batas
            label: {
              borderColor: "#a61f31",
              style: {
                color: "#fff",
              background: "#a84444",
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
      <ReactApexChart
        className="w-full"
        options={state.options}
        series={state.series}
        type="area"
        height={250}
        width="100%"
      />
    </>
  );
}
