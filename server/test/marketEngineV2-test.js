// ============================================
// FILE: server/test/marketEngineV2-test.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Testing Suite para Motor de Mercado V2
// CHANGE LOG: Initial test suite for ECPCIM algorithm validation
// SPEC REF: "2.1 - Productos" y "3.1 - Motor de Mercado Híbrido"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const mongoose = require('mongoose');
const marketEngineV2 = require('../src/services/marketEngineV2');
const Game = require('../src/models/Game');
const Company = require('../src/models/Company');
const Product = require('../src/models/Product');
const Market = require('../src/models/Market');
const Decision = require('../src/models/Decision');

/**
 * Test Suite para Motor de Mercado V2
 * Validación del algoritmo ECPCIM y precisión financiera
 */
class MarketEngineV2TestSuite {
    constructor() {
        this.testResults = [];
        this.testData = {};
    }

    /**
     * Inicializar entorno de pruebas
     */
    async setup() {
        console.log('🧪 SETUP: Inicializando entorno de pruebas para Motor de Mercado V2...');
        
        try {
            // Conectar a base de datos de pruebas
            await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/electronova-test');
            console.log('✅ MongoDB conectado para pruebas');

            // Crear datos de prueba
            await this.createTestData();
            console.log('✅ Datos de prueba creados');

        } catch (error) {
            console.error('❌ Error en setup:', error);
            throw error;
        }
    }

    /**
     * Crear datos de prueba consistentes
     */
    async createTestData() {
        // 1. Crear juego de prueba
        const testGame = new Game({
            name: 'Juego Prueba Motor V2',
            code: 'TEST-MOTOR-V2',
            adminId: new mongoose.Types.ObjectId(),
            status: 'ACTIVE',
            currentRound: 1,
            config: {
                maxRounds: 8,
                initialCash: 500000,
                totalProductionCapacity: 6000,
                modifiers: {
                    logisticsCost: 1.0,
                    rawMaterialCost: 1.0,
                    demand: 1.0
                }
            }
        });
        this.testData.game = await testGame.save();

        // 2. Crear mercado de prueba
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

        // 3. Crear producto de prueba
        const testProduct = new Product({
            name: 'ElectroNova Basic',
            line: 'Basic',
            baseCost: 50,
            rawMaterialConsumption: {
                Alfa: 2,
                Beta: 1,
                Omega: 0.5
            }
        });
        this.testData.product = await testProduct.save();

        // 4. Crear empresas de prueba
        this.testData.companies = await this.createTestCompanies();

        // 5. Crear decisiones de prueba
        this.testData.decisions = await this.createTestDecisions();

        console.log('📊 Datos de prueba configurados:');
        console.log(`   - Game: ${this.testData.game.code}`);
        console.log(`   - Market: ${this.testData.market.name}`);
        console.log(`   - Product: ${this.testData.product.name}`);
        console.log(`   - Companies: ${this.testData.companies.length}`);
        console.log(`   - Decisions: ${this.testData.decisions.length}`);
    }

