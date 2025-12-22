// server/src/sockets/socketHandler.js

/**
 * GESTOR DE WEBSOCKETS (Tiempo Real)
 * Aquí definimos cómo reacciona el servidor cuando alguien se conecta.
 */

let io; // Variable para guardar la instancia de Socket.io

const socketHandler = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    // Esto se ejecuta cada vez que un navegador (Frontend) se conecta
    console.log(`⚡ Nuevo cliente conectado: ${socket.id}`);

    // EVENTO: Unirse a la sala del juego
    // Los estudiantes se "suscriben" a las actualizaciones
    socket.on('join_game_room', (data) => {
      socket.join('game_room');
      console.log(`👤 Usuario ${data?.email || 'Anónimo'} se unió a la sala de juego.`);
    });

    // EVENTO: Desconexión
    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });
};

// Función para enviar notificaciones a TODOS los conectados
// La usaremos desde los controladores (Admin)
const notifyRoundChange = (newRound) => {
  if (io) {
    console.log(`📡 Emitiendo evento ROUND_CHANGE: Ronda ${newRound}`);
    // Emitimos a todos en la sala 'game_room'
    io.to('game_room').emit('round_changed', {
      round: newRound,
      message: '¡La ronda ha finalizado! Actualizando datos...'
    });
  }
};

module.exports = { socketHandler, notifyRoundChange };