// server/src/controllers/adminController.js
const { processRound } = require('../services/roundProcessor');
const GlobalConfig = require('../models/GlobalConfig');
const { notifyRoundChange } = require('../sockets/socketHandler');

// @desc    Forzar el cierre de ronda y procesar mercado
// @route   POST /api/admin/process-round
// @desc    Forzar el cierre de ronda y procesar mercado
// @route   POST /api/admin/process-round
// Controlador para disparar el procesamiento de una ronda completa
exports.triggerRoundProcessing = async (req, res) => {
  try {
    // 1. OBTENER CONFIGURACIÓN GLOBAL
    // Busca en la base de datos la configuración actual del juego
    // La configuración contiene parámetros como: ronda actual, estado del juego, etc.
    let config = await GlobalConfig.findOne();
    if (!config) {
      // Si no existe configuración, retorna error 404
      return res.status(404).json({ success: false, error: 'Configuración no encontrada.' });
    }

    // 2. VALIDAR SI EL JUEGO ESTÁ ACTIVO
    // Verifica que el juego no esté pausado antes de procesar la ronda
    // Esto previene procesamiento accidental cuando el administrador ha pausado el juego
    if (!config.gameActive) {
      return res.status(400).json({ success: false, error: 'El juego está pausado.' });
    }

    // 3. PROCESAR LA RONDA
    // Llama al servicio roundProcessor para ejecutar toda la lógica de la ronda:
    // - Calcula ventas de cada empresa
    // - Actualiza inventarios (FIFO)
    // - Envejece inventario y calcula costos
    // - Actualiza estados financieros
    // - NO incrementa la ronda aquí (lo hace después el paso 4)
    const results = await processRound(config);

    // 4. ACTUALIZAR RONDA EN LA CONFIGURACIÓN GLOBAL
    // Incrementa el contador de ronda y guarda en la base de datos
    // NOTA: Este incremento se hace DESPUÉS de procesar la ronda actual
    // porque processRound() trabaja con la ronda actual (no la siguiente)
    config.currentRound += 1;
    await config.save();

    // 5. NOTIFICACIÓN EN TIEMPO REAL (SOCKETS) <--- NUEVO
    // Envía notificación a todos los clientes conectados vía WebSockets
    // Esto permite que las interfaces de usuario se actualicen automáticamente
    // sin necesidad de recargar la página
    notifyRoundChange(config.currentRound);

    // 6. RESPUESTA EXITOSA AL CLIENTE
    // Retorna un objeto JSON con:
    // - success: indicador de operación exitosa
    // - message: descripción amigable del resultado
    // - data: contiene los resultados detallados de la ronda y la nueva ronda
    res.status(200).json({
      success: true,
      message: `Ronda procesada. Nueva Ronda: ${config.currentRound}`,
      data: {
        results,  // Resultados detallados del mercado por empresa
        newRound: config.currentRound  // Número de la nueva ronda
      }
    });

  } catch (error) {
    // 7. MANEJO DE ERRORES
    // Captura cualquier excepción no controlada durante el procesamiento
    console.error("Error en triggerRoundProcessing:", error);
    
    // Retorna error 500 (Internal Server Error) con detalles:
    // - success: false indica fallo
    // - error: mensaje genérico para el cliente
    // - details: mensaje específico del error (útil para depuración)
    res.status(500).json({ 
        success: false, 
        error: 'Error crítico al procesar ronda', 
        details: error.message 
    });
  }
};

// @desc    Obtener configuración global del juego
// @route   GET /api/admin/config
exports.getGameConfig = async (req, res) => {
  try {
    // Buscamos la ÚNICA configuración global (o creamos una si no existe)
    let config = await GlobalConfig.findOne();
    if (!config) {
      // Si no existe, creamos una por defecto para que no falle
      config = await GlobalConfig.create({}); // Crea con valores por defecto
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error al obtener configuración' });
  }
};