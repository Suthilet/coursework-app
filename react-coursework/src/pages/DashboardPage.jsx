import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth.js';
import { useState, useEffect } from 'react';
import { levelsAPI } from '../api/levels.js';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [levels, setLevels] = useState([]);
    const [totalLevels, setTotalLevels] = useState(0);

    // Получаем данные пользователя
    useEffect(() => {
        const fetchUserData = () => {
            const currentUser = authAPI.getUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                navigate('/login');
            }
        };
        
        fetchUserData();
        

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        
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
        // Если уровень еще не начат, начинаем его
        if (!levels.find(l => l.id === level.id)?.completed && 
            levels.findIndex(l => l.id === level.id) <= completedLevels) {
            
            try {
                await levelsAPI.startLevel(level.id);
                navigate(`/level/${level.id}`);
            } catch (error) {
                setErrors({ level: ['Не удалось начать уровень'] });
            }
        } 
        else if (level.completed) {
            navigate(`/level/${level.id}`);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getLevelColor = (level, index) => {
        if (level.completed) {
            return "bg-green-400"; 
        } else if (index <= completedLevels) {
            return "bg-blue-300"; 
        } else {
            return "bg-blue-300/70"; 
        }
    };

    const getLevelBorder = (level, index) => {
        if (level.completed) {
            return "border-[6px] border-black"; 
        } else if (index <= completedLevels) {
            return "border-[6px] border-black"; 
        } else {
            return "border-[6px] border-black/70"; 
        }
    };

    const getLevelTextColor = (level, index) => {
        if (index > completedLevels) {
            return "text-black/70"; 
        }
        return "text-black"; 
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-sky-500 flex items-center justify-center">
                <div className="text-white text-xl">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-500 overflow-hidden relative">
            {/* Верхняя белая панель */}
            <div className="w-full h-[476px] bg-white" />
            
            {/* Футер (нижняя полоса) */}
            <div className="w-full h-28 absolute bottom-0 bg-zinc-800" />
            
            {/* Дата и время в футере */}
            <div className="absolute right-10 bottom-6 text-right text-white text-2xl font-normal font-hannari">
                {formatTime(currentTime)}
                <br/>
                {formatDate(currentTime)}
            </div>
            
            {/* Заголовок страницы */}
            <div className="absolute left-10 top-8 text-black text-2xl font-medium font-hanken-grotesk">
                Профиль/Личное дело
            </div>
            
            {/* Информация о пользователе */}
            <div className="absolute left-72 top-44">
                <div className="text-black text-4xl font-bold font-hanken-grotesk">
                    {user.login || 'Flower2210'}
                </div>
                <div className="text-black text-2xl font-medium font-hanken-grotesk mt-4">
                    {user.full_name || 'Анастасия Старкина'}
                </div>
                <div className="text-black text-2xl font-medium font-hanken-grotesk mt-2">
                    {user.b_day ? new Date(user.b_day).toLocaleDateString('ru-RU') : '23.10.2006'}
                </div>
            </div>
            <div>
                
            </div>
            {/* Кнопка выхода (вверху) */}
            <button 
                onClick={handleExit}
                className="absolute right-10 top-[172px] text-black text-2xl font-bold font-hanken-grotesk hover:text-red-500 transition-colors"
            >
                Выйти
            </button>
            
            {/* Кнопка выхода (внизу) */}
            <button 
                onClick={handleExit}
                className="absolute left-10 bottom-6 text-white text-2xl font-semibold font-hanken-grotesk hover:text-red-300 transition-colors"
            >
                Выйти
            </button>
            
            {/* Кнопка редактирования профиля */}
            <button 
                onClick={() => navigate('/profile/edit')}
                className="absolute left-10 top-[384px] text-sky-500 text-2xl font-medium font-hanken-grotesk hover:text-sky-600 transition-colors"
            >
                Редактировать
            </button>
            
            {/* Аватар пользователя */}
            <div className="absolute left-10 top-32 w-56 h-56 bg-zinc-800 rounded-full flex items-center justify-center">
                <div className="text-white text-6xl font-bold">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
            </div>
            
            {/* Иконка профиля в хедере */}
            <button 
                onClick={() => navigate('/profile')}
                className="absolute right-40 top-6 w-16 h-16 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
                <div className="absolute w-10 h-12 left-[9.53px] top-[3.81px] opacity-20 bg-amber-600" />
                <div className="absolute w-11 h-14 left-[7.62px] top-[1.91px] bg-amber-600" />
            </button>
            
            {/* Иконка уведомлений */}
            <button 
                onClick={() => navigate('/notifications')}
                className="absolute right-8 top-7 w-12 h-12 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
            >
                <div className="absolute w-12 h-12 bg-black rounded-full" />
                <div className="absolute w-11 h-11 left-[2px] top-[2px] bg-blue-300 rounded-full" />
                <div className="absolute w-12 h-12 left-[0.50px] top-[0.50px] bg-indigo-500 rounded-full" />
            </button>
            
            <div className='block'>
                {/* Прогресс пользователя */}
            <div className="left-10 mt-4 ml-10 text-white text-2xl font-bold font-hanken-grotesk">
                Прогресс: {completedLevels}/{totalLevels}
            </div>
            
            {/* Уровни (динамические) */}
            <div className="left-10 mt-10 ml-10 flex items-center space-x-8">
                {loading ? (
                    // Показываем заглушки при загрузке
                    [...Array(5)].map((_, index) => (
                        <div key={index} className="relative">
                            <div className="w-40 h-40 rounded-xl bg-gray-300 animate-pulse border-[6px] border-gray-400" />
                        </div>
                    ))
                ) : (
                    levels.slice(0, 5).map((level, index) => (
                        <div key={level.id} className="relative group">
                            {/* Уровень */}
                            <button
                                onClick={() => handleLevelClick(level)}
                                disabled={index > completedLevels}
                                className={`
                                    w-40 h-40 rounded-xl transition-all duration-200
                                    ${getLevelColor(level, index)}
                                    ${getLevelBorder(level, index)}
                                    ${index > completedLevels ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 hover:shadow-lg cursor-pointer'}
                                `}
                            >
                                <div className={`absolute inset-0 flex items-center justify-center ${getLevelTextColor(level, index)} text-4xl font-bold font-hanken-grotesk`}>
                                    {level.displayNumber || level.id} {/* Используем displayNumber если есть */}
                                </div>
                                
                                {/* Бейдж для пройденных уровней */}
                                {level.completed && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                    </div>
                                )}
                            </button>
                            
                            {/* Информация об уровне при наведении */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-black/80 text-white p-2 rounded text-sm whitespace-nowrap">
                                    <div className="font-bold">Уровень {level.displayNumber || level.id}: {level.title}</div>
                                    <div>Сложность: {"★".repeat(level.difficulty)}</div>
                                    {level.completed && <div>Оценка: {level.score}%</div>}
                                </div>
                            </div>
                            

                        </div>
                    ))
                )}
            </div>
            
            {/* Информация о текущем уровне (под уровнями) */}
            <div className="ml-10 mt-8 max-w-2xl">
                {loading ? (
                    <div className="bg-white/90 p-6 rounded-2xl shadow-lg animate-pulse">
                        <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
                        <div className="h-10 bg-gray-300 rounded w-32"></div>
                    </div>
                ) : levels.length > 0 ? (() => {
                    const nextLevel = levels.find((level, index) => index === completedLevels);
                    if (nextLevel) {
                        return (
                            <div className="bg-white/90 p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold text-black mb-2 font-hanken-grotesk">
                                    {nextLevel.completed ? 'Пройденный уровень' : 'Следующий уровень'}
                                </h3>
                                <p className="text-black text-lg font-hanken-grotesk mb-2">
                                    <strong>Название:</strong> Уровень {nextLevel.displayNumber || nextLevel.id}: {nextLevel.title}
                                </p>
                                <p className="text-black text-lg font-hanken-grotesk mb-4">
                                    <strong>Сложность:</strong> {"★".repeat(nextLevel.difficulty)} ({nextLevel.difficulty}/5)
                                </p>
                                <button
                                    onClick={() => handleLevelClick(nextLevel)}
                                    disabled={completedLevels < levels.findIndex(l => l.id === nextLevel.id)}
                                    className={`
                                        px-6 py-3 rounded-xl font-bold font-hanken-grotesk transition-all
                                        ${nextLevel.completed 
                                            ? 'bg-green-500 text-white hover:bg-green-600' 
                                            : completedLevels >= levels.findIndex(l => l.id === nextLevel.id)
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {nextLevel.completed ? 'Повторить уровень' : 'Начать уровень'}
                                </button>
                            </div>
                        );
                    }
                    return null;
                })() : (
                    <div className="bg-white/90 p-6 rounded-2xl shadow-lg">
                        <p className="text-black text-lg font-hanken-grotesk">
                            Уровни еще не загружены или отсутствуют.
                        </p>
                    </div>
                )}
            </div>
            </div>
            
            

            
            {/* Дополнительные элементы декора */}
            <div className="absolute left-1/4 top-1/3 w-64 h-64 bg-blue-400/10 rounded-full blur-xl" />
            <div className="absolute right-1/4 bottom-1/4 w-48 h-48 bg-green-400/10 rounded-full blur-xl" />
        </div>
    );
};

export default DashboardPage;