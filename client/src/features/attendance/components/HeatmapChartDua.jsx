import { Chart } from 'frappe-charts/dist/frappe-charts.min.esm';
import { useEffect, useMemo, useRef } from 'react';

function getHeatmapRange(attendanceRecords) {
  const validDates = attendanceRecords
    .map((record) => new Date(record.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  const today = new Date();
  const firstDate = validDates[0] || today;
  const lastDate = validDates.at(-1) || today;
  return {
    start: new Date(firstDate.getFullYear(), firstDate.getMonth(), 1),
    end: new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0, 23, 59, 59),
  };
}

export default function HeatmapChartDua({ data: attendanceRecords = [] }) {
  const chartRef = useRef(null);
  const chartData = useMemo(() => {
    const dataPoints = {};
    attendanceRecords.forEach((record) => {
      const date = new Date(record.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const scores = { Hadir: 100, Izin: 70, Sakit: 50, Alfa: 1 };
      dataPoints[Math.floor(date.getTime() / 1000)] = scores[record.status] || 0;
    });
    return { dataPoints, ...getHeatmapRange(attendanceRecords) };
  }, [attendanceRecords]);

  useEffect(() => {
    if (!chartRef.current) return undefined;
    const attendanceHeatmap = new Chart(chartRef.current, {
      data: chartData,
      type: 'heatmap',
      radius: 2,
      colors: ['#d6e3e2', '#b91c1c', '#0369a1', '#b45309', '#047857'],
    });

    return () => {
      attendanceHeatmap.destroy();
    };
  }, [chartData]);

  return <div ref={chartRef} className="attendance-heatmap__chart" />;
}
