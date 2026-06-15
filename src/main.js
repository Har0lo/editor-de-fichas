import './styles.css';
import { startRouter } from './router.js';
import { initAuth } from './auth.js';

// esperar las fuentes (para medir texto bien) e iniciar la sesión antes de enrutar
Promise.all([document.fonts.ready, initAuth()]).then(() => startRouter());
