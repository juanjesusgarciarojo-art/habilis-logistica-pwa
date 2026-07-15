# 🚚 Habilis - Plataforma de Gestión Logística (PWA)

Este proyecto es una aplicación web progresiva (PWA) desarrollada para la gestión integral de la empresa logística **Habilis**. Permite coordinar personal, operaciones diarias, control de calidad y auditoría desde una interfaz única y adaptada a móviles, tablets y ordenadores.

---

## 🚀 Características Principales

*   **PWA Completa:** Instalable en iOS, Android y Escritorio, con soporte de funcionamiento sin conexión (Offline).
*   **Tres Perfiles de Usuario:**
    *   **Trabajador:** Fichaje diario, checklists obligatorios con fotos, dudas y reportes de roturas/incidencias.
    *   **Responsable:** Monitoreo del equipo fichado, asignación de cargas/descargas y visualización de incidencias en tiempo real.
    *   **Administrador:** Aprobación de vacaciones, gestión de nóminas y contratos, auditoría completa e informes descargables en **Excel (.xlsx)**, **CSV** y **PDF**.
*   **Dualidad de Datos:** Base de datos simulada en `localStorage` (para demostraciones inmediatas) con posibilidad de conectar a un **Firebase real** con un solo clic desde la interfaz de Ajustes.
*   **Diseño Corporativo:** Ajustado 100% a la identidad de Habilis (Naranja-Rojo y Azul).

---

## 💻 Requisitos Previos

Para ejecutar o desarrollar este proyecto en local, necesitas tener instalado:
*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
*   Un gestor de paquetes como `npm` (incluido con Node.js)

---

## 🛠️ Instalación y Ejecución Local

1.  **Descargar o clonar el proyecto** y abrir una terminal en su carpeta.
2.  **Instalar las dependencias:**
    ```bash
    npm install
    ```
3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
4.  **Abrir la aplicación:** Abre en tu navegador la dirección que se muestre en pantalla (normalmente `http://localhost:5173`).

---

## 🌐 ¿Cómo desplegar la aplicación para que otros la vean online?

Si subes el proyecto a GitHub, tus colaboradores verán el código y la documentación, pero **no podrán interactuar con la aplicación directamente desde el repositorio**. Para que puedan usar la demo haciendo clic en un enlace, tienes las siguientes opciones de despliegue gratuito:

### Opción A: Despliegue en GitHub Pages (La más recomendada para esta demo)
Puedes publicar el proyecto directamente en los servidores de GitHub de forma gratuita en 2 minutos:

1.  Abre el archivo `vite.config.ts` y añade la propiedad `base: './'` dentro de `defineConfig` (esto permite que los enlaces funcionen en subcarpetas de GitHub Pages).
2.  Instala el paquete de despliegue en tu terminal:
    ```bash
    npm install --save-dev gh-pages
    ```
3.  Abre tu archivo `package.json` y añade estos dos comandos dentro de `"scripts"`:
    ```json
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
    ```
4.  Ejecuta en tu terminal:
    ```bash
    npm run deploy
    ```
    *¡Listo! Tu aplicación estará disponible en la URL `https://tu-usuario.github.io/nombre-del-repositorio/`.*

### Opción B: Despliegue en Vercel o Netlify (Un clic)
1.  Crea una cuenta gratuita en [Vercel](https://vercel.com/) o [Netlify](https://www.netlify.com/).
2.  Conecta tu cuenta de GitHub.
3.  Selecciona el repositorio de Habilis.
4.  Haz clic en **Deploy**. El sistema detectará automáticamente que es un proyecto Vite y lo publicará, dándote una URL pública interactiva. Además, cada vez que subas cambios a GitHub, la web se actualizará sola.

### Opción C: Firebase Hosting (Para producción real)
Una vez que el proyecto pase a ser funcional con la base de datos de producción:
1.  Instala la herramienta de Firebase: `npm install -g firebase-tools`
2.  Inicia sesión: `firebase login`
3.  Inicializa el hosting en la carpeta del proyecto: `firebase init hosting` (selecciona la carpeta `dist` como directorio público y configúrala como Single Page Application).
4.  Despliega: `npm run build && firebase deploy`

---

## 📁 Estructura del Proyecto

*   `src/components/`: Vistas de los paneles de control y componentes visuales.
*   `src/services/`: Capas de base de datos (`db.ts`), autenticación (`auth.ts`) y simulación de datos (`mockData.ts`).
*   `src/utils/`: Lógica para generar archivos Excel y PDF descargables.
*   `src/index.css`: Estilo visual corporativo y animaciones de la aplicación.
*   `public/`: Manifiesto PWA (`manifest.json`), service worker (`sw.js`) e iconos del logotipo.
