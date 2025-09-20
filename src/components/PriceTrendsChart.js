import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceTrendsChart = () => {
  const [selectedCity, setSelectedCity] = useState('Lagos');

  // Price trend data for different Nigerian cities (in Naira)
  const cityData = {
    'Lagos': {
      data: [
        { month: 'Jan', victoriaIsland: 45000000, lekki: 38000000, ikoyi: 52000000 },
        { month: 'Feb', victoriaIsland: 46500000, lekki: 39500000, ikoyi: 53800000 },
        { month: 'Mar', victoriaIsland: 48000000, lekki: 41000000, ikoyi: 55500000 },
        { month: 'Apr', victoriaIsland: 49500000, lekki: 42500000, ikoyi: 57200000 },
        { month: 'May', victoriaIsland: 51000000, lekki: 44000000, ikoyi: 59000000 },
        { month: 'Jun', victoriaIsland: 52500000, lekki: 45500000, ikoyi: 60800000 }
      ],
      areas: ['Victoria Island', 'Lekki', 'Ikoyi'],
      colors: ['#10B981', '#F59E0B', '#3B82F6']
    },
    'Abuja': {
      data: [
        { month: 'Jan', asokoro: 42000000, maitama: 38000000, wuse: 32000000 },
        { month: 'Feb', asokoro: 43500000, maitama: 39500000, wuse: 33500000 },
        { month: 'Mar', asokoro: 45000000, maitama: 41000000, wuse: 35000000 },
        { month: 'Apr', asokoro: 46500000, maitama: 42500000, wuse: 36500000 },
        { month: 'May', asokoro: 48000000, maitama: 44000000, wuse: 38000000 },
        { month: 'Jun', asokoro: 49500000, maitama: 45500000, wuse: 39500000 }
      ],
      areas: ['Asokoro', 'Maitama', 'Wuse'],
      colors: ['#EF4444', '#8B5CF6', '#06B6D4']
    },
    'Port Harcourt': {
      data: [
        { month: 'Jan', gra: 28000000, oldGRA: 25000000, rumuola: 22000000 },
        { month: 'Feb', gra: 29000000, oldGRA: 26000000, rumuola: 23000000 },
        { month: 'Mar', gra: 30000000, oldGRA: 27000000, rumuola: 24000000 },
        { month: 'Apr', gra: 31000000, oldGRA: 28000000, rumuola: 25000000 },
        { month: 'May', gra: 32000000, oldGRA: 29000000, rumuola: 26000000 },
        { month: 'Jun', gra: 33000000, oldGRA: 30000000, rumuola: 27000000 }
      ],
      areas: ['GRA', 'Old GRA', 'Rumuola'],
      colors: ['#F97316', '#84CC16', '#EC4899']
    },
    'Kano': {
      data: [
        { month: 'Jan', nassarawa: 18000000, dala: 15000000, fagge: 12000000 },
        { month: 'Feb', nassarawa: 18500000, dala: 15500000, fagge: 12500000 },
        { month: 'Mar', nassarawa: 19000000, dala: 16000000, fagge: 13000000 },
        { month: 'Apr', nassarawa: 19500000, dala: 16500000, fagge: 13500000 },
        { month: 'May', nassarawa: 20000000, dala: 17000000, fagge: 14000000 },
        { month: 'Jun', nassarawa: 20500000, dala: 17500000, fagge: 14500000 }
      ],
      areas: ['Nassarawa', 'Dala', 'Fagge'],
      colors: ['#6B7280', '#14B8A6', '#F59E0B']
    }
  };

  const currentCityData = cityData[selectedCity];

  const chartData = {
    labels: currentCityData.data.map(d => d.month),
    datasets: currentCityData.areas.map((area, index) => {
      const areaKey = area.toLowerCase().replace(/\s+/g, '');
      return {
        label: area,
        data: currentCityData.data.map(d => d[areaKey] / 1000000), // Convert to millions for display
        borderColor: currentCityData.colors[index],
        backgroundColor: `${currentCityData.colors[index]}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: currentCityData.colors[index],
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      };
    })
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
        display: false
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
            return `${context[0].label} ${selectedCity}`;
          },
          label: function(context) {
            return `${context.dataset.label}: ₦${context.parsed.y}M`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price (₦M)',
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
          },
          callback: function(value) {
            return `₦${value}M`;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month',
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
      duration: 1500,
      easing: 'easeInOutQuart',
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Price Trends in {selectedCity}</h3>
        <div className="flex space-x-2">
          {Object.keys(cityData).map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCity === city
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative h-80 w-full">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>Jan 2024</span>
        <span className="text-center font-medium">6-Month Price Trend</span>
        <span>Jun 2024</span>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 text-blue-800">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium">Market Analysis</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Average price increase in {selectedCity}: {selectedCity === 'Lagos' ? '+12.5%' : 
           selectedCity === 'Abuja' ? '+11.8%' : 
           selectedCity === 'Port Harcourt' ? '+9.7%' : '+8.9%'} over 6 months
        </p>
      </div>
    </div>
  );
};

export default PriceTrendsChart;
