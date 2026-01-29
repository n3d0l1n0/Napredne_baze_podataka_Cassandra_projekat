export const API_BASE_URL = 'http://localhost:5000/api';
export const STUDENT_ID = 's002';

export async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP greška! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Greška pri dobavljanju podataka:', error);
        return [];
    }
}

export async function sendData(endpoint, method = 'POST', data = null) {
    const options = {
        method: method,
        headers: {}
    };

    if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`HTTP greška! Status: ${response.status}`);
        
        if (response.status === 204) return true;
        
        return await response.json();
    } catch (error) {
        console.error("Greška pri slanju podataka:", error);
        return null;
    }
}