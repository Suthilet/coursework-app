// components/SQLReference.jsx
import React, { useState } from 'react';
import bookIcon from '../svg/book.svg';

const SQLReference = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('basics');

    const sqlCommands = {
        basics: [
            { command: 'SELECT * FROM suspects', description: 'Выбрать все данные из таблицы' },
            { command: 'SELECT name, eyes FROM suspects', description: 'Выбрать конкретные колонки' },
            { command: 'SELECT DISTINCT eyes FROM suspects', description: 'Уникальные значения' }
        ],
        where: [
            { command: 'WHERE eyes = "голубые"', description: 'Фильтр по равенству' },
            { command: 'WHERE age > 25', description: 'Больше чем' },
            { command: 'WHERE age BETWEEN 20 AND 30', description: 'В диапазоне' }
        ],
        and_or: [
            { command: 'WHERE eyes = "голубые" AND gender = "М"', description: 'И (оба условия)' },
            { command: 'WHERE eyes = "голубые" OR eyes = "зеленые"', description: 'ИЛИ (любое условие)' }
        ],
        order: [
            { command: 'ORDER BY age DESC', description: 'Сортировка по убыванию' },
            { command: 'ORDER BY name ASC', description: 'Сортировка по возрастанию' }
        ]
    };

    const categories = {
        basics: 'Основы SELECT',
        where: 'Фильтрация WHERE',
        and_or: 'Логические операторы',
        order: 'Сортировка'
    };

    return (
        <>
            {/* Кнопка открытия справочника */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-yellow-400 hover:bg-yellow-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-40"
                title="Справочник SQL"
            >
                <img src={bookIcon} alt="Справочник" className="w-7 h-7" />
            </button>

            {/* Модальное окно справочника */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
                    
                    <div className="relative bg-white rounded-2xl w-[600px] max-w-[90vw] max-h-[80vh] overflow-hidden shadow-2xl">
                        {/* Заголовок */}
                        <div className="bg-blue-500 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-2xl font-bold font-hanken-grotesk">
                                📖 Справочник SQL
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:text-gray-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Категории */}
                        <div className="flex border-b px-4 gap-2 overflow-x-auto">
                            {Object.entries(categories).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        activeCategory === key
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Контент */}
                        <div className="p-6 overflow-y-auto max-h-[500px]">
                            {sqlCommands[activeCategory].map((item, idx) => (
                                <div key={idx} className="mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="font-mono text-blue-600 font-bold mb-1">
                                        {item.command}
                                    </div>
                                    <div className="text-gray-600 text-sm">
                                        {item.description}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Совет */}
                        <div className="bg-yellow-50 p-4 border-t">
                            <div className="text-yellow-800 text-sm font-medium">
                                💡 Совет: Используйте быстрые запросы в редакторе для быстрой вставки кода!
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SQLReference;