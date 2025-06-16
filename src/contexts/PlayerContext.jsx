import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const PlayerContext = createContext(undefined);

const defaultPlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  queue: [],
  currentIndex: -1,
  shuffle: false,
  liked: false,
  source: null, // Track the source of the current queue
};

export function PlayerProvider({ children }) {
  const { user } = useAuth();
  const [playerState, setPlayerState] = useState(defaultPlayerState);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  
  const audioRef = useRef(null);
  const shuffledQueueRef = useRef([]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Event listeners
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', updateDuration);
      audioRef.current.addEventListener('ended', handleTrackEnd);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('loadedmetadata', updateDuration);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current = null;
      }
    };
  }, []);

  // Load favorites when user changes
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites(new Set());
    }
  }, [user]);

  // Update liked status when current track changes
  useEffect(() => {
    if (playerState.currentTrack) {
      setPlayerState(prev => ({
        ...prev,
        liked: favorites.has(playerState.currentTrack.id)
      }));
    }
  }, [playerState.currentTrack, favorites]);

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('track_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(new Set(data.map(f => f.track_id)));
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  useEffect(() => {
    if (playerState.currentTrack && audioRef.current) {
      audioRef.current.src = playerState.currentTrack.url;
      audioRef.current.volume = playerState.volume;
      
      if (playerState.isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing track:', err);
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
        });
      }

      // Record play history
      if (user) {
        recordPlayHistory(playerState.currentTrack.id);
      }
    }
  }, [playerState.currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (playerState.isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing track:', err);
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [playerState.isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerState.volume;
    }
  }, [playerState.volume]);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const updateDuration = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const recordPlayHistory = async (trackId) => {
    try {
      const { error } = await supabase
        .from('play_history')
        .insert({
          user_id: user?.id,
          track_id: trackId,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error recording play history:', err);
    }
  };

  const handleTrackEnd = () => {
    next();
  };

  const playTrack = (track, source = null) => {
    setPlayerState({
      currentTrack: track,
      isPlaying: true,
      volume: playerState.volume,
      queue: [track],
      currentIndex: 0,
      shuffle: false,
      liked: favorites.has(track.id),
      source: source,
    });
  };

  const playTracks = (tracks, startIndex, source = null) => {
    if (tracks.length === 0 || startIndex < 0 || startIndex >= tracks.length) {
      return;
    }

    setPlayerState({
      currentTrack: tracks[startIndex],
      isPlaying: true,
      volume: playerState.volume,
      queue: tracks,
      currentIndex: startIndex,
      shuffle: false,
      liked: favorites.has(tracks[startIndex].id),
      source: source,
    });
  };

  const togglePlay = () => {
    if (!playerState.currentTrack && playerState.queue.length > 0) {
      // If no current track but we have a queue, play the first track
      setPlayerState(prev => ({
        ...prev,
        currentTrack: prev.queue[0],
        currentIndex: 0,
        isPlaying: true,
      }));
    } else {
      // Otherwise just toggle play state
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const next = () => {
    if (playerState.queue.length === 0) return;
    
    const nextIndex = playerState.shuffle
      ? Math.floor(Math.random() * playerState.queue.length)
      : (playerState.currentIndex + 1) % playerState.queue.length;
    
    const nextTrack = playerState.queue[nextIndex];
    
    setPlayerState(prev => ({
      ...prev,
      currentTrack: nextTrack,
      currentIndex: nextIndex,
      isPlaying: true,
      liked: favorites.has(nextTrack.id),
    }));
  };

  const previous = () => {
    if (playerState.queue.length === 0) return;
    
    // If we're more than 3 seconds into the track, restart it instead
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    const prevIndex = playerState.shuffle
      ? Math.floor(Math.random() * playerState.queue.length)
      : (playerState.currentIndex - 1 + playerState.queue.length) % playerState.queue.length;
    
    const prevTrack = playerState.queue[prevIndex];
    
    setPlayerState(prev => ({
      ...prev,
      currentTrack: prevTrack,
      currentIndex: prevIndex,
      isPlaying: true,
      liked: favorites.has(prevTrack.id),
    }));
  };

  const toggleShuffle = () => {
    setPlayerState(prev => ({
      ...prev,
      shuffle: !prev.shuffle,
    }));
  };

  // Updated toggleLike function to accept a specific track
  const toggleLike = async (specificTrack = null) => {
    if (!user) return;

    // Use the specific track if provided, otherwise use current track
    const trackToToggle = specificTrack || playerState.currentTrack;
    if (!trackToToggle) return;

    const trackId = trackToToggle.id;
    const isCurrentlyLiked = favorites.has(trackId);

    try {
      if (isCurrentlyLiked) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);

        if (error) throw error;
        
        // Update local state immediately
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            track_id: trackId,
          });

        if (error) throw error;
        
        // Update local state immediately
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(trackId);
          return next;
        });
      }

      // Update player state if this is the current track
      if (playerState.currentTrack?.id === trackId) {
        setPlayerState(prev => ({
          ...prev,
          liked: !isCurrentlyLiked,
        }));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw err; // Re-throw to let the calling component handle it
    }
  };

  const setVolume = (volume) => {
    setPlayerState(prev => ({ ...prev, volume }));
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <PlayerContext.Provider 
      value={{ 
        playerState, 
        playTrack, 
        playTracks,
        togglePlay, 
        next, 
        previous, 
        setVolume, 
        seek,
        currentTime,
        duration,
        toggleShuffle,
        toggleLike,
        favorites,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};