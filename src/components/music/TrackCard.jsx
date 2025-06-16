import { Play, Music, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { formatTime } from '../../utils/formatters';
import TrackContextMenu from './TrackContextMenu';

const TrackCard = ({ track, onClick, showDuration = false }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleMenuClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
    setShowMenu(true);
  };

  return (
    <>
      <div 
        className="group hover-card cursor-pointer overflow-hidden w-full"
        onClick={onClick}
      >
        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
          {track.cover_url ? (
            <img 
              src={track.cover_url} 
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
              <Music size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              className="p-3 rounded-full bg-primary-600 text-white transform scale-90 group-hover:scale-100 transition-transform"
              aria-label="Play"
            >
              <Play size={20} />
            </button>
          </div>
        </div>
        
        <div className="truncate font-medium">{track.title}</div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400 truncate">{track.artist}</div>
          <div className="flex items-center gap-2">
            {showDuration && (
              <div className="text-xs text-neutral-500 hidden md:block">
                {formatTime(track.duration)}
              </div>
            )}
            <button
              onClick={handleMenuClick}
              className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
              title="More options"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      <TrackContextMenu
        track={track}
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        position={menuPosition}
      />
    </>
  );
};

export default TrackCard;