    /**
     * Crear empresas de prueba con diferentes perfiles
     */
    async createTestCompanies() {
        const companies = [
            {
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Premium',
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
                        ageInRounds: 1
                    }
                ]
            },
            {
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Budget',
                cash: 500000,
                techLevel: 4,
                ethicsIndex: 60,
                productionQuota: 0,
                inventory: [
                    {
                        productLine: this.testData.product._id,
                        market: this.testData.market.name,
                        units: 300,
                        unitCost: 55,
                        ageInRounds: 1
                    }
                ]
            },
            {
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Equilibrada',
                cash: 500000,
                techLevel: 6,
                ethicsIndex: 75,
                productionQuota: 0,
                inventory: [
                    {
                        productLine: this.testData.product._id,
                        market: this.testData.market.name,
                        units: 250,
                        unitCost: 58,
                        ageInRounds: 1
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
     * Crear decisiones de prueba con diferentes estrategias
     */
    async createTestDecisions() {
        const decisions = [
            {
                companyId: this.testData.companies[0]._id,
                round: 1,
                commercial: [
                    {
                        market: this.testData.market.name,
                        marketingBudget: 20000,
                        prices: [
                            {
                                productLine: this.testData.product._id,
                                price: 120 // Premium
                            }
                        ]
                    }
                ]
            },
            {
                companyId: this.testData.companies[1]._id,
                round: 1,
                commercial: [
                    {
                        market: this.testData.market.name,
                        marketingBudget: 5000,
                        prices: [
                            {
                                productLine: this.testData.product._id,
                                price: 80 // Budget
                            }
                        ]
                    }
                ]
            },
            {
                companyId: this.testData.companies[2]._id,
                round: 1,
                commercial: [
                    {
                        market: this.testData.market.name,
                        marketingBudget: 10000,
                        prices: [
                            {
                                productLine: this.testData.product._id,
                                price: 100 // Equilibrado
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
     * Test 1: Validación de cálculo de scores competitivos
     */
    async testCompetitiveScores() {
        console.log('\n🧪 TEST 1: Validación de Scores Competitivos');
        
        try {
            const results = await marketEngineV2.calculateSales(
                this.testData.market,
                this.testData.product,
                this.testData.companies,
                this.testData.decisions,
                this.testData.game.config
            );

            // Validar que se generaron resultados
            if (!results || Object.keys(results).length === 0) {
                throw new Error('No se generaron resultados de ventas');
            }

            // Validar precisión de cálculos financieros
            for (const [companyId, result] of Object.entries(results)) {
                if (typeof result.revenue !== 'number' || result.revenue < 0) {
                    throw new Error(`Revenue inválido para empresa ${companyId}: ${result.revenue}`);
                }
                if (typeof result.cogs !== 'number' || result.cogs < 0) {
                    throw new Error(`COGS inválido para empresa ${companyId}: ${result.cogs}`);
                }
                if (typeof result.units !== 'number' || result.units < 0) {
                    throw new Error(`Units inválido para empresa ${companyId}: ${result.units}`);
                }
            }

            this.testResults.push({
                test: 'CompetitiveScores',
                status: 'PASS',
                message: 'Scores competitivos calculados correctamente',
                details: results
            });

            console.log('✅ TEST 1 PASADO: Scores competitivos validados');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'CompetitiveScores',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 1 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 2: Validación de límites de precios (Hard Caps)
     */
    async testPriceHardCaps() {
        console.log('\n🧪 TEST 2: Validación de Hard Caps de Precios');
        
        try {
            // Crear decisión con precio excesivo
            const highPriceDecision = new Decision({
                companyId: this.testData.companies[0]._id,
                round: 1,
                commercial: [
                    {
                        market: this.testData.market.name,
                        marketingBudget: 20000,
                        prices: [
                            {
                                productLine: this.testData.product._id,
                                price: 200 // Por encima del hard cap (150)
                            }
                        ]
                    }
                ]
            });
            await highPriceDecision.save();

            const results = await marketEngineV2.calculateSales(
                this.testData.market,
                this.testData.product,
                this.testData.companies,
                [highPriceDecision],
                this.testData.game.config
            );

            // Validar que el precio excesivo impacta negativamente las ventas
            const highPriceResult = results[this.testData.companies[0]._id];
            if (!highPriceResult) {
                throw new Error('No se generaron resultados para precio excesivo');
            }

            // Las ventas deberían ser significativamente menores
            if (highPriceResult.units > 50) { // Umbral arbitrario para validación
                throw new Error('Hard cap de precio no aplicado correctamente');
            }

            this.testResults.push({
                test: 'PriceHardCaps',
                status: 'PASS',
                message: 'Hard caps de precios aplicados correctamente',
                details: results
            });

            console.log('✅ TEST 2 PASADO: Hard caps validados');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'PriceHardCaps',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 2 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 3: Validación de precisión Decimal128
     */
    async testDecimal128Precision() {
        console.log('\n🧪 TEST 3: Validación de Precisión Decimal128');
        
        try {
            // Verificar que los valores monetarios usan Decimal128
            const company = this.testData.companies[0];
            const cashBefore = company.cash;
            
            // Validar que cash es Decimal128
            if (!(cashBefore instanceof mongoose.Types.Decimal128)) {
                throw new Error('Cash no está almacenado como Decimal128');
            }

            // Realizar operación financiera
            const results = await marketEngineV2.calculateSales(
                this.testData.market,
                this.testData.product,
                [company],
                this.testData.decisions.filter(d => d.companyId.toString() === company._id.toString()),
                this.testData.game.config
            );

            // Recargar empresa y verificar precisión
            const updatedCompany = await Company.findById(company._id);
            const cashAfter = updatedCompany.cash;

            // Validar que no hay pérdida de precisión
            const revenue = results[company._id]?.revenue || 0;
            const expectedCash = parseFloat(cashBefore.toString()) + revenue;
            const actualCash = parseFloat(cashAfter.toString());

            if (Math.abs(expectedCash - actualCash) > 0.01) {
                throw new Error(`Pérdida de precisión detectada: esperado ${expectedCash}, actual ${actualCash}`);
            }

            this.testResults.push({
                test: 'Decimal128Precision',
                status: 'PASS',
                message: 'Precisión Decimal128 mantenida',
                details: { expectedCash, actualCash, revenue }
            });

            console.log('✅ TEST 3 PASADO: Precisión Decimal128 validada');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'Decimal128Precision',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 3 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Ejecutar todos los tests
     */
    async runAllTests() {
        console.log('\n🚀 INICIANDO TEST SUITE PARA MOTOR DE MERCADO V2');
        
        const tests = [
            () => this.testCompetitiveScores(),
            () => this.testPriceHardCaps(),
            () => this.testDecimal128Precision()
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
                Company.deleteMany({}),
                Product.deleteMany({}),
                Market.deleteMany({}),
                Decision.deleteMany({})
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
async function runMarketEngineTests() {
    const testSuite = new MarketEngineV2TestSuite();
    
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
    runMarketEngineTests();
}

module.exports = MarketEngineV2TestSuite;