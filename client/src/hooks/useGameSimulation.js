// ============================================
// FILE: client/src/hooks/useGameSimulation.js
// PURPOSE: Calcular estado proyectado (Con Tracking de Consumo MP)
// ============================================

import { useMemo } from 'react';

const COSTS = {
    logistics: { air: 15, ground: 5 },
};

export const useGameSimulation = (company, decision, products, materials) => {
    
    const projectedState = useMemo(() => {
        if (!company || !products || !materials) return null;

        // 1. ESTADO INICIAL
        const initialCash = parseFloat(company.cash);
        const initialRawMaterials = {};
        company.rawMaterials.forEach(rm => initialRawMaterials[rm.materialType] = rm.units);
        
        const initialFactoryStock = {};
        company.factoryStock.forEach(fs => initialFactoryStock[fs.productLine] = fs.units);

        // 2. VARIABLES DE TRABAJO
        let projectedCash = initialCash;
        let currentRawMaterials = { ...initialRawMaterials };
        let currentFactoryStock = { ...initialFactoryStock };
        
        // NUEVO: Acumulador de Consumo
        let materialConsumption = { Alfa: 0, Beta: 0, Omega: 0 }; 

        // --- CÁLCULOS ---

        // A. COMPRAS
        let procurementCost = 0;
        if (decision.procurement) {
            decision.procurement.forEach(order => {
                const mat = materials.find(m => m.name === order.materialType);
                if (mat && order.units > 0) {
                    const multiplier = order.supplierType === 'local' ? 1.2 : 1.0;
                    procurementCost += (order.units * parseFloat(mat.baseCost) * multiplier);
                }
            });
        }

        // B. PRODUCCIÓN
        let productionCost = 0;
        let mpDeficit = [];

        if (decision.production) {
            decision.production.forEach(order => {
                const product = products.find(p => p._id === order.productLine);
                if (product && order.units > 0) {
                    productionCost += (order.units * parseFloat(product.baseProductionCost));

                    product.rawMaterialRequirements.forEach(req => {
                        const needed = req.quantity * order.units;
                        
                        // REGISTRAR CONSUMO TOTAL (Independiente de si hay stock o no)
                        materialConsumption[req.materialType] = (materialConsumption[req.materialType] || 0) + needed;

                        if (currentRawMaterials[req.materialType] >= needed) {
                            currentRawMaterials[req.materialType] -= needed;
                        } else {
                            const missing = needed - (currentRawMaterials[req.materialType] || 0);
                            mpDeficit.push({ material: req.materialType, missing });
                            currentRawMaterials[req.materialType] = 0;
                        }
                    });

                    const currentStock = currentFactoryStock[product._id] || 0;
                    currentFactoryStock[product._id] = currentStock + order.units;
                }
            });
        }

        // C. LOGÍSTICA
        let logisticsCost = 0;
        let stockDeficit = [];

        if (decision.logistics) {
            decision.logistics.forEach(shipment => {
                if (shipment.units > 0) {
                    const costPerUnit = shipment.method === 'aereo' ? COSTS.logistics.air : COSTS.logistics.ground;
                    logisticsCost += (shipment.units * costPerUnit);

                    const available = currentFactoryStock[shipment.productLine] || 0;
                    if (available >= shipment.units) {
                        currentFactoryStock[shipment.productLine] -= shipment.units;
                    } else {
                        stockDeficit.push({ product: shipment.productLine, missing: shipment.units - available });
                        currentFactoryStock[shipment.productLine] = 0;
                    }
                }
            });
        }

        // D. MARKETING
        let marketingCost = 0;
        if (decision.commercial) {
            decision.commercial.forEach(mkt => {
                marketingCost += (mkt.marketingBudget || 0);
            });
        }

        const totalExpenses = procurementCost + productionCost + logisticsCost + marketingCost;
        projectedCash -= totalExpenses;

        const isValid = projectedCash >= 0 && mpDeficit.length === 0 && stockDeficit.length === 0;

        return {
            initialCash,
            projectedCash,
            totalExpenses,
            initialState: {
                rawMaterials: initialRawMaterials,
                factoryStock: initialFactoryStock
            },
            // NUEVO CAMPO EXPORTADO
            materialConsumption, 
            breakdown: {
                procurement: procurementCost,
                production: productionCost,
                logistics: logisticsCost,
                marketing: marketingCost
            },
            inventory: {
                rawMaterials: currentRawMaterials,
                factoryStock: currentFactoryStock
            },
            errors: {
                mpDeficit,
                stockDeficit,
                negativeCash: projectedCash < 0
            },
            isValid
        };

    }, [company, decision, products, materials]);

    return projectedState;
};