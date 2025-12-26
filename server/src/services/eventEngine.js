// ============================================
// FILE: server/src/services/eventEngine.js
// VERSION: v2.2.0-alpha.1
// PURPOSE: Generador de eventos aleatorios (Caos Controlado)
// SPEC REF: T3.2 - EventEngine
// ============================================

const GameSettings = require('../models/GameSettings');
const Event = require('../models/Event');

// Probabilidad de evento (0.15 = 15%)
const EVENT_PROBABILITY = 0.15;

// Catálogo de Desastres y Milagros
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
 * Determina y aplica eventos para la NUEVA ronda.
 * @param {Number} nextRound - Número de la ronda que va a comenzar
 * @param {Object} session - Sesión de Mongoose (opcional)
 * @param {Boolean} forceEvent - Para testing: fuerza que ocurra algo
 */
exports.triggerEventForNextRound = async (nextRound, session = null, forceEvent = false) => {
    console.log(`🎲 EVENT ENGINE: Calculando destino para Ronda ${nextRound}...`);

    // 1. Obtener Settings
    const settings = await GameSettings.findOne({ isActive: true }).session(session);
    if (!settings) throw new Error("Settings not found");

    // 2. Reiniciar Modificadores (Vuelta a la normalidad)
    settings.currentModifiers = {
        logisticsCost: 1.0,
        rawMaterialCost: 1.0,
        demand: 1.0
    };

    // 3. Tirar los dados
    const roll = Math.random();
    const shouldTrigger = forceEvent || (roll < EVENT_PROBABILITY);

    if (!shouldTrigger) {
        console.log(`   ☀️ Clima tranquilo. Sin eventos.`);
        await settings.save({ session });
        return null;
    }

    // 4. Seleccionar Evento Aleatorio
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    
    // 5. Aplicar Efectos
    scenario.apply(settings.currentModifiers);
    await settings.save({ session });

    // 6. Publicar Noticia
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