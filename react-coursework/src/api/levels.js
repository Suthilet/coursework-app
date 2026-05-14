// api/levels.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api'; // Добавьте /api здесь

export const levelsAPI = {
    // Получить все уровни (дела) для дашборда
    getLevels: async () => {
        const token = localStorage.getItem('token');
        console.log('Fetching levels with token:', token ? 'present' : 'missing');
        
        try {
            const response = await axios.get(`${API_URL}/cases`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Levels API response:', response.data);
            
            // Проверяем разные структуры ответа
            if (response.data && Array.isArray(response.data)) {
                return response.data;
            } else if (response.data && response.data.cases) {
                return response.data.cases;
            } else if (response.data && response.data.data) {
                return response.data.data;
            } else {
                console.warn('Unexpected response structure:', response.data);
                return [];
            }
            
        } catch (error) {
            console.error('Error fetching levels from API:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    },
    
    // Получить прогресс пользователя
    getUserProgress: async () => {
        const token = localStorage.getItem('token');
        console.log('Fetching progress with token:', token ? 'present' : 'missing');
        
        try {
            const response = await axios.get(`${API_URL}/progress/my/progress`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Progress API response:', response.data);
            return response.data;
            
        } catch (error) {
            console.error('Error fetching user progress:', error);
            // Возвращаем пустой прогресс при ошибке
            return { progress: [] };
        }
    },
    
     getLevelProgress: async (levelId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/progress/case/${levelId}/progress`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching level progress:', error);
            return { 
                is_completed: false,
                selected_suspect_name: null,
                selected_suspect_id: null
            };
        }
    },
    
    // Проверить ответ
    submitAnswer: async (levelId, suspectId) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/progress/case/${levelId}/check`, 
            { suspect_id: suspectId },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    },
    
    // Начать уровень
    startLevel: async (levelId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${API_URL}/progress/case/${levelId}/start`, 
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error starting level:', error);
            return { success: true };
        }
    },
    
    // Получить улики для уровня
    getEvidence: async (levelId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/evidence/case/${levelId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.evidence || response.data.evidences || [];
        } catch (error) {
            console.error('Error fetching evidence:', error);
            throw error;
        }
    },
    
    // Получить список всех подозреваемых для уровня
    getCriminals: async (levelId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/suspects/case/${levelId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.suspects || [];
        } catch (error) {
            console.error('Error fetching criminals:', error);
            throw error;
        }
    },
    
    // Выполнить SQL-подобный запрос
    executeQuery: async (levelId, query) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${API_URL}/cases/${levelId}/query`, 
                { query: query },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    },
    
    // // Проверить ответ (отправить выбранного подозреваемого)
    // submitAnswer: async (levelId, suspectId) => {
    //     const token = localStorage.getItem('token');
    //     try {
    //         const response = await axios.post(`${API_URL}/cases/${levelId}/check-answer`, 
    //             { suspect_id: suspectId },
    //             {
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`,
    //                     'Content-Type': 'application/json'
    //                 }
    //             }
    //         );
    //         return response.data;
    //     } catch (error) {
    //         console.error('Error submitting answer:', error);
    //         throw error;
    //     }
    // },
    
    // // Начать уровень (обновить прогресс)
    // startLevel: async (levelId) => {
    //     const token = localStorage.getItem('token');
    //     try {
    //         const response = await axios.post(`${API_URL}/progress/case/${levelId}/start`, 
    //             {},
    //             {
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`,
    //                     'Content-Type': 'application/json'
    //                 }
    //             }
    //         );
    //         return response.data;
    //     } catch (error) {
    //         console.error('Error starting level:', error);
    //         // Если нет метода start, просто вернем успех
    //         return { success: true };
    //     }
    // }
};