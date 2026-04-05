import React, { useState, useEffect, useRef } from 'react';
import { Droplets, Users, Clock, TrendingUp, MapPin, ArrowLeft, Activity, Waves, CircleHelp } from 'lucide-react';

// Edinburgh Leisure pools data with colors and opening hours
const POOLS = [
  { 
    id: 'royal-commonwealth', 
    name: 'Royal Commonwealth Pool', 
    location: 'Dalkeith Road',
    lat: 55.9366,
    lng: -3.1627,
    color: '#0EA5E9', // Sky blue for the flagship
    hours: {
      weekday: { open: '05:30', close: '22:00' },
      saturday: { open: '05:30', close: '20:00' },
      sunday: { open: '07:30', close: '20:00' },
      // Closed Wednesday 9-10am for staff training
      wednesdayClosed: { start: '09:00', end: '10:00' }
    }
  },
  { 
    id: 'warrender', 
    name: 'Warrender Swim Centre', 
    location: 'Thirlestane Road',
    lat: 55.9352,
    lng: -3.1876,
    color: '#8B5CF6', // Purple
    hours: {
      weekday: { open: '06:30', close: '21:30' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '17:00' }
    }
  },
  { 
    id: 'glenogle', 
    name: 'Glenogle Swim Centre', 
    location: 'Glenogle Road',
    lat: 55.9578,
    lng: -3.2021,
    color: '#10B981', // Emerald green
    hours: {
      weekday: { open: '06:30', close: '21:30' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '17:00' }
    }
  },
  { 
    id: 'leith-victoria', 
    name: 'Leith Victoria Swim Centre', 
    location: 'Junction Place',
    lat: 55.9752,
    lng: -3.1654,
    color: '#F59E0B', // Amber
    hours: {
      weekday: { open: '06:30', close: '21:30' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '17:00' }
    }
  },
  { 
    id: 'dalry', 
    name: 'Dalry Swim Centre', 
    location: 'Caledonian Crescent',
    lat: 55.9434,
    lng: -3.2196,
    color: '#EF4444', // Red
    hours: {
      weekday: { open: '06:30', close: '21:30' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '17:00' }
    }
  },
  { 
    id: 'portobello', 
    name: 'Portobello Swim Centre', 
    location: 'Bellfield Street',
    lat: 55.954,
    lng: -3.1069,
    color: '#EC4899', // Pink
    hours: {
      weekday: { open: '06:30', close: '21:30' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '17:00' }
    }
  },
  { 
    id: 'ainslie-park', 
    name: 'Ainslie Park Leisure Centre', 
    location: 'Pilton Drive',
    lat: 55.9739,
    lng: -3.2334,
    color: '#6366F1', // Indigo
    hours: {
      weekday: { open: '06:30', close: '21:30' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '17:00' }
    }
  },
  {
    id: 'glasgow-club-bellahouston',
    name: 'Glasgow Club Bellahouston',
    location: 'Glasgow (Bellahouston)',
    lat: 55.8455,
    lng: -4.3089,
    color: '#14B8A6',
    hours: {
      weekday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '20:00' }
    }
  },
  {
    id: 'glasgow-club-castlemilk',
    name: 'Glasgow Club Castlemilk',
    location: 'Glasgow (Castlemilk)',
    lat: 55.8089,
    lng: -4.2334,
    color: '#F97316',
    hours: {
      weekday: { open: '08:00', close: '20:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '10:00', close: '17:00' }
    }
  },
  {
    id: 'glasgow-club-easterhouse',
    name: 'Glasgow Club Easterhouse',
    location: 'Glasgow (Easterhouse)',
    lat: 55.8651,
    lng: -4.1234,
    color: '#38BDF8',
    hours: {
      monday: { open: '09:00', close: '14:30' },
      tuesday: { open: '14:30', close: '20:00' },
      wednesday: { open: '09:00', close: '14:30' },
      thursday: { open: '14:30', close: '20:00' },
      friday: { open: '09:00', close: '14:30' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { closed: true }
    }
  },
  {
    id: 'glasgow-club-gorbals',
    name: 'Glasgow Club Gorbals',
    location: 'Glasgow (Gorbals)',
    lat: 55.8489,
    lng: -4.2567,
    color: '#F43F5E',
    hours: {
      weekday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '20:00' }
    }
  },
  {
    id: 'glasgow-club-north-woodside',
    name: 'Glasgow Club North Woodside',
    location: 'Glasgow (North Woodside)',
    lat: 55.8734,
    lng: -4.2678,
    color: '#8B5CF6',
    hours: {
      monday: { open: '15:00', close: '21:00' },
      tuesday: { open: '10:00', close: '15:00' },
      wednesday: { open: '10:00', close: '15:00' },
      thursday: { open: '15:00', close: '21:00' },
      friday: { open: '10:00', close: '15:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { closed: true }
    }
  },
  {
    id: 'glasgow-club-scotstoun',
    name: 'Glasgow Club Scotstoun',
    location: 'Glasgow (Scotstoun)',
    lat: 55.8734,
    lng: -4.3456,
    color: '#0EA5E9',
    hours: {
      weekday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '20:00' }
    }
  },
  {
    id: 'glasgow-club-springburn',
    name: 'Glasgow Club Springburn',
    location: 'Glasgow (Springburn)',
    lat: 55.8834,
    lng: -4.2345,
    color: '#10B981',
    hours: {
      weekday: { open: '06:00', close: '21:00' },
      saturday: { open: '08:00', close: '16:00' },
      sunday: { open: '08:00', close: '16:00' }
    }
  },
  {
    id: 'tollcross-international-swimming-centre',
    name: 'Tollcross International Swimming Centre',
    location: 'Glasgow (Tollcross)',
    lat: 55.8537,
    lng: -4.2193,
    color: '#06B6D4',
    hours: {
      weekday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '20:00' }
    }
  },
  {
    id: 'glasgow-club-whitehill',
    name: 'Glasgow Club Whitehill',
    location: 'Glasgow (Whitehill)',
    lat: 55.8567,
    lng: -4.2123,
    color: '#84CC16',
    hours: {
      monday: { closed: true },
      tuesday: { closed: true },
      wednesday: { closed: true },
      thursday: { closed: true },
      friday: { closed: true },
      saturday: { closed: true },
      sunday: { closed: true }
    }
  },
 {
  id: "western-baths-club",
  name: "Western Baths Club",
  location: "Glasgow (Hillhead / West End)",
  lat: 55.8751,
  lng: -4.2813,
  color: "#A855F7", // Purple
  hours: {
    weekday: { open: "06:00", close: "21:30" },
    saturday: { open: "07:00", close: "19:30" },
    sunday: { open: "08:00", close: "18:30" }
  }
},
  {
    id: 'glasgow-club-drumchapel',
    name: 'Glasgow Club Drumchapel',
    location: 'Glasgow (Drumchapel)',
    lat: 55.9012,
    lng: -4.3789,
    color: '#D97706',
    hours: {
      weekday: { open: '07:00', close: '21:00' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '09:00', close: '17:00' }
    }
  },
  {
    id: 'glasgow-club-ibrox',
    name: 'Glasgow Club Ibrox',
    location: 'Glasgow (Ibrox)',
    lat: 55.8534,
    lng: -4.3123,
    color: '#7C3AED',
    hours: {
      weekday: { open: '07:00', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '09:00', close: '18:00' }
    }
  },
  {
    id: 'glasgow-club-maryhill',
    name: 'Glasgow Club Maryhill',
    location: 'Glasgow (Maryhill)',
    lat: 55.8934,
    lng: -4.2934,
    color: '#DC2626',
    hours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { closed: true }
    }
  },
  {
    id: 'glasgow-club-milton',
    name: 'Glasgow Club Milton',
    location: 'Glasgow (Milton)',
    lat: 55.9123,
    lng: -4.2567,
    color: '#2563EB',
    hours: {
      weekday: { open: '07:00', close: '21:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '09:00', close: '17:00' }
    }
  },
  {
    id: 'glasgow-club-pollok',
    name: 'Glasgow Club Pollok',
    location: 'Glasgow (Pollok)',
    lat: 55.8234,
    lng: -4.3234,
    color: '#DB2777',
    hours: {
      weekday: { open: '06:30', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '18:00' }
    }
  },
  {
    id: 'glasgow-club-shettleston',
    name: 'Glasgow Club Shettleston',
    location: 'Glasgow (Shettleston)',
    lat: 55.8534,
    lng: -4.1789,
    color: '#0891B2',
    hours: {
      weekday: { open: '07:00', close: '21:30' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '09:00', close: '17:00' }
    }
  },
  {
    id: 'the-peak-stirling',
    name: 'The PEAK',
    location: 'Stirling Sports Village',
    lat: 56.1123,
    lng: -3.9234,
    city: 'Stirling',
    address: 'Forthside Way, Stirling FK7 7QA',
    color: '#16A34A',
    poolSize: '25m',
    lanes: 6,
    notes: 'Book up to 7 days in advance via Active Stirling app. 6-lane 25m main pool.',
    hours: {
      weekday: { open: '06:00', close: '22:00' },
      saturday: { open: '07:00', close: '20:00' },
      sunday: { open: '07:00', close: '20:00' }
    }
  },
  {
    id: 'zwembad-de-zijl',
    name: 'Zwembad De Zijl',
    location: 'Leiden, Netherlands',
    lat: 52.1734,
    lng: 4.4589,
    city: 'Leiden',
    country: 'NL',
    address: 'Paramaribostraat 66, 2315 VK Leiden',
    color: '#FF6B35',
    poolSize: '25m',
    notes: 'Indoor and outdoor pools. Triathlon training available. Main pool open year round.',
    hours: {
      weekday: { open: '07:00', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '18:00' }
    }
  },
  {
    id: 'combibad-de-vliet',
    name: 'Combibad De Vliet',
    location: 'Leiden, Netherlands',
    lat: 52.1823,
    lng: 4.4234,
    city: 'Leiden',
    country: 'NL',
    address: 'Voorschoterweg 6, Leiden',
    color: '#0EA5E9',
    poolSize: '50m',
    notes: 'Outdoor 50m pool open May to October. One of the longest pools in the Leiden area.',
    seasonal: true,
    seasonOpen: '05-01',
    seasonClose: '10-31',
    hours: {
      weekday: { open: '07:00', close: '20:00' },
      saturday: { open: '09:00', close: '17:30' },
      sunday: { open: '09:00', close: '17:30' }
    }
  },
];

