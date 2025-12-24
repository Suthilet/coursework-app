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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authAPI.isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

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
    <div className="w-full h-screen bg-blue-500 overflow-hidden absolute">
      <div className='w-full absolute flex justify-between p-6'>
        <div className="text-white text-5xl font-normal font-roboto-mono filice-logo">
          Filice
        </div>
        <div className="w-max g-6 right-8 flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')}>
            <img src={profile} alt='Профиль'/>
          </button>
          <button onClick={() => navigate('/settings')}>
            <img src={settings} alt='Настройки'/>
          </button>
        </div>
      </div>
      <div className="w-full h-20 absolute bottom-0 bg-[#313131]" />
    
      
      {/* Дата и время в футере */}
      <div className="absolute right-10 bottom-2 text-right text-white text-2xl font-normal font-hannari">
        {formatTime(currentTime)}
        <br/>
        {formatDate(currentTime)}
      </div>
      
      {/* Основной контейнер формы */}
      <div className='grid place-items-center h-screen'>
        {/* Внешняя рамка формы */}
        <div className="w-[819px] h-[622px] bg-[#363636] rounded-[19px]">
          
          {/* Заголовок формы */}
          <div className="flex justify-between items-center p-4 bg-[#313131] rounded-t-[19px]">
            <div className="text-white text-xl font-normal font-hanken-grotesk">
              Следователь/Вход
            </div>
            
            {/* Кнопка закрытия (иконка) */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-6 h-6 overflow-hidden cursor-pointer hover:opacity-70 transition-opacity focus:outline-none"
            >
              <div className="w-2.5 h-2.5 mx-auto mt-[7.63px] outline outline-[3px] outline-offset-[-1.50px] outline-white" />
            </button>
          </div>
          
          <div className='my-auto grid place-items-center h-[90%]'>
            <div className="h-[422px] m-auto w-[545px] relative">
              <h1 className="text-[38px]/10 font-semibold font-hanken-grotesk">
                <span className="text-blue-300">Войди</span>
                <span className="text-white">, чтобы продолжить расследования</span>
              </h1>
              
              {/* Форма входа */}
              <form onSubmit={handleSubmit} className="w-[534px] mx-auto mt-8">
                {/* Общие ошибки */}
                {errors.general && (
                  <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded-lg">
                    {errors.general}
                  </div>
                )}
                
                {/* Поле логина */}
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      name="login"
                      value={formData.login}
                      onChange={handleInputChange}
                      placeholder="Логин"
                      className={`auth-input w-full h-14 bg-white rounded-xl text-black text-[20px] font-hanken-grotesk px-4 ${
                        errors.login ? 'border-2 border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.login && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {errors.login}
                    </div>
                  )}
                </div>
                
                {/* Поле пароля */}
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Пароль"
                      className={`auth-input w-full h-14 bg-white rounded-xl text-black text-[20px] font-hanken-grotesk px-4 ${
                        errors.password ? 'border-2 border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {errors.password}
                    </div>
                  )}
                </div>
                
                {/* Сообщение об ошибке входа (показывается только если есть ошибка general) */}
                {errors.general && !errors.login && !errors.password && (
                  <div className="mb-4 text-red-400 text-sm text-center">
                    {errors.general}
                  </div>
                )}
                
                {/* Кнопка входа */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`block auth-button w-[198px] hover:text-white m-auto h-14 bg-amber-600 hover:bg-amber-700 rounded-xl text-black font-bold font-hanken-grotesk transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="hover:text-white flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-2"></div>
                      Вход...
                    </div>
                  ) : (
                    <div className=''>Войти</div>
                  )}
                </button>
                
                {/* Ссылка на регистрацию */}
                <div className="text-center mt-8">
                  <p className="text-white text-base font-semibold font-hanken-grotesk">
                    Еще нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={handleRegisterClick}
                      className="text-blue-300 underline hover:text-blue-400 transition-colors font-hanken-grotesk"
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