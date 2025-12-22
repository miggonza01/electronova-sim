// client/src/services/adminService.js
import api from './api';

const adminService = {
  /**
   * Obtiene la configuración global actual (Ronda, Estado del juego).
   */
  getGameConfig: async () => {
    try {
      const response = await api.get('/admin/config');
      return response.data; // { success: true, data: { ... } }
    } catch (error) {
      console.error("Error obteniendo config de admin:", error);
      throw error;
    }
  },

  /**
   * Dispara el procesamiento de la ronda (El "Botón Rojo").
   * Esto calcula ventas, actualiza inventarios y avanza la ronda.
   */
  processRound: async () => {
    try {
      const response = await api.post('/admin/process-round');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error crítico al procesar ronda";
      throw new Error(message);
    }
  }
};

export default adminService;