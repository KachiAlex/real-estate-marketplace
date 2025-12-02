import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const VendorConversionChart = ({ properties = [] }) => {
  const labels = properties.map((p, index) => p.title || `Property ${index + 1}`);
  const conversionRates = properties.map(p => {
    const views = p.views || 0;
    const inquiries = p.inquiries || 0;
    if (!views) return 0;
    return ((inquiries / views) * 100).toFixed(1);
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: conversionRates,
        backgroundColor: '#10B98180',
        borderColor: '#10B981',
        borderWidth: 1
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
          label: (context) => `Conversion: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (val) => `${val}%`
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
      <Bar data={data} options={options} />
    </div>
  );
};

export default VendorConversionChart;


