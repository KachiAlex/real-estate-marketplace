import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Flexible dashboard switcher for buyer <-> vendor
const RoleSwitcher = ({ onClose }) => {
	const { user, switchRole } = useAuth();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);

	const handleSwitch = async (targetRole) => {
		if (!user) return;
		setLoading(true);
		try {
			const result = await switchRole(targetRole);
			onClose?.();
			if (result && result.activeRole === 'vendor') {
				navigate('/vendor/dashboard', { replace: true });
			} else {
				navigate('/dashboard', { replace: true });
			}
		} catch (err) {
			console.error('Role switch failed', err);
			toast.error(err?.message || 'Failed to switch role');
		} finally {
			setLoading(false);
		}
	};

	if (!user) return null;

	return (
		<div className="px-4 pb-2">
			<div className="flex items-center justify-between">
				<span className="text-xs font-semibold text-gray-500">Active Role</span>
				<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
					{user?.activeRole === 'vendor' ? 'Vendor' : 'Buyer'}
				</span>
			</div>
			<div className="mt-2 grid grid-cols-2 gap-2">
				<button
					onClick={() => handleSwitch('buyer')}
					disabled={loading || user?.activeRole === 'buyer'}
					className={`text-xs px-2 py-1 rounded border ${user?.activeRole !== 'buyer' ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50' : 'bg-blue-600 text-white border-blue-600'}`}
				>
					Buyer
				</button>
				<button
					onClick={() => handleSwitch('vendor')}
					disabled={loading || user?.activeRole === 'vendor'}
					className={`text-xs px-2 py-1 rounded border ${user?.activeRole === 'vendor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
				>
					Vendor
				</button>
			</div>
		</div>
	);
};

export default RoleSwitcher;
