// ============================================
// FILE: server/test/randomEventService-test.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Testing Suite para Random Event Service
// CHANGE LOG: Initial test suite for random events validation
// SPEC REF: "4.2 - Eventos Aleatorios"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const mongoose = require('mongoose');
const randomEventService = require('../src/services/randomEventService');
const Game = require('../src/models/Game');
const RandomEvent = require('../src/models/RandomEvent');

/**
 * Test Suite para Random Event Service
 * Validación del sistema de eventos aleatorios
 */
class RandomEventServiceTestSuite {
    constructor() {
        this.testResults = [];
        this.testData = {};
    }

    /**
     * Inicializar entorno de pruebas
     */
    async setup() {
        console.log('🧪 SETUP: Inicializando entorno de pruebas para Random Event Service...');
        
        try {
            // Conectar a base de datos de pruebas
            await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/electronova-test');
            console.log('✅ MongoDB conectado para pruebas');

            // Inicializar eventos aleatorios
            await randomEventService.initializeEvents();
            console.log('✅ Eventos aleatorios inicializados');

            // Crear datos de prueba
            await this.createTestData();
            console.log('✅ Datos de prueba creados');

        } catch (error) {
            console.error('❌ Error en setup:', error);
            throw error;
        }
    }

    /**
     * Crear datos de prueba
     */
    async createTestData() {
        // Crear juego de prueba con eventos aleatorios configurados
        const testGame = new Game({
            name: 'Juego Prueba Eventos',
            code: 'TEST-EVENTS',
            adminId: new mongoose.Types.ObjectId(),
            status: 'ACTIVE',
            currentRound: 2,
            config: {
                maxRounds: 8,
                initialCash: 500000,
                totalProductionCapacity: 6000,
                randomEvents: {
                    enabled: true,
                    startRound: 2,
                    probability: 0.5, // 50% para pruebas
                    maxOnePerRound: true
                },
                modifiers: {
                    logisticsCost: 1.0,
                    rawMaterialCost: 1.0,
                    demand: 1.0
                }
            }
        });
        this.testData.game = await testGame.save();

        console.log('📊 Datos de prueba configurados:');
        console.log(`   - Game: ${this.testData.game.code}`);
        console.log(`   - Current Round: ${this.testData.game.currentRound}`);
        console.log(`   - Random Events: ${JSON.stringify(this.testData.game.config.randomEvents)}`);
    }

