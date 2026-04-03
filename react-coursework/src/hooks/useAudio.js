// src/hooks/useAudio.js
import { useAudioContext } from '../context/AudioContext';

const useAudio = () => {
    const { isPlaying, volume, isMuted, togglePlay, toggleMute, changeVolume } = useAudioContext();
    
    return {
        isPlaying,
        volume,
        isMuted,
        togglePlay,
        toggleMute,
        changeVolume,
        // Процент для UI слайдера (0-100)
        volumePercent: Math.round(volume * 100),
    };
};

export default useAudio;