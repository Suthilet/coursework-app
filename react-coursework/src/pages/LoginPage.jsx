import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth.js';
import profile from '../svg/person-noncolor.svg';
import settings from '../svg/settings-noncolor.svg';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // const [currentTime, setCurrentTime] = useState(new Date());
  // 
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 60000);
    
  //   return () => clearInterval(timer);
  // }, []);

  useEffect(() => {
    if (authAPI.isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // const formatTime = (date) => {
  //   return date.toLocaleTimeString('ru-RU', { 
  //     hour: '2-digit', 
  //     minute: '2-digit' 
  //   });
  // };

  // const formatDate = (date) => {
  //   return date.toLocaleDateString('ru-RU', {
  //     day: '2-digit',
  //     month: '2-digit',
  //     year: 'numeric'
  //   });
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Валидация
    const newErrors = {};
    
    if (!formData.login.trim()) {
      newErrors.login = 'Введите логин';
    }
    
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Отправляем запрос на сервер
      const result = await authAPI.login(formData.login, formData.password);
      
      if (result.success) {
        // Успешный вход - перенаправляем на дашборд
        navigate('/dashboard');
      } else {
        // Показываем ошибки от сервера
        if (result.errors && typeof result.errors === 'object') {
          setErrors(result.errors);
        } else if (result.message) {
          setErrors({ general: result.message });
        } else {
          setErrors({ general: 'Неверный логин или пароль' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Произошла ошибка при входе. Попробуйте позже.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-blue-500 overflow-hidden relative">
      {/* ==================== ХЕДЕР ==================== */}
      <div className='w-full flex justify-between items-center px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 absolute top-0 left-0 right-0 z-20'>
        {/* Логотип */}
        <div className="text-white font-normal font-roboto-mono 
          text-[27px] sm:text-[32px] lg:text-[32px] 2xl:text-[36px]">
          Filice
        </div>
        
        {/* Иконки справа */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-1.5 hover:opacity-70 transition-opacity active:scale-95"
            aria-label="Профиль"
          >
            <img src={profile} alt='Профиль' className="w-10 h-10 sm:w-12 sm:h-12 md:w-11 md:h-11 lg:w-11 lg:h-11 2xl:h-16 2xl:w-16" />
          </button>
          <button 
            onClick={() => navigate('/settings')} 
            className="lg:p-1 hover:opacity-70 transition-opacity active:scale-95"
            aria-label="Настройки"
          >
            <img src={settings} alt='Настройки' className="w-10 h-10 sm:w-12 sm:h-12 md:w-11 md:h-11 lg:w-11 lg:h-11 2xl:h-16 2xl:w-16" />
          </button>
        </div>
      </div>
    
      {/* ==================== ОСНОВНОЙ КОНТЕЙНЕР ==================== */}
      <div className='flex items-center justify-center min-h-screen px-3 sm:px-4 md:px-6 py-20 sm:py-24 md:py-28'>
        {/* Карточка формы */}
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-[#363636] rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Заголовок карточки */}
          <div className="flex justify-between items-center px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-[#313131]">
            <div className="text-white font-normal font-hanken-grotesk
              text-[14px] sm:text-[16px] md:text-base lg:text-lg">
              Следователь/Вход
            </div>
            
            {/* Кнопка закрытия */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
              aria-label="Закрыть"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 outline outline-2 sm:outline-[3px] outline-white" />
            </button>
          </div>
          
          {/* Контент формы */}
          <div className='px-4 py-10 sm:px-6 md:px-8 sm:py-6 md:py-8'>
            <div className="max-w-sm sm:max-w-md md:max-w-lg mx-auto">
              {/* Главный заголовок */}
              <h1 className="font-semibold font-hanken-grotesk text-center sm:text-left leading-tight
                text-[20px] md:text-[24px] lg:text-xl xl:text-2xl">
                <span className="text-blue-300">Войди</span>
                <span className="text-white">, чтобы продолжить расследования</span>
              </h1>
              
              {/* Форма */}
              <form onSubmit={handleSubmit} className="w-full mt-4 flex-col sm:mt-5 md:mt-6">
                
                {/* Общие ошибки */}
                {errors.general && (
                  <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-900/30 text-red-200 rounded-lg
                    text-[10px] sm:text-xs md:text-sm">
                    {errors.general}
                  </div>
                )}
                
                {/* Поле логина */}
                <div className="mb-3 sm:mb-4">
                  <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder="Логин"
                    className={`w-full bg-white rounded-lg sm:rounded-xl text-black font-hanken-grotesk px-3 sm:px-4 outline-none transition-all duration-200
                      h-9 sm:h-10 md:h-11 lg:h-12
                      text-xs sm:text-sm md:text-base
                      ${errors.login 
                        ? 'border-2 border-red-500 focus:border-red-600' 
                        : 'border-2 border-transparent focus:border-blue-400'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={loading}
                    autoComplete="username"
                  />
                  {errors.login && (
                    <div className="text-red-400 text-[10px] sm:text-xs mt-1 ml-1">
                      {errors.login}
                    </div>
                  )}
                </div>
                
                {/* Поле пароля */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Пароль"
                    className={`w-full bg-white rounded-lg sm:rounded-xl text-black font-hanken-grotesk px-3 sm:px-4 outline-none transition-all duration-200
                      h-9 sm:h-10 md:h-11 lg:h-12
                      text-xs sm:text-sm md:text-base
                      ${errors.password 
                        ? 'border-2 border-red-500 focus:border-red-600' 
                        : 'border-2 border-transparent focus:border-blue-400'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <div className="text-red-400 text-[10px] sm:text-xs mt-1 ml-1">
                      {errors.password}
                    </div>
                  )}
                </div>
                
                {/* Кнопка входа */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-[15px] lg:text-[18px] xl:text-[22px] sm:w-56 md:w-64 lg:w-72 h-9 sm:h-10 md:h-11 lg:h-12 mx-auto block 
                    bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                    rounded-lg sm:rounded-xl text-black font-bold font-hanken-grotesk 
                    transition-all duration-200 transform active:scale-[0.98]
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                    text-xs sm:text-sm md:text-base`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 border-b-2 border-black mr-2"></div>
                      <span className="hidden sm:inline">Вход...</span>
                      <span className="sm:hidden">Загрузка...</span>
                    </div>
                  ) : (
                    'Войти'
                  )}
                </button>
                
                {/* Ссылка на регистрацию */}
                <div className="text-center mt-4 sm:mt-5 md:mt-6">
                  <p className="text-white font-semibold font-hanken-grotesk
                    text-xs sm:text-sm md:text-base">
                    Еще нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={handleRegisterClick}
                      className="text-blue-300 underline hover:text-blue-400 active:text-blue-500 
                        transition-colors font-hanken-grotesk 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1"
                      disabled={loading}
                    >
                      Зарегистрироваться
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;