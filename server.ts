import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get('/api/lookup', async (req, res) => {
    const barcode = req.query.barcode as string;
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    try {
      // 1. Try Discogs API if token is configured
      const discogsToken = process.env.DISCOGS_TOKEN;
      if (discogsToken) {
        const discogsUrl = `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcode)}&type=release`;
        const discogsRes = await fetch(discogsUrl, {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScannerMVP/1.0'
          }
        });
        
        if (discogsRes.ok) {
          const data = await discogsRes.json();
          if (data.results && data.results.length > 0) {
            const release = data.results[0];
            
            // Discogs title is usually formatted as "Artist - Title"
            let artist = 'Unknown Artist';
            let title = release.title;
            if (title.includes(' - ')) {
              const parts = title.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ').trim();
            }
            
            return res.json({
              title,
              artist,
              category: release.genre?.[0] || release.style?.[0] || 'Vinyl',
              coverUrl: release.cover_image || `https://picsum.photos/seed/${encodeURIComponent(title)}/400/400`
            });
          }
        }
      }

      // 2. Fallback to Gemini AI if Discogs fails or is not configured
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I scanned a barcode from a vinyl record: ${barcode}. 
Please provide the album title, artist, a musical category/genre, and a placeholder cover URL (you can use https://picsum.photos/seed/{album_name}/400/400).
If you don't know the exact barcode, make a highly educated guess or return a generic placeholder for a vinyl record.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              category: { type: Type.STRING },
              coverUrl: { type: Type.STRING },
            },
            required: ['title', 'artist', 'category', 'coverUrl'],
          },
        },
      });

      const text = response.text;
      if (text) {
        return res.json(JSON.parse(text));
      }
      
      res.status(404).json({ error: 'Not found' });
    } catch (error) {
      console.error('Lookup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
