import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
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

  const [formData, setFormData] = useState({
    full_name: '',
    login: '',
    password: '',
    password_confirmation: '',
    b_day: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибки
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Простая валидация
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Введите полное имя';
    }
    
    if (!formData.login.trim()) {
      newErrors.login = 'Введите логин';
    }
    
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов';
    }
    
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Пароли не совпадают';
    }
    
    if (!formData.b_day) {
      newErrors.b_day = 'Укажите дату рождения';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    // Отправляем данные на сервер
    const result = await authAPI.register(formData);
    
    setLoading(false);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors(result.errors);
    }
  };

    const handleLoginClick = () => {
    navigate('/login');
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
        <div className="w-[819px] h-[843px] bg-[#363636] rounded-[19px]">
          
            
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
            <div className='my-auto grid place-items-center h-[70%]'>

            <div className="h-[422px] m-auto w-[545px] relative">
                <h1 className="text-[38px]/10  font-semibold font-hanken-grotesk ">
                  <span className="text-blue-300">Зарегистрируйся</span>
                  <span className="text-white">, чтобы стать следователем</span>
                </h1>
              
              {/* Форма входа */}
              <form onSubmit={handleSubmit} className="w-[534px] mx-auto mt-8">
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Фамилия и Имя"
                     className="auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk"
                      />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="date"
                      name="b_day"
                      value={formData.b_day}
                      onChange={handleInputChange}
                      placeholder="Дата рождения"
                    className="auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk"
                      />
                  </div>
                </div>    

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

                <div className="mb-8">
                  <div className="relative">
                    <input
                      type="password"
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      placeholder="Повторите пароль"
                      className="auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk"
                    />
                  </div>
                </div>
                
                {/* Кнопка входа */}
                <button
                  type="submit"
                  className="block auth-button w-[326px] m-auto h-14 bg-amber-600 hover:bg-amber-700 rounded-xl text-black font-bold font-hanken-grotesk"
                >
                  Зарегистрироваться
                </button>
                
                {/* Ссылка на регистрацию */}
                <div className="text-center mt-8">
                  <p className="text-white text-base font-semibold font-hanken-grotesk">
                    Уже есть аккаунт? {' '}
                    <button
                      type="button"
                      onClick={handleLoginClick}
                      className="text-blue-300 underline hover:text-blue-400 transition-colors font-hanken-grotesk"
                    >
                      Войти
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

export default RegisterPage;