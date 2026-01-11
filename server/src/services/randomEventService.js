// ============================================
// FILE: server/src/services/randomEventService.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Motor de Eventos Aleatorios del Simulador
// CHANGE LOG: New service for random events management
// SPEC REF: "4.2 - Eventos Aleatorios"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const RandomEvent = require('../models/RandomEvent');
const Game = require('../models/Game');

/**
 * Servicio de Gestión de Eventos Aleatorios
 * Controla la generación, aplicación y seguimiento de eventos aleatorios
 */
class RandomEventService {
    constructor() {
        this.eventCache = new Map(); // Cache de eventos para rendimiento
    }

    /**
     * Inicializar eventos aleatorios del sistema
     */
    async initializeEvents() {
        console.log('🎲 SERVICE: Inicializando Eventos Aleatorios...');
        
        try {
            // Verificar si ya existen eventos
            const existingEvents = await RandomEvent.countDocuments();
            if (existingEvents > 0) {
                console.log(`✅ Ya existen ${existingEvents} eventos aleatorios en el sistema`);
                return;
            }

            // Definir eventos aleatorios del simulador
            const events = [
                // Eventos de Demanda
                {
                    eventId: 'DEMAND_BOOM',
                    name: 'Auge de Demanda',
                    category: 'DEMAND',
                    description: {
                        technical: 'Incremento súbito de la demanda del mercado debido a factores externos',
                        user: '¡Auge inesperado en el mercado! Los consumidores están comprando más productos'
                    },
                    impact: {
                        demand: 1.5, // +50% demanda
                        logisticsCost: 1.1 // +10% costo logístico por sobrecarga
                    },
                    probability: 0.15,
                    restrictions: {
                        minRound: 2
                    },
                    duration: 2
                },
                {
                    eventId: 'DEMAND_CRASH',
                    name: 'Caída de Demanda',
                    category: 'DEMAND',
                    description: {
                        technical: 'Reducción drástica de la demanda por factores económicos',
                        user: 'Recesión inesperada: Los consumidores han reducido sus compras'
                    },
                    impact: {
                        demand: 0.6, // -40% demanda
                        logisticsCost: 0.9 // -10% costo logístico por menor volumen
                    },
                    probability: 0.10,
                    restrictions: {
                        minRound: 3
                    },
                    duration: 2
                },
                
                // Eventos de Suministro
                {
                    eventId: 'RAW_MATERIAL_CRISIS',
                    name: 'Crisis de Materia Prima',
                    category: 'SUPPLY',
                    description: {
                        technical: 'Escasez de materias primas en el mercado global',
                        user: 'Crisis de suministro: Los costos de materia prima han aumentado drásticamente'
                    },
                    impact: {
                        rawMaterialCost: 1.8, // +80% costo MP
                        productionCapacity: 0.8 // -20% capacidad por escasez
                    },
                    probability: 0.12,
                    restrictions: {
                        minRound: 2
                    },
                    duration: 3
                },
                {
                    eventId: 'SUPPLY_GLUT',
                    name: 'Exceso de Suministro',
                    category: 'SUPPLY',
                    description: {
                        technical: 'Sobreabundancia de materias primas en el mercado',
                        user: 'Buenas noticias: Exceso de oferta ha reducido los costos de materia prima'
                    },
                    impact: {
                        rawMaterialCost: 0.7, // -30% costo MP
                        logisticsCost: 1.2 // +20% costo por mayor volumen
                    },
                    probability: 0.08,
                    restrictions: {
                        minRound: 2
                    },
                    duration: 2
                },
                
                // Eventos Logísticos
                {
                    eventId: 'LOGISTICS_CRISIS',
                    name: 'Crisis Logística',
                    category: 'LOGISTICS',
                    description: {
                        technical: 'Problemas en la cadena de suministro global',
                        user: 'Crisis logística: Los costos de distribución han aumentado significativamente'
                    },
                    impact: {
                        logisticsCost: 2.0, // +100% costo logístico
                        demand: 0.8 // -20% demanda por problemas de distribución
                    },
                    probability: 0.10,
                    restrictions: {
                        minRound: 2
                    },
                    duration: 2
                },
                {
                    eventId: 'LOGISTICS_OPTIMIZATION',
                    name: 'Optimización Logística',
                    category: 'LOGISTICS',
                    description: {
                        technical: 'Nuevas tecnologías mejoran la eficiencia logística',
                        user: 'Avance tecnológico: Se han optimizado las rutas de distribución'
                    },
                    impact: {
                        logisticsCost: 0.7, // -30% costo logístico
                        demand: 1.1 // +10% demanda por mejor servicio
                    },
                    probability: 0.08,
                    restrictions: {
                        minRound: 3
                    },
                    duration: 3
                },
                
                // Eventos Económicos
                {
                    eventId: 'ECONOMIC_BOOM',
                    name: 'Auge Económico',
                    category: 'ECONOMIC',
                    description: {
                        technical: 'Crecimiento económico general del mercado',
                        user: 'Auge económico: Mayor poder adquisitivo de los consumidores'
                    },
                    impact: {
                        demand: 1.3, // +30% demanda
                        logisticsCost: 1.1 // +10% costo por mayor actividad
                    },
                    probability: 0.12,
                    restrictions: {
                        minRound: 2
                    },
                    duration: 2
                },
                {
                    eventId: 'ECONOMIC RECESSION',
                    name: 'Recesión Económica',
                    category: 'ECONOMIC',
                    description: {
                        technical: 'Contracción económica del mercado',
                        user: 'Recesión económica: Los consumidores reducen su gasto'
                    },
                    impact: {
                        demand: 0.7, // -30% demanda
                        logisticsCost: 0.9 // -10% costo por menor actividad
                    },
                    probability: 0.10,
                    restrictions: {
                        minRound: 3
                    },
                    duration: 2
                },
                
                // Eventos Tecnológicos
                {
                    eventId: 'TECH_INNOVATION',
                    name: 'Innovación Tecnológica',
                    category: 'TECHNOLOGY',
                    description: {
                        technical: 'Nuevas tecnologías mejoran la eficiencia productiva',
                        user: 'Innovación tecnológica: Nuevas mejoras en la producción'
                    },
                    impact: {
                        productionCapacity: 1.2, // +20% capacidad
                        techLevel: 1.1 // +10% nivel tecnológico
                    },
                    probability: 0.08,
                    restrictions: {
                        minRound: 3
                    },
                    duration: 3
                },
                
                // Eventos Regulatorios
                {
                    eventId: 'ENVIRONMENTAL_REGULATION',
                    name: 'Regulación Ambiental',
                    category: 'REGULATORY',
                    description: {
                        technical: 'Nuevas regulaciones ambientales afectan los costos',
                        user: 'Nuevas regulaciones: Se requieren procesos más sostenibles'
                    },
                    impact: {
                        rawMaterialCost: 1.2, // +20% costo por materiales sostenibles
                        ethicsIndex: 1.1 // +10% ética por cumplimiento
                    },
                    probability: 0.06,
                    restrictions: {
                        minRound: 4
                    },
                    duration: 4
                }
            ];

            // Insertar eventos en la base de datos
            await RandomEvent.insertMany(events);
            console.log(`✅ Se han creado ${events.length} eventos aleatorios`);

            // Actualizar cache
            await this.refreshEventCache();

        } catch (error) {
            console.error('❌ Error inicializando eventos aleatorios:', error);
            throw error;
        }
    }

