// components/TooltipButton.jsx
import React from 'react';

const TooltipButton = ({ children, tooltip, onClick, className, disabled = false }) => {
    return (
        <div className="relative group inline-block">
            <button
                onClick={onClick}
                disabled={disabled}
                className={className}
            >
                {children}
            </button>
            
            {/* Подсказка при наведении */}
            {tooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-black/90 text-white text-xs rounded px-3 py-1.5 whitespace-nowrap font-medium shadow-lg">
                        {tooltip}
                        {/* Маленький треугольник снизу */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-black/90" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TooltipButton;