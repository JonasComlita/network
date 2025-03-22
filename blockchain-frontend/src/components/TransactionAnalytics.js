import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import apiService from './apiService';

// Register Chart.js components
Chart.register(...registerables);

const TransactionAnalytics = () => {
    const [analytics, setAnalytics] = useState({
        total_transactions: 0,
        total_amount: 0,
        average_amount: 0,
        daily_stats: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTime, setRefreshTime] = useState(Date.now());
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await apiService.getAnalytics();
                setAnalytics(response.data);
            } catch (error) {
                console.error('Failed to fetch analytics data:', error);
                setError('Unable to load transaction analytics. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchAnalytics();
        
        // Set up auto-refresh interval
        const intervalId = setInterval(() => {
            fetchAnalytics();
            setRefreshTime(Date.now());
        }, 5 * 60 * 1000); // Refresh every 5 minutes
        
        return () => clearInterval(intervalId);
    }, []);

    // Create chart when data is available
    useEffect(() => {
        if (chartRef.current && analytics.daily_stats && analytics.daily_stats.length > 0) {
            // Destroy existing chart if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            
            const ctx = chartRef.current.getContext('2d');
            
            // Prepare data for chart
            const labels = analytics.daily_stats.map(day => day.date);
            const transactionCounts = analytics.daily_stats.map(day => day.transaction_count);
            const transactionVolumes = analytics.daily_stats.map(day => day.transaction_volume);
            
            // Create new chart
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Transaction Count',
                            data: transactionCounts,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Transaction Volume',
                            data: transactionVolumes,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                            type: 'line',
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Transaction Count'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Volume'
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        }
    }, [analytics.daily_stats, refreshTime]);

    // Format currencies
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    if (loading && !analytics.total_transactions) {
        return (
            <div className="p-4 border rounded shadow-sm bg-white">
                <h2 className="text-xl font-bold mb-4">Transaction Analytics</h2>
                <div className="animate-pulse space-y-4">
                    <div className="flex space-x-4">
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                    <div className="h-40 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border rounded shadow-sm bg-white">
                <h2 className="text-xl font-bold mb-4">Transaction Analytics</h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                    <button 
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            apiService.getAnalytics()
                                .then(res => {
                                    setAnalytics(res.data);
                                    setLoading(false);
                                })
                                .catch(err => {
                                    setError(err.message);
                                    setLoading(false);
                                });
                        }}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-xl font-bold mb-4">Transaction Analytics</h2>
            
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-blue-600 text-sm font-medium mb-1">Total Transactions</div>
                    <div className="text-2xl font-bold">{analytics.total_transactions.toLocaleString()}</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-green-600 text-sm font-medium mb-1">Total Amount</div>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.total_amount)}</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="text-purple-600 text-sm font-medium mb-1">Average Transaction</div>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.average_amount)}</div>
                </div>
            </div>
            
            {/* Chart */}
            {analytics.daily_stats && analytics.daily_stats.length > 0 ? (
                <div className="mt-6" style={{ height: '300px' }}>
                    <canvas ref={chartRef}></canvas>
                </div>
            ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No daily statistics available</p>
                </div>
            )}
            
            <div className="text-right mt-2">
                <span className="text-xs text-gray-500">
                    {loading ? 'Updating...' : `Last updated: ${new Date(refreshTime).toLocaleTimeString()}`}
                </span>
            </div>
        </div>
    );
};

export default TransactionAnalytics;