    /**
     * Actualizar cache de eventos
     */
    async refreshEventCache() {
        try {
            const events = await RandomEvent.find({ isActive: true });
            this.eventCache.clear();
            
            for (const event of events) {
                this.eventCache.set(event.eventId, event);
            }
            
            console.log(`✅ Cache actualizado: ${this.eventCache.size} eventos activos`);
        } catch (error) {
            console.error('❌ Error actualizando cache de eventos:', error);
        }
    }

    /**
     * Determinar si ocurre un evento aleatorio en una ronda
     */
    async shouldTriggerRandomEvent(game, round) {
        try {
            // Verificar configuración del juego
            if (!game.config.randomEvents.enabled) {
                return false;
            }

            // Verificar ronda mínima
            if (round < game.config.randomEvents.startRound) {
                return false;
            }

            // Verificar si ya hay un evento activo para esta ronda
            const existingEvent = game.eventHistory.find(event => event.round === round);
            if (existingEvent && game.config.randomEvents.maxOnePerRound) {
                return false;
            }

            // Calcular probabilidad
            const randomValue = Math.random();
            const shouldTrigger = randomValue < game.config.randomEvents.probability;

            console.log(`🎲 EVENTO: Ronda ${round}, Probabilidad: ${game.config.randomEvents.probability}, Valor: ${randomValue.toFixed(3)}, Trigger: ${shouldTrigger}`);

            return shouldTrigger;

        } catch (error) {
            console.error('❌ Error determinando evento aleatorio:', error);
            return false;
        }
    }

