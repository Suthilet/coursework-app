// components/SQLTextarea.jsx
import React from 'react';

const SQLTextarea = ({ value, onChange, placeholder }) => {
    // Простая подсветка ключевых слов
    const highlightSQL = (sql) => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'INSERT', 'UPDATE', 'DELETE'];
        let highlighted = sql;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            highlighted = highlighted.replace(regex, `<span class="text-blue-600 font-bold">${keyword}</span>`);
        });
        // Подсветка строк
        highlighted = highlighted.replace(/"[^"]*"/g, '<span class="text-green-600">$&</span>');
        highlighted = highlighted.replace(/'[^']*'/g, '<span class="text-green-600">$&</span>');
        // Подсветка чисел
        highlighted = highlighted.replace(/\b\d+\b/g, '<span class="text-orange-600">$&</span>');
        
        return highlighted;
    };

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={onChange}
                className="w-full h-40 p-6 text-black text-lg font-mono bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                spellCheck="false"
                placeholder={placeholder}
                style={{ color: 'transparent', caretColor: 'black' }}
            />
            <div 
                className="absolute inset-0 p-6 pointer-events-none overflow-auto font-mono text-lg"
                dangerouslySetInnerHTML={{ __html: highlightSQL(value) }}
                style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            />
        </div>
    );
};

export default SQLTextarea;