import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Обновление времени каждую минуту
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Форма отправлена:', formData);
    // Здесь будет логика авторизации
    // navigate('/dashboard');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="w-full h-screen relative bg-sky-500 overflow-hidden">
      {/* Футер (нижняя полоса) */}
      <div className="w-full h-28 absolute bottom-0 bg-zinc-800" />
      
      {/* Логотип Filice */}
      <div className="absolute left-10 top-3 text-white text-5xl font-normal font-roboto-mono filice-logo">
        Filice
      </div>
      
      {/* Дата и время в футере */}
      <div className="absolute right-10 bottom-6 text-right text-white text-2xl font-normal font-hannari">
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
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {/* Внешняя рамка формы */}
        <div className="w-[819px] h-[622px] bg-zinc-800 rounded-[19px] shadow-2xl">
          
          {/* Внутренний контейнер формы */}
          <div className="w-full h-[583.63px] mt-[38.37px] bg-neutral-700 rounded-b-[19px]">
            
            {/* Заголовок формы */}
            <div className="flex justify-between items-center p-6">
              <div className="text-white text-xl font-normal font-hanken-grotesk">
                Следователь/Вход
              </div>
              
              {/* Кнопка закрытия (иконка) */}
              <div className="w-6 h-6 overflow-hidden cursor-pointer hover:opacity-70 transition-opacity">
                <div className="w-2.5 h-2.5 mx-auto mt-[7.63px] outline outline-[3px] outline-offset-[-1.50px] outline-white" />
              </div>
            </div>
            
            {/* Приветственный текст */}
            <div className="w-[545px] h-32 mx-auto mt-8 px-8">
              <h1 className="text-4xl font-semibold font-hanken-grotesk">
                <span className="text-blue-300">Войди</span>
                <span className="text-white">, чтобы продолжить расследования</span>
              </h1>
              <p className="text-white/80 text-lg mt-4 font-hanken-grotesk">
                Введите свои учетные данные для доступа к системе
              </p>
            </div>
            
            {/* Форма входа */}
            <form onSubmit={handleSubmit} className="w-[534px] mx-auto mt-12">
              
              {/* Поле логина */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="auth-input w-full h-14 bg-white rounded-xl text-black"
                  />
                  <label className="absolute left-4 -top-2 bg-white px-2 text-black text-sm font-hanken-grotesk">
                    Логин
                  </label>
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
                    placeholder=" "
                    className="auth-input w-full h-14 bg-white rounded-xl text-black"
                  />
                  <label className="absolute left-4 -top-2 bg-white px-2 text-black text-sm font-hanken-grotesk">
                    Пароль
                  </label>
                </div>
              </div>
              
              {/* Кнопка входа */}
              <button
                type="submit"
                className="auth-button w-full h-14 bg-amber-600 hover:bg-amber-700 rounded-xl text-black font-bold font-hanken-grotesk"
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
              <div className="flex justify-between items-center mt-6">
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
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Дополнительные элементы декора */}
      <div className="absolute left-20 top-40 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute right-20 top-60 w-48 h-48 bg-blue-400/10 rounded-full blur-xl" />
      <div className="absolute left-1/3 bottom-40 w-64 h-64 bg-amber-500/5 rounded-full blur-xl" />
    </div>
  );
};

export default LoginPage;