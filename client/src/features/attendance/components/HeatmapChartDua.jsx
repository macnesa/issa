import { Chart } from "frappe-charts/dist/frappe-charts.min.esm";
import { useEffect, useRef } from "react";

export default function HeatmapChartDua({ data: attendanceRecords }) {

  const attendanceHeatmapPoints = {};
  const chartRef = useRef(null);

  if (attendanceRecords) {

    attendanceRecords.forEach((attendanceRecord) => {
      const date = new Date(attendanceRecord.createdAt);
      const unixTimestamp = Math.floor((date.getTime() / 1000));
      //  console.log(item );
      // return Math.floor(Date.parse(timestamp) / 1000);
      // const timestamp = new Date(item.createdAt).setHours(0, 0, 0, 0) / 1000;
      let attendanceStatusScore = 0;

      switch (attendanceRecord.status) {
        case 'Hadir':
          attendanceStatusScore = 100;
          break;
        case 'Sakit':
          attendanceStatusScore = 50;
          break;
        case 'Alfa':
          attendanceStatusScore = 1;
          break;
        case 'Izin':
          attendanceStatusScore = 70;
          break;
        default:
          attendanceStatusScore = 0;
      }

      attendanceHeatmapPoints[unixTimestamp] = attendanceStatusScore;
    });


  }




  useEffect(() => {
    const chartContainer = chartRef.current;
    const attendanceHeatmap = new Chart(chartContainer, {
      subtitle: "Contoh Heatmap Chart",
      color: "#c7323e",
      data: {
        dataPoints: attendanceHeatmapPoints,
        start: new Date("2023-01-01T00:00:00.000Z"),
        end: new Date("2023-07-31T11:59:00.000Z"),
      },
      type: "heatmap",
      radius: 2,
      //         empty      alfa       sakit      izin       hadir
      colors: ['#d9d9d9', '#c7323e', '#73b3f3', '#e6cc4e', '#2b5c31'],
      // width:300,
      // height:400,
      // responsive:true
      // x_axis_mode: "time",
      // y_axis_mode: "tick",
    });

    return () => {
      attendanceHeatmap.destroy();
    }
  }, [attendanceRecords]);

  return (
    //pointer-events-none border border-white 
    <div ref={chartRef} id="heatmap-chart" className="  border-black " style={{clipPath: "inset(0 0 15% 0%)"}} ></div>
     
    
    // <div className="grid mt-4 overflow-y-scroll justify-start sm:justify-center max-w-screen-xl mx-auto border border-red-400" >
    //   <div ref={chartRef} id="heatmap-chart" className="pointer-events-none w-[300px] h-[500px] border border-black " ></div>
    // </div>
    
    
    
  );
}


// {
//   '1578355200': 1, // alfa
//   '1578441600': 50, // // sakit
//   '1578528000': 70, // izin
//   '1578614400': 100, //hadir
// },
