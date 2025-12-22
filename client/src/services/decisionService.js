// client/src/services/decisionService.js
import api from './api';

/**
 * Servicio encargado de gestionar las decisiones del jugador.
 */
const decisionService = {
  
  /**
   * Obtiene la decisión que el jugador ya tomó para la ronda actual (si existe).
   * Útil para bloquear el formulario si ya jugó.
   */
  getCurrentDecision: async () => {
    try {
      const response = await api.get('/decisions/current');
      return response.data; // { success: true, data: { ... } }
    } catch (error) {
      console.error("Error obteniendo decisión:", error);
      throw error;
    }
  },

  /**
   * Envía una nueva decisión al servidor.
   * @param {Object} decisionData - { price, marketing, production: { units }, logistics: [] }
   */
  submitDecision: async (decisionData) => {
    try {
      const response = await api.post('/decisions', decisionData);
      return response.data;
    } catch (error) {
      // Extraemos el mensaje de error exacto del servidor si existe
      const message = error.response?.data?.error || "Error al enviar decisión";
      throw new Error(message);
    }
  }
};

export default decisionService;