    /**
     * Seleccionar un evento aleatorio basado en restricciones
     */
    async selectRandomEvent(game, round) {
        try {
            // Obtener eventos disponibles
            const availableEvents = await RandomEvent.find({ 
                isActive: true,
                'restrictions.minRound': { $lte: round }
            });

            // Filtrar por restricciones de ronda máxima
            const validEvents = availableEvents.filter(event => {
                if (event.restrictions.maxRound && event.restrictions.maxRound < round) {
                    return false;
                }
                return true;
            });

            if (validEvents.length === 0) {
                console.log('⚠️ No hay eventos válidos para esta ronda');
                return null;
            }

            // Seleccionar evento aleatorio ponderado por probabilidad
            const totalProbability = validEvents.reduce((sum, event) => sum + event.probability, 0);
            let randomValue = Math.random() * totalProbability;
            
            for (const event of validEvents) {
                randomValue -= event.probability;
                if (randomValue <= 0) {
                    console.log(`🎲 EVENTO SELECCIONADO: ${event.name} (${event.eventId})`);
                    return event;
                }
            }

            // Si no se seleccionó ninguno (redondeo), retornar el último
            return validEvents[validEvents.length - 1];

        } catch (error) {
            console.error('❌ Error seleccionando evento aleatorio:', error);
            return null;
        }
    }

    /**
     * Aplicar efectos de un evento aleatorio
     */
    async applyRandomEvent(game, event, round) {
        try {
            console.log(`⚡ APLICANDO EVENTO: ${event.name} en ronda ${round}`);

            // Crear entrada en historial
            const eventHistoryEntry = {
                round: round,
                eventId: event.eventId,
                eventName: event.name,
                eventDescription: event.description.user,
                eventImpact: this.generateImpactDescription(event),
                triggeredAt: new Date(),
                modifiers: {
                    demand: event.impact.demand !== 1.0 ? event.impact.demand : undefined,
                    logisticsCost: event.impact.logisticsCost !== 1.0 ? event.impact.logisticsCost : undefined,
                    rawMaterialCost: event.impact.rawMaterialCost !== 1.0 ? event.impact.rawMaterialCost : undefined,
                    productionCapacity: event.impact.productionCapacity !== 1.0 ? event.impact.productionCapacity : undefined
                }
            };

            // Agregar al historial del juego
            game.eventHistory.push(eventHistoryEntry);

            // Aplicar modificadores a la configuración del juego
            if (event.impact.demand !== 1.0) {
                game.config.modifiers.demand *= event.impact.demand;
            }
            if (event.impact.logisticsCost !== 1.0) {
                game.config.modifiers.logisticsCost *= event.impact.logisticsCost;
            }
            if (event.impact.rawMaterialCost !== 1.0) {
                game.config.modifiers.rawMaterialCost *= event.impact.rawMaterialCost;
            }

            // Guardar cambios
            await game.save();

            console.log(`✅ Evento aplicado: ${event.name}`);
            console.log(`   - Demanda: x${event.impact.demand}`);
            console.log(`   - Costo Logístico: x${event.impact.logisticsCost}`);
            console.log(`   - Costo MP: x${event.impact.rawMaterialCost}`);

            return eventHistoryEntry;

        } catch (error) {
            console.error('❌ Error aplicando evento aleatorio:', error);
            throw error;
        }
    }

