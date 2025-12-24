import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { levelsAPI } from '../api/levels.js';
import EvidenceViewer from './components/EvidenceViewer.jsx';
import arrow from '../svg/arrow.svg';
import profile from '../svg/person-color.svg';
import settings from '../svg/settings-color.svg';
import play from '../svg/play.svg';
import stop from '../svg/stop.svg';
import cross from '../svg/cross.svg';


const LevelPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [levelData, setLevelData] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [query, setQuery] = useState('select * from suspects');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCriminal, setSelectedCriminal] = useState(null);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [modalAnimation, setModalAnimation] = useState(false);
    const [isLevelCompleted, setIsLevelCompleted] = useState(false);
    const [correctAnswerId, setCorrectAnswerId] = useState(null);
    const [correctSuspectName, setCorrectSuspectName] = useState('')
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);

const fetchLevelData = async () => {
    try {
        setLoading(true);
        setError('');

        const completedLevels = JSON.parse(localStorage.getItem('completedLevels') || '{}');
        const levelInfo = completedLevels[id];
        
        if (levelInfo) {
           
            setIsLevelCompleted(true);
            setCorrectAnswerId(levelInfo.suspectId);
            setCorrectSuspectName(levelInfo.suspectName);
        }
        
        const levelResponse = await levelsAPI.getLevel(id);
        setLevelData(levelResponse.case);
        
        const evidenceData = await levelsAPI.getEvidence(id);
        console.log(evidenceData)
        setEvidence(evidenceData);
        
        const criminalsData = await levelsAPI.getCriminals(id);
        
        const formattedResults = criminalsData.map(criminal => ({
            id: criminal.id,
            name: criminal.name || 'Неизвестно',
            gender: criminal.gender || 'Не указан',
            eyes: criminal.eyes || 'Не указан',
            age: criminal.age || 'Не указан',
            hair: criminal.hair || 'Не указан',
            hobby: criminal.hobby || 'Не указан',
            address: criminal.address || 'Не указан',
            phone: criminal.phone || 'Не указан',
            selected: false,
            isCorrectAnswer: levelInfo && criminal.id === levelInfo.suspectId
        }));
        
        setResults(formattedResults);
        
        if (!levelInfo) {
            await levelsAPI.startLevel(id);
        }
        
    } catch (error) {
        console.error('Error loading level data:', error);
        setError('Не удалось загрузить данные уровня. Проверьте подключение к серверу.');
    } finally {
        setLoading(false);
    }
};
    
    useEffect(() => {
        fetchLevelData();
    }, [id]);
    
    const handleExecuteQuery = async () => {
        try {
            setError('');
            setSubmissionResult(null);
            setLoading(true);
            
            console.log('Executing query:', query);
            
            const response = await levelsAPI.executeQuery(id, query);
            
            console.log('API Response:', response);
            
            if (response.success) {
                if (!response.results || !Array.isArray(response.results)) {
                    throw new Error('Некорректный формат ответа от сервера');
                }
                
                const formattedResults = response.results.map((criminal, index) => ({
                    id: criminal.id || index,
                    name: criminal.name || 'Неизвестно',
                    gender: criminal.gender || 'Не указан',
                    eyes: criminal.eyes || criminal.eye_color || 'Не указан',
                    age: criminal.age || 'Не указан',
                    hair: criminal.hair || criminal.hair_color || 'Не указан',
                    hobby: criminal.hobby || criminal.interests || 'Не указан',
                    address: criminal.address || criminal.location || 'Не указан',
                    phone: criminal.phone || criminal.phone_number || 'Не указан',
                    selected: false,
                    isCorrectAnswer: isLevelCompleted && criminal.id === correctAnswerId
                }));
                
                setResults(formattedResults);
            } else {
                setError(response.message || 'Ошибка выполнения запроса');
                setResults([]);
            }
            
        } catch (error) {
            console.error('Error executing query:', error);
            setError(error.message || 'Неизвестная ошибка');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewEvidence = (evidenceItem) => {
        setSelectedEvidence(evidenceItem);
        setShowEvidenceModal(true);
    };
    
    const handleInsertText = (text) => {
        const textTrimmed = text.trim().toLowerCase();
        
        const isAndOr = textTrimmed.startsWith('and ') || textTrimmed.startsWith('or ');
        const isWhere = textTrimmed.startsWith('where ');
        
        if (query.trim() === '') {
            setQuery(text);
        } else {
            const currentQueryLower = query.toLowerCase();
            const hasWhereInQuery = currentQueryLower.includes('where ');
            
            if (isWhere && hasWhereInQuery) {
                const modifiedText = 'and ' + textTrimmed.substring(6); 
                setQuery(query.trim() + ' ' + modifiedText);
            } else if (isAndOr) {
                setQuery(query.trim() + ' ' + text.trim());
            } else {
                setQuery(query + '\n' + text);
            }
        }
    };
        
    const handleSelectCriminal = (index) => {
        if (isLevelCompleted) {
            setError('Этот уровень уже пройден. Вы не можете изменить ответ.');
            return;
        }
        
        const updatedResults = results.map((criminal, i) => ({
            ...criminal,
            selected: i === index
        }));
        setResults(updatedResults);
        setSelectedCriminal(index >= 0 ? updatedResults[index] : null);
    };
    
    const closeModal = () => {
        setModalAnimation(false);
        setTimeout(() => {
            setShowResultModal(false);
            setSubmissionResult(null);
        }, 300);
    };
    
    const handleGoToHome = () => {
        closeModal();
        navigate('/dashboard');
    };
    
    const handleRestartLevel = () => {
        closeModal();
        setQuery('select * from suspects');
        
        const resetResults = results.map(criminal => ({
            ...criminal,
            selected: false
        }));
        
        setResults(resetResults);
        setSelectedCriminal(null);
        setSubmissionResult(null);
        setError('');
    };
    

const handleConfirmSelection = async () => {
    if (!selectedCriminal) {
        setError('Пожалуйста, выберите подозреваемого');
        return;
    }
    
    try {
        setLoading(true);
        setError('');
        
        const response = await levelsAPI.submitAnswer(id, selectedCriminal.id);
        setSubmissionResult(response);
        
        setShowResultModal(true);
        setTimeout(() => {
            setModalAnimation(true);
        }, 10);
        
        if (response.is_correct) {
            const completedLevels = JSON.parse(localStorage.getItem('completedLevels') || '{}');
            completedLevels[id] = {
                suspectId: selectedCriminal.id,
                suspectName: selectedCriminal.name,
                completedAt: new Date().toISOString()
            };
            localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
            
            setIsLevelCompleted(true);
            setCorrectAnswerId(selectedCriminal.id);
            setCorrectSuspectName(selectedCriminal.name);
            
            const updatedResults = results.map(criminal => ({
                ...criminal,
                isCorrectAnswer: criminal.id === selectedCriminal.id
            }));
            setResults(updatedResults);
        }
        
    } catch (error) {
        console.error('Error submitting answer:', error);
        setError('Ошибка при отправке ответа. Проверьте подключение к серверу.');
    } finally {
        setLoading(false);
    }
};
    
    if (loading && !levelData) {
        return (
            <div className="min-h-screen bg-blue-500 flex items-center justify-center">
                <div className="text-white text-4xl">Загрузка дела...</div>
            </div>
        );
    }
    
    if (!levelData) {
        return (
            <div className="min-h-screen bg-blue-500 flex items-center justify-center">
                <div className="text-white text-4xl">Дело не найдено 😢</div>
            </div>
        );
    }
    
    return (
        <>
            <div className="w-full h-screen relative bg-blue-500 overflow-hidden">
                <div className="w-full h-20 absolute top-0 bg-white flex items-center px-8 shadow-md">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex justify-center items-center cursor-pointer mr-4 p-2 hover:bg-gray-100 rounded"
                    >
                        <img src={arrow} alt='Стрелка'/>
                    </button>
                    <div className="text-black text-xl font-semibold font-hanken-grotesk">
                        {levelData.title}
                        {isLevelCompleted && (
                            <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                ✓ Пройдено
                            </span>
                        )}
                    </div>
                    
                    
                    <div className="absolute g-6 right-8 flex items-center space-x-4">
                        <button onClick={() => navigate('/dashboard')}>
                            <img src={profile} alt='Профиль'/>
                        </button>
                        <button onClick={() => navigate('/settings')}>
                            <img src={settings} alt='Настройки'/>
                        </button>
                    </div>
                </div>
                
                <div className="flex h-full pt-20">
                    <div className="w-2/5 h-full p-8 overflow-y-auto">
                        <div className="mb-8">
                            <div className="text-white text-2xl font-semibold font-hanken-grotesk mb-4">
                                Описание дела
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <p className="text-black text-xl font-hanken-grotesk leading-relaxed">
                                    {levelData.description}
                                </p>
                            </div>
                        </div>
                        

                        <div className="mb-8">
                            <div className="text-white text-2xl font-semibold font-hanken-grotesk mb-4">
                                Улики ({evidence.length})
                            </div>
                            <div className="space-y-4">
                                {evidence.map((item, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:scale-[1.02] transition-transform"
                                        onClick={() => handleViewEvidence(item)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-semibold text-black font-hanken-grotesk text-lg">
                                                {item.title}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                item.type === 'image' ? 'bg-purple-100 text-purple-800 h-full' :
                                                item.type === 'text' ? 'bg-blue-100 text-blue-800' :
                                                item.type === 'html' ? 'bg-green-100 text-green-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {item.type === 'image' ? 'Фотография' :
                                                item.type === 'text' ? 'Документ' :
                                                item.type === 'html' ? 'Протокол' : item.type}
                                            </div>
                                        </div>
                                        <div className="text-black font-hanken-grotesk">
                                            <div className="text-gray-600 mb-2 line-clamp-2">{item.description}</div>
                                            <div className="text-sm text-gray-500">
                                                {item.size ? `Размер: ${Math.round(item.size / 1024)}KB • ` : ''}
                                                Нажмите для просмотра
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    
                    <div className="w-3/5 h-full bg-neutral-800 p-8 overflow-y-auto">
                        <div className="text-white text-4xl font-semibold font-hanken-grotesk mb-6">
                            База знаний 
                        </div>
                        
                        {isLevelCompleted && (
                            <div className="mb-6 p-4 bg-green-900/30 rounded-lg border-l-4 border-green-500">
                                <div className="text-green-300 font-semibold text-lg mb-1">
                                    ✓ Этот уровень уже пройден
                                </div>
                                <div className="text-green-100">
                                    Вы можете повторно выполнять запросы, но не можете изменить свой ответ.
                                </div>
                            </div>
                        )}
                        
                        {/* Быстрые кнопки SQL */}
                        <div className="mb-6">
                            <div className="text-white text-lg font-medium font-hanken-grotesk mb-3">
                                Быстрые запросы:
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleInsertText('select * from suspects')}
                                    className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-lg text-black text-lg font-medium font-hanken-grotesk transition-colors shadow-md"
                                >
                                    select * from suspects
                                </button>
                                <button
                                    onClick={() => handleInsertText('where eyes = "голубые"')}
                                    className="bg-blue-300 hover:bg-blue-500 px-5 py-2 rounded-lg text-black hover:text-white text-lg font-medium font-hanken-grotesk transition-colors shadow-md"
                                >
                                    where eyes = "голубые"
                                </button>
                                <button
                                    onClick={() => handleInsertText('where age > 25')}
                                    className="bg-blue-300 hover:bg-blue-500 px-5 py-2 rounded-lg text-black hover:text-white text-lg font-medium font-hanken-grotesk transition-colors shadow-md"
                                >
                                    where age `{'>'}` 25
                                </button>
                            </div>
                        </div>
                        
                        <div className="mb-8">
                            <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-4">
                                <div className="bg-blue-500 px-6 py-4">
                                    <div className="text-white text-xl font-semibold font-hanken-grotesk">
                                        SQL Редактор
                                    </div>
                                </div>
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full h-40 p-6 text-black text-lg font-mono bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    spellCheck="false"
                                    placeholder="Введите SQL запрос для поиска подозреваемых..."
                                />
                            </div>
                            
                            <div className="flex justify-between items-top">
                                <div className="text-white text-base font-hanken-grotesk">
                                    Используйте SQL-подобные запросы для фильтрации
                                </div>
                                <button
                                    onClick={handleExecuteQuery}
                                    disabled={loading}
                                    className="sticky top-0 right-8"
                                >
                                    {loading ? (
                                        <img src={stop} alt='stop' />
                                    ) : (
                                        <img src={play} alt='play' />
                                    )}
                                </button>
                            </div>
                       
                           
                        </div>
                        
                        <div className="mb-8 mt-20">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-white text-4xl font-semibold font-hanken-grotesk">
                                    Результаты
                                </div>
                                <div className="text-white/80 font-hanken-grotesk">
                                    Найдено: {results.length} записей
                                </div>
                            </div>
                            
                            {results.length > 0 ? (
                                <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-blue-300 text-xl">
                                                <tr>
                                                    <th className="w-16 p-4 text-center">Выбор</th>
                                                    <th className="p-4 text-left text-gray-900 font-bold">Name<br/><span className='font-semibold'>Имя</span></th>
                                                    <th className="p-4 text-left text-gray-900 font-bold">Gender<br/><span className='font-semibold text-gray-700'>Пол</span></th>
                                                    <th className="p-4 text-left text-gray-900 font-bold">Age<br/><span className='font-semibold text-gray-700'>Возраст</span></th>
                                                    <th className="p-4 text-left text-gray-900 font-bold">Eyes<br/><span className='font-semibold text-gray-700'>Цвет глаз</span></th>
                                                    <th className="p-4 text-left text-gray-900 font-bold">Hobby<br/><span className='font-semibold text-gray-700'>Хобби</span></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.map((criminal, index) => (
                                                    <tr 
                                                        key={index}
                                                        className={`border-b border-gray-200 hover:bg-gray-50 ${criminal.selected ? 'bg-yellow-50' : ''} ${
                                                            isLevelCompleted && criminal.isCorrectAnswer ? 'bg-green-50' : ''
                                                        }`}
                                                        onClick={() => handleSelectCriminal(index)}
                                                        style={{ cursor: isLevelCompleted ? 'default' : 'pointer' }}
                                                    >
                                                        <td className="p-4 text-m text-center">
                                                            <div className={`
                                                                w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto
                                                                ${criminal.selected ? 'border-green-500 bg-green-100 text-green-500' : 
                                                                isLevelCompleted && criminal.isCorrectAnswer ? 'border-green-500 bg-green-100 text-green-500' : 
                                                                'border-gray-300 text-transparent'}
                                                            `}>
                                                                {criminal.selected || (isLevelCompleted && criminal.isCorrectAnswer) ? '✓' : ''}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-xl font-hanken-grotesk text-gray-800 font-medium">
                                                            {criminal.name}
                                                            {isLevelCompleted && criminal.isCorrectAnswer && (
                                                                <span className="ml-2 text-green-600 text-sm font-bold">✓ Ваш ответ</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-xl font-hanken-grotesk text-gray-700">
                                                            {criminal.gender}
                                                        </td>
                                                        <td className="p-4 text-xl font-hanken-grotesk text-gray-700">
                                                            {criminal.age}
                                                        </td>
                                                        <td className="p-4 text-xl font-hanken-grotesk text-gray-700">
                                                            {criminal.eyes}
                                                        </td>
                                                        <td className="p-4 text-xl font-hanken-grotesk text-gray-700">
                                                            {criminal.hobby}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/10 p-8 rounded-xl text-center">
                                    <div className="text-white text-lg font-hanken-grotesk">
                                        Записи не найдены. Выполните запрос чтобы увидеть подозреваемых.
                                    </div>
                                </div>
                            )}
                        </div>
                         {error && !submissionResult && (
                                <div className="mt-4 p-4 bg-red-900/30 text-white rounded-r-lg mb-5">
                                    <div className="font-semibold">Ошибка:</div>
                                    <div>{error}</div>
                                </div>
                            )}
                        <div>
                        <div className="text-white text-lg font-medium font-hanken-grotesk mb-4">
                            {isLevelCompleted ? (
                                <div className="mb-4 p-4 bg-green-900/30 rounded-lg">
                                    <div className="text-green-100">
                                        Правильный ответ: <span className="font-bold">{correctSuspectName}</span>
                                    </div>
                                    <div className="text-green-100 text-sm mt-1">
                                        Вы можете повторять запросы, но не можете изменить ответ.
                                    </div>
                                </div>
                            ) : selectedCriminal ? (
                                <div className="mb-4 p-4 bg-white/20 rounded-lg">
                                    <div className="text-white font-semibold mb-1">Выбран подозреваемый:</div>
                                    <div className="text-yellow-300 text-xl font-bold">
                                        {selectedCriminal.name}
                                    </div>
                                    <div className="text-white/80 text-sm mt-1">
                                        {selectedCriminal.age} лет, {selectedCriminal.eyes} глаза
                                    </div>
                                </div>
                            ) : (
                                'Выберите подозреваемого из таблицы выше'
                            )}
                        </div>

                            
                            <div className="flex justify-center">
                                <button
                                    onClick={handleConfirmSelection}
                                    disabled={(!selectedCriminal && !isLevelCompleted) || loading}
                                    className={`
                                        px-8 py-4 rounded-full text-xl font-bold font-hanken-grotesk 
                                        transition-colors shadow-lg transform hover:scale-105 transition-transform
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${isLevelCompleted 
                                            ? 'hidden' 
                                            : 'bg-amber-600 hover:bg-amber-700 hover:text-white text-black'
                                        }
                                    `}
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
                                            Проверка...
                                        </div>
                                    ) : isLevelCompleted ? (
                                        'Показать результат'
                                    ) : (
                                        'Проверить подозреваемого'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showResultModal && submissionResult && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
                    modalAnimation ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                    <div 
                        className={`absolute inset-0 transition-all duration-300 ${
                            modalAnimation ? 'bg-black/70' : 'bg-black/0'
                        }`}
                        onClick={closeModal}
                    />
                    
                    <div className={`relative z-10 transition-all duration-300 ${
                        modalAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}>
                        {submissionResult.is_correct || isLevelCompleted ? (
                            <div className="w-[1000px] h-96 relative">
                                <div className="w-[1000px] h-96 left-0 top-0 absolute bg-white rounded-[69px] border-[18px] border-amber-600" />
                                
                                <button 
                                    onClick={closeModal}
                                    className="w-14 h-14 left-[913px] top-[30px] absolute overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    <img src={cross} alt='cross'/>
                                </button>
                                
                                <div className="w-[671px] h-28 left-[200px] top-[96px] absolute text-center justify-start text-black text-4xl font-bold font-hanken-grotesk">
                                    {'Ура! Ты смог вычислить преступника!'}
                                </div>
                                
                                <div className="w-[500px] h-16 left-[220px] top-[166px] absolute justify-start text-black text-xl font-medium font-hanken-grotesk">
                                    {'Отличная работа!'}
                                </div>
                                
                                <button 
                                    onClick={handleGoToHome}
                                    className="w-80 h-14 left-[132px] top-[275px] absolute bg-blue-300 rounded-xl hover:bg-blue-400 transition-colors"
                                >
                                    <div className="flex items-center justify-center gap-3 hover:gap-6 hover:mr-3 h-full">
                                        <img src={arrow} alt='Стрелка'/> 
                                        <span className="text-black text-2xl font-medium font-hanken-grotesk">
                                            на Главную
                                        </span>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={handleGoToHome}
                                    className="w-80 h-14 left-[522px] top-[275px] absolute bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
                                >
                                    <span className="text-white text-2xl font-semibold font-hanken-grotesk">
                                        Следующий уровень
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="w-[1000px] h-96 relative">
                                <div className="w-[1000px] h-96 left-0 top-0 absolute bg-white rounded-[69px] border-[18px] border-blue-300" />
                                
                                <button 
                                    onClick={closeModal}
                                    className="w-14 h-14 left-[913px] top-[30px] absolute overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    <img src={cross} alt='cross'/>
                                </button>
                                
                                <div className="left-[200px] top-[96px] absolute justify-start text-black text-4xl font-bold font-hanken-grotesk">
                                    Увы, это неправильный ответ ;(
                                </div>
                                
                                <div className="w-[500px] h-16 left-[230px] top-[166px] text-center absolute justify-start text-black text-xl font-medium font-hanken-grotesk">
                                    Попробуй еще раз! Ты можешь воспользоваться подсказкой, если тебе нужна помощь
                                </div>
                                
                                <button 
                                    onClick={handleGoToHome}
                                    className="w-80 h-14 left-[132px] top-[275px] absolute bg-blue-300 rounded-xl hover:bg-blue-400 transition-colors"
                                >
                                    <div className="flex items-center justify-center gap-3 hover:gap-6 hover:mr-3 h-full">
                                        <img src={arrow} alt='Стрелка'/> 
                                        <span className="text-black text-2xl font-medium font-hanken-grotesk">
                                            на Главную
                                        </span>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={handleRestartLevel}
                                    className="w-80 h-14 left-[522px] top-[275px] absolute bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
                                >
                                    <span className="text-black hover:text-white text-2xl font-semibold font-hanken-grotesk">
                                        Попробовать снова
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showEvidenceModal && selectedEvidence && (
                <EvidenceViewer 
                    evidence={selectedEvidence}
                    onClose={() => {
                        setShowEvidenceModal(false);
                        setSelectedEvidence(null);
                    }}
                />
            )}
        </>
    );
};

export default LevelPage;