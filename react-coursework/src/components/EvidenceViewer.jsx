import React, { useEffect, useRef, useState, useCallback } from 'react';

const EvidenceViewer = ({ evidence, onClose }) => {
    const modalRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const iframeRef = useRef(null);
    
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [initialZoom, setInitialZoom] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [iframeError, setIframeError] = useState(false);
    
    // Полный URL к файлу
    const fullUrl = `http://localhost:8000/storage/${evidence.file_path}`;
    
    // Определяем тип содержимого
    const isImage = ['image', 'photo'].includes(evidence.type?.toLowerCase()) || 
                    evidence.mime_type?.includes('image');
    const isHtml = evidence.type === 'html' || evidence.file_path?.endsWith('.html');
    const isPdf = evidence.type === 'pdf' || evidence.file_path?.endsWith('.pdf');
    const isText = evidence.type === 'text' || evidence.file_path?.endsWith('.txt');
    
    // Расчет оптимального зума для изображения
    const calculateOptimalZoom = useCallback((imgWidth, imgHeight, containerWidth, containerHeight) => {
        if (!imgWidth || !imgHeight || !containerWidth || !containerHeight) return 1;
        
        const widthRatio = containerWidth / imgWidth;
        const heightRatio = containerHeight / imgHeight;
        
        // Выбираем меньший коэффициент, чтобы изображение полностью поместилось
        return Math.min(widthRatio, heightRatio, 1); // Максимум 1x (оригинальный размер)
    }, []);
    
    // Обработка загрузки изображения
    const handleImageLoad = () => {
        setImageLoaded(true);
        
        if (imageRef.current && containerRef.current) {
            const imgWidth = imageRef.current.naturalWidth;
            const imgHeight = imageRef.current.naturalHeight;
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            
            setImageDimensions({ width: imgWidth, height: imgHeight });
            setContainerDimensions({ width: containerWidth, height: containerHeight });
            
            // Рассчитываем оптимальный зум для начального отображения
            const optimalZoom = calculateOptimalZoom(imgWidth, imgHeight, containerWidth, containerHeight);
            setZoomLevel(optimalZoom);
            setInitialZoom(optimalZoom);
        }
    };
    
    // Обработка загрузки iframe
    const handleIframeLoad = () => {
        setIframeLoading(false);
        setIframeError(false);
        
        // Для кросс-оригин iframe нельзя получить доступ к содержимому,
        // поэтому используем альтернативные методы
        if (iframeRef.current) {
            // Устанавливаем разумную высоту для HTML документов
            if (isHtml) {
                // Для HTML устанавливаем фиксированную высоту
                iframeRef.current.style.height = '600px';
                iframeRef.current.style.minHeight = '400px';
            }
            
            // Прокручиваем к началу
            try {
                iframeRef.current.contentWindow.scrollTo(0, 0);
            } catch (e) {
                // Игнорируем ошибки кросс-оригина
            }
        }
    };
    
    // Обработка ошибки загрузки iframe
    const handleIframeError = () => {
        setIframeLoading(false);
        setIframeError(true);
    };
    
    // Обновление размеров контейнера при изменении окна
    useEffect(() => {
        const updateContainerSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setContainerDimensions({ width: clientWidth, height: clientHeight });
                
                // Пересчитываем зум при изменении размера контейнера
                if (imageDimensions.width && imageDimensions.height) {
                    const optimalZoom = calculateOptimalZoom(
                        imageDimensions.width, 
                        imageDimensions.height, 
                        clientWidth, 
                        clientHeight
                    );
                    // Если текущий зум меньше оптимального, увеличиваем до оптимального
                    if (zoomLevel < optimalZoom) {
                        setZoomLevel(optimalZoom);
                    }
                }
            }
        };
        
        updateContainerSize();
        window.addEventListener('resize', updateContainerSize);
        
        return () => {
            window.removeEventListener('resize', updateContainerSize);
        };
    }, [imageDimensions, zoomLevel, calculateOptimalZoom]);
    
    // Обработчики клавиш
    useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        
        const handleKeyDown = (e) => {
            if (e.key === '+') {
                e.preventDefault();
                setZoomLevel(prev => Math.min(prev + 0.1, 3));
            } else if (e.key === '-') {
                e.preventDefault();
                setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
            } else if (e.key === '0') {
                e.preventDefault();
                setZoomLevel(initialZoom);
                setPosition({ x: 0, y: 0 });
            }
        };
        
        document.addEventListener('keydown', handleEscapeKey);
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose, initialZoom]);
    
    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };
    
    // Обработчики для перетаскивания изображения
    const handleMouseDown = (e) => {
        if (zoomLevel > initialZoom) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };
    
    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    // Управление зумом
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
    const handleZoomReset = () => {
        setZoomLevel(initialZoom);
        setPosition({ x: 0, y: 0 });
    };
    
    // Функция для скачивания файла
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = evidence.title || 'evidence';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Загрузка текстовых файлов через fetch для избежания CORS
    const [textContent, setTextContent] = useState('');
    const [loadingText, setLoadingText] = useState(false);
    
    useEffect(() => {
        if (isText) {
            const loadTextContent = async () => {
                try {
                    setLoadingText(true);
                    const response = await fetch(fullUrl);
                    if (response.ok) {
                        const text = await response.text();
                        setTextContent(text);
                    } else {
                        throw new Error('Failed to load text file');
                    }
                } catch (error) {
                    console.error('Error loading text file:', error);
                    setIframeError(true);
                } finally {
                    setLoadingText(false);
                }
            };
            
            loadTextContent();
        }
    }, [isText, fullUrl]);
    
    // Сброс состояния при смене улики
    useEffect(() => {
        setIframeLoading(true);
        setIframeError(false);
        setTextContent('');
        setLoadingText(false);
    }, [evidence.id]);
    
    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={handleBackdropClick}
        >
            <div 
                className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()} 
                ref={modalRef}
            >
                {/* Заголовок */}
                <div className="bg-zinc-800 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div className="text-white text-xl font-normal font-hanken-grotesk">
                        {evidence.title}
                        <span className="text-sm text-white/70 ml-2">
                            {isImage ? '📷 Фотография' : 
                             isHtml ? '📄 Документ' : 
                             isPdf ? '📑 PDF' : 
                             isText ? '📝 Текстовый файл' : '📎 Файл'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Кнопка скачивания */}
                        <button 
                            onClick={handleDownload}
                            className="text-white hover:text-gray-300 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                            title="Скачать файл"
                        >
                            ⬇️ Скачать
                        </button>
                        
                        {isImage && imageLoaded && (
                            <div className="flex items-center gap-2 bg-black/30 rounded-full px-3 py-1">
                                <button 
                                    onClick={handleZoomOut}
                                    className="text-white hover:text-gray-300 text-lg w-6 h-6 flex items-center justify-center"
                                    title="Уменьшить (-)"
                                >
                                    -
                                </button>
                                <span className="text-white text-sm min-w-[40px] text-center">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <button 
                                    onClick={handleZoomIn}
                                    className="text-white hover:text-gray-300 text-lg w-6 h-6 flex items-center justify-center"
                                    title="Увеличить (+)"
                                >
                                    +
                                </button>
                                <button 
                                    onClick={handleZoomReset}
                                    className="text-white hover:text-gray-300 text-xs w-6 h-6 flex items-center justify-center ml-1"
                                    title="Сбросить зум (0)"
                                >
                                    ⟲
                                </button>
                            </div>
                        )}
                        
                        <button 
                            onClick={onClose}
                            className="text-white hover:text-gray-300 text-2xl transition-colors w-8 h-8 flex items-center justify-center"
                            title="Закрыть (ESC)"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                
                {/* Основной контент */}
                <div 
                    ref={containerRef}
                    className={`relative w-full bg-gray-900 flex-grow ${
                        isHtml || isPdf ? 'overflow-y-auto' : 'overflow-hidden'
                    }`}
                    style={{ 
                        minHeight: '400px',
                        maxHeight: 'calc(90vh - 140px)'
                    }}
                >
                    {isImage ? (
                        // Для изображений
                        <div 
                            className="w-full h-full flex items-center justify-center overflow-auto"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{
                                cursor: zoomLevel > initialZoom ? (isDragging ? 'grabbing' : 'grab') : 'default'
                            }}
                        >
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                    <span className="ml-3 text-white">Загрузка изображения...</span>
                                </div>
                            )}
                            
                            <img 
                                ref={imageRef}
                                src={fullUrl}
                                alt={evidence.title}
                                className={`transition-transform duration-200 ${
                                    imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                style={{
                                    transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                                    maxWidth: 'none',
                                    maxHeight: 'none',
                                }}
                                onLoad={handleImageLoad}
                                onMouseDown={handleMouseDown}
                                draggable={false}
                            />
                        </div>
                    ) : isHtml ? (
                        // Для HTML документов
                        <div className="w-full h-full flex flex-col">
                            {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                    <span className="ml-3 text-white">Загрузка HTML документа...</span>
                                </div>
                            )}
                            
                            {iframeError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-8">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">⚠️</div>
                                        <div className="text-white text-xl mb-4">Не удалось загрузить документ</div>
                                        <button
                                            onClick={handleDownload}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            ⬇️ Скачать файл для просмотра
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <iframe 
                                ref={iframeRef}
                                src={fullUrl}
                                title={`Улика: ${evidence.title}`}
                                className={`w-full border-0 transition-opacity duration-300 ${
                                    iframeLoading ? 'opacity-0 h-0' : 'opacity-100'
                                }`}
                                sandbox="allow-scripts allow-same-origin"
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                                style={{ 
                                    height: '100%',
                                    minHeight: '800px'
                                }}
                            />
                        </div>
                    ) : isPdf ? (
                        // Для PDF документов
                        <div className="w-full h-full flex flex-col">
                            {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                    <span className="ml-3 text-white">Загрузка PDF документа...</span>
                                </div>
                            )}
                            
                            <iframe 
                                src={fullUrl}
                                title={`Улика: ${evidence.title}`}
                                className={`w-full h-full border-0 transition-opacity duration-300 ${
                                    iframeLoading ? 'opacity-0' : 'opacity-100'
                                }`}
                                onLoad={() => setIframeLoading(false)}
                                onError={handleIframeError}
                            />
                        </div>
                    ) : isText ? (
                        // Для текстовых файлов - отображаем напрямую
                        <div className="w-full h-full p-6 overflow-auto">
                            {loadingText && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                    <span className="ml-3 text-white">Загрузка текста...</span>
                                </div>
                            )}
                            
                            {iframeError && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">⚠️</div>
                                    <div className="text-white text-xl mb-4">Не удалось загрузить текстовый файл</div>
                                    <button
                                        onClick={handleDownload}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        ⬇️ Скачать файл
                                    </button>
                                </div>
                            )}
                            
                            {!loadingText && textContent && (
                                <pre className="text-white font-mono text-sm whitespace-pre-wrap bg-gray-800 p-4 rounded-lg">
                                    {textContent}
                                </pre>
                            )}
                        </div>
                    ) : (
                        // Для других типов файлов
                        <div className="w-full h-full flex items-center justify-center p-8">
                            <div className="text-center max-w-md">
                                <div className="text-6xl mb-4">📄</div>
                                <div className="text-white text-xl mb-2">{evidence.title}</div>
                                <div className="text-gray-400 mb-4">{evidence.description}</div>
                                <div className="text-gray-500 bg-gray-800/50 p-4 rounded-lg">
                                    <p className="mb-2">
                                        <span className="text-gray-300">Тип файла:</span> {evidence.type || 'Неизвестно'}
                                    </p>
                                    <p className="mb-2">
                                        <span className="text-gray-300">MIME-тип:</span> {evidence.mime_type || 'Неизвестно'}
                                    </p>
                                    <p>
                                        <span className="text-gray-300">Размер:</span> {evidence.size ? Math.round(evidence.size / 1024) : '?'} KB
                                    </p>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    ⬇️ Скачать файл
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                
                {/* Подсказки по управлению (для изображений) */}
                {isImage && imageLoaded && zoomLevel > initialZoom && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs p-2 rounded backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <span>Перетащите для перемещения</span>
                            <div className="w-6 h-6 border border-white/50 rounded flex items-center justify-center">
                                👆
                            </div>
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
};

export default EvidenceViewer;