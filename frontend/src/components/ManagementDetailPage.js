import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Button = ({ children, primary, onClick, ...props }) => (
  <button
    className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      primary
        ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        : 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
    }`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

const ManagementDetailPage = ({
  title,
  subtitle,
  intro,
  image,
  imageAlt,
  accentClassName = 'from-blue-600 to-cyan-500',
  tabs,
  stats,
  checklist,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.key || 'overview');

  const activeContent = tabs?.find((tab) => tab.key === activeTab) || tabs?.[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-600 font-semibold">Hospital Management</p>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          <Button primary onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </header>

      <main className="flex-1">
        <section className={`bg-gradient-to-r ${accentClassName} text-white`}>
          <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-4">{subtitle}</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{title}</h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl">{intro}</p>
              <div className="flex flex-wrap gap-3">
                <Button primary onClick={() => navigate('/login')}>Get Started</Button>
                <Button onClick={() => navigate('/signup')}>Create Account</Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-white/10 blur-3xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                <img src={image} alt={imageAlt} className="w-full h-[24rem] object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {(stats || []).map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-sm border p-6">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white rounded-2xl shadow-md border p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Interactive overview</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {(tabs || []).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl bg-slate-50 p-6 min-h-[14rem]">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{activeContent?.title}</h4>
                <p className="text-gray-600 leading-relaxed mb-4">{activeContent?.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(activeContent?.points || []).map((point) => (
                    <div key={point} className="rounded-xl bg-white border px-4 py-3 text-sm text-gray-700 shadow-sm">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">What it helps with</h3>
              <div className="space-y-4">
                {(checklist || []).map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                    <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagementDetailPage;