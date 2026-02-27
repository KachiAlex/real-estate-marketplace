import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function VendorChart({ data = [], title = '' }) {
  // Expect data as array of { label, value } or numbers
  const labels = (data && data.length && data.map((d, i) => (d && d.label) || `#${i + 1}`)) || [];
  const values = (data && data.length && data.map((d) => (typeof d === 'number' ? d : (d && d.value) || 0))) || [];

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        fill: false,
        backgroundColor: 'rgba(59,130,246,0.6)',
        borderColor: 'rgba(59,130,246,0.9)',
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f1f5f9' } },
    },
  };

  if (!data || !data.length) {
    return <div className="h-36 flex items-center justify-center text-gray-300">No data</div>;
  }

  return (
    <div className="h-36">
      <Line data={chartData} options={options} />
    </div>
  );
}
