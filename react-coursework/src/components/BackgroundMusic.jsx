// src/components/BackgroundMusic.jsx
import { useEffect } from 'react';
import { useAudioContext } from '../context/AudioContext';

const BackgroundMusic = () => {
    const { audioElement, isPlaying } = useAudioContext();

    useEffect(() => {
        // Автовоспроизведение при первом взаимодействии со страницей
        const handleFirstInteraction = () => {
            if (audioElement && !isPlaying) {
                audioElement.play().catch(() => {});
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    }, [audioElement, isPlaying]);

    return null; // Это невидимый компонент-контроллер
};

export default BackgroundMusic;