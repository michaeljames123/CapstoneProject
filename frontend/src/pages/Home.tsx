import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <section className="relative py-24 animate-fade-in overflow-hidden">
        <div className="absolute inset-0 bg-grid-soft"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1542353436-312f0f44d040?auto=format&fit=crop&w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
          }}
        ></div>
        <div className="overlay-gradient"></div>
        <div className="absolute -top-16 -left-24 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full hero-shape animate-drift"></div>
        <div className="absolute -bottom-20 -right-28 w-[28rem] h-[28rem] bg-gradient-to-br from-emerald-400 to-green-600 rounded-full hero-shape animate-drift"></div>

        <div className="absolute top-28 left-6 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13l-3 3m0 0l-3-3m3 3V8a4 4 0 014-4h4a4 4 0 014 4v8"/></svg>
        </div>
        <div className="absolute top-12 right-12 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <div className="absolute bottom-10 left-1/4 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AgridroneInsight
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              AI-powered agricultural drone analysis platform for precision farming and crop health monitoring
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/analyze"
                  className="btn-primary text-lg px-8 py-4 inline-block soft-hover"
                >
                  Start Analysis
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-4 inline-block soft-hover"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="btn-secondary text-lg px-8 py-4 inline-block soft-hover"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AgridroneInsight?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with agricultural expertise to provide actionable insights for your crops.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-gradient card-hover text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Advanced machine learning algorithms analyze your drone imagery to detect crop health issues, diseases, and areas requiring attention.
              </p>
            </div>

            <div className="card-gradient card-hover text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Processing</h3>
              <p className="text-gray-600">
                Get instant results from your drone imagery analysis with our high-performance cloud infrastructure and optimized algorithms.
              </p>
            </div>

            <div className="card-gradient card-hover text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Detailed Analytics</h3>
              <p className="text-gray-600">
                Comprehensive reports and visualizations help you understand your crop health patterns and make data-driven farming decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative cta-section py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-soft opacity-50"></div>
        <div className="overlay-gradient"></div>
        <div className="absolute -top-10 left-10 w-72 h-72 bg-gradient-to-br from-emerald-300 to-green-500 rounded-full hero-shape animate-drift"></div>
        <div className="absolute -bottom-12 right-8 w-80 h-80 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full hero-shape animate-drift"></div>
        <div className="absolute top-8 right-16 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v14H3z"/><path d="M8 21h8"/></svg>
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Agriculture?</h2>
          <p className="text-lg text-gray-700 mb-8">Join thousands of farmers already optimizing yields with AgridroneInsight.</p>
          {!user && (
            <Link to="/register" className="btn-primary text-lg px-8 py-4 inline-block soft-hover">
              Start Your Free Trial
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
