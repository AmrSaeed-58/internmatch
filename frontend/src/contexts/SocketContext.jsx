import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !user) {
      // Disconnect if logged out
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');

    const s = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      // Connected
    });

    s.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
