import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import profile from '../svg/person-noncolor.svg';
import settings from '../svg/settings-noncolor.svg';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
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

  // Функция для проверки имени
  const validateName = (name) => {
    const trimmedName = name.trim();
    
    // Проверка на пустое значение
    if (!trimmedName) {
      return { valid: false, message: 'Введите полное имя' };
    }
    
    // Проверка на наличие минимум двух слов
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2) {
      return { valid: false, message: 'Введите фамилию и имя через пробел' };
    }
    
    // Проверка каждого слова на наличие только букв и разрешенных символов
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/;
    
    for (const word of words) {
      // Проверка на наличие только букв
      if (!nameRegex.test(word)) {
        return { 
          valid: false, 
          message: 'Имя может содержать только буквы, пробелы, дефисы и апострофы' 
        };
      }
      
      // Проверка на минимальную длину слова (минимум 2 буквы)
      if (word.length < 2) {
        return { 
          valid: false, 
          message: 'Каждое слово должно содержать минимум 2 буквы' 
        };
      }
      
      // Проверка, что слово начинается с заглавной буквы (опционально)
      const firstChar = word.charAt(0);
      if (!/[A-ZА-ЯЁ]/.test(firstChar)) {
        return { 
          valid: false, 
          message: 'Каждое слово должно начинаться с заглавной буквы' 
        };
      }
      
      // Проверка, что остальные буквы строчные (опционально)
      const restOfWord = word.slice(1);
      if (restOfWord !== restOfWord.toLowerCase()) {
        return { 
          valid: false, 
          message: 'После первой буквы должны идти строчные буквы' 
        };
      }
    }
    
    // Проверка на максимальное количество слов (например, не более 3)
    if (words.length > 3) {
      return { 
        valid: false, 
        message: 'Введите фамилию и имя (можно добавить отчество)' 
      };
    }
    
    // Проверка общей длины
    if (trimmedName.length > 100) {
      return { valid: false, message: 'Имя слишком длинное' };
    }
    
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Валидация
    const newErrors = {};
    
    // Проверка имени с помощью функции validateName
    const nameValidation = validateName(formData.full_name);
    if (!nameValidation.valid) {
      newErrors.full_name = nameValidation.message;
    }
    
    // Проверка логина
    if (!formData.login.trim()) {
      newErrors.login = 'Введите логин';
    } else if (formData.login.length < 3) {
      newErrors.login = 'Логин должен быть не менее 3 символов';
    } else if (formData.login.length > 30) {
      newErrors.login = 'Логин не должен превышать 30 символов';
    } else if (!/^[a-zA-Z0-9_\-@.]+$/.test(formData.login)) {
      newErrors.login = 'Логин может содержать только буквы, цифры и символы _ - @ .';
    }
    
    // Проверка пароля
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов';
    } else if (formData.password.length > 100) {
      newErrors.password = 'Пароль не должен превышать 100 символов';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру';
    }
    
    // Проверка подтверждения пароля
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Пароли не совпадают';
    }
    
    // Проверка даты рождения
    if (!formData.b_day) {
      newErrors.b_day = 'Укажите дату рождения';
    } else {
      const birthDate = new Date(formData.b_day);
      const today = new Date();
      
      // Проверка, что дата не в будущем
      if (birthDate > today) {
        newErrors.b_day = 'Дата рождения не может быть в будущем';
      }
      
      // Проверка, что возраст не менее 13 лет (опционально)
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
      if (birthDate > minAgeDate) {
        newErrors.b_day = 'Для регистрации вам должно быть не менее 13 лет';
      }
      
      // Проверка, что возраст не более 150 лет (опционально)
      const maxAgeDate = new Date();
      maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 150);
      if (birthDate < maxAgeDate) {
        newErrors.b_day = 'Пожалуйста, проверьте дату рождения';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Отправляем данные на сервер
      const result = await authAPI.register(formData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        // Обработка ошибок с сервера
        if (result.errors && typeof result.errors === 'object') {
          setErrors(result.errors);
        } else if (result.message) {
          setErrors({ general: result.message });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Произошла ошибка при регистрации. Попробуйте позже.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
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

      <div className='grid place-items-center h-screen'>
        <div className="w-[819px] h-[843px] bg-[#363636] rounded-[19px]">
          
          <div className="flex justify-between items-center p-4 bg-[#313131] rounded-t-[19px]">
            <div className="text-white text-xl font-normal font-hanken-grotesk">
              Следователь/Регистрация
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-6 h-6 overflow-hidden cursor-pointer hover:opacity-70 transition-opacity focus:outline-none"
            >
              <div className="w-2.5 h-2.5 mx-auto mt-[7.63px] outline outline-[3px] outline-offset-[-1.50px] outline-white" />
            </button>
          </div>
          
          <div className='my-auto grid place-items-center h-[70%]'>
            <div className="h-[422px] m-auto w-[545px] relative">
              <h1 className="text-[38px]/10 font-semibold font-hanken-grotesk">
                <span className="text-blue-300">Зарегистрируйся</span>
                <span className="text-white">, чтобы стать следователем</span>
              </h1>
              
              <form onSubmit={handleSubmit} className="w-[534px] mx-auto mt-8">
                {errors.general && (
                  <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded-lg">
                    {errors.general}
                  </div>
                )}

                {/* Поле ФИО */}
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Фамилия и Имя (например: Иванов Иван)"
                      className={`auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk px-4 ${
                        errors.full_name ? 'border-2 border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.full_name && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {errors.full_name}
                    </div>
                  )}
                  
                </div>

                {/* Поле даты рождения */}
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="date"
                      name="b_day"
                      value={formData.b_day}
                      onChange={handleInputChange}
                      placeholder="Дата рождения"
                      className={`auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk px-4 ${
                        errors.b_day ? 'border-2 border-red-500' : ''
                      }`}
                      disabled={loading}
                      max={new Date().toISOString().split('T')[0]} // Максимальная дата - сегодня
                    />
                  </div>
                  {errors.b_day && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {errors.b_day}
                    </div>
                  )}
                </div>

                {/* Поле логина */}
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      name="login"
                      value={formData.login}
                      onChange={handleInputChange}
                      placeholder="Логин"
                      className={`auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk px-4 ${
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
                      className={`auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk px-4 ${
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

                {/* Поле подтверждения пароля */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="password"
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      placeholder="Повторите пароль"
                      className={`auth-input w-full h-14 bg-white rounded-xl text-black text-m font-hanken-grotesk px-4 ${
                        errors.password_confirmation ? 'border-2 border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.password_confirmation && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {errors.password_confirmation}
                    </div>
                  )}
                </div>
                
                {/* Кнопка регистрации */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`hover:text-white block auth-button w-[326px] m-auto h-14 bg-amber-600 hover:bg-amber-700 rounded-xl text-black font-bold font-hanken-grotesk transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-2"></div>
                      Регистрация...
                    </div>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </button>
                
                {/* Ссылка на вход */}
                <div className="text-center mt-8">
                  <p className="text-white text-base font-semibold font-hanken-grotesk">
                    Уже есть аккаунт? {' '}
                    <button
                      type="button"
                      onClick={handleLoginClick}
                      className="text-blue-300 underline hover:text-blue-400 transition-colors font-hanken-grotesk"
                      disabled={loading}
                    >
                      Войти
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

export default RegisterPage;