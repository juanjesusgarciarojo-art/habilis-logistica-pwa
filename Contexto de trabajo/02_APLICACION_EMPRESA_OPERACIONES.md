# 🏢 02 - Aplicación Corporativa de Operaciones y Calidad (`APP/`)

> **Plataforma web integral (PWA) de Habilis Logística para gestión de operarios, checklists de maquinaria, control de muelles, portal del empleado e informes de calidad.**

---

## 🚀 Cómo arrancar y probar esta aplicación

En cualquiera de los dos ordenadores:
```powershell
# 1. Situarse en la carpeta de la app corporativa
cd "c:\Users\...\OneDrive\Aplicaciones\Habilis\APP"

# 2. Si es la primera vez en este PC, instalar dependencias:
npm install

# 3. Iniciar el servidor local de pruebas:
npm run dev
```
La aplicación abrirá la interfaz corporativa en su puerto local habitual (por defecto `http://localhost:5173/` o `http://localhost:5174/` si Fichajes ya está abierto).

---

## 🛠️ Componentes y Módulos Principales de la Aplicación

* **Panel del Operario (`WorkerDashboard.tsx`):**  
  Vista para el personal en muelle: tareas asignadas, estado de la jornada, calendario individual y avisos.
* **Panel de Responsable / Mando (`ManagerDashboard.tsx`):**  
  Supervisión de equipos en muelle, asignación de tareas operativas y revisión en tiempo real.
* **Cuadro de Mando de Administración (`AdminDashboard.tsx`):**  
  Control general de centros, configuración de parámetros y gestión de usuarios.
* **Checklists de Equipos e Incidentes (`ChecklistModal.tsx`):**  
  Revisiones de carretillas elevadoras, registro de daños y evidencias fotográficas.
* **Calendario Anual y Ausencias (`AnnualCalendar.tsx`):**  
  Visualización interactiva de turnos anuales, vacaciones y días de descanso.
* **Registro de Auditoría (`AuditLogView.tsx`):**  
  Trazabilidad de modificaciones de datos y acciones de usuarios.

---

## 🔗 Relación entre `APP/` y `Gestión horaria/`

* **`Gestión horaria/`:** Es el terminal táctil ultra rápido (Kiosk) para colocar en tablets en la pared del muelle exclusivamente para que los 40-50 operarios fichen su entrada y salida en 3 segundos.
* **`APP/`:** Es la aplicación completa de gestión logística y operaciones diarias que utilizan los responsables y directores desde sus ordenadores o móviles.
* **Estrategia acordada:** Ambas comparten el mismo stack tecnológico (React 19 + TypeScript + Vite + Tailwind CSS), de modo que cuando ambas estén maduras, el módulo de fichajes pueda integrarse en `APP/` sin necesidad de reescribir código.
