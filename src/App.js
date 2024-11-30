import React, { useState, useEffect } from 'react';
import SpotifyCalendar from './components/SpotifyCalendar';
import './App.css';

function App() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
          },
          body: 'grant_type=client_credentials'
        });

        const data = await response.json();
        setToken(data.access_token);
        setIsLoading(false);
      } catch (error) {
        console.error('Error getting access token:', error);
        setIsLoading(false);
      }
    };

    getAccessToken();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 p-6">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-zinc-400">Loading midyan's music history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Spotify Music Tracker</h1>
        </header>
        <main>
          {token ? (
            <SpotifyCalendar spotifyToken={token} />
          ) : (
            <div className="text-center text-red-500">
              Failed to load Spotify data. Please check your credentials.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;