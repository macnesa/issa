import { Chart } from "frappe-charts/dist/frappe-charts.min.esm";
import { useEffect, useRef } from "react";

export default function Heatmap(props) {

  let result = {};
  const chartRef = useRef(null);

  if (props.data) {

    props.data.forEach(item => {
      const date = new Date(item.createdAt);
      const unixTimestamp = Math.floor((date.getTime() / 1000));
      //  console.log(item );
      // return Math.floor(Date.parse(timestamp) / 1000);
      // const timestamp = new Date(item.createdAt).setHours(0, 0, 0, 0) / 1000;
      let value = 0;

      switch (item.status) {
        case 'Hadir':
          value = 100;
          break;
        case 'Sakit':
          value = 50;
          break;
        case 'Alfa':
          value = 1;
          break;
        case 'Izin':
          value = 70;
          break;
        default:
          value = 0;
      }

      result[unixTimestamp] = value;
    });


  }




  useEffect(() => {
    const chartd = chartRef.current;
    const chart = new Chart(chartd, {
      subtitle: "Contoh Heatmap Chart",
      color: "#c7323e",
      data: {
        dataPoints: result,
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
      chart.destroy();
    }
  }, [props.data]);

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