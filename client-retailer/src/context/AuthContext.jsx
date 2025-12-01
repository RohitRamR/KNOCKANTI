import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    axios.defaults.baseURL = 'http://localhost:5001/api';
    axios.defaults.withCredentials = true;

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const res = await axios.post('/auth/refresh');
            if (res.data.accessToken) {
                localStorage.setItem('token', res.data.accessToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
                const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
                setUser({ ...payload });
            }
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post('/auth/login', { email, password });
        const { accessToken, ...userData } = res.data;
        localStorage.setItem('token', accessToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    };

    const logout = async () => {
        await axios.post('/auth/logout');
        localStorage.removeItem('token');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
