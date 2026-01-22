// ============================================
// FILE: server/test/integration-test.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Integration Test Suite for Complete System
// CHANGE LOG: Comprehensive integration testing with MongoDB
// SPEC REF: Full System Integration
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const mongoose = require('mongoose');
const Game = require('../src/models/Game');
const Company = require('../src/models/Company');
const Decision = require('../src/models/Decision');
const Product = require('../src/models/Product');
const Market = require('../src/models/Market');
const randomEventService = require('../src/services/randomEventService');
const marketEngineV2 = require('../src/services/marketEngineV2');
const capacityService = require('../src/services/capacityService');
const obsolescenceService = require('../src/services/obsolescenceService');

/**
 * Integration Test Suite for Complete ElectroNova System
 * Tests all components working together
 */
class IntegrationTestSuite {
    constructor() {
        this.testResults = [];
        this.testData = {};
    }

    /**
     * Inicializar entorno de pruebas completo
     */
    async setup() {
        console.log('🧪 SETUP: Inicializando entorno de integración completa...');
        
        try {
            // Conectar a base de datos de pruebas
            await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/electronova-integration-test');
            console.log('✅ MongoDB conectado para integración');

            // Limpiar base de datos
            await this.cleanupDatabase();

            // Inicializar eventos aleatorios
            await randomEventService.initializeEvents();
            console.log('✅ Eventos aleatorios inicializados');

            // Crear datos de prueba completos
            await this.createCompleteTestData();
            console.log('✅ Datos de prueba completos creados');

        } catch (error) {
            console.error('❌ Error en setup:', error);
            throw error;
        }
    }

    /**
     * Limpiar base de datos de pruebas
     */
    async cleanupDatabase() {
        await Promise.all([
            Game.deleteMany({}),
            Company.deleteMany({}),
            Decision.deleteMany({}),
            Product.deleteMany({}),
            Market.deleteMany({})
        ]);
    }

