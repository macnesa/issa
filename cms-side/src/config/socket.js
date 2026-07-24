import io from 'socket.io-client';
import baseUrl from './api';

const socket = io(baseUrl);

export default socket;
