import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L, { LatLng, LeafletMouseEvent, Map as LeafletMap, LayerGroup } from 'leaflet';
import api from '../api/config';

type MeasureType = 'AREA' | 'DISTANCE' | 'POI';

type LatLngPoint = { lat: number; lng: number };

type Measure = {
  id: string;
  name: string;
  description?: string;
  group?: string;
  type: MeasureType;
  path?: LatLngPoint[];
  point?: LatLngPoint | null;
  area_m2?: number | null;
  perimeter_m?: number | null;
  distance_m?: number | null;
  created_at: string;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function metersToKm(m: number) {
  return m / 1000;
}

function m2ToHa(m2: number) {
  return m2 / 10000;
}

function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371000; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const aVal = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, aVal))));
  return R * c;
}

function computePolylineLength(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistance(points[i], points[i + 1]);
  }
  return total;
}

function projectToMeters(lat: number, lng: number) {
  const R = 6378137; // Web Mercator
  const x = (lng * Math.PI / 180) * R;
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * R;
  return { x, y };
}

function computePolygonArea(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const coords = points.map((p) => projectToMeters(p.lat, p.lng));
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].x * coords[j].y - coords[j].x * coords[i].y;
  }
  return Math.abs(area) / 2;
}

function computePerimeter(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += haversineDistance(a, b);
  }
  return total;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(3)} km` : `${meters.toFixed(1)} m`;
}

function getTileUrl(type: 'roadmap' | 'satellite') {
  if (type === 'satellite') {
    // Use a different style for "satellite" mode (not true imagery but distinct look)
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  }
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}

const FieldEstimationLeaflet: React.FC = () => {
  const navigate = useNavigate();
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef = useRef<L.TileLayer | null>(null);
  const shapeLayerRef = useRef<LayerGroup | null>(null);
  const edgeLabelLayerRef = useRef<LayerGroup | null>(null);
  const vertexHandleLayerRef = useRef<LayerGroup | null>(null);
  const currentPointsRef = useRef<LatLng[]>([]);
  const currentOverlayRef = useRef<L.Layer | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [loadingMap, setLoadingMap] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('satellite');
  const [selectedType, setSelectedType] = useState<MeasureType>('AREA');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMeasureDrawerOpen, setIsMeasureDrawerOpen] = useState(false);
  const [measureName, setMeasureName] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('');
  const [activeTab, setActiveTab] = useState<'MEASURES' | 'GROUPS'>('MEASURES');
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [areaM2, setAreaM2] = useState<number | null>(null);
  const [perimeterM, setPerimeterM] = useState<number | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('field_measures');
    if (saved) {
      try {
        const parsed: Measure[] = JSON.parse(saved);
        setMeasures(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, {
      zoomControl: true,
    }).setView([14.5995, 120.9842], 17);

    const tile = L.tileLayer(getTileUrl(mapType), {
      attribution: '&copy; Esri & OpenStreetMap contributors',
      maxZoom: 19,
      zIndex: 1,
    });
    tile.addTo(map);

    const shapeLayer = L.layerGroup().addTo(map);
    const edgeLayer = L.layerGroup().addTo(map);
    const vertexLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tile;
    labelTileLayerRef.current = null;
    shapeLayerRef.current = shapeLayer;
    edgeLabelLayerRef.current = edgeLayer;
    vertexHandleLayerRef.current = vertexLayer;
    setLoadingMap(false);
  }, [mapType]);

  useEffect(() => {
    const tile = tileLayerRef.current;
    if (!tile) return;
    tile.setUrl(getTileUrl(mapType));
  }, [mapType]);

  const clearEdgeLabels = useCallback(() => {
    const edgeLayer = edgeLabelLayerRef.current;
    if (!edgeLayer) return;
    edgeLayer.clearLayers();
  }, []);

  const clearCurrentOverlay = useCallback(() => {
    const shapeLayer = shapeLayerRef.current;
    if (!shapeLayer) return;
    if (currentOverlayRef.current) {
      shapeLayer.removeLayer(currentOverlayRef.current);
      currentOverlayRef.current = null;
    }
    clearEdgeLabels();
    const vertexLayer = vertexHandleLayerRef.current;
    if (vertexLayer) {
      vertexLayer.clearLayers();
    }
    currentPointsRef.current = [];
  }, [clearEdgeLabels]);

  const updateMeasurementsFromPoints = useCallback((kind: 'polygon' | 'polyline', points: LatLng[]) => {
    if (!points.length) {
      setAreaM2(null);
      setPerimeterM(null);
      setDistanceM(null);
      return;
    }
    if (kind === 'polyline') {
      const len = computePolylineLength(points);
      setDistanceM(len);
      setAreaM2(null);
      setPerimeterM(null);
    } else {
      const area = computePolygonArea(points);
      const perim = computePerimeter(points);
      setAreaM2(area);
      setPerimeterM(perim);
      setDistanceM(null);
    }
  }, []);

  const updateEdgeLabelsFromPoints = useCallback((kind: 'polygon' | 'polyline', points: LatLng[]) => {
    const map = mapRef.current;
    const edgeLayer = edgeLabelLayerRef.current;
    if (!map || !edgeLayer || points.length < 2) return;

    clearEdgeLabels();

    const maxIndex = kind === 'polygon' ? points.length : points.length - 1;
    for (let i = 0; i < maxIndex; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const midLat = (a.lat + b.lat) / 2;
      const midLng = (a.lng + b.lng) / 2;
      const segLen = haversineDistance(a, b);

      const marker = L.marker([midLat, midLng], {
        interactive: false,
        icon: L.divIcon({
          className: 'edge-label',
          html: `<div>${formatDistance(segLen)}</div>`,
        }),
      });
      marker.addTo(edgeLayer);
    }
  }, [clearEdgeLabels]);

  const updateVertexHandlesFromPoints = useCallback((kind: 'polygon' | 'polyline', points: LatLng[]) => {
    const map = mapRef.current;
    const vertexLayer = vertexHandleLayerRef.current;
    if (!map || !vertexLayer) return;

    vertexLayer.clearLayers();

    points.forEach((p, index) => {
      const handle = L.marker([p.lat, p.lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'vertex-handle',
          html: '<div></div>',
        }),
      });

      handle.on('drag', (event: any) => {
        const marker = event.target as L.Marker;
        const latlng = marker.getLatLng();
        const updated = currentPointsRef.current.slice();
        updated[index] = latlng;
        currentPointsRef.current = updated;
        redrawCurrentShape(kind);
      });

      handle.addTo(vertexLayer);
    });
  }, []);

  const redrawCurrentShape = useCallback((kind: 'polygon' | 'polyline') => {
    const map = mapRef.current;
    const shapeLayer = shapeLayerRef.current;
    if (!map || !shapeLayer) return;

    const pts = currentPointsRef.current;
    if ((kind === 'polygon' && pts.length < 3) || (kind === 'polyline' && pts.length < 2)) {
      updateMeasurementsFromPoints(kind, pts);
      clearEdgeLabels();
      const vertexLayer = vertexHandleLayerRef.current;
      if (vertexLayer) {
        vertexLayer.clearLayers();
      }
      if (currentOverlayRef.current) {
        shapeLayer.removeLayer(currentOverlayRef.current);
        currentOverlayRef.current = null;
      }
      return;
    }

    if (currentOverlayRef.current) {
      shapeLayer.removeLayer(currentOverlayRef.current);
      currentOverlayRef.current = null;
    }

    if (kind === 'polygon') {
      const poly = L.polygon(pts, {
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#22c55e',
        fillOpacity: 0.35,
      });
      poly.addTo(shapeLayer);
      currentOverlayRef.current = poly;
    } else {
      const line = L.polyline(pts, {
        color: '#ffffff',
        weight: 3,
      });
      line.addTo(shapeLayer);
      currentOverlayRef.current = line;
    }

    updateMeasurementsFromPoints(kind, pts);
    updateEdgeLabelsFromPoints(kind, pts);
    updateVertexHandlesFromPoints(kind, pts);
  }, [clearEdgeLabels, updateEdgeLabelsFromPoints, updateMeasurementsFromPoints, updateVertexHandlesFromPoints]);

  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
    const map = mapRef.current;
    if (!map) return;
    if (!isDrawing) {
      return;
    }
    setSelectedMeasureId(null);
    setError(null);

    if (selectedType === 'POI') {
      clearCurrentOverlay();
      currentPointsRef.current = [e.latlng];
      const shapeLayer = shapeLayerRef.current;
      if (!shapeLayer) return;
      const marker = L.circleMarker(e.latlng, {
        radius: 6,
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.9,
      });
      marker.addTo(shapeLayer);
      currentOverlayRef.current = marker;
      setAreaM2(null);
      setPerimeterM(null);
      setDistanceM(null);
      return;
    }

    currentPointsRef.current = [...currentPointsRef.current, e.latlng];
    const kind = selectedType === 'AREA' ? 'polygon' : 'polyline';
    redrawCurrentShape(kind);
  }, [clearCurrentOverlay, redrawCurrentShape, selectedType, isDrawing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.off('click');
    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [handleMapClick]);

  const startDrawing = (t: MeasureType) => {
    setSelectedType(t);
    setIsDrawing(true);
    clearCurrentOverlay();
    setAreaM2(null);
    setPerimeterM(null);
    setDistanceM(null);
    setSelectedMeasureId(null);
  };

  const geolocate = () => {
    const map = mapRef.current;
    if (!navigator.geolocation || !map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 18);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    const map = mapRef.current;
    if (!map) return;
    const q = searchInputRef.current?.value?.trim();
    if (!q) return;
    try {
      setSearchLoading(true);
      setError(null);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
      const data: any[] = await res.json();
      if (!data.length) {
        setError('Location not found');
        return;
      }
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        map.setView([lat, lon], 18);
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const persistMeasures = (next: Measure[]) => {
    setMeasures(next);
    try {
      localStorage.setItem('field_measures', JSON.stringify(next));
    } catch {}
  };

  const logFieldEstimation = async (m: Measure) => {
    try {
      await api.post('/api/field-estimations', {
        name: m.name,
        description: m.description,
        group: m.group,
        type: m.type,
        area_m2: m.area_m2,
        perimeter_m: m.perimeter_m,
        distance_m: m.distance_m,
        geometry: m.path || (m.point ? { point: m.point } : null),
      });
    } catch (e) {
      // Best-effort logging only
      console.error('Failed to log field estimation activity', e);
    }
  };

  const saveCurrent = async () => {
    const pts = currentPointsRef.current;
    if (selectedType !== 'POI' && pts.length < (selectedType === 'AREA' ? 3 : 2)) {
      setError('Draw a shape on the map before saving.');
      return;
    }
    if (selectedType === 'POI' && pts.length < 1) {
      setError('Select a point on the map before saving.');
      return;
    }

    const id = uid();
    const base: Measure = {
      id,
      name: measureName || 'Untitled',
      description: description || '',
      group: group || '',
      type: selectedType,
      created_at: new Date().toISOString(),
    };

    let saved: Measure | null = null;

    if (selectedType === 'AREA') {
      const path = pts.map((p) => ({ lat: p.lat, lng: p.lng }));
      const area = areaM2 ?? computePolygonArea(pts);
      const perim = perimeterM ?? computePerimeter(pts);
      saved = { ...base, path, area_m2: area, perimeter_m: perim };
    } else if (selectedType === 'DISTANCE') {
      const path = pts.map((p) => ({ lat: p.lat, lng: p.lng }));
      const dist = distanceM ?? computePolylineLength(pts);
      saved = { ...base, path, distance_m: dist };
    } else if (selectedType === 'POI') {
      const p = pts[0];
      saved = { ...base, point: { lat: p.lat, lng: p.lng } };
    }

    if (!saved) return;

    const next = [saved, ...measures];
    persistMeasures(next);
    setSelectedMeasureId(saved.id);
    await logFieldEstimation(saved);
    setIsDrawing(false);
  };

  const deleteSelected = () => {
    const id = selectedMeasureId;
    if (!id) {
      clearCurrentOverlay();
      setAreaM2(null);
      setPerimeterM(null);
      setDistanceM(null);
      setIsDrawing(false);
      return;
    }
    const next = measures.filter((m) => m.id !== id);
    persistMeasures(next);
    setSelectedMeasureId(null);
    clearCurrentOverlay();
    setAreaM2(null);
    setPerimeterM(null);
    setDistanceM(null);
    setIsDrawing(false);
  };

  const loadMeasure = (m: Measure) => {
    const map = mapRef.current;
    const shapeLayer = shapeLayerRef.current;
    if (!map || !shapeLayer) return;

    clearCurrentOverlay();

    if (m.type === 'AREA' && m.path && m.path.length >= 3) {
      const pts = m.path.map((p) => new LatLng(p.lat, p.lng));
      currentPointsRef.current = pts;
      const poly = L.polygon(pts, {
        color: '#16a34a',
        weight: 3,
        fillColor: '#22c55e',
        fillOpacity: 0.2,
      });
      poly.addTo(shapeLayer);
      currentOverlayRef.current = poly;
      map.fitBounds(poly.getBounds());
      updateMeasurementsFromPoints('polygon', pts);
      updateEdgeLabelsFromPoints('polygon', pts);
      updateVertexHandlesFromPoints('polygon', pts);
    } else if (m.type === 'DISTANCE' && m.path && m.path.length >= 2) {
      const pts = m.path.map((p) => new LatLng(p.lat, p.lng));
      currentPointsRef.current = pts;
      const line = L.polyline(pts, {
        color: '#16a34a',
        weight: 4,
      });
      line.addTo(shapeLayer);
      currentOverlayRef.current = line;
      map.fitBounds(line.getBounds());
      updateMeasurementsFromPoints('polyline', pts);
      updateEdgeLabelsFromPoints('polyline', pts);
      updateVertexHandlesFromPoints('polyline', pts);
    } else if (m.type === 'POI' && m.point) {
      const marker = L.circleMarker([m.point.lat, m.point.lng], {
        radius: 6,
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.9,
      });
      marker.addTo(shapeLayer);
      currentOverlayRef.current = marker;
      currentPointsRef.current = [new LatLng(m.point.lat, m.point.lng)];
      map.setView([m.point.lat, m.point.lng], 18);
      setAreaM2(null);
      setPerimeterM(null);
      setDistanceM(null);
    }

    setSelectedMeasureId(m.id);
    setMeasureName(m.name || '');
    setDescription(m.description || '');
    setGroup(m.group || '');
    setIsDrawing(false);
  };

  const groups = useMemo(() => {
    const map = new Map<string, number>();
    measures.forEach((m) => {
      const g = m.group || 'Ungrouped';
      map.set(g, (map.get(g) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [measures]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">Field Estimation</div>
        </div>
        <div className="px-4 pt-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Measure name</label>
            <input value={measureName} onChange={(e) => setMeasureName(e.target.value)} className="w-full input-field" placeholder="Name" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full input-field" placeholder="Description" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Group</label>
            <input value={group} onChange={(e) => setGroup(e.target.value)} className="w-full input-field" placeholder="Group" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
            <div>
              <div className="text-gray-500">Area</div>
              <div className="font-semibold text-gray-900">{areaM2 ? `${m2ToHa(areaM2).toFixed(3)} ha` : '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Perimeter</div>
              <div className="font-semibold text-gray-900">{perimeterM ? `${metersToKm(perimeterM).toFixed(3)} km` : '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Distance</div>
              <div className="font-semibold text-gray-900">{distanceM ? `${metersToKm(distanceM).toFixed(3)} km` : '-'}</div>
            </div>
          </div>
        </div>
        <div className="px-4 pt-4">
          <div className="flex border-b">
            <button className={`px-3 py-2 text-sm ${activeTab === 'MEASURES' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-600'}`} onClick={() => setActiveTab('MEASURES')}>MEASURES</button>
            <button className={`px-3 py-2 text-sm ${activeTab === 'GROUPS' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-600'}`} onClick={() => setActiveTab('GROUPS')}>GROUPS</button>
          </div>
          <div className="h-48 overflow-y-auto py-2">
            {activeTab === 'MEASURES' ? (
              measures.length ? (
                <ul className="space-y-2">
                  {measures.map((m) => (
                    <li key={m.id}>
                      <button onClick={() => loadMeasure(m)} className={`w-full text-left px-3 py-2 rounded-lg border ${selectedMeasureId === m.id ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.type}</div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {m.type === 'AREA' && m.area_m2 ? `${m2ToHa(m.area_m2).toFixed(3)} ha, ${(m.perimeter_m ? metersToKm(m.perimeter_m) : 0).toFixed(3)} km` : m.type === 'DISTANCE' && m.distance_m ? `${metersToKm(m.distance_m).toFixed(3)} km` : m.type === 'POI' && m.point ? `${m.point.lat.toFixed(5)}, ${m.point.lng.toFixed(5)}` : ''}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 px-2">No measures yet. Create one below.</div>
              )
            ) : (
              <ul className="space-y-2">
                {groups.map((g) => (
                  <li key={g.name} className="px-3 py-2 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div className="font-medium text-gray-900">{g.name}</div>
                    <div className="text-xs text-gray-500">{g.count}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-auto px-4 py-3 border-t flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof (navigator as any).share === 'function') {
                const payload: any = {
                  name: measureName,
                  description,
                  group,
                  type: selectedType,
                };
                const pts = currentPointsRef.current;
                if (selectedType === 'POI' && pts[0]) {
                  payload.point = { lat: pts[0].lat, lng: pts[0].lng };
                } else if (pts.length) {
                  payload.path = pts.map((p) => ({ lat: p.lat, lng: p.lng }));
                }
                (navigator as any).share({
                  title: measureName || 'Measure',
                  text: 'Field measure',
                  url: window.location.href,
                }).catch(() => {});
              } else {
                const pts = currentPointsRef.current;
                const payload: any = {
                  name: measureName,
                  description,
                  group,
                  type: selectedType,
                };
                if (selectedType === 'POI' && pts[0]) {
                  payload.point = { lat: pts[0].lat, lng: pts[0].lng };
                } else if (pts.length) {
                  payload.path = pts.map((p) => ({ lat: p.lat, lng: p.lng }));
                }
                navigator.clipboard.writeText(JSON.stringify(payload)).catch(() => {});
              }
            }}
            className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            SHARE
          </button>
          <button onClick={saveCurrent} className="ml-auto px-3 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-700 text-white">SAVE</button>
          <button onClick={deleteSelected} className="px-3 py-2 text-sm rounded-lg bg-red-50 hover:bg-red-100 text-red-700">DELETE</button>
          <button onClick={() => navigate(-1)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">BACK</button>
        </div>
        <div className="px-4 py-3 border-t">
          <div className="relative">
            <button
              onClick={() => setIsMeasureDrawerOpen((open) => !open)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow flex items-center justify-between"
            >
              <span>Measure</span>
              <span className="text-xs opacity-90">{isMeasureDrawerOpen ? 'Hide' : 'Open'}</span>
            </button>
            {isMeasureDrawerOpen && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 shadow-inner p-3">
                <button onClick={() => startDrawing('AREA')} className="w-full mb-2 px-3 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white">CREATE NEW MEASURE (Area)</button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => startDrawing('DISTANCE')} className="px-3 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white">Distance</button>
                  <button onClick={() => startDrawing('POI')} className="px-3 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white">POI</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 relative z-0">
        <div className="absolute top-3 left-3 z-[2000] flex gap-2 items-center">
          <div className="bg-white rounded-md shadow border overflow-hidden flex">
            <button onClick={() => setMapType('roadmap')} className={`px-3 py-2 text-sm ${mapType === 'roadmap' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>Map</button>
            <button onClick={() => setMapType('satellite')} className={`px-3 py-2 text-sm ${mapType === 'satellite' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>Satellite</button>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search"
            className="w-80 bg-white border rounded-md px-3 py-2 text-sm shadow focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
        </div>
        <div className="absolute top-3 right-3 z-[2000] flex gap-2">
          <button onClick={geolocate} className="px-3 py-2 bg-white border rounded-md shadow text-sm hover:bg-gray-50">My location</button>
          <button onClick={handleSearch} className="px-3 py-2 bg-white border rounded-md shadow text-sm hover:bg-gray-50">
            {searchLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
        {error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 shadow">
            {error}
          </div>
        )}
        <div ref={mapEl} className="w-full h-full" />
        {loadingMap && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-gray-700">Loading map…</div>
        )}
      </div>
    </div>
  );
};

export default FieldEstimationLeaflet;
