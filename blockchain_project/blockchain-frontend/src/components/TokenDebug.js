import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TokenDebug = () => {
    const [tokenInfo, setTokenInfo] = useState({
        token: localStorage.getItem('token'),
        tokenParts: null,
        headers: null,
        testResult: null,
        loading: false,
        error: null
    });

    useEffect(() => {
        if (tokenInfo.token) {
            try {
                // Split the token into parts
                const parts = tokenInfo.token.split('.');
                const parsedToken = {
                    header: JSON.parse(atob(parts[0])),
                    payload: JSON.parse(atob(parts[1])),
                    // The signature cannot be decoded as it's a cryptographic hash
                };
                
                setTokenInfo(prev => ({
                    ...prev,
                    tokenParts: parsedToken
                }));
            } catch (e) {
                console.error('Error parsing token:', e);
                setTokenInfo(prev => ({
                    ...prev,
                    error: 'Invalid token format'
                }));
            }
        }
    }, [tokenInfo.token]);

    const testEndpoint = async (endpoint) => {
        setTokenInfo(prev => ({
            ...prev,
            loading: true,
            testResult: null,
            error: null
        }));

        try {
            const headers = {
                'Authorization': `Bearer ${tokenInfo.token}`
            };

            setTokenInfo(prev => ({
                ...prev,
                headers
            }));

            const response = await axios.get(`http://localhost:8000/api/${endpoint}/`, {
                headers
            });

            setTokenInfo(prev => ({
                ...prev,
                loading: false,
                testResult: {
                    status: response.status,
                    data: response.data
                }
            }));
        } catch (error) {
            console.error(`Error testing ${endpoint}:`, error);
            setTokenInfo(prev => ({
                ...prev,
                loading: false,
                error: error.response 
                    ? `Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}`
                    : error.message
            }));
        }
    };

    return (
        <div className="p-4 border rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">JWT Token Debug</h2>
            
            <div className="mb-4">
                <h3 className="font-semibold">Current Token:</h3>
                <div className="bg-gray-100 p-2 rounded overflow-x-auto">
                    {tokenInfo.token ? (
                        <code className="text-sm">{tokenInfo.token}</code>
                    ) : (
                        <span className="text-red-500">No token found in localStorage</span>
                    )}
                </div>
            </div>
            
            {tokenInfo.tokenParts && (
                <div className="mb-4">
                    <h3 className="font-semibold">Decoded Token:</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="bg-gray-100 p-2 rounded">
                            <strong>Header:</strong>
                            <pre className="text-xs overflow-x-auto">{JSON.stringify(tokenInfo.tokenParts.header, null, 2)}</pre>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                            <strong>Payload:</strong>
                            <pre className="text-xs overflow-x-auto">{JSON.stringify(tokenInfo.tokenParts.payload, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="mb-4">
                <h3 className="font-semibold">Test Endpoints:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                    <button
                        onClick={() => testEndpoint('profile')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test Profile
                    </button>
                    <button
                        onClick={() => testEndpoint('blocks')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test Blocks
                    </button>
                    <button
                        onClick={() => testEndpoint('analytics')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test Analytics
                    </button>
                    <button
                        onClick={() => testEndpoint('price')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test Price
                    </button>
                    <button
                        onClick={() => testEndpoint('notifications')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test Notifications
                    </button>
                </div>
            </div>
            
            {tokenInfo.headers && (
                <div className="mb-4">
                    <h3 className="font-semibold">Request Headers:</h3>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(tokenInfo.headers, null, 2)}
                    </pre>
                </div>
            )}
            
            {tokenInfo.loading && (
                <div className="text-center p-4">
                    <div className="spinner"></div>
                    <p>Testing API endpoint...</p>
                </div>
            )}
            
            {tokenInfo.error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                    <p className="font-bold">Error</p>
                    <p>{tokenInfo.error}</p>
                </div>
            )}
            
            {tokenInfo.testResult && (
                <div className="mb-4">
                    <h3 className="font-semibold">Test Result:</h3>
                    <div className="bg-green-100 p-2 rounded">
                        <p><strong>Status:</strong> {tokenInfo.testResult.status}</p>
                        <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(tokenInfo.testResult.data, null, 2)}</pre>
                    </div>
                </div>
            )}
            
            <div className="mt-4">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        setTokenInfo({
                            token: null,
                            tokenParts: null,
                            headers: null,
                            testResult: null,
                            loading: false,
                            error: null
                        });
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Clear Token
                </button>
            </div>
        </div>
    );
};

export default TokenDebug;