import { createContext, useContext, useReducer, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'AUTH_LOADED':
      return { ...state, user: action.payload, loading: false };
    case 'AUTH_LOGOUT':
      return { ...state, user: null, token: null, loading: false };
    case 'AUTH_ERROR':
      return { ...state, user: null, token: null, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount, verify existing token
  useEffect(() => {
    const loadUser = async () => {
      if (!state.token) {
        dispatch({ type: 'AUTH_ERROR' });
        return;
      }
      try {
        const res = await API.get('/auth/me');
        dispatch({ type: 'AUTH_LOADED', payload: res.data.data });
      } catch {
        localStorage.removeItem('token');
        dispatch({ type: 'AUTH_ERROR' });
      }
    };
    loadUser();
  }, [state.token]);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    dispatch({ type: 'AUTH_SUCCESS', payload: { token, user } });
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch {
      // Logout should always succeed on the client side
    }
    localStorage.removeItem('token');
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