    /**
     * Generar descripción del impacto para usuarios
     */
    generateImpactDescription(event) {
        const impacts = [];

        if (event.impact.demand !== 1.0) {
            const change = (event.impact.demand - 1) * 100;
            impacts.push(`Demanda ${change > 0 ? '+' : ''}${change.toFixed(0)}%`);
        }

        if (event.impact.logisticsCost !== 1.0) {
            const change = (event.impact.logisticsCost - 1) * 100;
            impacts.push(`Costos Logísticos ${change > 0 ? '+' : ''}${change.toFixed(0)}%`);
        }

        if (event.impact.rawMaterialCost !== 1.0) {
            const change = (event.impact.rawMaterialCost - 1) * 100;
            impacts.push(`Costos Materia Prima ${change > 0 ? '+' : ''}${change.toFixed(0)}%`);
        }

        if (event.impact.productionCapacity !== 1.0) {
            const change = (event.impact.productionCapacity - 1) * 100;
            impacts.push(`Capacidad Producción ${change > 0 ? '+' : ''}${change.toFixed(0)}%`);
        }

        return impacts.length > 0 ? impacts.join(', ') : 'Sin efectos directos';
    }

    /**
     * Obtener historial de eventos para un juego
     */
    async getEventHistory(gameId) {
        try {
            const game = await Game.findById(gameId).select('eventHistory currentRound');
            
            if (!game) {
                throw new Error('Juego no encontrado');
            }

            return {
                currentRound: game.currentRound,
                events: game.eventHistory.sort((a, b) => b.round - a.round)
            };

        } catch (error) {
            console.error('❌ Error obteniendo historial de eventos:', error);
            throw error;
        }
    }

    /**
     * Procesar eventos para una ronda específica
     */
    async processRoundEvents(game, round) {
        try {
            console.log(`🎲 PROCESANDO EVENTOS RONDA ${round}`);

            // Verificar si debe ocurrir un evento
            const shouldTrigger = await this.shouldTriggerRandomEvent(game, round);
            
            if (!shouldTrigger) {
                console.log('📊 No hay eventos aleatorios esta ronda');
                return null;
            }

            // Seleccionar y aplicar evento
            const selectedEvent = await this.selectRandomEvent(game, round);
            
            if (!selectedEvent) {
                console.log('⚠️ No se pudo seleccionar un evento válido');
                return null;
            }

            const eventResult = await this.applyRandomEvent(game, selectedEvent, round);
            
            console.log(`🎉 EVENTO APLICADO: ${selectedEvent.name}`);
            
            return eventResult;

        } catch (error) {
            console.error('❌ Error procesando eventos de ronda:', error);
            throw error;
        }
    }

    /**
     * Limpiar eventos expirados (basado en duración)
     */
    async cleanupExpiredEvents(game, currentRound) {
        try {
            // Los eventos con duración limitada podrían necesitar limpieza
            // Por ahora, los eventos se aplican como modificadores permanentes
            // hasta el final del juego o hasta que ocurra otro evento
            
            console.log('🧹 Limpieza de eventos expirados (no implementado aún)');
            
        } catch (error) {
            console.error('❌ Error limpiando eventos expirados:', error);
        }
    }
}

// Exportar instancia del servicio
module.exports = new RandomEventService();