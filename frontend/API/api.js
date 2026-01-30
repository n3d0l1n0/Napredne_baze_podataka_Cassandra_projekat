export const API_BASE_URL = 'http://localhost:5000/api';

export function getStudent() {
    const studentData = localStorage.getItem('student');
    try {
        return studentData ? JSON.parse(studentData) : null;
    } catch (e) {
        localStorage.removeItem('student');
        return null;
    }
}

export async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('student');
                window.location.reload();
            }
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
        if (!response.ok) {
            if (response.status === 401 && endpoint !== '/auth/login') {
                localStorage.removeItem('student');
                window.location.reload();
            }
            throw new Error(`HTTP greška! Status: ${response.status}`);
        }
        
        if (response.status === 204) return true;

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } 
        return true;

    } catch (error) {
        console.error("Greška pri slanju podataka:", error);
        return null;
    }
}