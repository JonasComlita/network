import React, { useEffect, useState } from 'react';
import apiService from './apiService';

const SentimentData = () => {
    const [sentiment, setSentiment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSentimentData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await apiService.getSentimentData();
                setSentiment(response.data);
            } catch (error) {
                console.error('Failed to fetch sentiment data:', error);
                setError('Unable to load sentiment data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchSentimentData();
        
        // Set up auto-refresh interval
        const intervalId = setInterval(fetchSentimentData, 60000); // Refresh every minute
        
        return () => clearInterval(intervalId);
    }, []);

    // Calculate sentiment color based on score
    const getSentimentColor = (sentiment, score) => {
        if (sentiment === 'positive') return `rgb(0, ${Math.min(255, Math.floor(score * 255))}, 0)`;
        if (sentiment === 'negative') return `rgb(${Math.min(255, Math.floor(score * 255))}, 0, 0)`;
        return 'rgb(128, 128, 128)'; // neutral
    };

    if (loading && sentiment.length === 0) {
        return (
            <div className="p-4 border rounded shadow-sm">
                <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border rounded shadow-sm">
                <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-red-700">{error}</p>
                    <button 
                        onClick={() => apiService.getSentimentData().then(res => setSentiment(res.data)).catch(err => setError(err.message))}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded shadow-sm">
            <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
            {sentiment.length === 0 ? (
                <p className="text-gray-500">No sentiment data available</p>
            ) : (
                <div className="space-y-2">
                    {sentiment.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-medium">{item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}</span>
                            <div className="flex-1 mx-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className="h-2.5 rounded-full" 
                                        style={{
                                            width: `${item.score * 100}%`,
                                            backgroundColor: getSentimentColor(item.sentiment, item.score)
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <span className="text-sm font-bold">{(item.score * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="text-right mt-4">
                <span className="text-xs text-gray-500">
                    {loading ? 'Refreshing...' : `Last updated: ${new Date().toLocaleTimeString()}`}
                </span>
            </div>
        </div>
    );
};

export default SentimentData;