const LANES = [
  { id: 'fast', label: 'Fast Lane', icon: '🏃', color: 'bg-red-100 border-red-300 text-red-800' },
  { id: 'medium', label: 'Medium Lane', icon: '🚶', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { id: 'slow', label: 'Slow Lane', icon: '🐢', color: 'bg-green-100 border-green-300 text-green-800' },
];

const BUSYNESS_LEVELS = [
  { value: 1, label: 'Empty', color: 'bg-green-500', emoji: '😊' },
  { value: 2, label: 'Quiet', color: 'bg-lime-500', emoji: '🙂' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-500', emoji: '😐' },
  { value: 4, label: 'Busy', color: 'bg-orange-500', emoji: '😬' },
  { value: 5, label: 'Packed', color: 'bg-red-500', emoji: '😰' },
];

export default function PoolBusynessTracker() {
  const appLogo = './assets/poolpulse_app_icon_color.svg';
  const [poolData, setPoolData] = useState({});
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedPool, setSelectedPool] = useState(null);
  const [selectedLane, setSelectedLane] = useState(null);
  const [selectedBusyness, setSelectedBusyness] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingPool, setViewingPool] = useState(null);
  const [showHomepage, setShowHomepage] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSignInTooltip, setShowSignInTooltip] = useState(false);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pool:')) {
          keys.push(key);
        }
      }
      
      if (keys.length > 0) {
        const data = {};
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value) {
            const poolId = key.replace('pool:', '');
            data[poolId] = JSON.parse(value);
          }
        }
        setPoolData(data);
      }
    } catch (error) {
      console.log('No existing data, starting fresh');
    } finally {
      setLoading(false);
    }
  };

  const savePoolUpdate = async (poolId, lane, busynessLevel) => {
    const timestamp = new Date().toISOString();
    
    // Basic spam protection: Check last check-in time for this device
    const lastCheckInKey = 'lastCheckIn';
    const lastCheckIn = localStorage.getItem(lastCheckInKey);
    
    if (lastCheckIn) {
      const timeSinceLastCheckIn = Date.now() - parseInt(lastCheckIn);
      const oneHour = 60 * 60 * 1000;
      
      if (timeSinceLastCheckIn < oneHour) {
        const minutesLeft = Math.ceil((oneHour - timeSinceLastCheckIn) / 60000);
        alert(`Please wait ${minutesLeft} minutes before checking in again. This helps prevent spam and keeps the data accurate for everyone.`);
        return;
      }
    }
    
    // Get existing pool data or create new
    const existingData = poolData[poolId] || { lanes: {}, totalUpdates: 0 };
    
    // Update lane data - just track check-ins and timestamp
    const updatedLanes = {
      ...existingData.lanes,
      [lane]: {
        lastUpdate: timestamp,
        checkInCount: (existingData.lanes[lane]?.checkInCount || 0) + 1,
      }
    };

    const update = {
      lanes: updatedLanes,
      totalUpdates: existingData.totalUpdates + 1,
      lastUpdate: timestamp,
    };

    try {
      localStorage.setItem(`pool:${poolId}`, JSON.stringify(update));
      setPoolData(prev => ({ ...prev, [poolId]: update }));
      
      // Record this check-in time
      localStorage.setItem(lastCheckInKey, Date.now().toString());
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setSelectedPool(null);
      setSelectedLane(null);
      setSelectedBusyness(null);
    } catch (error) {
      console.error('Error saving update:', error);
      alert('Failed to save update. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (selectedPool && selectedLane) {
      // Just record the check-in without busyness level
      savePoolUpdate(selectedPool, selectedLane, null);
    }
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'No data yet';
    const now = new Date();
    const then = new Date(timestamp);
    const minutes = Math.floor((now - then) / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getBusynessInfo = (level) => {
    return BUSYNESS_LEVELS.find(b => b.value === level) || BUSYNESS_LEVELS[0];
  };

  const getPoolCity = (pool) => {
    if (pool.city) return pool.city;

    const location = pool.location?.toLowerCase() || '';
    if (location.includes('glasgow')) return 'Glasgow';
    if (pool.id === 'the-peak-stirling' || location.includes('stirling')) return 'Stirling';
    return 'Edinburgh';
  };

  const getPoolCityLabel = (pool) => {
    const city = getPoolCity(pool);
    return city === 'Leiden' ? `${city} 🇳🇱` : city;
  };

  const getRegionForPool = (pool) => {
    const city = getPoolCity(pool).toLowerCase();

    if (city === 'leiden') return 'The Netherlands';
    return 'Scotland';
  };

  const filteredPools = POOLS.filter((pool) => (
    selectedRegion === 'All' ? true : getRegionForPool(pool) === selectedRegion
  ));

  useEffect(() => {
    if (selectedPool && !filteredPools.some(pool => pool.id === selectedPool)) {
      setSelectedPool(null);
      setSelectedLane(null);
    }
  }, [selectedRegion, selectedPool, filteredPools]);

  useEffect(() => {
    if (showHomepage) return;
    if (!mapContainerRef.current || leafletMapRef.current || !window.L) return;

    const map = window.L.map(mapContainerRef.current).setView([56.5, -4.0], 6);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    setTimeout(() => map.invalidateSize(), 0);

    leafletMapRef.current = map;

    return () => {
      leafletMarkersRef.current.forEach((marker) => marker.remove());
      leafletMarkersRef.current = [];
      map.remove();
      leafletMapRef.current = null;
    };
  }, [showHomepage]);

  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;

    leafletMarkersRef.current.forEach((marker) => marker.remove());
    leafletMarkersRef.current = [];

    const map = leafletMapRef.current;
    const poolsWithCoords = filteredPools.filter((pool) => typeof pool.lat === 'number' && typeof pool.lng === 'number');
    const markers = poolsWithCoords.map((pool) => {
      const isOpen = isPoolOpen(pool);
      const city = getPoolCity(pool);
      const marker = window.L.marker([pool.lat, pool.lng], {
        icon: window.L.divIcon({
          className: '',
          html: '<span style=\"display:block;width:18px;height:18px;border-radius:9999px;background:#4ecdc4;border:3px solid #0f766e;box-shadow:0 2px 6px rgba(0,0,0,0.35);\"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      });

      const popupContainer = document.createElement('div');
      popupContainer.className = 'min-w-[200px]';
      popupContainer.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px;">${pool.name}</div>
        <div style="font-size:13px;color:#4b5563;margin-bottom:6px;">${city}</div>
        <div style="font-size:12px;font-weight:700;margin-bottom:10px;color:${isOpen ? '#15803d' : '#b91c1c'};">
          ${isOpen ? 'OPEN' : 'CLOSED'}
        </div>
      `;
      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.textContent = 'View pool';
      viewButton.className = 'px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-600 text-white hover:bg-teal-700';
      viewButton.onclick = () => {
        setViewingPool(pool.id);
        map.closePopup();
      };
      popupContainer.appendChild(viewButton);
      marker.bindPopup(popupContainer);
      marker.addTo(map);
      return marker;
    });

    leafletMarkersRef.current = markers;
  }, [filteredPools]);

  const getPoolStatus = (poolId) => {
    const data = poolData[poolId];
    if (!data || !data.lanes) return null;
    
    const lanes = Object.keys(data.lanes);
    if (lanes.length === 0) return null;
    
    return data;
  };

  const getHoursForDay = (pool, day) => {
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const specific = pool.hours[dayKeys[day]];
    if (specific) return specific;
    if (day === 0) return pool.hours.sunday;
    if (day === 6) return pool.hours.saturday;
    return pool.hours.weekday;
  };

  const isPoolOpen = (pool) => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const hours = getHoursForDay(pool, day);

    if (!hours || hours.closed) return false;

    // Check for Wednesday morning closure at Royal Commonwealth
    if (day === 3 && pool.hours.wednesdayClosed) {
      if (currentTime >= pool.hours.wednesdayClosed.start &&
          currentTime < pool.hours.wednesdayClosed.end) {
        return false;
      }
    }

    return currentTime >= hours.open && currentTime < hours.close;
  };

  const getOpeningHoursText = (pool) => {
    const now = new Date();
    const day = now.getDay();
    const hours = getHoursForDay(pool, day);

    if (!hours || hours.closed) return 'Closed today';
    return `${hours.open} - ${hours.close}`;
  };

  const getLaneBusyness = (checkInCount) => {
    if (!checkInCount || checkInCount === 0) {
      return { label: 'Empty', color: '#10B981', emoji: '😊', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    } else if (checkInCount <= 2) {
      return { label: 'Quiet', color: '#84CC16', emoji: '🙂', bgColor: 'bg-lime-100', textColor: 'text-lime-800' };
    } else if (checkInCount <= 4) {
      return { label: 'Moderate', color: '#F59E0B', emoji: '😐', bgColor: 'bg-amber-100', textColor: 'text-amber-800' };
    } else if (checkInCount <= 6) {
      return { label: 'Busy', color: '#F97316', emoji: '😬', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
    } else {
      return { label: 'Very Busy', color: '#EF4444', emoji: '😰', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    }
  };

  // Privacy Policy View
  if (showPrivacyPolicy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <button 
              onClick={() => {
                setShowPrivacyPolicy(false);
                setShowHomepage(true);
              }}
              className="flex items-center gap-2 text-teal-100 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <p className="text-gray-600 mb-6">Last updated: February 16, 2026</p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Privacy</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Pool Pulse is built on trust, not surveillance. I created this app to help swimmers make better decisions 
              about when to visit the pool - not to collect data about them. Here's exactly what I do and don't collect.
            </p>

            <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg text-teal-900 mb-2">🔒 No Login Required</h3>
              <p className="text-teal-800 leading-relaxed">
                Pool Pulse doesn't require accounts, emails, or passwords. You can check in completely anonymously. 
                If spam becomes an issue, we may add optional verification in the future - but it will always be optional.
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3">What I Collect</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              When you check in at a pool, I only collect:
            </p>
            <ul className="list-disc ml-6 mb-6 text-gray-700 space-y-2">
              <li>Which pool you're at</li>
              <li>Which lane you selected (Fast, Medium, or Slow)</li>
              <li>The time you checked in</li>
            </ul>
            <p className="text-gray-700 mb-6 leading-relaxed">
              That's it. No names, no email addresses, no phone numbers, no IP addresses, no location tracking. 
              I literally cannot identify who you are.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">What I Don't Collect</h2>
            <ul className="list-disc ml-6 mb-6 text-gray-700 space-y-2">
              <li>Personal information of any kind</li>
              <li>Email addresses or contact details</li>
              <li>Your precise location (GPS data)</li>
              <li>Device identifiers or fingerprints</li>
              <li>Browsing history or cookies (beyond basic session management)</li>
              <li>Payment information (this is a free service)</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-3">How I Use the Data</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              The check-in data is used for one purpose only: showing other swimmers how busy each lane is. 
              That's the whole point of this app. I don't sell it, I don't share it with third parties, 
              and I don't use it for advertising or marketing.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Data Storage</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Check-in data is stored locally in your browser using localStorage. This means the data stays on your device 
              and isn't sent to any central server. When you check in, the count updates for everyone viewing the app, 
              but no personal information is transmitted.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Rights</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Since I don't collect personal information, there's nothing to request, delete, or export. 
              You're completely anonymous when using Pool Pulse.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Children's Privacy</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Pool Pulse is safe for all ages. Since I don't collect any personal information, 
              there's no risk to children's privacy when using this app.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to This Policy</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              If I ever need to change this privacy policy (for example, if I add new features), 
              I'll update this page and note the date at the top. I'll never start collecting personal 
              data without making it very clear and giving you a choice.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Questions?</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about privacy or how Pool Pulse works, email me at{' '}
              <a href="mailto:snehasindhu2109@gmail.com" className="text-teal-600 hover:text-teal-700 underline">
                snehasindhu2109@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Terms of Service View
  if (showTerms) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <button 
              onClick={() => {
                setShowTerms(false);
                setShowHomepage(true);
              }}
              className="flex items-center gap-2 text-teal-100 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <p className="text-gray-600 mb-6">Last updated: February 16, 2026</p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Pool Pulse</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Pool Pulse is a free community tool I built to help swimmers in Edinburgh find quieter times to swim. 
              By using this app, you agree to these simple terms.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">What Pool Pulse Is</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Pool Pulse shows you how busy different lanes are at Edinburgh Leisure pools based on anonymous 
              check-ins from other swimmers. It's a community-powered tool - the more people check in, 
              the more useful it becomes.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">What Pool Pulse Isn't</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Pool Pulse is NOT:
            </p>
            <ul className="list-disc ml-6 mb-6 text-gray-700 space-y-2">
              <li>An official Edinburgh Leisure service</li>
              <li>A booking or reservation system</li>
              <li>A guarantee of lane availability</li>
              <li>Real-time capacity monitoring (it's based on check-ins from swimmers)</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Using the App</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Pool Pulse is completely free to use. You don't need to create an account. You can check pool 
              busyness anytime and check in when you arrive at a pool. Please check in honestly - 
              the whole system works on trust.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Accuracy of Information</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              I do my best to keep opening hours and pool information accurate, but things change. 
              Always check with Edinburgh Leisure directly for the most current information about pool schedules, 
              closures, or special events. The busyness data is based on user check-ins and may not reflect 
              actual current conditions.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">No Warranty</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Pool Pulse is provided "as is" without any guarantees. I built this to help swimmers like myself, 
              but I can't promise it will always be available or 100% accurate. Use it as a helpful guide, 
              not as gospel truth.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Respectful Use</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Please use Pool Pulse responsibly. Don't try to hack it, spam it with fake check-ins, 
              or use it in ways that would harm other swimmers or the swimming community. Be a good neighbour.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes and Availability</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              I might add new features, change how things work, or (though I hope not) need to shut down Pool Pulse. 
              I'll do my best to give notice if big changes are coming, but this is a free community project, 
              so I can't make any promises about long-term availability.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Liability</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              I'm not responsible if you show up to a pool and it's busier than Pool Pulse suggested, 
              or if the pool is closed, or if anything else goes wrong. This is a helpful community tool, 
              not a binding contract. Swimming is still your own decision and your own risk.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Questions or Problems?</h2>
            <p className="text-gray-700 leading-relaxed">
              If something's not working right or you have questions, email me at{' '}
              <a href="mailto:snehasindhu2109@gmail.com" className="text-teal-600 hover:text-teal-700 underline">
                snehasindhu2109@gmail.com
              </a>
              {'. '}
              I'll do my best to help!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Homepage View
  if (showHomepage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-3xl border-2 border-white/30 shadow-2xl">
                  <img
                    src={appLogo}
                    alt="Pool Pulse"
                    className="w-14 h-14 object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-1">Pool Pulse</h1>
                <p className="text-teal-100 text-sm font-medium">UK & EU</p>
              </div>
            </div>
            <p className="text-center text-teal-50 text-lg max-w-2xl mx-auto">
              Know before you go - See how busy your local pool is.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Never waste a walk to a crowded pool again
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real-time lane busyness for pools across the UK and Europe — powered by anonymous community check-ins.
              </p>
            </div>

            {/* How It Works */}
            <div className="bg-[#edf8f6] border border-[#4ecdc4] rounded-xl p-5 mb-8">
              <h3 className="text-xl font-bold text-[#1a4a47] mb-4">How it works</h3>
              <div className="space-y-3 text-sm sm:text-base text-[#1a4a47]">
                <p>🏊 <span className="font-semibold">Check the pool</span> — See real-time lane busyness before you leave</p>
                <p>✅ <span className="font-semibold">Check in when you arrive</span> — Takes 2 seconds, no account needed, fully anonymous</p>
                <p>📊 <span className="font-semibold">Track your swimming</span> — Optional: sign in to log sessions and personal stats</p>
              </div>
              <p className="mt-4 text-sm text-teal-800">
                Check-ins are anonymous and never linked to your account. Sign in is optional and only needed for your personal dashboard.
              </p>
            </div>

            <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowHomepage(false)}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold px-10 py-4 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg text-lg"
              >
                View All Pools
              </button>
              <div className="relative flex items-center gap-2">
                <button
                  className="bg-white border border-[#4ecdc4] text-[#1a4a47] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#edf8f6] transition-colors shadow-sm text-sm"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  aria-label="Why sign in?"
                  onClick={() => setShowSignInTooltip((prev) => !prev)}
                  onMouseEnter={() => setShowSignInTooltip(true)}
                  onMouseLeave={() => setShowSignInTooltip(false)}
                  className="text-[#1a4a47] hover:text-teal-700 transition-colors"
                >
                  <CircleHelp className="w-5 h-5" />
                </button>
                {showSignInTooltip && (
                  <div className="absolute z-20 top-full right-0 mt-2 w-72 sm:w-80 text-left bg-white border border-[#4ecdc4] rounded-lg shadow-lg p-3 text-sm text-gray-700">
                    Signing in is optional. You can check pool busyness and contribute check-ins without an account. Sign in only to access your personal dashboard.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>🔒 Your check-ins are anonymous • No personal data collected • No accounts required</p>
            <p className="mt-2">
              Made with 💙 by Sneha for the Edinburgh swimming community • 
              <a href="mailto:snehasindhu2109@gmail.com" className="text-teal-600 hover:text-teal-700 underline ml-1">
                Contact me
              </a>
            </p>
            <p className="mt-2">
              <button 
                onClick={() => {
                  setShowHomepage(false);
                  setShowPrivacyPolicy(true);
                }} 
                className="text-gray-500 hover:text-gray-700 underline mr-3"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => {
                  setShowHomepage(false);
                  setShowTerms(true);
                }} 
                className="text-gray-500 hover:text-gray-700 underline"
              >
                Terms of Service
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <Waves className="w-16 h-16 text-teal-500 animate-pulse" />
            <Droplets className="w-8 h-8 text-cyan-500 animate-bounce absolute top-0 right-0" />
          </div>
          <p className="text-gray-600 mt-4">Loading pool data...</p>
        </div>
      </div>
    );
  }

  // Pool Detail View
  if (viewingPool) {
    const pool = POOLS.find(p => p.id === viewingPool);
    if (!pool) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 pb-20">
          <div className="bg-[#043A3D] text-white shadow-lg">
            <div className="max-w-2xl mx-auto px-4 py-6">
              <button
                onClick={() => setViewingPool(null)}
                className="flex items-center gap-2 text-teal-100 hover:text-white mb-3 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to all pools
              </button>
              <h1 className="text-2xl font-bold">Pool details unavailable</h1>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-700">
                We couldn't find that pool. Please go back and select a pool again.
              </p>
            </div>
          </div>
        </div>
      );
    }
    const poolStatus = getPoolStatus(viewingPool);
    const isOpen = isPoolOpen(pool);
    const hoursText = getOpeningHoursText(pool);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 pb-20">
        {/* Header */}
        <div 
          className="text-white shadow-lg"
          style={{ background: `linear-gradient(to right, ${pool.color}, ${pool.color}dd)` }}
        >
          <div className="max-w-2xl mx-auto px-4 py-4">
            <button 
              onClick={() => setViewingPool(null)}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to all pools
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-2xl border-2 border-white/30">
                  <Waves className="w-7 h-7" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{pool.name}</h1>
                  {isOpen ? (
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                      OPEN NOW
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      CLOSED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-white/90 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{pool.location}</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Today: {hoursText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {poolStatus ? (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Current Lane Status</h2>
                </div>
                
                <div className="space-y-4">
                  {LANES.map(lane => {
                    const laneData = poolStatus.lanes[lane.id];
                    const busyness = getLaneBusyness(laneData?.checkInCount || 0);
                    
                    return (
                      <div key={lane.id} className={`border-2 rounded-lg p-4 ${lane.color}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{lane.icon}</span>
                            <h3 className="font-bold text-lg">{lane.label}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`${busyness.bgColor} ${busyness.textColor} px-4 py-2 rounded-lg font-bold text-base flex items-center gap-2`}
                            >
                              <span>{busyness.emoji}</span>
                              <span>{busyness.label}</span>
                            </div>
                            {laneData && laneData.checkInCount > 0 && (
                              <div 
                                className="text-white px-3 py-2 rounded-lg font-bold text-sm"
                                style={{ backgroundColor: pool.color }}
                              >
                                {laneData.checkInCount} {laneData.checkInCount === 1 ? 'swimmer' : 'swimmers'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {laneData && laneData.checkInCount > 0 ? (
                          <div className="flex items-center gap-4 text-sm mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Last check-in {getTimeSince(laneData.lastUpdate)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm italic opacity-70">No swimmers checked in yet</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Last updated {getTimeSince(poolStatus.lastUpdate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{poolStatus.totalUpdates} total check-ins</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Check-Ins Yet</h3>
              <p className="text-gray-600">Be the first to check in at this pool!</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setSelectedPool(viewingPool);
                setViewingPool(null);
              }}
              className="text-white font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-all shadow-md"
              style={{ backgroundColor: pool.color }}
            >
              Check In At This Pool
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Pool List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button 
            onClick={() => setShowHomepage(true)}
            className="flex items-center gap-2 text-teal-100 hover:text-white mb-3 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-lg"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-2xl border-2 border-white/30 shadow-xl">
                <img
                  src={appLogo}
                  alt="Pool Pulse"
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pool Pulse</h1>
              <p className="text-teal-100 text-xs font-medium">{selectedRegion}</p>
            </div>
          </div>
          <p className="text-teal-50 text-sm">Real-time lane busyness for pools in {selectedRegion}</p>
        </div>
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-teal-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          ✓ Checked in! Have a great swim
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Pool Map */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-4">
          <div ref={mapContainerRef} className="w-full h-[60vh] min-h-[360px]" />
        </div>

        {/* Marker Filter */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Show markers</p>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            {['All', 'Scotland', 'The Netherlands'].map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedRegion === region
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Update Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 sticky bottom-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl p-1.5">
              <img
                src={appLogo}
                alt="Pool Pulse"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Check In</h2>
          </div>
          
          {/* Pool Selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Which pool are you at?</label>
            <select
              value={selectedPool || ''}
              onChange={(e) => setSelectedPool(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
            >
              <option value="">Select a pool...</option>
              {filteredPools.map(pool => (
                <option key={pool.id} value={pool.id}>{pool.name}</option>
              ))}
            </select>
          </div>

          {/* Lane Selection */}
          {selectedPool && (
            <div className="mb-4 animate-fadeIn">
              <label className="block text-sm font-semibold text-gray-700 mb-3">What lane are you swimming in?</label>
              <div className="grid grid-cols-3 gap-3">
                {LANES.map(lane => (
                  <button
                    key={lane.id}
                    onClick={() => setSelectedLane(lane.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedLane === lane.id
                        ? 'border-teal-500 bg-teal-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{lane.icon}</div>
                    <div className="font-semibold text-sm text-gray-900">{lane.label.replace(' Lane', '')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedPool && selectedLane && (
            <div className="mt-4 space-y-3">
              <div className="bg-[#edf8f6] border border-[#4ecdc4] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#1a4a47]">
                🔒 Check-ins are always anonymous — no account needed, ever.
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md"
              >
                I'm Swimming Here Now
              </button>
            </div>
          )}

          {!selectedPool && (
            <p className="text-center text-gray-500 text-sm">
              Select a pool to get started
            </p>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Community-powered lane tracking for swimmers in Scotland and The Netherlands</p>
          <p className="mt-1">Check in when you arrive • See how many swimmers are in each lane</p>
        </div>
      </div>
    </div>
  );
}
