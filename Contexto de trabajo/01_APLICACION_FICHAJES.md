# ⏱️ 01 - Aplicación de Registro Horario y Fichajes (`Gestión horaria/`)

> **Submódulo autónomo (PWA Standalone) para el fichaje presencial y supervisado de jornada en los centros logísticos de Habilis (Saica Pack Velilla y Meco).**

---

## 🚀 Cómo arrancar y probar esta aplicación

En cualquiera de los dos ordenadores:
```powershell
# 1. Situarse en la carpeta de la app
cd "c:\Users\...\OneDrive\Aplicaciones\Habilis\Gestión horaria"

# 2. Si es la primera vez en este PC, instalar librerías:
npm install

# 3. Iniciar el servidor local de pruebas:
npm run dev
```
La aplicación abrirá la interfaz Kiosk en: **`http://localhost:5173/`**.

---

## 🔑 Credenciales y Códigos de Prueba (Modo Prototipo)

* **Trabajadores en Planta (Centro 1 - Velilla):**
  * `12001` - Carlos Gómez Martín (Carretillero)
  * `13001` - Operario Ejemplo C1 (Operario)
  * `11001` - Responsable Ejemplo C1 (Responsable)
* **Trabajadores en Planta (Centro 2 - Meco):**
  * `21001` - Responsable Ejemplo C2 (Responsable)
  * `22001` - Carretillero Ejemplo C2 (Carretillero)
* **PIN universal de pruebas:** `1234` (valida el hash SHA-256 criptográfico con Salt de 16 caracteres aleatorios).
* **Acceso con candado para Responsables (`🔒 Zona Control`):**  
  Requiere introducir el código de un Responsable (`11001` o `21001`) + PIN `1234`. Si lo intenta un carretillero (`12001`), el sistema deniega el acceso por permisos de categoría.
* **Cambio de Centro en Terminal:**  
  Pulsa sobre la chapa del centro en la barra superior del terminal e introduce `11001` o `21001` (sin PIN, para agilidad de supervisores). Se almacena exclusivamente en el navegador de esa máquina (`localStorage`).

---

## 🛠️ Estado Actual del Desarrollo (Lo que ya está construido y probado)

1. **Flujo Táctil Kiosk en 3 Pasos (`KioskView.tsx`):**
   * Botones numéricos de 72px optimizados para uso táctil rápido (incluso con guantes).
   * Paso 1: Tecleo de código permanente de 5 cifras.
   * Paso 2: Saludo identificativo con foto/icono y entrada de PIN de 4 dígitos enmascarado.
   * Paso 3: Botón coherente (Verde "Entrada" si no hay jornada abierta, Rojo "Salida" si ya ha entrado). Cuenta atrás visual de 3 segundos para el siguiente operario.
2. **Criptografía del PIN (`authPin.ts`):**
   * Cada trabajador tiene una semilla aleatoria única (*Salt*) de 16 caracteres generada por `window.crypto.getRandomValues`.
   * Hash SHA-256 irreversible: `PIN + ":" + Salt + ":HABILIS_SECURE_CLOCK"`. Nunca viaja en texto plano.
   * Límite estricto de 3 intentos fallidos consecutivos: el código queda bloqueado en la app y el trabajador es derivado a los partes en papel `FOR-RRHH-001-01` y `FOR-RRHH-001-02`.
3. **Monitor de Presencia en Tiempo Real (`SupervisorMonitor.tsx`):**
   * Selector de turnos: **☀️ Mañana** (06:00 - 14:00) / **🌇 Tarde** (14:00 - 22:00) / **🌙 Noche** (22:00 - 06:00).
   * Semáforo de planta: 🟢 Fichados en verde, 🔴 Ausentes/Retrasos en rojo con minutos acumulados (`+15 min`), 🔵 Extras en azul.
   * Botón de refresco activo con animación de giro (`RefreshCw`) e indicador visual de hora de actualización (`Actualizado: 12:05:30`).
4. **Modo Simulador Kiosk Definitivo:**
   * Botón `[👁️ Simular Pantalla Definitiva]` para ocultar la barra superior de desarrollo y probar la tablet exactamente como la verán en Saica Pack.
   * Botón flotante discreto `[🛠️ Mostrar barra de desarrollo]` para recuperar los controles.

---

## 📄 Contrato de Datos: El CSV Único del Libro 03

* **Origen:** Libro `03_Cuadrantes_Ausencias_HABILIS_v2_3.xlsm` (hoja `Exportación app`).
* **Mecanismo:** El Libro 03 absorbe la plantilla del Libro 01 por Power Query y, mediante su macro **"Exportar CSV"**, genera un único archivo semanal de 15 columnas con toda la plantilla (activos y cesados) y sus 7 días de turnos planificados.
* **Documento de especificación detallada:**  
  Consulta `Gestión horaria/ESPECIFICACION_CSV_UNICO_LIBRO03.md`.

---

## 🎯 Próximos Pasos en Fichajes (Lo que falta por hacer)

1. **Módulo de Importación en la App (`AdminConfig.tsx`):**
   * Componente para que el responsable seleccione el CSV del Libro 03.
   * Previsualización con resumen (semana, altas, ceses, cambios).
   * Validación e inserción atómica en el almacenamiento.
2. **Conexión a Base de Datos Dedicada:**
   * Configuración de la instancia aislada e independiente en el servidor seguro.
3. **Módulo de Reportes Oficiales:**
   * Hoja mensual de jornada para trabajadores e Inspección (RD-ley 8/2019, sin DNI).
   * CSV de retorno analítico de fichajes para el Libro 03 (`ESPECIFICACION_RETORNO_FICHAJES_APP_LIBRO03.md`).
