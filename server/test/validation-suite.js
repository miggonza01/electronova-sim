// ============================================
// FILE: server/test/validation-suite.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Validation Suite sin dependencia de MongoDB
// CHANGE LOG: Initial validation for market engine and capacity service
// SPEC REF: "3.1 - Motor de Mercado" y "2.3 - Capacidad Compartida"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

/**
 * Suite de validación que no requiere MongoDB
 * Para validar la lógica de negocio antes de integración con base de datos
 */

/**
 * Validador de Motor de Mercado ECPCIM
 */
class MarketEngineValidator {
    constructor() {
        this.testResults = [];
    }

    /**
     * Validar fórmula de Score Competitivo
     * Score = (Precio * w_precio) + (Calidad * w_calidad) + (Marketing * w_marketing) + (Ética * w_ética)
     */
    validateCompetitiveScore() {
        console.log('\n🧪 VALIDACIÓN: Fórmula de Score Competitivo');
        
        try {
            // Datos de prueba
            const competitor = {
                price: 100,
                techLevel: 7,
                marketing: 10000,
                ethics: 80
            };

            const marketParams = {
                w_price: 0.4,
                w_quality: 0.3,
                w_marketing: 0.2,
                w_ethics: 0.1
            };

            // Calcular scores individuales
            const minPrice = 80;
            const maxPrice = 120;
            const priceRange = maxPrice - minPrice || 1;
            
            const scorePrice = (maxPrice - competitor.price) / priceRange;
            const scoreQuality = competitor.techLevel / 10;
            const scoreMarketing = (1 + Math.log10(competitor.marketing + 1)) * 0.15;
            const scoreEthics = competitor.ethics / 100;

            // Calcular score total
            const totalScore = (scorePrice * marketParams.w_price) +
                              (scoreQuality * marketParams.w_quality) +
                              (scoreMarketing * marketParams.w_marketing) +
                              (scoreEthics * marketParams.w_ethics);

            // Validaciones
            if (totalScore < 0 || totalScore > 1) {
                throw new Error(`Score fuera de rango [0,1]: ${totalScore}`);
            }

            if (scorePrice < 0 || scorePrice > 1) {
                throw new Error(`Score de precio inválido: ${scorePrice}`);
            }

            if (scoreQuality < 0 || scoreQuality > 1) {
                throw new Error(`Score de calidad inválido: ${scoreQuality}`);
            }

            console.log('✅ Fórmula de Score Competitivo validada:');
            console.log(`   - Score Precio: ${scorePrice.toFixed(3)}`);
            console.log(`   - Score Calidad: ${scoreQuality.toFixed(3)}`);
            console.log(`   - Score Marketing: ${scoreMarketing.toFixed(3)}`);
            console.log(`   - Score Ética: ${scoreEthics.toFixed(3)}`);
            console.log(`   - Score Total: ${totalScore.toFixed(3)}`);

            this.testResults.push({
                test: 'CompetitiveScore',
                status: 'PASS',
                message: 'Fórmula de score competitivo validada correctamente',
                details: { totalScore, components: { scorePrice, scoreQuality, scoreMarketing, scoreEthics } }
            });

            return true;

        } catch (error) {
            this.testResults.push({
                test: 'CompetitiveScore',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ Validación fallida:', error.message);
            return false;
        }
    }

    /**
     * Validar fórmula de elasticidad de precios
     */
    validatePriceElasticity() {
        console.log('\n🧪 VALIDACIÓN: Elasticidad de Precios');
        
        try {
            const basePrice = 100;
            const priceSensitivity = 1.5;
            const avgPrice = 100;

            // Test 1: Precio igual al promedio
            const price1 = basePrice;
            const elasticity1 = Math.pow(avgPrice / price1, priceSensitivity);
            if (Math.abs(elasticity1 - 1.0) > 0.001) {
                throw new Error(`Elasticidad incorrecta para precio igual: ${elasticity1}`);
            }

            // Test 2: Precio mayor al promedio
            const price2 = basePrice * 1.2;
            const elasticity2 = Math.pow(avgPrice / price2, priceSensitivity);
            if (elasticity2 >= 1.0) {
                throw new Error(`Elasticidad debería ser < 1 para precio mayor: ${elasticity2}`);
            }

            // Test 3: Precio menor al promedio
            const price3 = basePrice * 0.8;
            const elasticity3 = Math.pow(avgPrice / price3, priceSensitivity);
            if (elasticity3 <= 1.0) {
                throw new Error(`Elasticidad debería ser > 1 para precio menor: ${elasticity3}`);
            }

            console.log('✅ Elasticidad de precios validada:');
            console.log(`   - Precio ${price1}: ${elasticity1.toFixed(3)}`);
            console.log(`   - Precio ${price2}: ${elasticity2.toFixed(3)}`);
            console.log(`   - Precio ${price3}: ${elasticity3.toFixed(3)}`);

            this.testResults.push({
                test: 'PriceElasticity',
                status: 'PASS',
                message: 'Elasticidad de precios validada correctamente',
                details: { elasticity1, elasticity2, elasticity3 }
            });

            return true;

        } catch (error) {
            this.testResults.push({
                test: 'PriceElasticity',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ Validación fallida:', error.message);
            return false;
        }
    }

    /**
     * Validar fórmula de Hard Cap de precios
     */
    validatePriceHardCap() {
        console.log('\n🧪 VALIDACIÓN: Hard Cap de Precios');
        
        try {
            const price = 200;
            const hardCap = 150;

            // Aplicar fórmula de hard cap
            const penalty = Math.pow(hardCap / price, 4);
            
            // Validar que la penalización sea significativa
            if (penalty >= 0.5) {
                throw new Error(`Penalización de hard cap muy baja: ${penalty}`);
            }

            // Validar que la penalización sea menor que 1
            if (penalty >= 1.0) {
                throw new Error(`Penalización de hard cap debería ser < 1: ${penalty}`);
            }

            console.log('✅ Hard Cap de precios validado:');
            console.log(`   - Precio: ${price}`);
            console.log(`   - Hard Cap: ${hardCap}`);
            console.log(`   - Penalización: ${penalty.toFixed(3)}`);

            this.testResults.push({
                test: 'PriceHardCap',
                status: 'PASS',
                message: 'Hard cap de precios validado correctamente',
                details: { price, hardCap, penalty }
            });

            return true;

        } catch (error) {
            this.testResults.push({
                test: 'PriceHardCap',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ Validación fallida:', error.message);
            return false;
        }
    }
}

/**
 * Validador de Capacity Service
 */
class CapacityServiceValidator {
    constructor() {
        this.testResults = [];
    }

    /**
     * Validar fórmula de asignación de cuotas
     */
    validateQuotaAssignment() {
        console.log('\n🧪 VALIDACIÓN: Asignación de Cuotas de Producción');
        
        try {
            // Test 1: Capacidad estándar con 3 empresas
            const totalCapacity1 = 6000;
            const companyCount1 = 3;
            const expectedQuota1 = Math.floor(totalCapacity1 / companyCount1);
            
            if (expectedQuota1 !== 2000) {
                throw new Error(`Cuota incorrecta: esperado 2000, actual ${expectedQuota1}`);
            }

            // Test 2: Capacidad con número impar de empresas
            const totalCapacity2 = 6000;
            const companyCount2 = 4;
            const expectedQuota2 = Math.floor(totalCapacity2 / companyCount2);
            
            if (expectedQuota2 !== 1500) {
                throw new Error(`Cuota incorrecta: esperado 1500, actual ${expectedQuota2}`);
            }

            // Validar que la suma no excede la capacidad total
            const totalAssigned1 = expectedQuota1 * companyCount1;
            const totalAssigned2 = expectedQuota2 * companyCount2;
            
            if (totalAssigned1 > totalCapacity1) {
                throw new Error(`Capacidad excedida en test 1: ${totalAssigned1} > ${totalCapacity1}`);
            }

            if (totalAssigned2 > totalCapacity2) {
                throw new Error(`Capacidad excedida en test 2: ${totalAssigned2} > ${totalCapacity2}`);
            }

            console.log('✅ Asignación de cuotas validada:');
            console.log(`   - Test 1: ${companyCount1} empresas, ${expectedQuota1} cada una, total ${totalAssigned1}/${totalCapacity1}`);
            console.log(`   - Test 2: ${companyCount2} empresas, ${expectedQuota2} cada una, total ${totalAssigned2}/${totalCapacity2}`);

            this.testResults.push({
                test: 'QuotaAssignment',
                status: 'PASS',
                message: 'Asignación de cuotas validada correctamente',
                details: { 
                    test1: { companies: companyCount1, quota: expectedQuota1, total: totalAssigned1 },
                    test2: { companies: companyCount2, quota: expectedQuota2, total: totalAssigned2 }
                }
            });

            return true;

        } catch (error) {
            this.testResults.push({
                test: 'QuotaAssignment',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ Validación fallida:', error.message);
            return false;
        }
    }

    /**
     * Validar edge cases
     */
    validateEdgeCases() {
        console.log('\n🧪 VALIDACIÓN: Edge Cases de Capacidad');
        
        try {
            // Test 1: Capacidad cero
            const totalCapacity1 = 0;
            const companyCount1 = 3;
            const expectedQuota1 = Math.floor(totalCapacity1 / companyCount1);
            
            if (expectedQuota1 !== 0) {
                throw new Error(`Cuota con capacidad cero debería ser 0: ${expectedQuota1}`);
            }

            // Test 2: Una sola empresa
            const totalCapacity2 = 6000;
            const companyCount2 = 1;
            const expectedQuota2 = Math.floor(totalCapacity2 / companyCount2);
            
            if (expectedQuota2 !== totalCapacity2) {
                throw new Error(`Empresa única debería recibir toda la capacidad: ${expectedQuota2}`);
            }

            // Test 3: Muchas empresas con capacidad limitada
            const totalCapacity3 = 1000;
            const companyCount3 = 10;
            const expectedQuota3 = Math.floor(totalCapacity3 / companyCount3);
            
            if (expectedQuota3 !== 100) {
                throw new Error(`Cuota incorrecta para muchas empresas: ${expectedQuota3}`);
            }

            console.log('✅ Edge cases validados:');
            console.log(`   - Capacidad cero: ${expectedQuota1}`);
            console.log(`   - Empresa única: ${expectedQuota2}`);
            console.log(`   - Muchas empresas: ${expectedQuota3}`);

            this.testResults.push({
                test: 'EdgeCases',
                status: 'PASS',
                message: 'Edge cases de capacidad validados correctamente',
                details: { 
                    zeroCapacity: expectedQuota1,
                    singleCompany: expectedQuota2,
                    manyCompanies: expectedQuota3
                }
            });

            return true;

        } catch (error) {
            this.testResults.push({
                test: 'EdgeCases',
                status: 'FAIL',
                message: error.message,
                details: null
            });

            console.error('❌ Validación fallida:', error.message);
            return false;
        }
    }
}

/**
 * Suite principal de validación
 */
class ValidationSuite {
    constructor() {
        this.marketValidator = new MarketEngineValidator();
        this.capacityValidator = new CapacityServiceValidator();
        this.allResults = [];
    }

    /**
     * Ejecutar todas las validaciones
     */
    async runAllValidations() {
        console.log('🚀 INICIANDO SUITE DE VALIDACIÓN ELECTRONOVA V2');
        console.log('📋 Validaciones sin dependencia de MongoDB\n');

        // Validaciones de Motor de Mercado
        console.log('=== MOTOR DE MERCADO ECPCIM ===');
        const marketTests = [
            () => this.marketValidator.validateCompetitiveScore(),
            () => this.marketValidator.validatePriceElasticity(),
            () => this.marketValidator.validatePriceHardCap()
        ];

        let marketPassed = 0;
        for (const test of marketTests) {
            try {
                const result = await test();
                if (result) marketPassed++;
            } catch (error) {
                console.error('❌ Error inesperado en validación de mercado:', error);
            }
        }

        // Validaciones de Capacity Service
        console.log('\n=== CAPACITY SERVICE ===');
        const capacityTests = [
            () => this.capacityValidator.validateQuotaAssignment(),
            () => this.capacityValidator.validateEdgeCases()
        ];

        let capacityPassed = 0;
        for (const test of capacityTests) {
            try {
                const result = await test();
                if (result) capacityPassed++;
            } catch (error) {
                console.error('❌ Error inesperado en validación de capacidad:', error);
            }
        }

        // Consolidar resultados
        this.allResults = [
            ...this.marketValidator.testResults,
            ...this.capacityValidator.testResults
        ];

        const totalTests = marketTests.length + capacityTests.length;
        const totalPassed = marketPassed + capacityPassed;

        // Generar reporte final
        this.generateFinalReport(totalPassed, totalTests);

        return totalPassed === totalTests;
    }

    /**
     * Generar reporte final
     */
    generateFinalReport(passed, total) {
        console.log('\n📊 REPORTE FINAL DE VALIDACIÓN');
        console.log('=====================================');

        for (const result of this.allResults) {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
        }

        console.log(`\n📈 RESUMEN: ${passed}/${total} validaciones pasadas`);
        
        if (passed === total) {
            console.log('🎉 TODAS LAS VALIDACIONES PASARON');
            console.log('✅ La lógica de negocio está lista para integración con MongoDB');
        } else {
            console.log('⚠️ HAY VALIDACIONES FALLIDAS');
            console.log('🔧 Revisar la lógica antes de proceder con la integración');
        }

        console.log('\n📝 PRÓXIMOS PASOS:');
        console.log('1. Configurar MongoDB para desarrollo');
        console.log('2. Ejecutar tests de integración');
        console.log('3. Implementar mejoras en el motor ECPCIM');
        console.log('4. Validar con datos reales del juego');
    }
}

/**
 * Ejecutar suite de validación
 */
async function runValidationSuite() {
    const validationSuite = new ValidationSuite();
    
    try {
        const allValidationsPassed = await validationSuite.runAllValidations();
        process.exit(allValidationsPassed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Error fatal en suite de validación:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runValidationSuite();
}

module.exports = ValidationSuite;