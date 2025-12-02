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

const VendorViewsChart = ({ properties = [] }) => {
  // Build simple "views over properties" series using current data
  const labels = properties.map((p, index) => p.title || `Property ${index + 1}`);
  const viewsData = properties.map(p => p.views || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Views',
        data: viewsData,
        borderColor: '#2563EB',
        backgroundColor: '#2563EB20',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#2563EB'
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
          label: (context) => `Views: ${context.parsed.y}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  if (!properties.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No property data available yet.
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
};

export default VendorViewsChart;


