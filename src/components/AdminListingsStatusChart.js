import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminListingsStatusChart = ({ total = 0, pending = 0, approved = 0, rejected = 0 }) => {
  const data = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [pending, approved, rejected],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        hoverBackgroundColor: ['#D97706', '#059669', '#DC2626'],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const sum = pending + approved + rejected || 1;
            const pct = ((value / sum) * 100).toFixed(1);
            return `${context.label}: ${value} (${pct}%)`;
          }
        }
      }
    }
  };

  if (!total) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No property data available yet.
      </div>
    );
  }

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default AdminListingsStatusChart;


