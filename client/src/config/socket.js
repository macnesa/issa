import io from 'socket.io-client';
const socket = io('http://localhost:3000');
// const socket = io('https://issa.rhazzid.site');

export default socket;
