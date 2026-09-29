# ⏱️ Habilis - Módulo Autónomo de Gestión Horaria y Fichajes

Este directorio aloja la aplicación independiente de **Registro de Jornada y Fichajes** para los centros de trabajo de **Habilis Logística** (Centros 1 y 2 en Saica Pack).

---

## 🎯 Objetivo y Estrategia de Trabajo

Desarrollar una aplicación de fichajes **independiente y autónoma**, optimizada para su uso en tablets o móviles en planta custodiados por el Responsable de Turno.

* **Principio "Standalone First":** Funciona de forma 100% operativa por sí sola desde hoy mismo con su propia base de datos en **Firebase Firestore**, permitiendo su despliegue y uso inmediato en el muelle de carga.
* **Integración Futura Transparente:** La arquitectura de componentes y servicios está diseñada en **React + TypeScript** con la misma estética corporativa de Habilis para que, cuando se decida, su integración dentro de la aplicación principal de la empresa (`APP/`) sea directa y sin rehacer código.

---

## 🔑 Características Principales

1. **Pantalla Kiosco / Operario (Fichaje en 3 segundos):**
   * Teclado numérico táctil grande en pantalla.
   * Introducción del **Código Permanente de 5 Cifras** (`Centro + Puesto + Correlativo`).
   * Autenticación con **PIN Personal de 4 Cifras** (hasheado con salt, nunca en texto plano).
   * Confirmación inmediata de nombre, hora del servidor (`serverTimestamp`) y registro de Entrada o Salida.
   * Límite de 3 intentos fallidos con bloqueo de seguridad y derivación al parte manual `FOR-RRHH-001-01`.

2. **Panel del Responsable de Turno (Pase de Lista Semáforo):**
   * Selector de turno activo (☀️ Mañana / 🌇 Tarde / 🌙 Noche).
   * Semáforo de presencia en tiempo real:
     * 🟢 **Presentes / En Planta** (Fichados con hora exacta).
     * 🔴 **Pendientes / Ausentes** (Con contador de minutos de retraso tras la hora de inicio).
     * 🔵 **Refuerzos / Extras** (Operarios añadidos al turno fuera de cuadrante).
   * Alertas de incoherencia (intentos de doble entrada o salida sin entrada).

3. **Intercambio de Datos con los Libros Excel:**
   * **Importación de Plantilla (Vía CSV):** Desde la hoja `Exportación fichaje` de `01_Gestion_Plantilla_HABILIS_v2_1.xlsx`.
   * **Importación de Cuadrante Semanal (Vía CSV de los viernes):** Desde la hoja `Exportación cuadrante` de `03_Cuadrantes_Ausencias_HABILIS_v2.xlsx`.

4. **Cumplimiento Normativo (RD-ley 8/2019):**
   * Registro diario objetivo con hora inmutable de servidor.
   * Minimización de datos: **sin DNI/NIE** en la aplicación para proteger la privacidad.
   * Generación de informes acreditativos oficiales para trabajadores, sindicatos o Inspección de Trabajo.

---

## 📁 Estructura del Módulo

* `src/`:
  * `components/`:
    * `KioskView.tsx`: Teclado numérico y confirmación de fichaje del operario.
    * `SupervisorMonitor.tsx`: Monitor semáforo de pase de lista por turnos.
    * `CsvImporter.tsx`: Herramienta de carga controlada de CSVs de plantilla y cuadrantes.
  * `services/`:
    * `firebase.ts`: Conexión a Firestore y llamadas con `serverTimestamp()`.
    * `authPin.ts`: Cifrado, salting y validación de PINs de 4 cifras.
    * `fichajeService.ts`: Lógica de secuencias estrictas (Entrada/Salida).
  * `types/`:
    * `index.ts`: Modelos de datos TypeScript (Empleado, Fichaje, Cuadrante, Turno).
