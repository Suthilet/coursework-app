// components/QueryExplanationModal.jsx
import React, { useEffect, useState } from 'react';

const QueryExplanationModal = ({ query, results, onClose }) => {
    const [explanation, setExplanation] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        parseQuery(query);
    }, [query]);

    const parseQuery = (sqlQuery) => {
        const lowerQuery = sqlQuery.toLowerCase();
        let explanationText = '';
        
        // Базовый анализ запроса
        if (lowerQuery.includes('select *')) {
            explanationText += '• Выбраны все колонки из таблицы\n';
        } else if (lowerQuery.includes('select')) {
            const selectMatch = sqlQuery.match(/select\s+(.*?)\s+from/i);
            if (selectMatch) {
                const columns = selectMatch[1];
                if (columns !== '*') {
                    explanationText += `• Выбраны колонки: ${columns}\n`;
                }
            }
        }

        if (lowerQuery.includes('where')) {
            const whereMatch = sqlQuery.match(/where\s+(.*?)(?:$|order\s+by)/i);
            if (whereMatch) {
                explanationText += `• Условие фильтрации: ${whereMatch[1]}\n`;
            }
        }

        if (lowerQuery.includes('order by')) {
            explanationText += `• Результаты отсортированы\n`;
        }

        if (results.length === 0) {
            explanationText += `\n⚠️ Запрос не вернул результатов. Попробуйте изменить условия.`;
        } else if (results.length === 1) {
            explanationText += `\n✅ Найден 1 подозреваемый, соответствующий условиям.`;
        } else {
            explanationText += `\n📊 Найдено ${results.length} подозреваемых, соответствующих условиям.`;
        }

        setExplanation(explanationText);
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
            visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            
            <div className={`relative bg-white rounded-2xl w-[500px] max-w-[90vw] overflow-hidden shadow-2xl transition-all duration-300 ${
                visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
                {/* Заголовок */}
                <div className="bg-blue-500 px-6 py-4">
                    <h3 className="text-white text-xl font-bold font-hanken-grotesk">
                        🔍 Разбор SQL запроса
                    </h3>
                </div>

                {/* Запрос */}
                <div className="p-6">
                    <div className="mb-4">
                        <div className="text-gray-500 text-sm mb-1">Ваш запрос:</div>
                        <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm text-blue-600 overflow-x-auto">
                            {query}
                        </div>
                    </div>

                    {/* Объяснение */}
                    <div className="mb-4">
                        <div className="text-gray-500 text-sm mb-1">Что делает запрос:</div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <pre className="text-green-800 text-sm whitespace-pre-wrap font-sans">
                                {explanation}
                            </pre>
                        </div>
                    </div>

                    {/* Статистика */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Найдено записей:</span>
                            <span className="font-bold text-blue-600">{results.length}</span>
                        </div>
                    </div>

                    {/* Кнопка закрытия */}
                    <button
                        onClick={handleClose}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Понятно!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QueryExplanationModal;