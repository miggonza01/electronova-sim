// ============================================
// FILE: server/src/services/eventEngine.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: Generador de eventos aleatorios (Modifica Game.config)
// ============================================

const Event = require('../models/Event');

const EVENT_PROBABILITY = 0.15;

const SCENARIOS = [
    {
        type: 'LOGISTICS_STRIKE',
        title: '⚠️ Huelga de Transportistas',
        message: 'El sindicato logístico ha paralizado las rutas. Los costos de envío se duplican temporalmente.',
        severity: 'warning',
        apply: (modifiers) => { modifiers.logisticsCost = 2.0; }
    },
    {
        type: 'MATERIAL_SHORTAGE',
        title: '📉 Escasez de Materias Primas',
        message: 'Una crisis en las minas de silicio ha disparado el costo de los insumos un 50%.',
        severity: 'danger',
        apply: (modifiers) => { modifiers.rawMaterialCost = 1.5; }
    },
    {
        type: 'MARKET_BOOM',
        title: '🚀 Boom Económico',
        message: 'La confianza del consumidor está por las nubes. La demanda global aumenta un 30%.',
        severity: 'success',
        apply: (modifiers) => { modifiers.demand = 1.3; }
    },
    {
        type: 'MARKET_CRASH',
        title: '📉 Recesión Global',
        message: 'Incertidumbre en los mercados financieros. La demanda se contrae un 20%.',
        severity: 'danger',
        apply: (modifiers) => { modifiers.demand = 0.8; }
    }
];

/**
 * Determina y aplica eventos para la NUEVA ronda de un JUEGO específico.
 * @param {Object} game - Documento del Juego (Mongoose Document)
 * @param {Object} session - Sesión de transacción
 * @param {Boolean} forceEvent - Para testing
 */
exports.triggerEventForNextRound = async (game, session = null, forceEvent = false) => {
    const nextRound = game.currentRound + 1;
    console.log(`🎲 EVENT ENGINE: Calculando destino para ${game.code} Ronda ${nextRound}...`);

    // 1. Resetear Modificadores (Vuelta a la normalidad para la nueva ronda)
    // Importante: Mongoose requiere reasignar el objeto o marcar como modificado si es Mixed, 
    // pero aquí está definido en el Schema, así que asignamos directo.
    game.config.modifiers = {
        logisticsCost: 1.0,
        rawMaterialCost: 1.0,
        demand: 1.0
    };

    // 2. Tirar los dados
    const roll = Math.random();
    const shouldTrigger = forceEvent || (roll < EVENT_PROBABILITY);

    if (!shouldTrigger) {
        console.log(`   ☀️ Clima tranquilo. Sin eventos.`);
        // No creamos documento Event, solo guardamos el reset de modificadores (que se hará al guardar el game)
        return null;
    }

    // 3. Seleccionar Evento
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    
    // 4. Aplicar Efectos (Modifica el objeto game en memoria)
    scenario.apply(game.config.modifiers);

    // 5. Publicar Noticia (Persistencia)
    // TODO: En Fase 5 completa, agregar gameId al esquema Event para filtrar noticias por sala.
    // Por ahora, creamos el evento genérico (visible si filtramos por ronda, pero idealmente por gameId).
    const newEvent = new Event({
        round: nextRound,
        type: scenario.type,
        title: scenario.title,
        message: scenario.message,
        severity: scenario.severity,
        duration: 1
    });
    
    await newEvent.save({ session });

    console.log(`   ⚡ EVENTO ACTIVADO: ${scenario.title}`);
    return newEvent;
};