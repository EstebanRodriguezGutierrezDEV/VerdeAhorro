import { initDashboardPage } from './controllers/DashboardController.js';

if (window.location.pathname.includes('dashboard')) {
  document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardPage();
  });
}
