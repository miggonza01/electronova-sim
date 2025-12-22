// server/test-socket-listener.js
const io = require('socket.io-client');

// Conectarse al servidor local
const socket = io('http://localhost:5000');

console.log('>>> INICIANDO ESCUCHA DE SOCKETS (Simulando Estudiante)...');

socket.on('connect', () => {
  console.log('✅ CONECTADO AL SERVIDOR DE JUEGO via WebSocket');
  
  // Unirse a la sala
  socket.emit('join_game_room', { email: 'estudiante_espia@test.com' });
});

// Escuchar el evento de cambio de ronda
socket.on('round_changed', (data) => {
  console.log('\n🔔 ¡ALERTA! EL SERVIDOR DICE QUE LA RONDA CAMBIÓ');
  console.log(`   Nueva Ronda: ${data.round}`);
  console.log(`   Mensaje: ${data.message}`);
  console.log('   (Aquí el Frontend recargaría los datos automáticamente)\n');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
});