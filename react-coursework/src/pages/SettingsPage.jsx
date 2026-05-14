import { useNavigate } from 'react-router-dom';
import useAudio from '../hooks/useAudio';
import profile from '../svg/person-color.svg';
import settings from '../svg/settings-color.svg';
import exit from '../svg/exit.svg';
import reset from '../svg/reset.svg';
import { authAPI } from '../api/auth.js';
import { levelsAPI } from '../api/levels.js';
import { useState } from 'react';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { isMuted, toggleMute, changeVolume, volumePercent } = useAudio();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // Функция выхода
    const handleLogout = async () => {
        await authAPI.logout();
        navigate('/login');
    };

    const handleResetProgress = async () => {
        setResetLoading(true);
        try {
            const response = await levelsAPI.resetProgress();
            if (response.success) {
                alert('Прогресс успешно сброшен!');
                setShowResetConfirm(false);
                // Опционально: перенаправить на дашборд
                navigate('/dashboard');
            } else {
                alert('Ошибка при сбросе прогресса');
            }
        } catch (error) {
            console.error('Error resetting progress:', error);
            alert('Ошибка при сбросе прогресса');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-blue-500 overflow-hidden relative">
            {/* Верхняя панель */}
            <div className="h-14 w-full bg-white sm:h-16 px-4 flex items-center justify-between">
                <div className="text-black font-medium font-hanken-grotesk text-base">
                    Настройки
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/dashboard')} className="p-1 hover:opacity-70 transition-opacity">
                        <img src={profile} alt='Профиль' className="w-7 h-7" />
                    </button>
                    <button onClick={() => navigate('/settings')} className="p-1 hover:opacity-70 transition-opacity">
                        <img src={settings} alt='Настройки' className="w-7 h-7" />
                    </button>
                </div>
            </div>

            <div className="h-6 sm:h-10"></div>

            {/* Контент */}
            <div className="px-4 pb-4">
                <div className="w-full h-max flex justify-center items-stretch gap-10 flex-wrap">
                    <div className="bg-white/90 p-4 sm:p-6 rounded-xl shadow-lg w-[800px] max-w-full">
                        <h1 className="font-bold text-black font-hanken-grotesk mb-6 text-lg sm:text-xl text-center">
                            Настройки звука
                        </h1>

                        {/* Музыка вкл/выкл */}
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-300">
                            <div>
                                <div className="text-black font-medium font-hanken-grotesk text-base sm:text-lg">
                                    Музыка
                                </div>
                            </div>
                            
                            <button
                                onClick={toggleMute}
                                className={`
                                    w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-colors duration-200
                                    ${isMuted ? 'bg-gray-400' : 'bg-green-500'}
                                `}
                                aria-label={isMuted ? 'Включить музыку' : 'Выключить музыку'}
                            >
                                <div className={`
                                    w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full shadow-md transform transition-transform duration-200
                                    ${isMuted ? 'translate-x-0.5' : 'translate-x-7 sm:translate-x-8'}
                                `} />
                            </button>
                        </div>

                        {/* Громкость */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-black font-medium font-hanken-grotesk text-base sm:text-lg">
                                    Громкость
                                </div>
                                <div className="text-gray-600 font-hanken-grotesk text-sm sm:text-base">
                                    {volumePercent}%
                                </div>
                            </div>
                            
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volumePercent}
                                onChange={(e) => changeVolume(parseInt(e.target.value) / 100)}
                                disabled={isMuted}
                                className={`
                                    w-full h-2 rounded-lg appearance-none cursor-pointer
                                    ${isMuted ? 'bg-gray-300' : 'bg-blue-300'}
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-4
                                    [&::-webkit-slider-thumb]:h-4
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:bg-white
                                    [&::-webkit-slider-thumb]:border-2
                                    [&::-webkit-slider-thumb]:border-black
                                    [&::-webkit-slider-thumb]:shadow-md
                                    [&::-webkit-slider-thumb]:cursor-pointer
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            />
                        </div>
                    </div>
                    
                    {/* Блок аккаунта */}
                    <div className="w-[280px] bg-white/90 p-4 sm:p-6 flex-col gap-3 rounded-xl shadow-lg">
                        <h1 className="font-bold text-black font-hanken-grotesk mb-6 text-lg sm:text-xl text-center">
                            Аккаунт
                        </h1>


                        <div className=''>
                        <button 
                            onClick={() => setShowResetConfirm(true)}
                            className="font-medium text-base my-3 hover:text-red-500 flex gap-2 w-full"
                        >
                            <img src={reset} alt='Сброс' className="w-6 h-6" />
                            Сбросить весь прогресс
                        </button>
                            <button 
                                onClick={handleLogout}  // ← ИСПРАВЛЕНО: вызываем функцию напрямую
                                className="font-medium text-base hover:text-orange-400 flex mt-32 gap-2 items-center"
                            >
                                <img src={exit} alt='Выход' className="w-6 h-6" />
                                Выйти из профиля
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Кнопка "Назад" */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-[200px] px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold font-hanken-grotesk rounded-xl transition-colors text-base"
                    >
                        Назад
                    </button>
                </div>
                
            </div>
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold text-black mb-4 font-hanken-grotesk">
                            Внимание!
                        </h2>
                        <p className="text-gray-700 mb-6 font-hanken-grotesk">
                            Вы уверены, что хотите сбросить весь прогресс? 
                            Все пройденные уровни будут отмечены как непройденные.
                            Это действие нельзя отменить.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg transition-colors"
                                disabled={resetLoading}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleResetProgress}
                                disabled={resetLoading}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {resetLoading ? 'Сброс...' : 'Да, сбросить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;