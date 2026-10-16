# ❓ 03 - Tareas Abiertas y Preguntas Inmediatas para el Usuario

> **Instrucción para la IA:** Consulta este documento antes de responder al usuario. Identifica en qué tarea quiere enfocarse hoy y pregúntale antes de modificar ningún archivo.

---

## 🎯 1. Tareas Inmediatas en la Aplicación de Fichajes (`Gestión horaria/`)

La aplicación Kiosk táctil ya tiene implementada la interfaz, el PIN criptográfico con Salt de 16 caracteres, el candado de responsables, el cambio independiente de centros (Velilla / Meco) y el semáforo de presencia con botón de refresco activo.

Las siguientes tareas pendientes están listas para abordarse:

### Tarea A: Módulo de Importación del CSV Único en `AdminConfig.tsx`
* **En qué consiste:** Crear la pantalla dentro de la zona de administración para que el responsable cargue el archivo CSV exportado desde el botón **"Exportar CSV"** del Libro 03 (`03_Cuadrantes_Ausencias_HABILIS_v2_3.xlsm`).
* **Especificación a seguir:** `Gestión horaria/ESPECIFICACION_CSV_UNICO_LIBRO03.md` (15 columnas, UTF-8, delimitador `;`, detección automática de cabecera, 7 filas por trabajador por semana).
* **Comportamiento requerido:**
  1. Mostrar previsualización antes de guardar: semana, versión, altas nuevas, ceses y total de trabajadores.
  2. Validar que no haya inconsistencias (rechazar el archivo entero si hay errores graves).
  3. Aplicar atómicamente la actualización a la base de trabajadores y a la planificación semanal.
  4. Preservar intactos los PINs, hashes y fichajes ya existentes de los trabajadores.

### Tarea B: Conexión de la Base de Datos Dedicada en Servidor Seguro
* **En qué consiste:** Crear la instancia aislada e independiente en el servidor para el registro horario, configurar sus credenciales en `.env` y aplicar las reglas de seguridad (lectura/escritura autenticada, inmutabilidad de fichajes con sello oficial de tiempo `serverTimestamp()`).
* **Confidencialidad:** Mantener en toda la app la denominación neutra *"Servidor Seguro e Inmutable"*, sin mostrar proveedores cloud comerciales.

### Tarea C: Módulo de Exportación de Informes y Retorno al Libro 03
* **En qué consiste:**
  1. Generar la hoja oficial de registro de jornada mensual para entregar al trabajador o a la Inspección de Trabajo (cumpliendo el RD-ley 8/2019, sin DNI/NIE).
  2. Generar el archivo CSV semanal analítico `fichajes_reales_YYYY_Www_NNN.csv` (10 columnas) conforme a `Gestión horaria/ESPECIFICACION_RETORNO_FICHAJES_APP_LIBRO03.md` para alimentar la consulta `qryFichajesRealesApp` del Libro 03.

---

## 🏢 2. Tareas en la Aplicación Corporativa (`APP/`)

Si el usuario decide trabajar en la aplicación corporativa general:
1. Revisión de módulos de checklists de carretillas elevadoras e incidentes.
2. Comprobación de vistas de operario (`WorkerDashboard.tsx`) y responsable (`ManagerDashboard.tsx`).
3. Preparación de los puntos de integración futura con el módulo de fichajes.

---

## ❓ 3. Pregunta Clave que la IA debe formular al usuario

> *"Hola Juan Jesús. He revisado el estado del proyecto en `Contexto de trabajo/`. Ambas aplicaciones (`Gestión horaria/` y `APP/`) están listas y sincronizadas en este equipo.*  
> *En la aplicación de fichajes, lo siguiente es abordar el **Importador del CSV Único del Libro 03**, la **conexión de la base de datos dedicada** o la **generación de informes oficiales**. ¿En cuál de estas tareas nos enfocamos en esta sesión?"*
