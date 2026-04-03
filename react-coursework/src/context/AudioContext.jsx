// src/context/AudioContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AudioContext = createContext();

export const useAudioContext = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudioContext must be used within AudioProvider');
    return context;
};

export const AudioProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [audioElement, setAudioElement] = useState(null);

    // Загрузка настроек из localStorage при старте
    useEffect(() => {
        const savedVolume = localStorage.getItem('musicVolume');
        const savedMuted = localStorage.getItem('musicMuted');
        
        if (savedVolume !== null) setVolume(parseFloat(savedVolume));
        if (savedMuted !== null) setIsMuted(savedMuted === 'true');

        // Создаём аудио-элемент
        const audio = new Audio('/music/background.mp3');
        audio.loop = true;
        audio.volume = savedMuted === 'true' ? 0 : parseFloat(savedVolume) || 0.5;
        setAudioElement(audio);

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    // Сохранение настроек при изменении
    useEffect(() => {
        localStorage.setItem('musicVolume', volume.toString());
        localStorage.setItem('musicMuted', isMuted.toString());
        
        if (audioElement) {
            audioElement.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted, audioElement]);

    const togglePlay = () => {
        if (!audioElement) return;
        
        if (isPlaying) {
            audioElement.pause();
        } else {
            audioElement.play().catch(err => console.error('Playback failed:', err));
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const changeVolume = (newVolume) => {
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) setIsMuted(false);
    };

    return (
        <AudioContext.Provider value={{
            isPlaying,
            volume,
            isMuted,
            togglePlay,
            toggleMute,
            changeVolume,
            audioElement
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export default AudioContext;