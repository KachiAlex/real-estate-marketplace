import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminEscrowVolumeChart = ({ escrows = [] }) => {
  if (!escrows.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No escrow data available yet.
      </div>
    );
  }

  // Group by date (YYYY-MM-DD) and sum amounts
  const totalsByDate = escrows.reduce((acc, tx) => {
    const date = tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : 'Unknown';
    if (!acc[date]) acc[date] = 0;
    acc[date] += tx.amount || 0;
    return acc;
  }, {});

  const labels = Object.keys(totalsByDate).sort();
  const data = labels.map(d => totalsByDate[d]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Escrow Volume (₦)',
        data,
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F620',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#3B82F6'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `₦${(context.parsed.y || 0).toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default AdminEscrowVolumeChart;


