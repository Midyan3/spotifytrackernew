import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Calendar.css';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  { name: 'January', days: 31 }, { name: 'February', days: 28 },
  { name: 'March', days: 31 }, { name: 'April', days: 30 },
  { name: 'May', days: 31 }, { name: 'June', days: 30 },
  { name: 'July', days: 31 }, { name: 'August', days: 31 },
  { name: 'September', days: 30 }, { name: 'October', days: 31 },
  { name: 'November', days: 30 }, { name: 'December', days: 31 }
];

const SpotifyCalendar = ({ spotifyToken }) => {
  const [musicData, setMusicData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearStats, setYearStats] = useState({});

  const availableYears = [2022, 2023, 2024];
  const USER_ID = process.env.REACT_APP_SPOTIFY_USER_ID;

  const fetchSpotifyData = useCallback(async () => {
    try {
      setLoading(true);
      
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/users/${USER_ID}/playlists?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        }
      );

      if (!playlistResponse.ok) {
        throw new Error('Failed to fetch playlists');
      }

      const playlistsData = await playlistResponse.json();
      const processedData = {};
      const stats = {};

      availableYears.forEach(year => {
        stats[year] = {
          totalTracks: 0,
          totalMinutes: 0,
          uniqueArtists: new Set()
        };
      });

      for (const playlist of playlistsData.items) {
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          {
            headers: {
              'Authorization': `Bearer ${spotifyToken}`
            }
          }
        );

        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          tracksData.items.forEach(item => {
            if (!item.track) return;

            const date = new Date(item.added_at);
            const year = date.getFullYear();
            if (!availableYears.includes(year)) return;

            const dateKey = formatDateKey(date);
            if (!processedData[dateKey]) {
              processedData[dateKey] = {
                date,
                count: 0,
                tracks: {},
                totalDuration: 0,
                artists: new Set()
              };
            }

            const track = item.track;
            processedData[dateKey].count++;
            processedData[dateKey].totalDuration += track.duration_ms;
            processedData[dateKey].artists.add(track.artists[0].id);

            const trackKey = `${track.name} - ${track.artists[0].name}`;
            processedData[dateKey].tracks[trackKey] = 
              (processedData[dateKey].tracks[trackKey] || 0) + 1;

            stats[year].totalTracks++;
            stats[year].totalMinutes += track.duration_ms / (1000 * 60);
            track.artists.forEach(artist => stats[year].uniqueArtists.add(artist.id));
          });
        }
      }

      setMusicData(processedData);
      setYearStats(stats);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [spotifyToken]);

  useEffect(() => {
    fetchSpotifyData();
  }, [fetchSpotifyData]);

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const getMonthData = useCallback((monthIndex) => {
    const year = selectedYear;
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = monthIndex === 1 && isLeapYear ? 29 : MONTHS[monthIndex].days;
    
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const days = Array(firstDay).fill(null).map((_, i) => ({
      key: `empty-${monthIndex}-${i}`,
      isEmpty: true
    }));

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dateKey = formatDateKey(date);
      days.push({
        key: `day-${monthIndex}-${day}`,
        date,
        dayOfMonth: day,
        data: musicData[dateKey],
        isEmpty: false
      });
    }

    return days;
  }, [selectedYear, musicData]);

  const getActivityColor = useCallback((data) => {
    if (!data) return 'transparent';
    const maxPlays = Math.max(
      ...Object.values(musicData).map(d => d.count || 0),
      10
    );
    const intensity = Math.min(data.count / maxPlays, 1);
    return `rgba(29, 185, 84, ${0.2 + intensity * 0.8})`;
  }, [musicData]);

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="loading-spinner"></div>
        <p>Loading midyan's music history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-error">
        <p>Error: {error}</p>
        <button onClick={fetchSpotifyData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="year-selector">
        {availableYears.map(year => (
          <button
            key={year}
            className={`year-button ${selectedYear === year ? 'active' : ''}`}
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="year-stats">
        {yearStats[selectedYear] && (
          <div className="summary-stats">
            <div className="stat">
              <span>{yearStats[selectedYear].totalTracks.toLocaleString()}</span>
              <label>Tracks Played</label>
            </div>
            <div className="stat">
              <span>{Math.round(yearStats[selectedYear].totalMinutes).toLocaleString()}</span>
              <label>Minutes of Music</label>
            </div>
            <div className="stat">
              <span>{yearStats[selectedYear].uniqueArtists.size.toLocaleString()}</span>
              <label>Unique Artists</label>
            </div>
          </div>
        )}
      </div>

      <div className="months-grid">
        {MONTHS.map((month, index) => (
          <div key={`${month.name}-${selectedYear}`} className="month-container">
            <h3 className="month-title">{month.name}</h3>
            <div className="month-calendar">
              <div className="weekdays">
                {WEEKDAYS.map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              <div className="days">
                {getMonthData(index).map(day => (
                  <div
                    key={day.key}
                    className={`day ${day.isEmpty ? 'empty' : ''} ${day.data ? 'has-data' : ''}`}
                    style={day.data ? { backgroundColor: getActivityColor(day.data) } : {}}
                    onClick={() => !day.isEmpty && day.data && setSelectedDay(day.data)}
                  >
                    {!day.isEmpty && (
                      <>
                        <span className="day-number">{day.dayOfMonth}</span>
                        {day.data && (
                          <span className="play-count">{day.data.count}</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedDay && (
        <div className="day-details" onClick={() => setSelectedDay(null)}>
          <div className="details-content" onClick={e => e.stopPropagation()}>
            <button className="close-details" onClick={() => setSelectedDay(null)}>×</button>
            <h4>{selectedDay.date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</h4>
            
            <div className="details-stats">
              <div className="stat">
                <label>Tracks</label>
                <span>{selectedDay.count}</span>
              </div>
              <div className="stat">
                <label>Minutes</label>
                <span>{Math.round(selectedDay.totalDuration / 60000)}</span>
              </div>
              <div className="stat">
                <label>Artists</label>
                <span>{selectedDay.artists.size}</span>
              </div>
            </div>

            <div className="details-tracks">
              <h5>Top Tracks:</h5>
              {Object.entries(selectedDay.tracks)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([track, plays], index) => (
                  <div key={`${track}-${index}`} className="track-item">
                    <span className="track-name">{track}</span>
                    <span className="play-count">{plays} plays</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyCalendar;