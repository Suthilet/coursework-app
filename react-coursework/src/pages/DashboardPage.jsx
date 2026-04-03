import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth.js';
import { useState, useEffect } from 'react';
import { levelsAPI } from '../api/levels.js';
import profile from '../svg/person-color.svg';
import settings from '../svg/settings-color.svg';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [levels, setLevels] = useState([]);
    const [totalLevels, setTotalLevels] = useState(0);

    useEffect(() => {
        const fetchUserData = () => {
            const currentUser = authAPI.getUser();
            if (currentUser) setUser(currentUser);
            else navigate('/login');
        };
        fetchUserData();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [navigate]);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                setLoading(true);
                const [levelsData, progressData] = await Promise.all([
                    levelsAPI.getLevels(),
                    levelsAPI.getUserProgress()
                ]);
                const userProgress = progressData.progress || [];
                const formattedLevels = levelsData.map((level, index) => {
                    const userLevelProgress = userProgress.find(p => p.case_id === level.id);
                    return {
                        id: level.id,
                        displayNumber: index + 1,
                        title: level.title,
                        difficulty: level.difficulty,
                        completed: userLevelProgress?.status === 'completed',
                        score: userLevelProgress?.score || 0
                    };
                });
                setLevels(formattedLevels);
                setTotalLevels(levelsData.length);
            } catch (error) {
                console.error('Error loading levels:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLevels();
    }, []);

    const completedLevels = levels.filter(level => level.completed).length;

    const handleExit = async () => {
        await authAPI.logout();
        navigate('/login');
    };

    const handleLevelClick = async (level) => {
        if (!levels.find(l => l.id === level.id)?.completed && 
            levels.findIndex(l => l.id === level.id) <= completedLevels) {
            try {
                await levelsAPI.startLevel(level.id);
                navigate(`/level/${level.id}`);
            } catch (error) {
                setErrors({ level: ['Не удалось начать уровень'] });
            }
        } else if (level.completed) {
            navigate(`/level/${level.id}`);
        }
    };

    const formatTime = (date) => date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const getLevelColor = (level, index) => {
        if (level.completed) return "bg-green-400";
        if (index <= completedLevels) return "bg-blue-300";
        return "bg-blue-300/70";
    };

    const getLevelBorder = (level, index) => {
        if (level.completed || index <= completedLevels) return "border-4 border-black";
        return "border-4 border-black/70";
    };

    const getLevelTextColor = (level, index) => index > completedLevels ? "text-black/70" : "text-black";

    if (!user) {
        return (
            <div className="min-h-screen bg-sky-500 flex items-center justify-center">
                <div className="text-white text-sm">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-500 overflow-hidden relative">
            {/* ==================== ВЕРХНЯЯ ПАНЕЛЬ ==================== */}
            <div className="w-full bg-white h-14 sm:h-16 px-4 flex items-center justify-between">
                {/* Логотип — слева */}
                <div className="text-black font-medium font-hanken-grotesk text-base">
                    Профиль/Личное дело
                </div>
                
                {/* Иконки — справа */}
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/dashboard')} className="p-1 hover:opacity-70 transition-opacity">
                        <img src={profile} alt='Профиль' className="w-7 h-7" />
                    </button>
                    <button onClick={() => navigate('/settings')} className="p-1 hover:opacity-70 transition-opacity">
                        <img src={settings} alt='Настройки' className="w-7 h-7" />
                    </button>
                </div>
            </div>

            {/* ==================== ОТСТУП ПОСЛЕ БЕЛОГО БЛОКА ==================== */}
            <div className="h-6 sm:h-10"></div>

            {/* ==================== ОСНОВНОЙ КОНТЕНТ ==================== */}
            <div className="px-4 pb-4">
                
                {/* Контейнер профиля */}
                <div className="flex items-start gap-4 mb-4">
                    
                    {/* Аватар */}
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="text-white font-bold text-2xl">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                    </div>
                    
                    {/* Информация о пользователе */}
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="text-black font-bold font-hanken-grotesk truncate text-lg">
                            {user.login || 'Flower2210'}
                        </div>
                        <div className="text-black font-medium font-hanken-grotesk truncate text-base mt-0.5">
                            {user.full_name || 'Анастасия Старкина'}
                        </div>
                        <div className="text-black font-medium font-hanken-grotesk text-base">
                            {user.b_day ? new Date(user.b_day).toLocaleDateString('ru-RU') : '23.10.2006'}
                        </div>
                    </div>

                    {/* Кнопка выхода (верхняя) */}
                    <button 
                        onClick={handleExit}
                        className="text-black font-bold font-hanken-grotesk hover:text-red-500 transition-colors flex-shrink-0 text-base"
                    >
                        Выйти
                    </button>
                </div>

                {/* Кнопка редактирования */}
                <button 
                    onClick={() => navigate('/dashboard/edit')}
                    className="mb-4 text-sky-500 font-medium font-hanken-grotesk hover:text-sky-600 transition-colors text-base"
                >
                    Редактировать
                </button>
                
                {/* Прогресс */}
                <div className="text-white font-bold font-hanken-grotesk mb-3 text-base">
                    Прогресс: {completedLevels}/{totalLevels}
                </div>
                
                {/* Уровни — автоматическая сетка */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-4">
                    {loading ? (
                        [...Array(totalLevels || 5)].map((_, index) => (
                            <div key={index} className="w-full aspect-square rounded-lg bg-gray-300 animate-pulse border-4 border-gray-400" />
                        ))
                    ) : (
                        levels.map((level, index) => (
                            <div key={level.id} className="relative group w-full aspect-square">
                                <button
                                    onClick={() => handleLevelClick(level)}
                                    disabled={index > completedLevels}
                                    className={`
                                        w-full h-full rounded-lg transition-all duration-200
                                        ${getLevelColor(level, index)}
                                        ${getLevelBorder(level, index)}
                                        ${index > completedLevels ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 hover:shadow-lg cursor-pointer'}
                                    `}
                                >
                                    <div className={`absolute inset-0 flex items-center justify-center ${getLevelTextColor(level, index)} font-bold font-hanken-grotesk text-2xl sm:text-3xl`}>
                                        {level.displayNumber || level.id}
                                    </div>
                                    {level.completed && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">✓</span>
                                        </div>
                                    )}
                                </button>
                                
                            </div>
                        ))
                    )}
                </div>
                
            </div>

            {/* ==================== ФУТЕР — ЧЁРНАЯ ПОЛОСА ==================== */}
            <div className="absolute bottom-0 left-0 right-0 w-full bg-zinc-800 h-16 sm:h-20 flex items-center justify-between px-4">
                <button 
                    onClick={handleExit}
                    className="text-white font-semibold font-hanken-grotesk hover:text-red-300 transition-colors text-sm sm:text-base"
                >
                    Выйти
                </button>
                
                <div className="text-white font-normal font-hannari text-sm sm:text-base text-right leading-tight">
                    {formatTime(currentTime)}<br/>{formatDate(currentTime)}
                </div>
            </div>
            

        </div>
    );
};

export default DashboardPage;