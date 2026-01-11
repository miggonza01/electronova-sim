// ============================================
// FILE: server/test/capacityService-test.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Testing Suite para Capacity Service
// CHANGE LOG: Initial test suite for production capacity validation
// SPEC REF: "2.3 - Capacidad de Producción Compartida"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const mongoose = require('mongoose');
const capacityService = require('../src/services/capacityService');
const Game = require('../src/models/Game');
const Company = require('../src/models/Company');

/**
 * Test Suite para Capacity Service
 * Validación del sistema de cuotas de producción compartida
 */
class CapacityServiceTestSuite {
    constructor() {
        this.testResults = [];
        this.testData = {};
    }

    /**
     * Inicializar entorno de pruebas
     */
    async setup() {
        console.log('🧪 SETUP: Inicializando entorno de pruebas para Capacity Service...');
        
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
     * Crear datos de prueba
     */
    async createTestData() {
        // Crear juego de prueba con capacidad estándar
        const testGame = new Game({
            name: 'Juego Prueba Capacity',
            code: 'TEST-CAPACITY',
            adminId: new mongoose.Types.ObjectId(),
            status: 'ACTIVE',
            currentRound: 1,
            config: {
                maxRounds: 8,
                initialCash: 500000,
                totalProductionCapacity: 6000, // Capacidad estándar
                modifiers: {
                    logisticsCost: 1.0,
                    rawMaterialCost: 1.0,
                    demand: 1.0
                }
            }
        });
        this.testData.game = await testGame.save();

        // Crear empresas de prueba
        this.testData.companies = await this.createTestCompanies();

        console.log('📊 Datos de prueba configurados:');
        console.log(`   - Game: ${this.testData.game.code}`);
        console.log(`   - Capacity: ${this.testData.game.config.totalProductionCapacity}`);
        console.log(`   - Companies: ${this.testData.companies.length}`);
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
                techLevel: 7,
                ethicsIndex: 80,
                productionQuota: 0
            },
            {
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Beta',
                cash: 500000,
                techLevel: 6,
                ethicsIndex: 75,
                productionQuota: 0
            },
            {
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Gamma',
                cash: 500000,
                techLevel: 8,
                ethicsIndex: 85,
                productionQuota: 0
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
     * Test 1: Validación de asignación equitativa de cuotas
     */
    async testEquitableQuotaAssignment() {
        console.log('\n🧪 TEST 1: Validación de Asignación Equitativa de Cuotas');
        
        try {
            const totalCapacity = this.testData.game.config.totalProductionCapacity;
            const companyCount = this.testData.companies.length;
            const expectedQuota = Math.floor(totalCapacity / companyCount);

            // Ejecutar servicio de capacidad
            await capacityService.calculateAndAssignQuotas(
                this.testData.companies,
                totalCapacity
            );

            // Validar asignación
            for (const company of this.testData.companies) {
                if (company.productionQuota !== expectedQuota) {
                    throw new Error(
                        `Cuota incorrecta para ${company.name}: esperado ${expectedQuota}, actual ${company.productionQuota}`
                    );
                }
            }

            // Validar que la suma no excede la capacidad total
            const totalAssigned = this.testData.companies.reduce((sum, company) => sum + company.productionQuota, 0);
            if (totalAssigned > totalCapacity) {
                throw new Error(`Capacidad total excedida: ${totalAssigned} > ${totalCapacity}`);
            }

            this.testResults.push({
                test: 'EquitableQuotaAssignment',
                status: 'PASS',
                message: `Cuotas asignadas equitativamente: ${expectedQuota} por empresa`,
                details: { totalCapacity, companyCount, expectedQuota, totalAssigned }
            });

            console.log(`✅ TEST 1 PASADO: Cuotas de ${expectedQuota} asignadas correctamente a ${companyCount} empresas`);
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EquitableQuotaAssignment',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 1 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 2: Validación con número impar de empresas
     */
    async testOddNumberOfCompanies() {
        console.log('\n🧪 TEST 2: Validación con Número Impar de Empresas');
        
        try {
            // Agregar una empresa adicional para hacer impar
            const additionalCompany = new Company({
                gameId: this.testData.game._id,
                user: new mongoose.Types.ObjectId(),
                name: 'Empresa Delta',
                cash: 500000,
                techLevel: 5,
                ethicsIndex: 70,
                productionQuota: 0
            });
            await additionalCompany.save();

            const oddCompanies = [...this.testData.companies, additionalCompany];
            const totalCapacity = this.testData.game.config.totalProductionCapacity;
            const companyCount = oddCompanies.length;
            const expectedQuota = Math.floor(totalCapacity / companyCount);

            // Ejecutar servicio
            await capacityService.calculateAndAssignQuotas(oddCompanies, totalCapacity);

            // Validar asignación
            for (const company of oddCompanies) {
                if (company.productionQuota !== expectedQuota) {
                    throw new Error(
                        `Cuota incorrecta para ${company.name}: esperado ${expectedQuota}, actual ${company.productionQuota}`
                    );
                }
            }

            // Validar que hay capacidad remanente (por la división entera)
            const totalAssigned = oddCompanies.reduce((sum, company) => sum + company.productionQuota, 0);
            const remainingCapacity = totalCapacity - totalAssigned;
            
            if (remainingCapacity < 0 || remainingCapacity >= companyCount) {
                throw new Error(`Capacidad remanente inválida: ${remainingCapacity}`);
            }

            this.testResults.push({
                test: 'OddNumberOfCompanies',
                status: 'PASS',
                message: `Cuotas asignadas correctamente con ${companyCount} empresas (impar)`,
                details: { totalCapacity, companyCount, expectedQuota, totalAssigned, remainingCapacity }
            });

            console.log(`✅ TEST 2 PASADO: ${companyCount} empresas (impar) con cuotas de ${expectedQuota}, capacidad remanente: ${remainingCapacity}`);
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'OddNumberOfCompanies',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 2 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 3: Validación con capacidad personalizada
     */
    async testCustomCapacity() {
        console.log('\n🧪 TEST 3: Validación con Capacidad Personalizada');
        
        try {
            // Probar con diferentes capacidades
            const testCapacities = [3000, 7500, 12000];
            
            for (const capacity of testCapacities) {
                const companyCount = this.testData.companies.length;
                const expectedQuota = Math.floor(capacity / companyCount);

                // Resetear cuotas
                this.testData.companies.forEach(company => company.productionQuota = 0);

                // Ejecutar servicio con capacidad personalizada
                await capacityService.calculateAndAssignQuotas(this.testData.companies, capacity);

                // Validar asignación
                for (const company of this.testData.companies) {
                    if (company.productionQuota !== expectedQuota) {
                        throw new Error(
                            `Cuota incorrecta para capacidad ${capacity}: esperado ${expectedQuota}, actual ${company.productionQuota}`
                        );
                    }
                }

                console.log(`   ✅ Capacidad ${capacity}: ${expectedQuota} por empresa`);
            }

            this.testResults.push({
                test: 'CustomCapacity',
                status: 'PASS',
                message: 'Capacidades personalizadas manejadas correctamente',
                details: { testCapacities }
            });

            console.log('✅ TEST 3 PASADO: Capacidades personalizadas validadas');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'CustomCapacity',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 3 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Test 4: Validación de edge cases
     */
    async testEdgeCases() {
        console.log('\n🧪 TEST 4: Validación de Edge Cases');
        
        try {
            // Test 4.1: Sin empresas
            try {
                await capacityService.calculateAndAssignQuotas([], 6000);
                console.log('   ✅ Sin empresas: manejado correctamente (sin error)');
            } catch (error) {
                throw new Error(`Error con array vacío: ${error.message}`);
            }

            // Test 4.2: Capacidad cero
            this.testData.companies.forEach(company => company.productionQuota = 0);
            await capacityService.calculateAndAssignQuotas(this.testData.companies, 0);
            
            for (const company of this.testData.companies) {
                if (company.productionQuota !== 0) {
                    throw new Error(`Cuota incorrecta con capacidad cero: ${company.productionQuota}`);
                }
            }
            console.log('   ✅ Capacidad cero: manejado correctamente');

            // Test 4.3: Una sola empresa
            const singleCompany = [this.testData.companies[0]];
            const singleCapacity = 6000;
            await capacityService.calculateAndAssignQuotas(singleCompany, singleCapacity);
            
            if (singleCompany[0].productionQuota !== singleCapacity) {
                throw new Error(`Cuota incorrecta para empresa única: ${singleCompany[0].productionQuota}`);
            }
            console.log('   ✅ Empresa única: manejado correctamente');

            this.testResults.push({
                test: 'EdgeCases',
                status: 'PASS',
                message: 'Edge cases manejados correctamente',
                details: { noCompanies: true, zeroCapacity: true, singleCompany: true }
            });

            console.log('✅ TEST 4 PASADO: Edge cases validados');
            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EdgeCases',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ TEST 4 FALLIDO:', error.message);
            return false;
        }
    }

    /**
     * Ejecutar todos los tests
     */
    async runAllTests() {
        console.log('\n🚀 INICIANDO TEST SUITE PARA CAPACITY SERVICE');
        
        const tests = [
            () => this.testEquitableQuotaAssignment(),
            () => this.testOddNumberOfCompanies(),
            () => this.testCustomCapacity(),
            () => this.testEdgeCases()
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
                Company.deleteMany({})
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
async function runCapacityTests() {
    const testSuite = new CapacityServiceTestSuite();
    
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
    runCapacityTests();
}

module.exports = CapacityServiceTestSuite;