    /**
     * Test 1: Validación de inicialización de eventos
     */
    async testEventInitialization() {
        console.log('\n🧪 TEST 1: Validación de Inicialización de Eventos');
        
        try {
            // Verificar que se crearon eventos
            const eventCount = await RandomEvent.countDocuments({ isActive: true });
            
            if (eventCount === 0) {
                throw new Error('No se crearon eventos aleatorios');
            }

            // Verificar categorías de eventos
            const categories = await RandomEvent.distinct('category');
            const expectedCategories = ['DEMAND', 'SUPPLY', 'LOGISTICS', 'ECONOMIC', 'TECHNOLOGY', 'REGULATORY'];
            
            for (const category of expectedCategories) {
                if (!categories.includes(category)) {
                    throw new Error(`Falta categoría de eventos: ${category}`);
                }
            }

            // Verificar cache del servicio
            if (randomEventService.eventCache.size === 0) {
                throw new Error('Cache de eventos no está inicializado');
            }

            this.testResults.push({
                test: 'EventInitialization',
                status: 'PASS',
                message: `Eventos inicializados correctamente: ${eventCount} eventos, ${categories.length} categorías`,
                details: { eventCount, categories, cacheSize: randomEventService.eventCache.size }
            });

            console.log(`✅ TEST 1 PASADO: ${eventCount} eventos creados en ${categories.length} categorías`);
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EventInitialization',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 1 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 2: Validación de lógica de probabilidad
     */
    async testProbabilityLogic() {
        console.log('\n🧪 TEST 2: Validación de Lógica de Probabilidad');
        
        try {
            const game = this.testData.game;
            const round = 2;

            // Test 2.1: Evento debería ocurrir con probabilidad alta
            game.config.randomEvents.probability = 1.0; // 100%
            const shouldTriggerHigh = await randomEventService.shouldTriggerRandomEvent(game, round);
            
            if (!shouldTriggerHigh) {
                throw new Error('Evento debería ocurrir con probabilidad 100%');
            }

            // Test 2.2: Evento no debería ocurrir con probabilidad baja
            game.config.randomEvents.probability = 0.0; // 0%
            const shouldTriggerLow = await randomEventService.shouldTriggerRandomEvent(game, round);
            
            if (shouldTriggerLow) {
                throw new Error('Evento no debería ocurrir con probabilidad 0%');
            }

            // Test 2.3: Ronda mínima
            game.config.randomEvents.startRound = 5;
            const shouldTriggerMinRound = await randomEventService.shouldTriggerRandomEvent(game, round);
            
            if (shouldTriggerMinRound) {
                throw new Error('Evento no debería ocurrir antes de ronda mínima');
            }

            // Restaurar configuración
            game.config.randomEvents.probability = 0.5;
            game.config.randomEvents.startRound = 2;

            this.testResults.push({
                test: 'ProbabilityLogic',
                status: 'PASS',
                message: 'Lógica de probabilidad validada correctamente',
                details: { 
                    highProb: shouldTriggerHigh,
                    lowProb: shouldTriggerLow,
                    minRound: !shouldTriggerMinRound
                }
            });

            console.log('✅ TEST 2 PASADO: Lógica de probabilidad validada');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'ProbabilityLogic',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 2 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 3: Validación de selección de eventos
     */
    async testEventSelection() {
        console.log('\n🧪 TEST 3: Validación de Selección de Eventos');
        
        try {
            const game = this.testData.game;
            const round = 2;

            // Seleccionar evento aleatorio
            const selectedEvent = await randomEventService.selectRandomEvent(game, round);
            
            if (!selectedEvent) {
                throw new Error('No se seleccionó ningún evento');
            }

            // Validar estructura del evento
            if (!selectedEvent.eventId || !selectedEvent.name || !selectedEvent.category) {
                throw new Error('Evento seleccionado no tiene estructura válida');
            }

            // Validar que el evento cumpla restricciones
            if (selectedEvent.restrictions.minRound > round) {
                throw new Error('Evento seleccionado viola restricción de ronda mínima');
            }

            // Validar impacto
            if (!selectedEvent.impact) {
                throw new Error('Evento seleccionado no tiene definido impacto');
            }

            this.testResults.push({
                test: 'EventSelection',
                status: 'PASS',
                message: `Evento seleccionado correctamente: ${selectedEvent.name} (${selectedEvent.eventId})`,
                details: { 
                    eventId: selectedEvent.eventId,
                    name: selectedEvent.name,
                    category: selectedEvent.category,
                    impact: selectedEvent.impact
                }
            });

            console.log(`✅ TEST 3 PASADO: Evento ${selectedEvent.name} seleccionado correctamente`);
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EventSelection',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 3 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 4: Validación de aplicación de eventos
     */
    async testEventApplication() {
        console.log('\n🧪 TEST 4: Validación de Aplicación de Eventos');
        
        try {
            const game = this.testData.game;
            const round = 2;

            // Seleccionar evento para aplicar
            const selectedEvent = await randomEventService.selectRandomEvent(game, round);
            
            if (!selectedEvent) {
                throw new Error('No se pudo seleccionar evento para aplicar');
            }

            // Guardar estado inicial
            const initialDemand = game.config.modifiers.demand;
            const initialLogistics = game.config.modifiers.logisticsCost;
            const initialRawMaterial = game.config.modifiers.rawMaterialCost;

            // Aplicar evento
            const eventResult = await randomEventService.applyRandomEvent(game, selectedEvent, round);

            // Validar que se creó entrada en historial
            if (!game.eventHistory || game.eventHistory.length === 0) {
                throw new Error('No se creó entrada en historial de eventos');
            }

            const historyEntry = game.eventHistory[game.eventHistory.length - 1];
            
            if (historyEntry.eventId !== selectedEvent.eventId) {
                throw new Error('Entrada en historial no corresponde al evento aplicado');
            }

            // Validar que se aplicaron modificadores
            let modifiersApplied = false;
            if (selectedEvent.impact.demand !== 1.0 && game.config.modifiers.demand !== initialDemand) {
                modifiersApplied = true;
            }
            if (selectedEvent.impact.logisticsCost !== 1.0 && game.config.modifiers.logisticsCost !== initialLogistics) {
                modifiersApplied = true;
            }
            if (selectedEvent.impact.rawMaterialCost !== 1.0 && game.config.modifiers.rawMaterialCost !== initialRawMaterial) {
                modifiersApplied = true;
            }

            if (!modifiersApplied && selectedEvent.impact.demand !== 1.0 && selectedEvent.impact.logisticsCost !== 1.0 && selectedEvent.impact.rawMaterialCost !== 1.0) {
                throw new Error('No se aplicaron modificadores del evento');
            }

            this.testResults.push({
                test: 'EventApplication',
                status: 'PASS',
                message: `Evento aplicado correctamente: ${selectedEvent.name}`,
                details: { 
                    eventId: selectedEvent.eventId,
                    historyEntry: historyEntry.eventId,
                    modifiersApplied
                }
            });

            console.log(`✅ TEST 4 PASADO: Evento ${selectedEvent.name} aplicado correctamente`);
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EventApplication',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 4 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 5: Validación de historial de eventos
     */
    async testEventHistory() {
        console.log('\n🧪 TEST 5: Validación de Historial de Eventos');
        
        try {
            const game = this.testData.game;

            // Obtener historial de eventos
            const eventHistory = await randomEventService.getEventHistory(game._id);

            // Validar estructura del historial
            if (!eventHistory.currentRound || !eventHistory.events) {
                throw new Error('Historial no tiene estructura válida');
            }

            // Validar ordenamiento (debería estar por ronda descendente)
            if (eventHistory.events.length > 1) {
                for (let i = 0; i < eventHistory.events.length - 1; i++) {
                    if (eventHistory.events[i].round < eventHistory.events[i + 1].round) {
                        throw new Error('Historial no está ordenado correctamente por ronda');
                    }
                }
            }

            // Validar que cada entrada tenga campos requeridos
            for (const event of eventHistory.events) {
                if (!event.round || !event.eventId || !event.eventName || !event.eventDescription) {
                    throw new Error('Entrada de historial incompleta');
                }
            }

            this.testResults.push({
                test: 'EventHistory',
                status: 'PASS',
                message: `Historial de eventos validado: ${eventHistory.events.length} eventos`,
                details: { 
                    currentRound: eventHistory.currentRound,
                    eventCount: eventHistory.events.length
                }
            });

            console.log(`✅ TEST 5 PASADO: Historial con ${eventHistory.events.length} eventos validado`);
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EventHistory',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 5 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Ejecutar todos los tests
     */
    async runAllTests() {
        console.log('\n🚀 INICIANDO TEST SUITE PARA RANDOM EVENT SERVICE');
        
        const tests = [
            () => this.testEventInitialization(),
            () => this.testProbabilityLogic(),
            () => this.testEventSelection(),
            () => this.testEventApplication(),
            () => this.testEventHistory()
        ];

        let passedTests = 0;
        const totalTests = tests.length;

        for (const test of tests) {
            try {
                const result = await test();
                if (result) passedTests++;
            } catch (error) {
                console.error('❌ Error inesperado en test:', error);
            }
        }

        console.log(`\n📊 RESULTADOS: ${passedTests}/${totalTests} tests pasados`);
        
        // Generar reporte
        this.generateTestReport();

        return passedTests === totalTests;
    }

    /**
     * Generar reporte de resultados
     */
    generateTestReport() {
        console.log('\n📋 REPORTE DE TESTS:');
        
        for (const result of this.testResults) {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
            
            if (result.status === 'FAIL' && result.details) {
                console.log(`   Detalles: ${JSON.stringify(result.details, null, 2)}`);
            }
        }

        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`\n📈 RESUMEN: ${passCount} pasados, ${failCount} fallidos`);
    }

    /**
     * Limpiar entorno de pruebas
     */
    async cleanup() {
        console.log('\n🧹 CLEANUP: Limpiando entorno de pruebas...');
        
        try {
            // Limpiar colecciones
            await Promise.all([
                Game.deleteMany({}),
                RandomEvent.deleteMany({})
            ]);

            // Desconectar de base de datos
            await mongoose.disconnect();
            console.log('✅ Cleanup completado');

        } catch (error) {
            console.error('❌ Error en cleanup:', error);
        }
    }
}

/**
 * Ejecutar test suite
 */
async function runRandomEventTests() {
    const testSuite = new RandomEventServiceTestSuite();
    
    try {
        // Setup
        await testSuite.setup();
        
        // Ejecutar tests
        const allTestsPassed = await testSuite.runAllTests();
        
        // Cleanup
        await testSuite.cleanup();
        
        // Salir con código apropiado
        process.exit(allTestsPassed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Error fatal en test suite:', error);
        await testSuite.cleanup();
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runRandomEventTests();
}

module.exports = RandomEventServiceTestSuite;