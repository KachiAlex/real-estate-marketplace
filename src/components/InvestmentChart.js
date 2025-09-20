import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InvestmentChart = ({ data, title = "Projected Returns" }) => {
  // Default chart data if none provided
  const defaultData = [
    { quarter: 'Q1 2024', value: 15, amount: 2.1 },
    { quarter: 'Q2 2024', value: 18, amount: 2.8 },
    { quarter: 'Q3 2024', value: 22, amount: 3.2 },
    { quarter: 'Q4 2024', value: 25, amount: 3.8 },
    { quarter: 'Q1 2025', value: 28, amount: 4.1 },
    { quarter: 'Q2 2025', value: 30, amount: 4.5 },
    { quarter: 'Q3 2025', value: 32, amount: 4.8 },
    { quarter: 'Q4 2025', value: 35, amount: 5.2 }
  ];

  const chartData = data || defaultData;

  const chartConfig = {
    labels: chartData.map(item => item.quarter),
    datasets: [
      {
        label: 'Return %',
        data: chartData.map(item => item.value),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)',   // Yellow
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(139, 92, 246, 0.8)',   // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(14, 165, 233, 0.8)',   // Sky Blue
          'rgba(34, 197, 94, 0.8)',    // Emerald
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Amount (₦M)',
        data: chartData.map(item => item.amount),
        backgroundColor: 'rgba(156, 163, 175, 0.3)',
        borderColor: 'rgba(156, 163, 175, 0.8)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Return: ${context.parsed.y}%`;
            } else {
              return `Amount: ₦${context.parsed.y}M`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Return %',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Amount (₦M)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Quarter',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            Based on historical performance and project timeline
          </p>
        </div>
        
        <div className="relative h-80 w-full">
          <Bar data={chartConfig} options={options} />
        </div>
        
        <div className="mt-4 flex justify-between text-xs text-gray-500">
          <span>Q1 2024</span>
          <span className="text-center font-medium">Investment Growth Timeline</span>
          <span>Q4 2025</span>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">Projected Growth</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Expected returns based on market analysis and development milestones
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestmentChart;
