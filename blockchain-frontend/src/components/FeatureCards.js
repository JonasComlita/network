import React from 'react';

const FeatureCards = () => {
  const features = [
    {
      id: 1,
      title: 'Real-time Processing',
      description: 'Experience fast transaction processing with our optimized consensus mechanism and parallel processing architecture.',
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 2,
      title: 'Advanced Smart Contracts',
      description: 'Build complex decentralized applications with our intuitive smart contract framework and development tools.',
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 10H20" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 20V10" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 3,
      title: 'Enhanced Security',
      description: 'Benefit from industry-leading security protocols and cryptographic techniques to protect your assets and data.',
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 16L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 11C5 14.3137 7.68629 17 11 17C14.3137 17 17 14.3137 17 11C17 7.68629 14.3137 5 11 5C7.68629 5 5 7.68629 5 11Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 4,
      title: 'Scalable Architecture',
      description: 'Our blockchain scales with your needs, handling thousands of transactions per second without compromising performance.',
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 6H6C4.89543 6 4 6.89543 4 8V16C4 17.1046 4.89543 18 6 18H18C19.1046 18 20 17.1046 20 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M15 7L18 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 8L21 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 5,
      title: 'Developer-friendly APIs',
      description: 'Integrate blockchain technology into your applications effortlessly with our comprehensive API documentation and SDKs.',
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 17V17.5V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 6,
      title: 'Advanced Analytics',
      description: 'Gain valuable insights into your blockchain operations with our powerful analytics and monitoring tools.',
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-center text-white mb-12">Key Features</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(feature => (
          <div 
            key={feature.id} 
            className="feature-card bg-gray-800/30 border border-gray-700 p-6 rounded-lg transition-all duration-300 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center mb-5">
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;
