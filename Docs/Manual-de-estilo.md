Manual de Estilo y Guía de Identidad Visual

presento el Manual de Estilo y Guía de Identidad Visual para el simulador ElectroNova  
Inc. Este documento garantiza que la interfaz no solo sea estética, sino que cumpla con  
la función pedagógica de sumergir al estudiante de pregrado en un entorno profesional  
de toma de decisiones de alto nivel ("Corporate Tech").   
   
1\. CONCEPTO VISUAL: "THE STRATEGIC DASHBOARD"   
El estilo se define como Corporate Tech. Busca imitar las terminales de datos financieros  
(estilo Bloomberg o Reuters) pero con una capa de usuario moderna y accesible (estilo  
SaaS Premium como Stripe o Slack).   
● Atributos de marca: Autoridad, Claridad, Precisión Financiera, Modernidad.  
● Filosofía UX: "La data es la protagonista". Menos decoración, más visualización   
de datos.   
   
2\. PALETA DE COLORES (SISTEMA DE DISEÑO)   
Se utilizarán variables CSS para asegurar consistencia y facilitar el "Modo  
Oscuro/Claro".   
Uso Color Hex Significado Psicológico   
Primario (Deep Navy) \#0F172A Estabilidad, autoridad y confianza.   
Secundario (Electric Blue) \#3B82F6 Tecnología, acción y fluidez digital.   
Éxito (Profit Green) \#10B981 Crecimiento, saldo positivo, ética alta.   
Alerta (Risk Red) \#EF4444 Quiebre de stock, deuda, ética baja.   
Fondo (Soft Slate) \#F8FAFC Limpieza visual para reducir fatiga  
cognitiva.   
Texto (Slate 900\) \#1E293B Legibilidad máxima.   
   
3\. TIPOGRAFÍA   
Para garantizar la legibilidad en tablas de datos complejas y dispositivos móviles:   
1\. Principal (Headings): Inter o Montserrat (Bold/SemiBold). Transmite modernidad y  
solidez.   
2\. Cuerpo y Datos: JetBrains Mono o Roboto Mono (para valores numéricos). Las  
fuentes monoespaciadas permiten que las columnas de cifras se alineen  
perfectamente, facilitando la comparación financiera.   
   
4\. COMPONENTES DE INTERFAZ (UI)   
● Tarjetas de KPI (Cards): Bordes redondeados (rounded-xl), sombras sutiles  
(  
shadow-sm) y un indicador de tendencia (flecha verde/roja).   
● Formularios de Decisión: Inputs con validación en tiempo real. Si el usuario  
ingresa una cifra que excede su capital, el borde cambia a rojo inmediatamente  
con un micro-texto explicativo.   
● Tablas de Datos: Diseño Zebra-striped para lectura fácil. Las celdas con valores  
críticos (como el $WSC$) deben resaltar al hacer hover.   
● Modales de Ayuda (Wiki): Uso de Glassmorphism (fondo desenfocado) para no  
perder el contexto de la partida mientras se lee una fórmula.   
   
5\. INGENIERÍA DE PROMPTS PARA ASSETS (IA GENERATIVA)   
Para mantener la coherencia visual en imágenes de fondo, avatares de instructores o  
banners, utiliza estos prompts exactos:   
● Backgrounds de Login:  
Prompt (Midjourney/DALL-E): "High-tech corporate office interior, futuristic  
electronics manufacturing background, clean aesthetic, cinematic lighting, deep  
navy and electric blue color palette, 8k resolution, minimalist architectural style  
\--ar 16:9"   
● Avatar del "CEO Mentor" (LatAm):  
Prompt: "Professional Hispanic male executive in his 50s, friendly but  
authoritative, wearing a modern business casual suit, blurred high-tech lab  
background, realistic photography, soft studio lighting \--v 6.0"   
   
6\. UX Y ACCESIBILIDAD (WCAG 2.1)   
Como simulador educativo, la inclusión es obligatoria:   
● Contraste: Todos los textos deben cumplir con el ratio de contraste 4.5:1.  
● Estados de Error: No usar solo el color para comunicar (ej. añadir un icono de   
advertencia ⚠ junto al texto rojo para usuarios con daltonismo).  
● Responsive Design: La jerarquía en móviles debe priorizar el botón "Enviar   
Decisión" y el "Capital Disponible" en un sticky header.   
   
7\. TONO Y VOZ (MICROCOPY)   
● Interfaz Técnica (Botones/Labels): Español Neutro.  
○ Correcto: "Procesar transacciones", "Estado de inventario".  
○ Incorrecto: "Dale click para comprar", "Tus cosas".   
● Narrativa y Feedback (Mensajes al Estudiante): Español Latinoamericano  
profesional.   
○ Ejemplo de acierto: "¡Excelente gestión\! Tu índice de ética ha subido  
debido a la selección de proveedores sostenibles."   
○ Ejemplo de alerta: "Advertencia: El nivel de obsolescencia en la Plaza  
Norte está afectando tu rentabilidad acumulada."   
   
8\. EXPLICACIÓN DE FÓRMULAS EN UI   
Cada vez que se presente una fórmula (como el Score Competitivo $CS$), se debe usar  
una tarjeta de información con el siguiente formato visual:   
¿Cómo se calcula?   
El sistema toma tu precio relativo y lo pondera frente al mercado:   
$$CS \= w1 \\cdot \\left(\\frac{P\_{min}}{P\_{actual}}\\right)$$  
Consejo Pro: Si bajas mucho el precio pero no tienes inventario, tu Score  
caerá por incumplimiento.   
   
