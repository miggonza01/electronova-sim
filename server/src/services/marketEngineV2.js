// ============================================
// FILE: server/src/services/marketEngineV2.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Motor de Ventas Híbrido (Algoritmo ECPCIM)
// SPEC REF: 2.3 - Motor de Mercado Híbrido
// ============================================

const Market = require('../models/Market');
const Product = require('../models/Product');
const inventoryService = require('./inventoryService');

/**
 * Calcula las ventas para un mercado y producto específico en una ronda.
 * @param {Object} market - Documento del Mercado (Novaterra, etc.)
 * @param {Object} product - Documento del Producto (Alta, etc.)
 * @param {Array} activeCompanies - Array de empresas activas (con sus decisiones e inventarios)
 * @param {Array} allDecisions - Array de decisiones de la ronda actual
 */
exports.calculateSales = async (market, product, activeCompanies, allDecisions) => {
    console.log(`📊 MARKET ENGINE: Calculando ${product.name} en ${market.name}...`);

    // 1. CALCULAR DEMANDA TOTAL DEL SEGMENTO (D_total)
    // PDF Pág 4: D_total = Potencial * Factor Aleatorio
    // Para desarrollo determinista usamos 1.0, en prod usaríamos Math.random()
    const randomFactor = 1.0; 
    const totalDemand = market.demandPotential * randomFactor;

    // Preparar datos de competidores
    const competitors = [];

    for (const company of activeCompanies) {
        // Buscar decisión de la empresa para este mercado
        const decision = allDecisions.find(d => d.companyId.toString() === company._id.toString());
        
        let price = 0;
        let marketing = 0;

        if (decision && decision.commercial) {
            const commData = decision.commercial.find(c => c.market === market.name);
            if (commData) {
                marketing = commData.marketingBudget;
                const priceData = commData.prices.find(p => p.productLine.toString() === product._id.toString());
                if (priceData) price = priceData.price;
            }
        }

        // Buscar Inventario Disponible en esta Plaza
        // Nota: inventoryService.processFIFO requiere un array. Filtramos los lotes de este producto/mercado.
        const availableStock = company.inventory.filter(
            lot => lot.market === market.name && lot.productLine.toString() === product._id.toString()
        );
        const totalUnitsAvailable = availableStock.reduce((sum, lot) => sum + lot.units, 0);

        // Si no puso precio o no tiene stock, no compite
        if (price <= 0 || totalUnitsAvailable <= 0) continue;

        competitors.push({
            company,
            price,
            marketing,
            stock: availableStock, // Array de lotes
            totalUnits: totalUnitsAvailable,
            techLevel: company.techLevel,
            ethics: company.ethicsIndex,
            score: 0,
            sales: 0,
            revenue: 0
        });
    }

    if (competitors.length === 0) {
        console.log(`   ⚠️ Sin competidores activos en este segmento.`);
        return;
    }

    // 2. CALCULAR SCORE COMPETITIVO (SC)
    // Necesitamos rangos para normalizar precios
    const prices = competitors.map(c => c.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // Evitar división por 0

    competitors.forEach(comp => {
        // A. Puntuación Precio (Invertida: Menor precio = Mejor)
        // Fórmula PDF: (Max - Precio) / Rango
        const scorePrice = (maxPrice - comp.price) / priceRange;

        // B. Puntuación Marketing (Logarítmica)
        // Fórmula PDF: 1 + log10(Inversión + 1) * 0.15
        const scoreMarketing = (1 + Math.log10(comp.marketing + 1)) * 0.15;

        // C. Puntuación Calidad (Simplificada v2: TechLevel)
        // Normalizamos TechLevel (asumiendo max 10 por ahora)
        const scoreQuality = comp.techLevel / 10;

        // D. Puntuación Ética
        const scoreEthics = comp.ethics / 100;

        // SCORE FINAL PONDERADO
        comp.score = (scorePrice * market.params.w_price) +
                     (scoreQuality * market.params.w_quality) +
                     (scoreMarketing * market.params.w_marketing) +
                     (scoreEthics * market.params.w_ethics);
    });

    // Suma total de Scores para reparto de cuota
    const totalScore = competitors.reduce((sum, c) => sum + c.score, 0) || 1;

    // 3. ASIGNAR CUOTA Y APLICAR ELASTICIDAD
    for (const comp of competitors) {
        // Cuota Base
        let potentialDemand = totalDemand * (comp.score / totalScore);

        // Aplicar Hard Cap de Precio (Si te pasas, vendes casi nada)
        if (comp.price > market.priceHardCap) {
            const excessRatio = market.priceHardCap / comp.price; // < 1
            // Penalización drástica: Demanda * ratio^4
            potentialDemand *= Math.pow(excessRatio, 4);
        }

        // Aplicar Elasticidad (Sensibilidad)
        // Si el precio es alto comparado con el promedio, la demanda baja
        const avgPrice = prices.reduce((a,b) => a+b, 0) / prices.length;
        const priceRatio = avgPrice / comp.price; 
        potentialDemand *= Math.pow(priceRatio, market.priceSensitivity);

        // 4. VALIDAR CONTRA INVENTARIO (Ventas Reales)
        const realSales = Math.floor(Math.min(potentialDemand, comp.totalUnits));

        // 5. EJECUTAR VENTA (Consumir Stock FIFO)
        if (realSales > 0) {
            const consumption = inventoryService.consumeStockFIFO(comp.stock, realSales);
            
            // Actualizar Inventario en Objeto Empresa (En memoria, luego se guarda)
            // Reemplazamos los lotes viejos con los actualizados (remanentes)
            // Nota: Esto es complejo en Arrays. Simplificación:
            // Borramos los lotes de este producto/mercado y ponemos los nuevos (si quedaron)
            
            // Paso 1: Quitar lotes viejos de este producto/mercado
            comp.company.inventory = comp.company.inventory.filter(
                lot => !(lot.market === market.name && lot.productLine.toString() === product._id.toString())
            );
            
            // Paso 2: Agregar lotes con stock restante (si hay)
            // consumeStockFIFO modifica 'units' in-situ en el array que le pasamos (comp.stock)
            // Filtramos los que quedaron con > 0
            const remainingLots = comp.stock.filter(lot => lot.units > 0);
            comp.company.inventory.push(...remainingLots);

            // Registrar Ingresos
            comp.sales = realSales;
            comp.revenue = realSales * comp.price;
            
            // Actualizar Cash
            // Convertimos Decimal128 a float, sumamos, guardamos
            let currentCash = parseFloat(comp.company.cash.toString());
            comp.company.cash = currentCash + comp.revenue;

            console.log(`   ✅ VENTA: ${comp.company.name} vendió ${realSales}u a $${comp.price} (Ingreso: $${comp.revenue})`);
        } else {
            console.log(`   ❌ SIN VENTA: ${comp.company.name} (Precio muy alto o Score bajo)`);
        }
    }
};