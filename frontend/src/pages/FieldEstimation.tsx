import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type MeasureType = 'AREA' | 'DISTANCE' | 'POI';

type Measure = {
  id: string;
  name: string;
  description?: string;
  group?: string;
  type: MeasureType;
  path?: { lat: number; lng: number }[];
  point?: { lat: number; lng: number } | null;
  area_m2?: number | null;
  perimeter_m?: number | null;
  distance_m?: number | null;
  created_at: string;
};

declare global {
  interface Window {
    google: any;
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function metersToKm(m: number) {
  return m / 1000;
}

function m2ToHa(m2: number) {
  return m2 / 10000;
}

const FieldEstimation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const measuresStorageKey = useMemo(
    () => (user ? `field_measures_${user.id}` : 'field_measures_guest'),
    [user]
  );
  const mapEl = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('satellite');
  const [selectedType, setSelectedType] = useState<MeasureType>('AREA');
  const [measureName, setMeasureName] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('');
  const [activeTab, setActiveTab] = useState<'MEASURES' | 'GROUPS'>('MEASURES');
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [areaM2, setAreaM2] = useState<number | null>(null);
  const [perimeterM, setPerimeterM] = useState<number | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);

  const mapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const currentOverlayRef = useRef<any>(null);

  const apiKey = useMemo(() => String(process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''), []);

  useEffect(() => {
    const saved = localStorage.getItem(measuresStorageKey);
    if (saved) {
      try {
        setMeasures(JSON.parse(saved));
        return;
      } catch {}
    }
    setMeasures([]);
  }, [measuresStorageKey]);

  useEffect(() => {
    if (!apiKey) {
      setApiError('Missing REACT_APP_GOOGLE_MAPS_API_KEY');
      setLoading(false);
      return;
    }

    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing && (window as any).google && (window as any).google.maps) {
      setLoading(false);
      initMap();
      return;
    }

    const s = document.createElement('script');
    s.id = 'google-maps-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,drawing,geometry`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      setLoading(false);
      initMap();
    };
    s.onerror = () => {
      setApiError('Failed to load Google Maps');
      setLoading(false);
    };
    document.head.appendChild(s);
  }, [apiKey]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  function initMap() {
    if (!mapEl.current || !(window as any).google?.maps) return;
    const google = (window as any).google;
    const map = new google.maps.Map(mapEl.current, {
      center: { lat: 14.5995, lng: 120.9842 },
      zoom: 17,
      mapTypeId: mapType,
      fullscreenControl: true,
      streetViewControl: false,
      mapTypeControl: false,
    });
    mapRef.current = map;

    if (searchInputRef.current) {
      const ac = new google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'name'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place && place.geometry && place.geometry.location) {
          map.panTo(place.geometry.location);
          map.setZoom(18);
        }
      });
    }

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        strokeColor: '#16a34a',
        strokeWeight: 3,
        editable: true,
      },
      polylineOptions: {
        strokeColor: '#16a34a',
        strokeWeight: 4,
        editable: true,
      },
      markerOptions: {
        draggable: true,
      },
    });
    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    google.maps.event.addListener(drawingManager, 'overlaycomplete', (e: any) => {
      drawingManager.setDrawingMode(null);
      if (currentOverlayRef.current) {
        // Clear previous overlay and its edge labels
        if (currentOverlayRef.current.__edgeLabels) {
          currentOverlayRef.current.__edgeLabels.forEach((m: any) => m.setMap(null));
          currentOverlayRef.current.__edgeLabels = [];
        }
        currentOverlayRef.current.setMap(null);
        currentOverlayRef.current = null;
      }
      currentOverlayRef.current = e.overlay;
      if (e.type === 'polygon' || e.type === 'polyline') {
        e.overlay.setEditable(true);
        const path = e.overlay.getPath();
        const update = () => { updateMeasurements(e.type, e.overlay); updateEdgeLabels(e.type, e.overlay); };
        google.maps.event.addListener(path, 'set_at', update);
        google.maps.event.addListener(path, 'insert_at', update);
        google.maps.event.addListener(path, 'remove_at', update);
        update();
      } else if (e.type === 'marker') {
        const updatePoint = () => {
          const pos = e.overlay.getPosition();
          setDistanceM(null);
          setAreaM2(null);
          setPerimeterM(null);
          setSelectedMeasureId(null);
        };
        google.maps.event.addListener(e.overlay, 'dragend', updatePoint);
        updatePoint();
      }
      setSelectedMeasureId(null);
    });
  }

  function startDrawing(t: MeasureType) {
    setSelectedType(t);
    const google = (window as any).google;
    if (!google?.maps || !drawingManagerRef.current) return;
    const dm = drawingManagerRef.current;
    if (currentOverlayRef.current) {
      currentOverlayRef.current.setMap(null);
      currentOverlayRef.current = null;
    }
    setAreaM2(null);
    setPerimeterM(null);
    setDistanceM(null);
    if (t === 'AREA') dm.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    else if (t === 'DISTANCE') dm.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
    else dm.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
  }

  function updateMeasurements(kind: 'polygon' | 'polyline', overlay: any) {
    const google = (window as any).google;
    const pathArr: any[] = overlay.getPath().getArray();
    if (kind === 'polyline') {
      const len = google.maps.geometry.spherical.computeLength(pathArr);
      setDistanceM(len);
      setAreaM2(null);
      setPerimeterM(null);
    } else {
      const area = google.maps.geometry.spherical.computeArea(pathArr);
      const perim = google.maps.geometry.spherical.computeLength([...pathArr, pathArr[0]].filter(Boolean));
      setAreaM2(area);
      setPerimeterM(perim);
      setDistanceM(null);
    }
  }

  function clearEdgeLabels(overlay: any) {
    if (overlay && overlay.__edgeLabels) {
      overlay.__edgeLabels.forEach((m: any) => m.setMap(null));
      overlay.__edgeLabels = [];
    }
  }

  function formatDistance(meters: number) {
    return meters >= 1000 ? `${(meters / 1000).toFixed(3)} km` : `${meters.toFixed(1)} m`;
  }

  function updateEdgeLabels(kind: 'polygon' | 'polyline', overlay: any) {
    const google = (window as any).google;
    if (!google?.maps || !overlay?.getPath || !mapRef.current) return;
    const path = overlay.getPath();
    const len = path.getLength();
    clearEdgeLabels(overlay);
    const labels: any[] = [];
    for (let i = 0; i < len - (kind === 'polygon' ? 0 : 1); i++) {
      const a = path.getAt(i);
      const b = path.getAt((i + 1) % len);
      if (!a || !b) continue;
      const mid = (google.maps.geometry.spherical as any).interpolate
        ? google.maps.geometry.spherical.interpolate(a, b, 0.5)
        : new google.maps.LatLng((a.lat() + b.lat()) / 2, (a.lng() + b.lng()) / 2);
      const segLen = google.maps.geometry.spherical.computeDistanceBetween(a, b);
      const marker = new google.maps.Marker({
        position: mid,
        map: mapRef.current,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
        label: { text: formatDistance(segLen), color: '#ffffff', fontSize: '12px', fontWeight: '700' },
      });
      labels.push(marker);
    }
    overlay.__edgeLabels = labels;
  }

  function saveCurrent() {
    const google = (window as any).google;
    if (!mapRef.current || !google?.maps) return;
    const ov = currentOverlayRef.current;
    if (!ov) return;
    const id = uid();
    const base: Measure = {
      id,
      name: measureName || 'Untitled',
      description: description || '',
      group: group || '',
      type: selectedType,
      created_at: new Date().toISOString(),
    } as Measure;
    if (selectedType === 'AREA') {
      const path = ov.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
      const area = areaM2 || 0;
      const perim = perimeterM || 0;
      const m: Measure = { ...base, path, area_m2: area, perimeter_m: perim };
      const next = [m, ...measures];
      setMeasures(next);
      localStorage.setItem(measuresStorageKey, JSON.stringify(next));
      setSelectedMeasureId(m.id);
    } else if (selectedType === 'DISTANCE') {
      const path = ov.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
      const dist = distanceM || 0;
      const m: Measure = { ...base, path, distance_m: dist };
      const next = [m, ...measures];
      setMeasures(next);
      localStorage.setItem(measuresStorageKey, JSON.stringify(next));
      setSelectedMeasureId(m.id);
    } else if (selectedType === 'POI') {
      const pos = ov.getPosition();
      const m: Measure = { ...base, point: { lat: pos.lat(), lng: pos.lng() } };
      const next = [m, ...measures];
      setMeasures(next);
      localStorage.setItem(measuresStorageKey, JSON.stringify(next));
      setSelectedMeasureId(m.id);
    }
  }

  function deleteSelected() {
    const id = selectedMeasureId;
    if (!id) {
      if (currentOverlayRef.current) {
        currentOverlayRef.current.setMap(null);
        currentOverlayRef.current = null;
      }
      setAreaM2(null);
      setPerimeterM(null);
      setDistanceM(null);
      return;
    }
    const next = measures.filter(m => m.id !== id);
    setMeasures(next);
    localStorage.setItem(measuresStorageKey, JSON.stringify(next));
    setSelectedMeasureId(null);
    if (currentOverlayRef.current) {
      currentOverlayRef.current.setMap(null);
      currentOverlayRef.current = null;
    }
    setAreaM2(null);
    setPerimeterM(null);
    setDistanceM(null);
  }

  function loadMeasure(m: Measure) {
    const google = (window as any).google;
    if (!google?.maps || !mapRef.current) return;
    if (currentOverlayRef.current) {
      currentOverlayRef.current.setMap(null);
      currentOverlayRef.current = null;
    }
    if (m.type === 'AREA' && m.path && m.path.length >= 3) {
      const poly = new google.maps.Polygon({
        paths: m.path,
        map: mapRef.current,
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        strokeColor: '#16a34a',
        strokeWeight: 3,
        editable: true,
      });
      currentOverlayRef.current = poly;
      const bounds = new google.maps.LatLngBounds();
      m.path.forEach(p => bounds.extend(p));
      mapRef.current.fitBounds(bounds);
      updateMeasurements('polygon', poly);
      updateEdgeLabels('polygon', poly);
      const path = poly.getPath();
      const update = () => { updateMeasurements('polygon', poly); updateEdgeLabels('polygon', poly); };
      google.maps.event.addListener(path, 'set_at', update);
      google.maps.event.addListener(path, 'insert_at', update);
      google.maps.event.addListener(path, 'remove_at', update);
    } else if (m.type === 'DISTANCE' && m.path && m.path.length >= 2) {
      const line = new google.maps.Polyline({
        path: m.path,
        map: mapRef.current,
        strokeColor: '#16a34a',
        strokeWeight: 4,
        editable: true,
      });
      currentOverlayRef.current = line;
      const bounds = new google.maps.LatLngBounds();
      m.path.forEach(p => bounds.extend(p));
      mapRef.current.fitBounds(bounds);
      updateMeasurements('polyline', line);
      updateEdgeLabels('polyline', line);
      const path = line.getPath();
      const update = () => { updateMeasurements('polyline', line); updateEdgeLabels('polyline', line); };
      google.maps.event.addListener(path, 'set_at', update);
      google.maps.event.addListener(path, 'insert_at', update);
      google.maps.event.addListener(path, 'remove_at', update);
    } else if (m.type === 'POI' && m.point) {
      const marker = new google.maps.Marker({
        position: m.point,
        map: mapRef.current,
        draggable: true,
      });
      currentOverlayRef.current = marker;
      mapRef.current.panTo(m.point);
      setAreaM2(null);
      setPerimeterM(null);
      setDistanceM(null);
    }
    setSelectedMeasureId(m.id);
    setMeasureName(m.name || '');
    setDescription(m.description || '');
    setGroup(m.group || '');
  }

  function geolocate() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current.panTo({ lat: latitude, lng: longitude });
        mapRef.current.setZoom(18);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const groups = useMemo(() => {
    const map = new Map<string, number>();
    measures.forEach(m => {
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
                  {measures.map(m => (
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
                {groups.map(g => (
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
                const data = { title: measureName || 'Measure', text: 'Field measure', url: window.location.href };
                (navigator as any).share(data).catch(() => {});
              } else {
                const ov: any = currentOverlayRef.current;
                const path = typeof ov?.getPath === 'function'
                  ? ov.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
                  : null;
                const payload = { name: measureName, description, group, type: selectedType, path };
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
            <button onClick={() => startDrawing('AREA')} className="w-full mb-2 px-3 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white">CREATE NEW MEASURE (Area)</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => startDrawing('DISTANCE')} className="px-3 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white">Distance</button>
              <button onClick={() => startDrawing('POI')} className="px-3 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white">POI</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <div className="absolute top-3 left-3 z-10 flex gap-2 items-center">
          <div className="bg-white rounded-md shadow border overflow-hidden flex">
            <button onClick={() => setMapType('roadmap')} className={`px-3 py-2 text-sm ${mapType === 'roadmap' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>Map</button>
            <button onClick={() => setMapType('satellite')} className={`px-3 py-2 text-sm ${mapType === 'satellite' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>Satellite</button>
          </div>
          <input ref={searchInputRef} type="text" placeholder="Search" className="w-80 bg-white border rounded-md px-3 py-2 text-sm shadow focus:outline-none" />
        </div>
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button onClick={geolocate} className="px-3 py-2 bg-white border rounded-md shadow text-sm hover:bg-gray-50">My location</button>
        </div>
        {apiError ? (
          <div className="h-full flex items-center justify-center text-red-600 text-sm">{apiError}</div>
        ) : (
          <div ref={mapEl} className="w-full h-full" />
        )}
        {loading && !apiError && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-gray-700">Loading map…</div>
        )}
      </div>
    </div>
  );
};

export default FieldEstimation;
