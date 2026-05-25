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

