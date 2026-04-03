import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import profile from '../svg/person-noncolor.svg';
import settings from '../svg/settings-noncolor.svg';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // const [currentTime, setCurrentTime] = useState(new Date());

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 60000);
  //   return () => clearInterval(timer);
  // }, []);

  // const formatTime = (date) => {
  //   return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  // };

  // const formatDate = (date) => {
  //   return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  // };

  const [formData, setFormData] = useState({
    full_name: '',
    login: '',
    password: '',
    password_confirmation: '',
    b_day: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateName = (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return { valid: false, message: 'Введите полное имя' };
    
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2) return { valid: false, message: 'Введите фамилию и имя через пробел' };
    
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/;
    for (const word of words) {
      if (!nameRegex.test(word)) return { valid: false, message: 'Имя может содержать только буквы, пробелы, дефисы и апострофы' };
      if (word.length < 2) return { valid: false, message: 'Каждое слово должно содержать минимум 2 буквы' };
      if (!/[A-ZА-ЯЁ]/.test(word.charAt(0))) return { valid: false, message: 'Каждое слово должно начинаться с заглавной буквы' };
      const rest = word.slice(1);
      if (rest !== rest.toLowerCase()) return { valid: false, message: 'После первой буквы должны идти строчные буквы' };
    }
    if (words.length > 3) return { valid: false, message: 'Введите фамилию и имя (можно добавить отчество)' };
    if (trimmedName.length > 100) return { valid: false, message: 'Имя слишком длинное' };
    
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const newErrors = {};
    
    const nameValidation = validateName(formData.full_name);
    if (!nameValidation.valid) newErrors.full_name = nameValidation.message;
    
    if (!formData.login.trim()) newErrors.login = 'Введите логин';
    else if (formData.login.length < 3) newErrors.login = 'Логин должен быть не менее 3 символов';
    else if (formData.login.length > 30) newErrors.login = 'Логин не должен превышать 30 символов';
    else if (!/^[a-zA-Z0-9_\-@.]+$/.test(formData.login)) newErrors.login = 'Логин может содержать только буквы, цифры и символы _ - @ .';
    
    if (!formData.password) newErrors.password = 'Введите пароль';
    else if (formData.password.length < 8) newErrors.password = 'Пароль должен быть не менее 8 символов';
    else if (formData.password.length > 100) newErrors.password = 'Пароль не должен превышать 100 символов';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) newErrors.password = 'Пароль должен содержать заглавную, строчную букву и цифру';
    
    if (formData.password !== formData.password_confirmation) newErrors.password_confirmation = 'Пароли не совпадают';
    
    if (!formData.b_day) newErrors.b_day = 'Укажите дату рождения';
    else {
      const birthDate = new Date(formData.b_day);
      const today = new Date();
      if (birthDate > today) newErrors.b_day = 'Дата рождения не может быть в будущем';
      const minAge = new Date(); minAge.setFullYear(minAge.getFullYear() - 13);
      if (birthDate > minAge) newErrors.b_day = 'Вам должно быть не менее 13 лет';
      const maxAge = new Date(); maxAge.setFullYear(maxAge.getFullYear() - 150);
      if (birthDate < maxAge) newErrors.b_day = 'Пожалуйста, проверьте дату рождения';
    }
    
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setLoading(false); return; }

    try {
      const result = await authAPI.register(formData);
      if (result.success) navigate('/dashboard');
      else if (result.errors && typeof result.errors === 'object') setErrors(result.errors);
      else if (result.message) setErrors({ general: result.message });
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Произошла ошибка при регистрации. Попробуйте позже.' });
    } finally { setLoading(false); }
  };

  const handleLoginClick = () => navigate('/login');

  return (
    <div className="min-h-screen bg-blue-500 overflow-hidden relative box-border">
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
      <div className='flex items-center justify-center min-h-screen px-2 sm:px-3 md:px-4 pt-14 sm:pt-16 pb-12 sm:pb-14'>
        {/* Карточка формы — компактная на мобильных */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl bg-[#363636] 
          rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl overflow-hidden
          h-auto sm:h-auto md:h-auto">
          
          {/* Заголовок карточки */}
          <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-[#313131]">
            <div className="text-white font-normal font-hanken-grotesk
              text-[11px] sm:text-[13px] md:text-sm lg:text-base">
              Следователь/Регистрация
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity focus:outline-none"
              aria-label="Закрыть"
            >
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 outline outline-2 outline-white" />
            </button>
          </div>
          
          {/* Контент формы — без скролла, компактный */}
          <div className='px-3 sm:px-5 md:px-7 py-3 sm:py-4 md:py-6'>
            <div className="max-w-xs sm:max-w-sm md:max-w-md mx-auto">
              {/* Главный заголовок */}
              <h1 className="font-semibold font-hanken-grotesk text-center sm:text-left leading-tight
                text-[14px] sm:text-[16px] md:text-lg lg:text-xl">
                <span className="text-blue-300">Зарегистрируйся</span>
                <span className="text-white">, чтобы стать следователем</span>
              </h1>
              
              {/* Форма */}
              <form onSubmit={handleSubmit} className="w-full mt-2.5 sm:mt-3 md:mt-4">
                
                {/* Общие ошибки */}
                {errors.general && (
                  <div className="mb-2 p-2 bg-red-900/30 text-red-200 rounded text-[9px] sm:text-[10px]">
                    {errors.general}
                  </div>
                )}

                {/* Поля формы — компактные на мобильных */}
                {[
                  { name: 'full_name', type: 'text', placeholder: 'Фамилия и Имя', error: errors.full_name },
                  { name: 'b_day', type: 'date', placeholder: '', error: errors.b_day, max: new Date().toISOString().split('T')[0] },
                  { name: 'login', type: 'text', placeholder: 'Логин', error: errors.login, autoComplete: 'username' },
                  { name: 'password', type: 'password', placeholder: 'Пароль', error: errors.password, autoComplete: 'new-password' },
                  { name: 'password_confirmation', type: 'password', placeholder: 'Повторите пароль', error: errors.password_confirmation, autoComplete: 'new-password' },
                ].map((field, idx) => (
                  <div key={field.name} className={`mb-2 ${idx === 4 ? 'mb-3.5' : ''}`}>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      max={field.max}
                      autoComplete={field.autoComplete}
                      className={`w-full bg-white rounded text-black font-hanken-grotesk px-2.5 sm:px-3 outline-none transition-all
                        h-7 sm:h-8 md:h-9 lg:h-10
                        text-[11px] sm:text-xs md:text-sm
                        ${field.error ? 'border-2 border-red-500' : 'border-2 border-transparent focus:border-blue-400'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={loading}
                    />
                    {field.error && (
                      <div className="text-red-400 text-[9px] sm:text-[10px] mt-0.5 ml-0.5">{field.error}</div>
                    )}
                  </div>
                ))}
                
                {/* Кнопка регистрации */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full sm:w-52 md:w-60 lg:w-72 h-7 sm:h-8 md:h-9 lg:h-10 mx-auto block 
                    bg-amber-600 hover:bg-amber-700 active:bg-amber-800
                    rounded text-black font-bold font-hanken-grotesk 
                    transition-all active:scale-[0.98]
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                    text-[11px] sm:text-xs md:text-sm lg:text-base`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-b-2 border-black mr-1.5"></div>
                      <span className="hidden sm:inline">Регистрация...</span>
                      <span className="sm:hidden">Загрузка...</span>
                    </div>
                  ) : 'Зарегистрироваться'}
                </button>
                
                {/* Ссылка на вход */}
                <div className="text-center mt-2.5 sm:mt-3 md:mt-4">
                  <p className="text-white font-semibold font-hanken-grotesk text-[10px] sm:text-xs md:text-sm">
                    Уже есть аккаунт?{' '}
                    <button
                      type="button"
                      onClick={handleLoginClick}
                      className="text-blue-300 underline hover:text-blue-400 transition-colors disabled:opacity-50"
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