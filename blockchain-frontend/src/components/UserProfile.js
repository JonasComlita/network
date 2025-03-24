import React, { useEffect, useState, useRef } from 'react';
import { Camera, Edit, Save, AlertTriangle, CheckCircle, Shield, X } from 'lucide-react';
import apiService from './apiService';
import useWebSocketEnhanced from '../hooks/useWebSocketEnhanced';

const UserProfile = () => {
  // User profile state
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Edit form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    notify_price_changes: false,
    notify_transaction_updates: false
  });

  // File upload state
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // 2FA state
  const [twoFactorSetup, setTwoFactorSetup] = useState({
    showSetup: false,
    qrCode: null,
    secret: null,
    verificationCode: '',
    isVerifying: false
  });

  // File input ref
  const fileInputRef = useRef(null);
  
  // WebSocket for real-time profile updates
  const { lastMessage } = useWebSocketEnhanced('user_profile/', {
    onMessage: (message) => {
      if (message.type === 'profile_update') {
        // Update profile with new data
        setProfile(prevProfile => ({
          ...prevProfile,
          ...message.profile
        }));
      }
    }
  });

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
    fetchUserPreferences();
  }, []);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.profile.getProfile();
      
      if (response.data) {
        setProfile(response.data);
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          bio: response.data.bio || ''
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user preferences
  const fetchUserPreferences = async () => {
    try {
      const response = await apiService.profile.getPreferences();
      
      if (response.data) {
        setPreferences(response.data);
        setFormData(prevData => ({
          ...prevData,
          notify_price_changes: response.data.notify_price_changes,
          notify_transaction_updates: response.data.notify_transaction_updates
        }));
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create FormData object for file upload
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('bio', formData.bio);
      
      if (profilePicture) {
        data.append('profile_picture', profilePicture);
      }
      
      // Update profile
      const profileResponse = await apiService.profile.updateProfile(data);
      
      // Update preferences separately (different endpoint)
      const preferencesData = {
        notify_price_changes: formData.notify_price_changes,
        notify_transaction_updates: formData.notify_transaction_updates
      };
      
      const preferencesResponse = await apiService.profile.updatePreferences(preferencesData);
      
      // Update local state
      if (profileResponse.data) {
        setProfile(profileResponse.data);
      }
      
      if (preferencesResponse.data) {
        setPreferences(preferencesResponse.data);
      }
      
      // Show success message
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Exit edit mode
      setIsEditing(false);
      
      // Reset file input
      setProfilePicture(null);
      setPreviewUrl(null);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.formattedMessage || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update password
      await apiService.profile.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );
      
      // Show success message
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset form
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Hide password form
      setShowPasswordForm(false);
      
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.formattedMessage || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA setup
  const handleSetup2FA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize 2FA setup
      const response = await apiService.profile.setup2FA();
      
      if (response.data) {
        setTwoFactorSetup({
          ...twoFactorSetup,
          showSetup: true,
          qrCode: response.data.qr_code,
          secret: response.data.secret
        });
      }
      
    } catch (err) {
      console.error('Error setting up 2FA:', err);
      setError(err.formattedMessage || 'Failed to set up two-factor authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA verification
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    
    try {
      setTwoFactorSetup(prev => ({ ...prev, isVerifying: true }));
      setError(null);
      
      // Verify 2FA setup
      const response = await apiService.profile.verify2FASetup(twoFactorSetup.verificationCode);
      
      if (response.data && response.data.status === 'enabled') {
        // Update profile
        setProfile(prev => ({
          ...prev,
          two_factor_enabled: true
        }));
        
        // Show success message
        setSuccessMessage('Two-factor authentication enabled successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reset 2FA setup state
        setTwoFactorSetup({
          showSetup: false,
          qrCode: null,
          secret: null,
          verificationCode: '',
          isVerifying: false
        });
      }
      
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      setError(err.formattedMessage || 'Failed to verify two-factor authentication. Please check your code and try again.');
    } finally {
      setTwoFactorSetup(prev => ({ ...prev, isVerifying: false }));
    }
  };

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    // Prompt for verification code
    const code = prompt('Please enter your verification code to disable two-factor authentication:');
    
    if (!code) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Disable 2FA
      const response = await apiService.profile.disable2FA(code);
      
      if (response.data && response.data.status === 'disabled') {
        // Update profile
        setProfile(prev => ({
          ...prev,
          two_factor_enabled: false
        }));
        
        // Show success message
        setSuccessMessage('Two-factor authentication disabled successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      
    } catch (err) {
      console.error('Error disabling 2FA:', err);
      setError(err.formattedMessage || 'Failed to disable two-factor authentication. Please check your code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        notify_price_changes: preferences?.notify_price_changes || false,
        notify_transaction_updates: preferences?.notify_transaction_updates || false
      });
    }
    
    // Reset file input
    setProfilePicture(null);
    setPreviewUrl(null);
    
    // Exit edit mode
    setIsEditing(false);
  };

  // Handle password form input
  const handlePasswordFormInput = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Show loading state
  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Your Profile</h2>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
          )}
        </div>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-center text-green-800">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      
      {/* Profile Content */}
      <div className="px-6 py-6">
        {!isEditing ? (
          /* View Mode */
          <div className="flex flex-col md:flex-row">
            {/* Profile Picture */}
            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 flex flex-col items-center">
              <div className="relative">
                <img
                  src={profile?.profile_picture || 'https://via.placeholder.com/150'}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                />
                {profile?.email_verified && (
                  <span className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </span>
                )}
              </div>
              
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {profile?.username}
                </h3>
                <p className="text-sm text-gray-500">
                  {profile?.email}
                </p>
                
                {/* Verification badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.email_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-gray-900">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}` 
                      : 'Not set'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDate(profile?.date_joined)}
                  </dd>
                </div>
                
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-line">
                    {profile?.bio || 'No bio provided'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Primary Wallet</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900">
                    {profile?.wallet_address_display || 'No wallet'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Wallet Balance</dt>
                  <dd className="mt-1 text-gray-900">
                    {profile?.wallet_balance 
                      ? `${parseFloat(profile.wallet_balance).toFixed(8)}` 
                      : '0.00000000'}
                  </dd>
                </div>
                
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Notification Preferences</dt>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full ${
                        preferences?.notify_price_changes 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}></div>
                      <span className="ml-2 text-sm text-gray-700">Price change notifications</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full ${
                        preferences?.notify_transaction_updates 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}></div>
                      <span className="ml-2 text-sm text-gray-700">Transaction update notifications</span>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <dt className="text-sm font-medium text-gray-500 mb-3">Security Settings</dt>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Change Password
                    </button>
                    
                    {profile?.two_factor_enabled ? (
                      <button
                        onClick={handleDisable2FA}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Disable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={handleSetup2FA}
                        className="inline-flex items-center px-3 py-2 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>
              </dl>
              
              {/* Password Change Form */}
              {showPasswordForm && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="current_password"
                        name="current_password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordFormInput}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new_password"
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordFormInput}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordFormInput}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* 2FA Setup */}
              {twoFactorSetup.showSetup && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Setup Two-Factor Authentication</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.) 
                      and enter the verification code to enable two-factor authentication.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center mb-6">
                      <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                        {twoFactorSetup.qrCode && (
                          <img 
                            src={`data:image/png;base64,${twoFactorSetup.qrCode}`} 
                            alt="2FA QR Code"
                            className="border border-gray-300 p-2 rounded"
                          />
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          If you can't scan the QR code, you can manually enter this secret key:
                        </p>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-300 mb-4">
                          {twoFactorSetup.secret}
                        </div>
                      </div>
                    </div>
                    
                    <form onSubmit={handleVerify2FA} className="max-w-md">
                      <label htmlFor="verification_code" className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="verification_code"
                        value={twoFactorSetup.verificationCode}
                        onChange={(e) => setTwoFactorSetup(prev => ({
                          ...prev,
                          verificationCode: e.target.value
                        }))}
                        placeholder="Enter 6-digit code"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setTwoFactorSetup(prev => ({
                            ...prev,
                            showSetup: false
                          }))}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={twoFactorSetup.isVerifying}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                          {twoFactorSetup.isVerifying ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row">
              {/* Profile Picture */}
              <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 flex flex-col items-center">
                <div className="relative">
                  <img
                    src={previewUrl || profile?.profile_picture || 'https://via.placeholder.com/150'}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 text-white shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />
                
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-500">
                    Click the camera icon to change your profile picture
                  </p>
                </div>
              </div>
              
              {/* Profile Form */}
              <div className="flex-1">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Preferences</h4>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notify_price_changes"
                            name="notify_price_changes"
                            type="checkbox"
                            checked={formData.notify_price_changes}
                            onChange={handleInputChange}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notify_price_changes" className="font-medium text-gray-700">
                            Price Change Notifications
                          </label>
                          <p className="text-gray-500">
                            Receive notifications when cryptocurrency prices change significantly.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notify_transaction_updates"
                            name="notify_transaction_updates"
                            type="checkbox"
                            checked={formData.notify_transaction_updates}
                            onChange={handleInputChange}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notify_transaction_updates" className="font-medium text-gray-700">
                            Transaction Notifications
                          </label>
                          <p className="text-gray-500">
                            Receive notifications about new transactions in your wallet.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;