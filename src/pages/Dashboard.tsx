import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, logout } from '../firebase';
import { Scanner } from '../components/Scanner';
import { fetchRecordMetadata } from '../services/metadata';
import { Camera, LogOut, Disc3, Share2, Trash2, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface RecordItem {
  id: string;
  barcode: string;
  title: string;
  artist: string;
  category: string;
  spotifyUrl: string;
  coverUrl: string;
  createdAt: any;
}

export function Dashboard() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'records'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: RecordItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as RecordItem);
      });
      // Sort client-side for simplicity in MVP
      items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRecords(items);
    });

    return () => unsubscribe();
  }, [user]);

  const handleScan = async (barcode: string) => {
    setIsScanning(false);
    setIsProcessing(true);

    try {
      const metadata = await fetchRecordMetadata(barcode);
      if (metadata && user) {
        const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(metadata.artist + ' ' + metadata.title)}`;
        
        await addDoc(collection(db, 'records'), {
          ownerId: user.uid,
          barcode,
          title: metadata.title,
          artist: metadata.artist,
          category: metadata.category,
          spotifyUrl,
          coverUrl: metadata.coverUrl,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to add record:', error);
      alert('Failed to process barcode.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this record?')) {
      await deleteDoc(doc(db, 'records', id));
    }
  };

  const categories = Array.from(new Set(records.map(r => r.category))).filter(Boolean);

  const filteredRecords = records.filter(r => {
    const matchesSearch = (r.title + r.artist).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? r.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc3 className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">My Vinyls</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={`/collection/${user?.uid}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Public Link</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === null
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isProcessing && (
          <div className="mb-8 rounded-xl bg-indigo-50 p-4 text-center text-indigo-700 animate-pulse">
            Processing scanned barcode... Fetching album details...
          </div>
        )}

        {filteredRecords.length === 0 && !isProcessing ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
            <Disc3 className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || selectedCategory
                ? "Try adjusting your filters."
                : "Start building your collection by scanning a barcode."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredRecords.map((record) => (
              <div key={record.id} className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md">
                <div className="aspect-square w-full overflow-hidden bg-gray-100">
                  <img
                    src={record.coverUrl}
                    alt={record.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="line-clamp-1 font-semibold text-gray-900" title={record.title}>
                    {record.title}
                  </h3>
                  <p className="line-clamp-1 text-sm text-gray-500" title={record.artist}>
                    {record.artist}
                  </p>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {record.category}
                    </span>
                    <a
                      href={record.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                      title="Listen on Spotify"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-red-600 opacity-0 backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Camera className="h-5 w-5" />
          Scan Record
        </button>
      </div>

      {isScanning && (
        <Scanner
          onScan={handleScan}
          onClose={() => setIsScanning(false)}
        />
      )}
    </div>
  );
}
