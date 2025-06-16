import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Music, Heart, Shuffle } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

const Player = () => {
  const navigate = useNavigate();
  const { 
    playerState, 
    togglePlay, 
    next, 
    previous, 
    setVolume,
    seek,
    currentTime,
    duration,
    toggleShuffle,
    toggleLike,
  } = usePlayer();
  
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(playerState.volume);
  const [visualizerBars, setVisualizerBars] = useState([]);

  const { currentTrack, isPlaying, volume, shuffle, liked, source } = playerState;

  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  // Check mute status when volume changes
  useEffect(() => {
    if (volume === 0) {
      setIsMuted(true);
    } else if (isMuted && volume > 0) {
      setIsMuted(false);
    }
  }, [volume]);

  // Simple visulizer effect - just for design
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const newBars = Array.from({ length: 12 }, () => Math.floor(Math.random() * 35) + 1);
        setVisualizerBars(newBars);
      }, 200);
      return () => clearInterval(interval);
    } else {
      setVisualizerBars(Array(12).fill(3));
    }
  }, [isPlaying]);

  const handleTrackSourceClick = () => {
    if (!currentTrack) return;

    // Use the source information to navigate to the correct location
    if (source) {
      navigate(source);
    } else {
      // Fallback to recently played if no source is tracked
      navigate('/recently-played');
    }
  };

  // If no track is playing, show mini player
  if (!currentTrack) {
    return (
      <div className="h-16 bg-background-light border-t border-neutral-800 px-4 flex items-center justify-between">
        <div className="text-neutral-400 text-sm">
          Select a track to start playing
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light border-t border-neutral-800 px-4 py-2 md:py-4">
      {/* Progress bar - top of player */}
      <div className="absolute top-0 left-0 right-0 -translate-y-full h-1 bg-neutral-800">
        <div 
          className="h-full bg-primary-500"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Current track info */}
        <div className="flex items-center min-w-0 max-w-[30%]">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded bg-neutral-800 overflow-hidden flex-shrink-0">
            {currentTrack.cover_url ? (
              <img 
                src={currentTrack.cover_url} 
                alt={`${currentTrack.title} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                <Music size={20} />
              </div>
            )}
          </div>
          <div className="ml-3 min-w-0">
            <div className="text-sm md:text-base font-medium truncate">{currentTrack.title}</div>
            <div className="text-xs md:text-sm text-neutral-400 truncate">{currentTrack.artist}</div>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={toggleLike}
              className={`text-neutral-400 hover:text-white p-1 transition-colors ${
                liked ? 'text-primary-400' : ''
              }`}
              aria-label="Like track"
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>

            <button 
              onClick={previous}
              className="text-neutral-400 hover:text-white p-1 transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={20} />
            </button>
            
            <button 
              onClick={togglePlay}
              className="p-2 rounded-full bg-white text-background-dark hover:bg-neutral-200 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button 
              onClick={next}
              className="text-neutral-400 hover:text-white p-1 transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={20} />
            </button>

            <button
              onClick={toggleShuffle}
              className={`text-neutral-400 hover:text-white p-1 transition-colors ${
                shuffle ? 'text-primary-400' : ''
              }`}
              aria-label="Toggle shuffle"
            >
              <Shuffle size={20} />
            </button>
          </div>
          
          {/* Time and seekbar - only on medium+ screens */}
          <div className="hidden md:flex items-center gap-2 w-full max-w-md mt-2">
            <span className="text-xs text-neutral-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="slider flex-1"
            />
            
            <span className="text-xs text-neutral-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right controls: visualizer and volume */}
        <div className="flex items-center gap-4 min-w-[20%] md:min-w-[25%] justify-end">
          {/* Audio visualizer */}
          <div className="hidden lg:flex">
            <div className="visualizer">
              {visualizerBars.map((height, i) => (
                <div 
                  key={i} 
                  className="visualizer-bar" 
                  style={{ height: `${height}px` }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Track source button */}
          <button 
            onClick={handleTrackSourceClick}
            className="text-neutral-400 hover:text-white p-1 transition-colors hidden md:block"
            aria-label="Go to track source"
            title={source ? `Go to ${source}` : 'Go to recently played'}
          >
            <ListMusic size={20} />
          </button>
          
          {/* Volume control */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white p-1 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="slider w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;