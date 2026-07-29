import ReactApexChart from "react-apexcharts";

export default function LineChart({ data: scoreRecords }) {
  const scoreCategories = scoreRecords.map((scoreRecord) => scoreRecord.category);
  const scoreValues = scoreRecords.map((scoreRecord) => scoreRecord.value);

  const minimumPassingScore = scoreRecords[0]?.lesson?.kkm;

  
  const scoreSeries = {
    monthDataSeries1: {
      name: scoreCategories,
      value: scoreValues,
    },
  };
  
  const chartConfiguration = {
    series: [
      {
        name: "Nilai",
        data: scoreSeries.monthDataSeries1.value,
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
        fontFamily: "Plus Jakarta Sans, sans-serif",
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

      labels: scoreSeries.monthDataSeries1.name,
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
            y: minimumPassingScore, // nilai batas
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
        options={chartConfiguration.options}
        series={chartConfiguration.series}
        type="area"
        height={250}
        width="100%"
      />
    </>
  );
}
