import React from 'react';
import { Mail, Settings, Target, BarChart3, Users, Send, CheckCircle } from 'lucide-react';

// Header component for Email Configuration page
const ConfigurationHeader = () => {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center space-x-4">
        <Settings className="w-8 h-8" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Email Configuration</h1>
          <p className="text-indigo-100 mt-1">Set up your email account for bulk sending</p>
        </div>
      </div>
    </div>
  );
};

// Header component for Compose Email page
const ComposeHeader = () => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center space-x-4">
        <Mail className="w-8 h-8" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Compose Email</h1>
          <p className="text-blue-100 mt-1">Create and send your email campaigns</p>
        </div>
      </div>
    </div>
  );
};

// Header component for Campaign Management page
const CampaignHeader = () => {
  return (
    <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center space-x-4">
        <Target className="w-8 h-8" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Campaign Management</h1>
          <p className="text-emerald-100 mt-1">Track and manage your email campaigns</p>
        </div>
      </div>
    </div>
  );
};

// Demo component showing all headers
const EmailPageHeaders = () => {
  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-width-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Email System Headers</h2>
        
        <div className="space-y-8">
          {/* Configuration Header */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Configuration Page Header</h3>
            <ConfigurationHeader />
          </div>
          
          {/* Compose Header */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Compose Page Header</h3>
            <ComposeHeader />
          </div>
          
          {/* Campaign Header */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Campaign Page Header</h3>
            <CampaignHeader />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage Instructions</h3>
          
          <div className="space-y-4 text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800">For Configuration Page:</h4>
              <code className="text-sm bg-gray-100 p-1 rounded">{'<ConfigurationHeader />'}</code>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">For Compose Page:</h4>
              <code className="text-sm bg-gray-100 p-1 rounded">{'<ComposeHeader />'}</code>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">For Campaign Page:</h4>
              <code className="text-sm bg-gray-100 p-1 rounded">{'<CampaignHeader />'}</code>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Integration Notes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Import the specific header component you need</li>
              <li>• Place the header at the top of each page, before your main content</li>
              <li>• Pass dynamic data (counts, rates) as props from your parent component</li>
              <li>• Headers are fully responsive and match your existing design system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPageHeaders;