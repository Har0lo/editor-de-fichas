import './styles.css';
import { startRouter } from './router.js';

// esperar las fuentes para que el canvas no mida textos con la fuente fallback
document.fonts.ready.then(() => startRouter());
