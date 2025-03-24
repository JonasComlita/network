import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle, XCircle, AlertTriangle, Clock, MapPin, Monitor } from 'lucide-react';
import apiService from './apiService';
import { TwoFactorStatus } from './TwoFactorComponents';
import TwoFactorSetup from './TwoFactorComponents';
import useWebSocketEnhanced from '../hooks/useWebSocketEnhanced';

const SecuritySettings = () => {
  // Security state
  const [securityData, setSecurityData] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  
  // WebSocket for real-time security updates
  const { lastMessage } = useWebSocketEnhanced('auth_status/', {
    onMessage: (message) => {
      if (message.type === 'auth_status') {
        // Update security status
        setSecurityData(prev => ({
          ...prev,
          two_factor_enabled: message.two_factor_enabled,
          email_verified: message.email_verified,
          account_locked: message.account_locked
        }));
      }
    }
  });
  
  // Fetch security data on mount
  useEffect(() => {
    fetchSecurityData();
    fetchLoginHistory();
  }, []);
  
  // Fetch security overview data
  const fetchSecurityData = async () => {
    try {
      setError(null);
      
      const response = await apiService.getSecurityOverview();
      
      if (response.data) {
        setSecurityData(response.data);
      }
    } catch (err) {
      console.error('Error fetching security data:', err);
      setError(err.formattedMessage || 'Failed to load security data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch login history
  const fetchLoginHistory = async () => {
    try {
      const response = await apiService.getLoginHistory();
      
      if (response.data) {
        setLoginHistory(response.data.results || []);
      }
    } catch (err) {
      console.error('Error fetching login history:', err);
    }
  };
  
  // Handle 2FA management
  const handleManageTwoFactor = () => {
    setShowTwoFactorSetup(!showTwoFactorSetup);
  };
  
  // Calculate security score (0-100)
  const calculateSecurityScore = () => {
    if (!securityData) return 0;
    
    let score = 0;
    
    // Basic account security (max 40 points)
    if (securityData.email_verified) score += 15;
    if (securityData.password_strength === 'strong') score += 15;
    else if (securityData.password_strength === 'medium') score += 7;
    if (securityData.has_recent_password_change) score += 10;
    
    // Advanced security features (max 60 points)
    if (securityData.two_factor_enabled) score += 30;
    if (securityData.has_wallet_backup) score += 20;
    if (securityData.has_recovery_email) score += 10;
    
    return Math.min(100, score);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get security status indicator component
  const SecurityStatusIndicator = ({ enabled, label }) => (
    <div className="flex items-center">
      {enabled ? (
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500 mr-2" />
      )}
      <span className={enabled ? 'text-green-700' : 'text-red-700'}>
        {label}
      </span>
    </div>
  );
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Calculate security score
  const securityScore = calculateSecurityScore();
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Security score overview */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Security Score</h3>
            <p className="text-sm text-gray-500">
              Complete security steps to protect your account and assets
            </p>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
                strokeDasharray="100, 100"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={securityScore >= 75 ? '#10B981' : securityScore >= 40 ? '#FBBF24' : '#EF4444'}
                strokeWidth="3"
                strokeDasharray={`${securityScore}, 100`}
              />
              <text x="18" y="20.5" fontFamily="system-ui" fontSize="7" textAnchor="middle" fill="#374151">
                {securityScore}%
              </text>
            </svg>
          </div>
        </div>
        
        {/* Security features status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Account Protection</h4>
            <div className="space-y-2">
              <SecurityStatusIndicator 
                enabled={securityData?.email_verified}
                label="Email verification"
              />
              <SecurityStatusIndicator 
                enabled={securityData?.two_factor_enabled}
                label="Two-factor authentication"
              />
              <SecurityStatusIndicator 
                enabled={securityData?.password_strength === 'strong'}
                label="Strong password"
              />
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Wallet Security</h4>
            <div className="space-y-2">
              <SecurityStatusIndicator 
                enabled={securityData?.has_wallet_backup}
                label="Wallet backup"
              />
              <SecurityStatusIndicator 
                enabled={securityData?.has_multiple_wallets}
                label="Multiple wallets"
              />
              <SecurityStatusIndicator 
                enabled={securityData?.has_recovery_email}
                label="Recovery email"
              />
            </div>
          </div>
        </div>
        
        {/* Two-factor authentication section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Two-Factor Authentication
          </h3>
          
          {showTwoFactorSetup ? (
            <TwoFactorSetup />
          ) : (
            <TwoFactorStatus 
              enabled={securityData?.two_factor_enabled} 
              onManage={handleManageTwoFactor}
            />
          )}
        </div>
        
        {/* Password security section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Password Security
          </h3>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-800">
                  Password Strength: {securityData?.password_strength || 'Unknown'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Last changed: {formatDate(securityData?.last_password_change)}
                </p>
              </div>
              
              <button
                className="px-3 py-1 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/change-password'}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
        
        {/* Recent login activity */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Recent Login Activity
          </h3>
          
          {loginHistory.length === 0 ? (
            <div className="text-center py-8 border border-gray-200 rounded-lg">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent login activity</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loginHistory.map((login, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(login.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            {login.location || 'Unknown location'}
                          </div>
                          <div className="text-xs text-gray-500">
                            IP: {login.ip_address || 'Unknown IP'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Monitor className="h-4 w-4 text-gray-400 mr-1" />
                            {login.user_agent ? 
                              (login.user_agent.length > 30 ? 
                                login.user_agent.substring(0, 30) + '...' : 
                                login.user_agent) : 
                              'Unknown device'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            login.successful ? 
                              'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'
                          }`}>
                            {login.successful ? 'Successful' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {loginHistory.length > 5 && (
                <div className="px-6 py-3 bg-gray-50 text-center border-t border-gray-200">
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => window.location.href = '/login-history'}
                  >
                    View full history
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;