import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
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

const AdminEscrowVolumeChart = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVolumes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/admin/escrow/volumes');
        setVolumes(res.data?.data || []);
      } catch (e) {
        setError(e.message || 'Failed to fetch escrow volumes');
      } finally {
        setLoading(false);
      }
    };
    fetchVolumes();
  }, []);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-500">Loading chart...</div>;
  }
  if (error) {
    return <div className="h-64 flex items-center justify-center text-sm text-red-500">{error}</div>;
  }
  if (!volumes.length) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-500">No escrow data available yet.</div>;
  }

  const labels = volumes.map(v => v.date);
  const data = volumes.map(v => v.total);
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
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `₦${(context.parsed.y || 0).toLocaleString()}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default AdminEscrowVolumeChart;


