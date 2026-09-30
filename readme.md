# NexusBiz - Sistema de Gestión de Inventario con IA Local

**NexusBiz** es una aplicación full-stack moderna de control de inventario potenciada por un asistente conversacional inteligente (*NexusBot*). Utiliza un modelo de lenguaje local ejecutado mediante **Ollama**, permitiendo interactuar con la base de datos de manera natural y privada.

---

## Tecnologías Utilizadas

### Frontend:
* **React (Vite)**
* **Tailwind CSS v4** (Diseño moderno, responsivo y modo oscuro)
* **React Markdown** (Renderizado avanzado de respuestas de la IA)

### Backend:
* **Node.js & Express**
* **MongoDB & Mongoose** (Gestión y almacenamiento de datos del inventario)
* **Ollama** (Ejecución local de LLM con soporte para *Function Calling* / procesamiento de lenguaje natural)

---

##  Características Principales
*  **Chat conversacional inteligente** para consultas de stock, precios y filtrado de productos.
*  **Chips de acceso rápido** (*Quick Prompts*) para ejecutar comandos frecuentes con un solo clic.
*  **Historial persistente** utilizando `localStorage` en el navegador.
*  **Interfaz profesional** minimalista con tarjetas flotantes, indicadores de estado en tiempo real y tipografía limpia.
*  **Privacidad total:** Al correr la inteligencia artificial de forma local con Ollama, ningún dato corporativo ni de inventario sale a servidores externos.

---

##  Configuración y Ejecución Local

Sigue estos pasos para clonar y poner en marcha el proyecto en tu máquina:

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/nexusbiz.git
cd NexusBiz
2. Configurar y arrancar el Backend
Bash
cd nexusbiz-backend
npm install
Crea un archivo .env en la raíz de nexusbiz-backend con esta estructura:

Fragmento de código
PORT=5000
MONGO_URI=tu_conexion_mongodb_aqui
Inicia el servidor de desarrollo:

Bash
npm run dev
3. Configurar y arrancar el Frontend
Abre una nueva terminal en la carpeta del frontend:

Bash
cd nexusbiz-frontend
npm install
npm run dev