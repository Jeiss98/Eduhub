// services/reporteService.js
const reporteRepository = require('../repositories/reporteRepository');

class ReporteService {
  async getDashboard() {
    return await reporteRepository.getDashboardStats();
  }

  async getProyectos() {
    return await reporteRepository.getProyectosReport();
  }

  async getTareasVencidas() {
    return await reporteRepository.getTareasVencidas();
  }

  async getEstudiantes() {
    return await reporteRepository.getEstudiantesReport();
  }
}

module.exports = new ReporteService();
