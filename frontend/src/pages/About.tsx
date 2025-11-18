import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative py-16 sm:py-20 animate-fade-in overflow-hidden">
        <div className="absolute inset-0 bg-grid-soft"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1517740772437-9d8890a16b51?auto=format&fit=crop&w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
          }}
        ></div>
        <div className="overlay-gradient"></div>
        <div className="absolute -top-16 -left-24 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full hero-shape animate-drift"></div>
        <div className="absolute -bottom-20 -right-28 w-[26rem] h-[26rem] bg-gradient-to-br from-emerald-400 to-green-600 rounded-full hero-shape animate-drift"></div>
        <div className="absolute top-12 right-10 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l4 4-4 4-4-4 4-4z"/></svg>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About AgridroneInsight</h1>
          <p className="text-xl text-gray-700">Revolutionizing agriculture through AI-powered drone analysis</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-4">
              AgridroneInsight empowers farmers and agricultural professionals with cutting-edge AI technology 
              to monitor crop health, detect diseases, and optimize yields through advanced drone imagery analysis.
            </p>
            <p className="text-lg text-gray-600">
              By combining the power of artificial intelligence with precision agriculture, we help farmers 
              make data-driven decisions that increase productivity while reducing environmental impact.
            </p>
          </div>
          <div className="bg-primary-100 rounded-xl p-8 soft-hover">
            <div className="text-center">
              <svg className="w-24 h-24 text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">Advanced machine learning algorithms for accurate crop health assessment</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card card-hover text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast Processing</h3>
            <p className="text-gray-600">Get results in minutes, not hours. Our cloud infrastructure ensures rapid analysis of your drone imagery.</p>
          </div>

          <div className="card card-hover text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">High Accuracy</h3>
            <p className="text-gray-600">Our AI models achieve 97%+ accuracy in crop health detection, helping you make confident decisions.</p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Cost Effective</h3>
            <p className="text-gray-600">Reduce crop losses and optimize resource usage with our affordable precision agriculture solutions.</p>
          </div>
        </div>

        <div className="card">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Technology Stack</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">AI & Machine Learning</h3>
                <ul className="text-left text-gray-600 space-y-2">
                  <li>• Roboflow API for computer vision</li>
                  <li>• Advanced object detection models</li>
                  <li>• Real-time image processing</li>
                  <li>• Continuous model improvement</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Platform Features</h3>
                <ul className="text-left text-gray-600 space-y-2">
                  <li>• React TypeScript frontend</li>
                  <li>• Python Flask backend</li>
                  <li>• SQLite database</li>
                  <li>• Secure user authentication</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-10">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Common Corn Diseases in the Philippines</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Understanding the most important corn diseases helps farmers interpret what they see in the field and in drone imagery.
              AgridroneInsight is designed to highlight early symptoms so interventions can be made before yield losses become severe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🌽 Downy Mildew (Peronosclerospora spp.)</h3>
              <p className="text-gray-600 mb-3">
                Downy mildew is considered one of the most destructive diseases of corn in the Philippines, especially in humid and
                high-rainfall areas. Infected plants are often stunted and produce poor or no ears.
              </p>
              <ul className="text-gray-600 space-y-1 list-disc list-inside">
                <li>Yellowing or pale streaks along young leaves</li>
                <li>White, downy fungal growth on the underside of leaves in the early morning</li>
                <li>Severely infected plants become stunted and may appear &quot;crowded&quot; or uneven in the field</li>
              </ul>
              <p className="text-gray-600 mt-3 font-medium">Important causal species:</p>
              <ul className="text-gray-600 space-y-1 list-disc list-inside">
                <li><span className="font-semibold">Peronosclerospora philippinensis</span> (Philippine downy mildew)</li>
                <li><span className="font-semibold">Peronosclerospora sorghi</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🍃 Leaf Blight</h3>
              <p className="text-gray-600 mb-3">
                Leaf blights cause large dead areas on leaves, reducing the effective photosynthetic surface and directly lowering yield.
                They are commonly observed during warm, humid conditions and in densely planted fields.
              </p>
              <p className="text-gray-700 font-medium mb-1">Southern Corn Leaf Blight</p>
              <ul className="text-gray-600 space-y-1 list-disc list-inside mb-3">
                <li><span className="font-semibold">Helminthosporium maydis</span> / <span className="font-semibold">Bipolaris maydis</span></li>
                <li>Brown, elongated lesions along the leaf</li>
                <li>Severe infections can cause large leaf areas to dry and die prematurely</li>
              </ul>
              <p className="text-gray-700 font-medium mb-1">Northern Corn Leaf Blight</p>
              <ul className="text-gray-600 space-y-1 list-disc list-inside">
                <li><span className="font-semibold">Exserohilum turcicum</span></li>
                <li>Long, cigar-shaped grayish-green lesions that later turn tan</li>
                <li>Lesions may merge, destroying entire leaves on susceptible varieties</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
