import React, { useState, useEffect } from 'react';
import { Plane, Search, Share, Activity, AlertCircle, RefreshCw, CloudSun, Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, Car, Coffee, Briefcase, Map, ExternalLink, Smartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FlightStatus } from './types';

export default function App() {
  const [flightNumber, setFlightNumber] = useState('');
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [flightData, setFlightData] = useState<FlightStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showWidgetPreview, setShowWidgetPreview] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; description: string; icon: string; city: string } | null>(null);

  useEffect(() => {
    if (!flightData?.destination) { setWeather(null); return; }
    fetch(`/api/weather/${flightData.destination}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setWeather(d); })
      .catch(() => {});
  }, [flightData?.destination]);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun': return <Sun className="w-6 h-6 text-yellow-400" />;
      case 'cloud': return <Cloud className="w-6 h-6 text-gray-400" />;
      case 'cloud-rain': return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'cloud-drizzle': return <CloudDrizzle className="w-6 h-6 text-blue-300" />;
      case 'cloud-snow': return <CloudSnow className="w-6 h-6 text-blue-200" />;
      case 'cloud-lightning': return <CloudLightning className="w-6 h-6 text-yellow-400" />;
      default: return <CloudSun className="w-6 h-6 text-yellow-500" />;
    }
  };
  
  const fetchFlightData = async (fNum: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/flights/${fNum.toUpperCase()}`);
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch flight data');
      }

      // AeroDataBox usually returns an array. We take the first one.
      const flight = Array.isArray(data) ? data[0] : data;
      
      if (!flight) {
        throw new Error('Flight not found for today.');
      }

      // Map AeroDataBox data to our internal model safely
      const rawDeparture = flight.departure?.actualTimeUtc || flight.departure?.scheduledTimeUtc || flight.departure?.actualTimeLocal || flight.departure?.scheduledTimeLocal;
      const rawArrival = flight.arrival?.actualTimeUtc || flight.arrival?.scheduledTimeUtc || flight.arrival?.actualTimeLocal || flight.arrival?.scheduledTimeLocal;
      
      const formatTime = (isoString?: string) => {
        if (!isoString) return 'TBA';
        const d = new Date(isoString);
        return isNaN(d.getTime()) ? 'TBA' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      const mappedStatus: FlightStatus = {
        flightNumber: flight.number || fNum.toUpperCase(),
        origin: flight.departure?.airport?.iata || 'N/A',
        destination: flight.arrival?.airport?.iata || 'N/A',
        departureTime: formatTime(rawDeparture),
        estimatedArrival: formatTime(rawArrival),
        status: flight.status || 'Scheduled',
        progress: calculateProgress(rawDeparture, rawArrival),
        gate: flight.departure?.gate || 'TBA',
        belt: flight.arrival?.baggageBelt || 'TBA'
      };

      setFlightData(mappedStatus);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'An error occurred fetching flight status.');
      setFlightData(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (depTime?: string, arrTime?: string): number => {
    if (!depTime || !arrTime) return 0;
    const dep = new Date(depTime).getTime();
    const arr = new Date(arrTime).getTime();
    const now = Date.now();
    
    if (isNaN(dep) || isNaN(arr) || arr <= dep) return 0;
    
    if (now < dep) return 0;
    if (now > arr) return 100;
    
    return Math.floor(((now - dep) / (arr - dep)) * 100);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (flightNumber.trim()) {
      setTrackingNumber(flightNumber.trim());
      fetchFlightData(flightNumber.trim());
    }
  };

  const handleShare = async () => {
    if (!flightData) return;
    const shareText = `Tracking Flight ${flightData.flightNumber}: ${flightData.status}. ETA: ${flightData.estimatedArrival}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Flight ${flightData.flightNumber}`,
          text: shareText,
        });
      } catch (err) {
        console.warn('Share rejected or error', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Flight status copied to clipboard!');
    }
  };

  // Real-time polling
  useEffect(() => {
    if (!trackingNumber) return;
    
    // Update every 2 minutes as requested in "Live tracking" requirements
    const interval = setInterval(() => {
      fetchFlightData(trackingNumber);
    }, 120000);

    return () => clearInterval(interval);
  }, [trackingNumber]);

  return (
    <div className="min-h-screen bg-[#0E1113] flex items-center justify-center p-4 sm:p-6 font-sans text-[#E1E3E4]">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header Search Area */}
        <header className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#A8C7FA] rounded-full flex items-center justify-center">
              <Plane className="w-6 h-6 text-[#062E6F]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">byAir</h1>
              <p className="text-sm text-[#8E9192]">Flight Tracker & Companion</p>
            </div>
          </div>
          {lastUpdated && (
            <div className="flex gap-2 hidden md:flex">
                <div className="bg-[#2D3135] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
          )}
        </header>

        <form onSubmit={handleTrackSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-[14px] h-5 w-5 text-[#8E9192]" />
            <Input 
              type="text" 
              placeholder="Flight number (Try: DEMO)" 
              className="pl-12 bg-[#1B1F22] border-white/5 text-white placeholder:text-[#8E9192] rounded-2xl h-12 text-base shadow-[0_4px_24px_rgba(0,0,0,0.1)] focus-visible:ring-1 focus-visible:ring-[#A8C7FA]"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={!flightNumber.trim() || loading} className="bg-[#A8C7FA] hover:bg-[#A8C7FA]/90 text-[#062E6F] rounded-2xl h-12 px-8 font-bold shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all">
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : 'Track'}
          </Button>
        </form>

        {/* Error States */}
        {error && (
          <div className="bg-[#2D3135] border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm flex gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Status Unavailable</p>
              <p className="text-red-300/70">{error}</p>
            </div>
          </div>
        )}

        {/* The Bento Grid Widget */}
        {flightData && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 auto-rows-[minmax(140px,auto)]">
            {/* Main Flight Card */}
            <div className="bg-[#1B1F22] rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] md:col-span-3 md:row-span-2 relative min-h-[320px]">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <span className="px-3 py-1 bg-[#2D3135] text-[#A8C7FA] rounded-full text-xs font-bold uppercase tracking-widest inline-block whitespace-nowrap">
                    {flightData.status} • {flightData.flightNumber}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold mt-4 text-white">
                    {flightData.origin} <span className="text-[#8E9192] text-2xl md:text-3xl font-light mx-2">to</span> {flightData.destination}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#8E9192] uppercase tracking-tighter mb-1">Arrival ETA</p>
                  <p className="text-3xl font-semibold text-white">{flightData.estimatedArrival}</p>
                </div>
              </div>
              
              <div className="mt-12 mb-6">
                <div className="flex justify-between text-sm mb-4 font-mono text-[#8E9192]">
                  <span>Dep: {flightData.departureTime}</span>
                  <span>{flightData.progress}% Complete</span>
                </div>
                <div className="relative h-[4px] bg-white/10 rounded-full">
                  <div className="absolute h-full bg-[#A8C7FA] rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${flightData.progress}%` }}></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 flex items-center justify-center transition-all duration-1000 ease-in-out drop-shadow-md z-10"
                    style={{ left: `${flightData.progress}%` }}
                  >
                    <Plane className="w-5 h-5 text-[#A8C7FA] rotate-90" fill="currentColor" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-[#8E9192] uppercase mb-1">Status</p>
                    <p className="text-xl font-medium text-white">{flightData.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#C4E7FF]">
                  <span className="w-2 h-2 bg-[#34A853] rounded-full animate-pulse shadow-[0_0_8px_#34A853]"></span>
                  <span className="text-sm font-medium">Live</span>
                </div>
              </div>
            </div>

            {/* Terminal & Gate Card */}
            <div className="bg-[#A8C7FA] text-[#062E6F] rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] md:col-span-1 md:row-span-1 min-h-[140px]">
              <div className="flex justify-between items-start">
                <p className="font-bold uppercase text-[10px] sm:text-xs opacity-70 tracking-widest">Terminal & Gate</p>
              </div>
              <div className="mt-4">
                <p className="text-4xl lg:text-5xl font-bold tracking-tight">{flightData.gate}</p>
                <p className="text-xs lg:text-sm font-semibold opacity-80 mt-1">Departure Gate</p>
              </div>
            </div>

            {/* Baggage Claim Card */}
            <div className="bg-[#2D3135] text-white rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] md:col-span-1 md:row-span-1 min-h-[140px]">
              <div className="flex justify-between items-start">
                <p className="font-bold uppercase text-[10px] sm:text-xs text-[#8E9192] tracking-widest">Baggage Claim</p>
                <p className="text-2xl opacity-80">🧳</p>
              </div>
              <div className="mt-4">
                <p className="text-4xl lg:text-5xl font-bold tracking-tight">{flightData.belt}</p>
                <p className="text-xs lg:text-sm text-[#8E9192] mt-1 font-medium">Arrival Belt</p>
              </div>
            </div>

            {/* Weather Card */}
            <div className="bg-[#1B1F22] rounded-[2rem] p-6 flex flex-col justify-between border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] md:col-span-1 md:row-span-1 min-h-[140px]">
              <div className="flex justify-between items-start">
                <p className="font-bold text-[10px] sm:text-xs text-[#8E9192] uppercase tracking-widest">Local Weather</p>
                {weather ? getWeatherIcon(weather.icon) : <CloudSun className="w-6 h-6 text-yellow-500" />}
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold text-white">{weather ? `${weather.temp}°F` : '–°F'}</p>
                <p className="text-sm text-[#8E9192] mt-1">{weather ? `${weather.city} • ${weather.description}` : flightData.destination}</p>
              </div>
            </div>

            {/* Ground Transport Card */}
            <div className="bg-[#1B1F22] rounded-[2rem] p-6 flex flex-col sm:flex-row gap-6 border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] md:col-span-2 md:row-span-1 min-h-[140px]">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[10px] sm:text-xs text-[#8E9192] uppercase tracking-widest">Ground Transport</p>
                  <h3 className="text-lg font-bold mt-2 text-white flex items-center gap-2">UBER / LYFT</h3>
                </div>
                <p className="text-xs text-[#8E9192] mt-2 leading-relaxed">Wait time: 4-6 mins<br/>Pick up: Level 2, Island 3</p>
              </div>
              <div className="flex-1 bg-[#2D3135] rounded-[1.5rem] p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8E9192] tracking-widest">Public Transit</p>
                  <p className="text-sm font-bold text-white mt-1">FlyAway Bus</p>
                </div>
                <p className="text-xs text-[#8E9192] mt-2">Next: {new Date(Date.now() + 15*60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>

            {/* Lounges Card */}
            <div className="bg-[#0E1113] border border-dashed border-[#2D3135] rounded-[2rem] overflow-hidden md:col-span-1 md:row-span-2 min-h-[300px]">
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[10px] sm:text-xs text-[#8E9192] uppercase tracking-widest mb-6">Lounges & Cafes</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2D3135] flex items-center justify-center text-white"><Coffee className="w-5 h-5" /></div>
                      <div>
                        <p className="text-sm font-semibold text-white">Centurion Lounge</p>
                        <p className="text-[11px] text-[#8E9192] mt-0.5">Gate B39 • 2 min walk</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2D3135] flex items-center justify-center text-white"><Briefcase className="w-5 h-5" /></div>
                      <div>
                        <p className="text-sm font-semibold text-white">Star Alliance</p>
                        <p className="text-[11px] text-[#8E9192] mt-0.5">Terminal 4 • 5 min walk</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-[#2D3135] hover:bg-[#383C40] text-white rounded-xl h-11 mt-6 border border-white/5 transition-colors font-semibold"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(flightData.origin + ' Airport Terminal')}`, '_blank', 'noopener')}
                >
                  Explore Indoor Map
                </Button>
              </div>
            </div>

            {/* Google Maps Card */}
            <div
              className="bg-gradient-to-br from-[#1B1F22] to-[#2D3135] rounded-[2rem] p-6 flex flex-col justify-between border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] md:col-span-1 md:row-span-1 min-h-[140px] relative overflow-hidden cursor-pointer group hover:border-[#A8C7FA]/30 transition-colors"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(flightData.origin + ' International Airport')}`, '_blank', 'noopener')}
            >
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Map className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10">
                <p className="font-bold text-[10px] sm:text-xs text-[#8E9192] uppercase tracking-widest">Navigation</p>
                <h3 className="text-xl font-bold mt-2 text-white flex items-center gap-2">Google Maps</h3>
                <p className="text-xs text-[#A8C7FA] mt-1 font-medium">Route to {flightData.origin}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mt-4 relative z-10">
                Open Map <ExternalLink className="w-4 h-4" />
              </div>
            </div>

            {/* Share Status Action */}
            <div 
              onClick={handleShare}
              className="bg-gradient-to-br from-[#1B1F22] to-[#0E1113] rounded-[2rem] p-6 lg:px-8 flex flex-row items-center justify-between border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] md:col-span-2 md:row-span-1 cursor-pointer hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all group min-h-[100px]"
            >
              <div className="flex items-center gap-5 text-white">
                <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-[#2D3135] group-hover:bg-[#383C40] transition-colors">
                  <Share className="w-6 h-6 text-[#A8C7FA]" />
                </div>
                <div>
                  <p className="font-bold text-lg md:text-xl text-[#E1E3E4]">Share Flight Status</p>
                  <p className="text-sm text-[#8E9192] mt-1">Send live tracking details to family or pickup drivers.</p>
                </div>
              </div>
              <Button variant="outline" className="hidden md:flex bg-transparent border-white/10 text-[#E1E3E4] hover:bg-white/5 hover:text-white rounded-xl h-11 px-6">
                Copy Link
              </Button>
            </div>
            
          </div>
          
          <div className="w-full flex justify-center mt-12 pb-8">
            <Button 
                variant="outline" 
                onClick={() => setShowWidgetPreview(!showWidgetPreview)}
                className="bg-[#1B1F22] border-white/10 text-[#E1E3E4] hover:bg-[#2D3135] hover:text-white rounded-2xl h-12 px-8 shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all font-semibold"
            >
                <Smartphone className="w-5 h-5 mr-3 text-[#A8C7FA]" />
                {showWidgetPreview ? 'Close Widget Preview' : 'Preview Android Widget'}
            </Button>
          </div>

          {showWidgetPreview && (
            <div className="w-full flex justify-center pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="relative w-full max-w-[400px] h-[540px] rounded-[3rem] p-4 bg-slate-900 border-[12px] border-black shadow-[0_0_50px_rgba(0,0,0,0.7)] flex flex-col justify-end overflow-hidden" 
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  
                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 w-full h-8 flex justify-between items-end px-6 text-white text-[11px] font-bold z-20">
                    <span className="drop-shadow-md">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <div className="flex gap-1.5 items-center pb-0.5 drop-shadow-md">
                        <span>5G</span>
                        <div className="w-4 h-2.5 border-2 border-white rounded-[4px] p-[1px] opacity-90"><div className="w-[80%] h-full bg-white rounded-sm"></div></div>
                    </div>
                  </div>

                  {/* Material You Widget Layer */}
                  <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] w-full mb-20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-white relative z-10 hover:bg-black/70 transition-all cursor-pointer group">
                     {/* Header */}
                     <div className="flex justify-between items-center mb-5">
                        <span className="font-bold text-sm tracking-wide text-white/90">{flightData.flightNumber}</span>
                        <span className="text-[#A8C7FA] font-bold text-[10px] uppercase tracking-widest bg-[#A8C7FA]/10 px-3 py-1.5 rounded-full">{flightData.status}</span>
                     </div>
                     
                     {/* Progress */}
                     <div className="h-3.5 w-full bg-black/40 rounded-full mb-5 relative overflow-hidden ring-1 ring-white/5">
                        <div className="absolute top-0 left-0 h-full bg-[#A8C7FA] rounded-full transition-all duration-1000" style={{ width: `${flightData.progress}%` }}></div>
                     </div>
                     
                     {/* Info Grid */}
                     <div className="flex justify-between items-end">
                        <div className="flex z-10 flex-col">
                          <p className="text-4xl font-black tracking-tighter drop-shadow-sm">{flightData.origin}</p>
                          <p className="text-[10px] text-[#A8C7FA] opacity-90 mt-1 uppercase font-bold tracking-wider relative -left-[1px]">Dep {flightData.departureTime}</p>
                        </div>
                        
                        <div className="flex gap-5 pb-1 relative z-10 bg-white/5 rounded-2xl px-4 py-2 border border-white/5 shadow-inner">
                          <div className="text-center">
                            <p className="text-[9px] uppercase text-white/50 font-bold tracking-widest mb-1">Gate</p>
                            <p className="font-black text-sm">{flightData.gate}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] uppercase text-white/50 font-bold tracking-widest mb-1">Belt</p>
                            <p className="font-black text-sm">{flightData.belt}</p>
                          </div>
                        </div>

                        <div className="text-right z-10 flex flex-col items-end">
                          <p className="text-4xl font-black tracking-tighter drop-shadow-sm">{flightData.destination}</p>
                          <p className="text-[10px] text-[#A8C7FA] opacity-90 mt-1 uppercase font-bold tracking-wider relative -right-[1px]">ETA {flightData.estimatedArrival}</p>
                        </div>
                     </div>
                  </div>

                  {/* Dock Mock */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] h-[80px] bg-white/20 backdrop-blur-3xl rounded-[2.5rem] flex justify-around items-center px-4 z-10 border border-white/10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-green-400 to-emerald-300 shadow-md"></div>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 shadow-md"></div>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-red-400 shadow-md"></div>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-md"></div>
                  </div>
               </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}