    /**
     * Crear datos de prueba completos
     */
    async createCompleteTestData() {
        // 1. Crear mercado
        const testMarket = new Market({
            name: 'Novaterra',
            demandPotential: 1000,
            priceSensitivity: 1.5,
            priceHardCap: 150,
            params: {
                w_price: 0.4,
                w_quality: 0.3,
                w_marketing: 0.2,
                w_ethics: 0.1
            }
        });
        this.testData.market = await testMarket.save();

        // 2. Crear producto
const testProduct = new Product({
            name: 'Básica',
            line: 'Básica',
            baseCost: 50,
            rawMaterialConsumption: [{
                materialType: 'Alfa',
                quantity: 2
            }, {
                materialType: 'Beta',
                quantity: 1
            }, {
                materialType: 'Omega',
                quantity: 0.5
            }]
        });
        this.testData.product = await testProduct.save();

        // 3. Crear juego con eventos aleatorios
        const testGame = new Game({
            name: 'Juego Integración Completa',
            code: 'INTEGRATION-TEST',
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
                    probability: 1.0, // 100% para pruebas
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

        // 4. Crear empresas
        this.testData.companies = await this.createTestCompanies();

        // 5. Crear decisiones
        this.testData.decisions = await this.createTestDecisions();

        console.log('📊 Datos de integración configurados:');
        console.log(`   - Game: ${this.testData.game.code}`);
        console.log(`   - Market: ${this.testData.market.name}`);
        console.log(`   - Product: ${this.testData.product.name}`);
        console.log(`   - Companies: ${this.testData.companies.length}`);
        console.log(`   - Decisions: ${this.testData.decisions.length}`);
    }

    /**
     * Crear empresas de prueba
     */
    async createTestCompanies() {
        const companies = [
            {
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Alpha',
                cash: 500000,
                techLevel: 8,
                ethicsIndex: 90,
                productionQuota: 0,
                inventory: [
                    {
                        productLine: this.testData.product._id,
                        market: this.testData.market.name,
                        units: 200,
                        unitCost: 60,
                        ageInRounds: 4 // Obsoleto para probar
                    }
                ]
            },
            {
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Beta',
                cash: 500000,
                techLevel: 6,
                ethicsIndex: 75,
                productionQuota: 0,
                inventory: [
                    {
                        productLine: this.testData.product._id,
                        market: this.testData.market.name,
                        units: 300,
                        unitCost: 55,
                        ageInRounds: 1 // Nuevo
                    }
                ]
            }
        ];

        const savedCompanies = [];
        for (const companyData of companies) {
            const company = new Company(companyData);
            savedCompanies.push(await company.save());
        }
        return savedCompanies;
    }

    /**
     * Crear decisiones de prueba
     */
    async createTestDecisions() {
        const decisions = [
            {
                companyId: this.testData.companies[0]._id,
                round: 2,
                commercial: [
                    {
                        market: this.testData.market.name,
                        marketingBudget: 20000,
                        prices: [
                            {
                                productLine: this.testData.product._id,
                                price: 120
                            }
                        ]
                    }
                ]
            },
            {
                companyId: this.testData.companies[1]._id,
                round: 2,
                commercial: [
                    {
                        market: this.testData.market.name,
                        marketingBudget: 10000,
                        prices: [
                            {
                                productLine: this.testData.product._id,
                                price: 100
                            }
                        ]
                    }
                ]
            }
        ];

        const savedDecisions = [];
        for (const decisionData of decisions) {
            const decision = new Decision(decisionData);
            savedDecisions.push(await decision.save());
        }
        return savedDecisions;
    }

    /**
     * Test 1: Integración completa del procesamiento de ronda
     */
    async testCompleteRoundProcessing() {
        console.log('\n🧪 TEST 1: Procesamiento Completo de Ronda');
        
        try {
            const game = this.testData.game;
            const companies = this.testData.companies;
            const market = this.testData.market;
            const product = this.testData.product;
            const decisions = this.testData.decisions;

            // 1. Procesar eventos aleatorios
            const eventResult = await randomEventService.processRoundEvents(game, 2);
            console.log(`   🎲 Evento procesado: ${eventResult ? eventResult.eventName : 'Ninguno'}`);

            // 2. Calcular cuotas de producción con eventos
            await capacityService.calculateAndAssignQuotas(companies, game.config.totalProductionCapacity, game);
            console.log(`   🏭 Cuotas asignadas: ${companies.map(c => c.productionQuota).join(', ')}`);

            // 3. Procesar obsolescencia
            const obsolescenceResults = obsolescenceService.processBatchObsolescence(companies, 2, game.config.obsolescencePenaltyRate);
            console.log(`   📦 Obsolescencia: $${obsolescenceResults.totalCost.toFixed(2)}`);

            // 4. Calcular ventas con eventos
            const salesResults = await marketEngineV2.calculateSales(
                market,
                product,
                companies,
                decisions,
                game.config,
                game
            );
            console.log(`   💰 Ventas: ${Object.keys(salesResults).length} empresas con ventas`);

            // 5. Validar que todo se procesó correctamente
            const hasEvents = eventResult !== null;
            const hasQuotas = companies.every(c => c.productionQuota > 0);
            const hasObsolescence = obsolescenceResults.totalCost > 0;
            const hasSales = Object.keys(salesResults).length > 0;

            if (!hasQuotas) {
                throw new Error('No se asignaron cuotas de producción');
            }

            if (!hasObsolescence) {
                throw new Error('No se procesó obsolescencia (debería haberla habido)');
            }

            if (!hasSales) {
                throw new Error('No se generaron ventas');
            }

            this.testResults.push({
                test: 'CompleteRoundProcessing',
                status: 'PASS',
                message: 'Procesamiento completo de ronda validado',
                details: {
                    eventProcessed: hasEvents,
                    quotasAssigned: hasQuotas,
                    obsolescenceProcessed: hasObsolescence,
                    salesGenerated: hasSales,
                    eventResult: eventResult ? eventResult.eventName : null,
                    totalObsolescenceCost: obsolescenceResults.totalCost,
                    salesCount: Object.keys(salesResults).length
                }
            });

            console.log('✅ TEST 1 PASADO: Procesamiento completo validado');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'CompleteRoundProcessing',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 1 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 2: Validación de consistencia de eventos
     */
    async testEventConsistency() {
        console.log('\n🧪 TEST 2: Consistencia de Eventos Aleatorios');
        
        try {
            const game = this.testData.game;

            // Obtener historial de eventos
            const eventHistory = await randomEventService.getEventHistory(game._id);

            // Validar que los eventos estén en el historial del juego
            const gameDoc = await Game.findById(game._id);
            const historyMatches = JSON.stringify(gameDoc.eventHistory) === JSON.stringify(eventHistory.events);

            if (!historyMatches) {
                throw new Error('El historial de eventos no coincide');
            }

            // Validar que solo haya un evento por ronda (configuración)
            const round2Events = eventHistory.events.filter(e => e.round === 2);
            if (round2Events.length > 1 && game.config.randomEvents.maxOnePerRound) {
                throw new Error('Hay múltiples eventos en la misma ronda');
            }

            // Validar que los eventos tengan estructura correcta
            for (const event of eventHistory.events) {
                if (!event.round || !event.eventId || !event.eventName || !event.eventDescription) {
                    throw new Error('Evento con estructura incompleta');
                }
            }

            this.testResults.push({
                test: 'EventConsistency',
                status: 'PASS',
                message: 'Consistencia de eventos validada',
                details: {
                    totalEvents: eventHistory.events.length,
                    round2Events: round2Events.length,
                    historyMatches,
                    currentRound: eventHistory.currentRound
                }
            });

            console.log(`✅ TEST 2 PASADO: ${eventHistory.events.length} eventos consistentes`);
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EventConsistency',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 2 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 3: Integración de modificadores
     */
    async testModifiersIntegration() {
        console.log('\n🧪 TEST 3: Integración de Modificadores');
        
        try {
            const game = this.testData.game;
            const originalDemand = game.config.modifiers.demand;
            const originalLogistics = game.config.modifiers.logisticsCost;
            const originalRawMaterial = game.config.modifiers.rawMaterialCost;

            // Simular evento que modifica todos los parámetros
            const mockEvent = {
                eventId: 'TEST_EVENT',
                name: 'Evento de Prueba',
                impact: {
                    demand: 1.5,
                    logisticsCost: 2.0,
                    rawMaterialCost: 0.7
                }
            };

            // Aplicar evento manualmente
            const eventResult = await randomEventService.applyRandomEvent(game, mockEvent, 2);

            // Validar que los modificadores se aplicaron
            const demandModified = game.config.modifiers.demand !== originalDemand;
            const logisticsModified = game.config.modifiers.logisticsCost !== originalLogistics;
            const rawMaterialModified = game.config.modifiers.rawMaterialCost !== originalRawMaterial;

            if (!demandModified || !logisticsModified || !rawMaterialModified) {
                throw new Error('No todos los modificadores se aplicaron correctamente');
            }

            // Validar que los valores sean los esperados
            const expectedDemand = originalDemand * mockEvent.impact.demand;
            const expectedLogistics = originalLogistics * mockEvent.impact.logisticsCost;
            const expectedRawMaterial = originalRawMaterial * mockEvent.impact.rawMaterialCost;

            if (Math.abs(game.config.modifiers.demand - expectedDemand) > 0.001 ||
                Math.abs(game.config.modifiers.logisticsCost - expectedLogistics) > 0.001 ||
                Math.abs(game.config.modifiers.rawMaterialCost - expectedRawMaterial) > 0.001) {
                throw new Error('Los valores de los modificadores no son los esperados');
            }

            this.testResults.push({
                test: 'ModifiersIntegration',
                status: 'PASS',
                message: 'Integración de modificadores validada',
                details: {
                    originalDemand,
                    newDemand: game.config.modifiers.demand,
                    expectedDemand,
                    demandModified,
                    logisticsModified,
                    rawMaterialModified
                }
            });

            console.log('✅ TEST 3 PASADO: Modificadores integrados correctamente');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'ModifiersIntegration',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 3 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Ejecutar todos los tests de integración
     */
    async runAllIntegrationTests() {
        console.log('\n🚀 INICIANDO SUITE DE INTEGRACIÓN COMPLETA');
        console.log('📋 Testing complete system with MongoDB integration');
        
        const tests = [
            () => this.testCompleteRoundProcessing(),
            () => this.testEventConsistency(),
            () => this.testModifiersIntegration()
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

        console.log(`\n📊 RESULTADOS INTEGRACIÓN: ${passedTests}/${totalTests} tests pasados`);
        
        // Generar reporte
        this.generateIntegrationReport();

        return passedTests === totalTests;
    }

    /**
     * Generar reporte de integración
     */
    generateIntegrationReport() {
        console.log('\n📋 REPORTE DE INTEGRACIÓN:');
        console.log('=====================================');
        
        for (const result of this.testResults) {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
            
            if (result.status === 'PASS' && result.details) {
                console.log(`   Detalles: ${JSON.stringify(result.details, null, 2)}`);
            }
        }

        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`\n📈 RESUMEN INTEGRACIÓN: ${passCount} pasados, ${failCount} fallidos`);
        
        if (passCount === totalTests) {
            console.log('🎉 SISTEMA COMPLETO INTEGRADO CORRECTAMENTE');
            console.log('✅ Todos los componentes funcionan juntos');
        } else {
            console.log('⚠️ HAY PROBLEMAS DE INTEGRACIÓN');
            console.log('🔧 Revisar la comunicación entre componentes');
        }
    }

    /**
     * Limpiar entorno de pruebas
     */
    async cleanup() {
        console.log('\n🧹 CLEANUP: Limpiando entorno de integración...');
        
        try {
            // Limpiar colecciones
            await this.cleanupDatabase();

            // Desconectar de base de datos
            await mongoose.disconnect();
            console.log('✅ Cleanup completado');

        } catch (error) {
            console.error('❌ Error en cleanup:', error);
        }
    }
}

/**
 * Ejecutar suite de integración
 */
async function runIntegrationTests() {
    const testSuite = new IntegrationTestSuite();
    
    try {
        // Setup
        await testSuite.setup();
        
        // Ejecutar tests
        const allTestsPassed = await testSuite.runAllIntegrationTests();
        
        // Cleanup
        await testSuite.cleanup();
        
        // Salir con código apropiado
        process.exit(allTestsPassed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Error fatal en suite de integración:', error);
        await testSuite.cleanup();
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runIntegrationTests();
}

module.exports = IntegrationTestSuite;