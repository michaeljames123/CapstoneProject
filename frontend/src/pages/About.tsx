import React from 'react';

const About: React.FC = () => {
  const demoSectionRef = React.useRef<HTMLDivElement | null>(null);

  const handleScrollToDemo = () => {
    if (demoSectionRef.current) {
      demoSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative py-16 sm:py-20 lg:py-24 animate-fade-in overflow-hidden">
        <div className="absolute inset-0 bg-grid-soft"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1517740772437-9d8890a16b51?auto=format&fit=crop&w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
          }}
        ></div>
        <div className="overlay-gradient"></div>
        <div className="absolute -top-16 -left-24 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full hero-shape animate-drift"></div>
        <div className="absolute -bottom-20 -right-28 w-[26rem] h-[26rem] bg-gradient-to-br from-emerald-400 to-green-600 rounded-full hero-shape animate-drift"></div>
        <div className="absolute top-12 right-10 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l4 4-4 4-4-4 4-4z"/></svg>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 transform transition duration-500 hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex-1 text-center md:text-left">
              <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 mb-3">
                AI disease detection
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Spot stress and disease early
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-3">
                AI highlights problem areas in minutes, not days.
              </p>
              <p className="text-base md:text-lg text-gray-600">
                Our detection models are tuned for real-world farm conditions, giving you a fast visual map of risk zones.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <button
                  onClick={handleScrollToDemo}
                  className="inline-flex items-center px-5 py-3 rounded-full bg-emerald-600 text-white text-sm font-semibold shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <span className="mr-2">View Drone Demo</span>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-emerald-100 bg-gray-100">
                <img
                  src="/AgriDroneScan.png"
                  alt="AgriDroneScan"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-emerald-500/10 mix-blend-multiply"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-4">
              AgriDroneScan empowers farmers and agricultural professionals with cutting-edge AI technology 
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

        <div
          ref={demoSectionRef}
          id="drone-demo"
          className="card mt-10 animate-fade-in"
        >
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Drone-to-System Demonstration for Field Estimation</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              This demonstration shows how a drone flight is transformed into a clear, color-coded field map. From image capture, to AI analysis, to estimating affected areas, every step is visible and easy to understand.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">From flight to actionable insights</h3>
              <p className="text-gray-600 mb-4">
                The demo walks through the real workflow used in the field: capturing overlapping drone images, uploading them to AgriDroneScan, running AI models, and visualizing the results as field-level estimates.
              </p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Drone captures high-resolution, geo-referenced images over your corn field.</li>
                <li>Images are uploaded to the platform and prepared for AI analysis.</li>
                <li>Our models detect disease symptoms, stress patterns, and gaps in plant density.</li>
                <li>Detected areas are aggregated into a field map with estimated affected zones and severity.</li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">
                The same pipeline powers our real deployments, so what you see in the demo is exactly how your own fields can be analyzed.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card-hover rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="8" y="8" width="8" height="8" rx="2" />
                      <path d="M3 9h3M3 15h3M18 9h3M18 15h3M9 3v3M15 3v3M9 18v3M15 18v3" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">1. Drone flight & capture</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Plan the route and fly over the field. The drone records overlapping images that cover the entire area for accurate estimation.
                </p>
              </div>
              <div className="card-hover rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 16v-3h-3" />
                      <path d="M8 8v3h3" />
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="16 8 16 4 20 4" />
                      <polyline points="8 16 8 20 4 20" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">2. Upload to the system</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Images are uploaded to AgriDroneScan via the dashboard. Each file keeps its location and time, which is later used for mapping.
                </p>
              </div>
              <div className="card-hover rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="3" />
                      <path d="M9 9h1M14 9h1M10 15h4" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">3. AI analysis & detection</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Our models scan every pixel to detect disease symptoms, color stress, and missing plants, then score the severity per area.
                </p>
              </div>
              <div className="card-hover rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <path d="M14 17h7M17.5 14.5v5" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">4. Field estimation & decisions</h4>
                </div>
                <p className="text-sm text-gray-700">
                  The system combines detections into a field map, estimates the area affected, and highlights where to scout or treat first.
                </p>
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
