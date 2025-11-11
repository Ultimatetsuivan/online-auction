import { io } from 'socket.io-client';
import { apiConfig, getAuthToken } from './config/api';

const token = getAuthToken();

export const socket = io(apiConfig.socketURL, {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket'],
  withCredentials: true,
  query: token ? { token } : {}
});

// Add connection status listeners
socket.on('connect', () => console.log('Connected to WebSocket'));
socket.on('disconnect', () => console.log('Disconnected from WebSocket'));
socket.on('connect_error', (err) => console.log('Connection error:', err));