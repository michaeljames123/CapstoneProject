import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/config';

type HistoryItem = {
  id: number;
  drone_name: string;
  date_time: string;
  location: string;
  field_size: number;
  flight_time: number;
  created_at: string;
  analysis_result: any;
};

const computeReadiness = (preds: any[] = []) => {
  if (!Array.isArray(preds) || preds.length === 0) return 0;

  const polygonArea = (points: any[]): number => {
    if (!Array.isArray(points) || points.length < 3) return 0;
    let area = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const p1 = points[j];
      const p2 = points[i];
      area += (p1.x + p2.x) * (p1.y - p2.y);
    }
    return Math.abs(area) / 2;
  };

  let healthyArea = 0;
  let diseaseArea = 0;
  let pestArea = 0;
  let weedArea = 0;
  let totalArea = 0;
  let totalConf = 0;

  preds.forEach((p) => {
    const cls = String(p.class || '').toLowerCase();
    let area = 0;
    if (Array.isArray(p.points) && p.points.length >= 3) {
      area = polygonArea(p.points);
    } else if (p.width && p.height) {
      area = Math.max(0, Number(p.width) * Number(p.height));
    }

    totalArea += area;
    totalConf += p.confidence || 0;

    if (cls.includes('healthy')) {
      healthyArea += area;
    } else if (cls.includes('pest')) {
      pestArea += area;
    } else if (cls.includes('weed')) {
      weedArea += area;
    } else if (
      cls.includes('disease') ||
      cls.includes('blight') ||
      cls.includes('mildew') ||
      cls.includes('mold') ||
      cls.includes('rot') ||
      cls.includes('infect')
    ) {
      diseaseArea += area;
    }
  });

  if (totalArea <= 0) return 0;

  const avgConf = totalConf / preds.length;
  const healthyRatio = healthyArea / totalArea;
  const diseaseRatio = diseaseArea / totalArea;
  const pestRatio = pestArea / totalArea;
  const weedRatio = weedArea / totalArea;

  let score = healthyRatio * 100;
  score -= diseaseRatio * 50;
  score -= pestRatio * 40;
  score -= weedRatio * 25;
  score += (avgConf - 0.5) * 30;
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
};

const Dashboard: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/history');
      setItems(res.data?.history || []);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const id = setInterval(fetchHistory, 10000);
    return () => clearInterval(id);
  }, []);

  const avgReadiness = useMemo(() => {
    if (!items.length) return 0;
    const scores = items.map(i => computeReadiness(i.analysis_result?.predictions || []));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [items]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-50">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-700 mt-2">Overview of your recent analyses and quick actions</p>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full hero-shape animate-drift" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-gradient">
          <div className="text-gray-600 text-sm">Recent Analyses</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{items.length}</div>
          <p className="text-gray-600 mt-2 text-sm">Total records found in your account</p>
        </div>
        <div className="card-gradient">
          <div className="text-gray-600 text-sm">Avg Readiness</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{avgReadiness}%</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600" style={{ width: `${avgReadiness}%` }} />
          </div>
        </div>
        <div className="card-gradient">
          <div className="text-gray-600 text-sm">Auto-refresh</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">10s</div>
          <p className="text-gray-600 mt-2 text-sm">Polling /api/history every 10 seconds</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Start a new analysis</h2>
            <p className="text-gray-600 text-sm">Upload a drone image and flight data</p>
          </div>
          <Link to="/analyze" className="btn-primary">Go to Analyze</Link>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button onClick={fetchHistory} className="btn-secondary">Refresh</button>
        </div>
        {error && (
          <div className="p-3 rounded border bg-red-50 text-red-700 text-sm mb-4">{error}</div>
        )}
        {loading && (
          <div className="p-3 rounded border bg-primary-50 text-primary-700 text-sm mb-4">Loading latest data...</div>
        )}
        <div className="space-y-3">
          {items.slice(0, 6).map((item) => {
            const preds = item.analysis_result?.predictions || [];
            const readiness = computeReadiness(preds);
            return (
              <div key={item.id} className="bg-white rounded p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.location}</div>
                    <div className="text-xs text-gray-600">{new Date(item.date_time).toLocaleString()} • {item.drone_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Readiness</div>
                    <div className="text-lg font-semibold text-primary-700">{readiness}%</div>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600" style={{ width: `${readiness}%` }} />
                </div>
              </div>
            );
          })}
          {!items.length && !loading && (
            <div className="text-gray-500 text-sm">No records yet. Run your first analysis.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
