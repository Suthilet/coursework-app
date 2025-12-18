import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Обновление времени
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Проверяем, если пользователь уже авторизован
  React.useEffect(() => {
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
    // Очищаем ошибки при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Простая валидация
    if (!formData.login.trim()) {
      setErrors({ login: 'Введите логин' });
      setLoading(false);
      return;
    }
    
    if (!formData.password) {
      setErrors({ password: 'Введите пароль' });
      setLoading(false);
      return;
    }

    // Отправляем запрос на сервер
    const result = await authAPI.login(formData.login, formData.password);
    
    setLoading(false);
    
    if (result.success) {
      // Успешный вход - перенаправляем на дашборд
      navigate('/dashboard');
    } else {
      // Показываем ошибки от сервера
      setErrors(result.errors);
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="w-full h-screen bg-blue-500 overflow-hidden absolute">
      {/* Футер (нижняя полоса) */}
      <div className="w-full h-20 absolute bottom-0 bg-[#313131]" />
      
      {/* Логотип Filice */}
      <div className="absolute left-10 top-3 text-white text-5xl font-normal font-roboto-mono filice-logo">
        Filice
      </div>
      
      {/* Дата и время в футере */}
      <div className="absolute right-10 bottom-2 text-right text-white text-2xl font-normal font-hannari">
        {formatTime(currentTime)}
        <br/>
        {formatDate(currentTime)}
      </div>
      
      {/* Иконка профиля (левый верхний угол) */}
      <div className="absolute right-40 top-6 w-16 h-16 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
        <div className="absolute w-10 h-12 left-[9.53px] top-[3.81px] opacity-20 bg-white" />
        <div className="absolute w-11 h-14 left-[7.62px] top-[1.91px] bg-white" />
      </div>
      
      {/* Иконка уведомлений (правый верхний угол) */}
      <div className="absolute right-8 top-7 w-12 h-12 overflow-hidden cursor-pointer hover:scale-110 transition-transform">
        <div className="absolute w-12 h-12 bg-black" />
        <div className="absolute w-11 h-11 left-[2px] top-[2px] bg-white/25" />
        <div className="absolute w-12 h-12 left-[0.50px] top-[0.50px] bg-white" />
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
              <div className="w-6 h-6 overflow-hidden cursor-pointer hover:opacity-70 transition-opacity">
                <div className="w-2.5 h-2.5 mx-auto mt-[7.63px] outline outline-[3px] outline-offset-[-1.50px] outline-white" />
              </div>
            </div>
            <div className='my-auto grid place-items-center h-[90%]'>

            <div className="h-[422px] m-auto w-[545px] relative">
                <h1 className="text-[38px]/10  font-semibold font-hanken-grotesk ">
                  <span className="text-blue-300">Войди</span>
                  <span className="text-white">, чтобы продолжить расследования</span>
                </h1>
              
              {/* Форма входа */}
              <form onSubmit={handleSubmit} className="w-[534px] mx-auto mt-8">
                
                {/* Поле логина */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      name="login"
                      value={formData.login}
                      onChange={handleInputChange}
                      placeholder="Логин"
                       className="auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk"
                      />
                  </div>
                </div>
                
                {/* Поле пароля */}
                <div className="mb-8">
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Пароль"
                      className="auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk"
                    />
                  </div>
                </div>
                
                {/* Кнопка входа */}
                <button
                  type="submit"
                  className="block auth-button w-[198px] m-auto h-14 bg-amber-600 hover:bg-amber-700 rounded-xl text-black font-bold font-hanken-grotesk"
                >
                  Войти
                </button>
                
                {/* Ссылка на регистрацию */}
                <div className="text-center mt-8">
                  <p className="text-white text-base font-semibold font-hanken-grotesk">
                    Еще нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={handleRegisterClick}
                      className="text-blue-300 underline hover:text-blue-400 transition-colors font-hanken-grotesk"
                    >
                      Зарегистрироваться
                    </button>
                  </p>
                </div>
                
                {/* Дополнительные опции */}
                {/* <div className="flex justify-between items-center mt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-white text-sm font-hanken-grotesk">Запомнить меня</span>
                  </label>
                  <button
                    type="button"
                    className="text-blue-300 text-sm hover:text-blue-400 underline font-hanken-grotesk"
                  >
                    Забыли пароль?
                  </button>
                </div> */}
              </form>
            
          </div>
          </div>
                        
          </div>
        </div>
    
    </div>
  );
};

export default LoginPage;