# 📍 00 - ¿Dónde nos hemos quedado? (Bitácora de Estado en Vivo)

> **Este es el primer archivo que debe leer la IA en cualquiera de los dos ordenadores al iniciar una sesión.**  
> Como ambos ordenadores comparten esta carpeta sincronizada por OneDrive, este documento registra con exactitud el estado del proyecto, lo que se hizo en la última sesión y la tarea exacta que toca hacer a continuación.

---

## 📅 Última sesión registrada: 16 de octubre de 2026

### 1. ¿Cómo funciona la sincronización entre tus dos ordenadores?
* **Carpeta compartida en la nube:** Ambos ordenadores trabajan sobre la misma carpeta de OneDrive (`OneDrive\Aplicaciones\Habilis\`).
* **Sin necesidad de comandos manuales de subida:** No tienes que subir ni descargar archivos manualmente; OneDrive lo sincroniza todo automáticamente en cuanto el ordenador se conecta a internet.
* **Única precaución al cambiar de equipo:** Esperar un instante a que el icono de OneDrive termine de sincronizar (círculo verde con tic) antes de abrir los archivos.
* **Función de esta carpeta `Contexto de trabajo/`:** Como la IA en el otro ordenador no recuerda las conversaciones anteriores, lee estos archivos para situarse en 5 segundos y retomar el trabajo exactamente en el punto donde se dejó.

---

## 🛠️ Estado Actual: ¿Qué está terminado y probado al 100%?

### En la Aplicación de Fichajes (`Gestión horaria/`):
1. **Interfaz Kiosk Táctil (`KioskView.tsx`):**
   * Botones de 72px para dedos/guantes.
   * Paso 1: Introducción de código permanente de 5 cifras.
   * Paso 2: Saludo identificativo con foto/icono + tecleo de PIN de 4 dígitos enmascarado.
   * Paso 3: Registro coherente (Verde Entrada / Rojo Salida) con cuenta atrás de 3 segundos para el siguiente operario.
2. **Seguridad Criptográfica del PIN (`authPin.ts`):**
   * Generación de semilla aleatoria individual (*Salt*) de 16 caracteres criptográficos.
   * Hash SHA-256 (`PIN:Salt:HABILIS_SECURE_CLOCK`). Nunca se almacena en texto plano.
   * Bloqueo inmediato tras 3 intentos fallidos y derivación a partes en papel (`FOR-RRHH-001-01` y `02`).
   * PIN comodín de desarrollo: `1234`.
3. **Acceso de Responsables con Candado (`🔒 Zona Control`):**
   * Acceso protegido por código de 5 cifras + PIN.
   * Comprueba la categoría: solo permite el paso a trabajadores con puesto `Responsable` (o rangos `11xxx` / `21xxx`), denegando el acceso a operarios o carretilleros.
4. **Independencia Total de Centro por Terminal:**
   * Centros: `Saica Pack · Velilla` (Centro 1) y `Saica Pack · Meco` (Centro 2).
   * Guardado exclusivamente en el dispositivo (`localStorage`), de modo que cada tablet mantiene su planta asignada sin interferir con las demás.
   * Cambio rápido de centro mediante código de responsable (sin PIN) pulsando en la chapa superior.
5. **Monitor Semáforo con Refresco Activo (`SupervisorMonitor.tsx`):**
   * Selector de turnos (☀️ Mañana / 🌇 Tarde / 🌙 Noche).
   * Semáforo: 🟢 Fichados en verde, 🔴 Ausentes/Retrasos en rojo con minutos de demora, 🔵 Extras en azul.
   * Botón de refresco con animación de giro (`RefreshCw`) y hora de actualización en vivo (`Actualizado: HH:MM:SS`).
6. **Modo Kiosk Definitivo:**
   * Botón `[👁️ Simular Pantalla Definitiva]` para ocultar la barra de desarrollo y botón flotante de retorno `[🛠️ Mostrar barra de desarrollo]`.
7. **Especificación del CSV de intercambio:**
   * Definido y documentado el **CSV único semanal de 15 columnas** generado desde el botón del Libro 03 (`03_Cuadrantes_Ausencias_HABILIS_v2_4.xlsm`, alimentado desde `01_Gestion_Plantilla_HABILIS_v2_3.xlsx`).

---

## 🎯 ¿En qué punto exacto nos hemos quedado y qué falta por hacer?

### Bloque 1: Aplicación de Fichajes (`Gestión horaria/` -> futura integración en `APP/`)
1. **[TAREA PRIORITARIA] Desarrollar el Importador del CSV Único en la App (`AdminConfig.tsx`):**
   * Crear el selector de archivo en la zona de gestión para cargar el CSV único que exporta el Libro 03 (`habilis_personal_cuadrante_YYYY_Www_NNN.csv`).
   * Mostrar previsualización (semana, versión, altas, ceses, turnos) antes de confirmar.
   * Actualizar trabajadores (`centroActual`, `puestoActual`, `fechaInicioAutorizacion`, `fechaCese`) y cuadrantes sin borrar los PINs existentes.
2. **Conexión a Base de Datos Dedicada:**
   * Conectar la instancia del servidor seguro en la nube y configurar las reglas de inmutabilidad de fichajes con hora oficial de servidor (`serverTimestamp()`).
3. **Módulo de Reportes Oficiales y Retorno de Fichajes:**
   * Hoja mensual oficial de jornada (RD-ley 8/2019, sin DNI).
   * Exportación del CSV semanal de fichajes reales (`fichajes_reales_YYYY_Www_NNN.csv`) para devolver las horas trabajadas al Libro 03.

### Bloque 2: Aplicación de la Empresa y Operativa (`APP/`)
1. **Módulo de Explicación de la Operativa y Sistema Documental (`REG-DIR-001`):**
   * Integrar en `APP/` el listado maestro oficial de documentos (`POP`, `IT`, `FOR`, `REG`, `CHK` por áreas `DIR`, `RRHH`, `LOG`, `PRL`, `CAL`, `ADM`, `MAN`), sus versiones vigentes, puestos destinatarios, confirmación de lectura/formación y el formulario de solicitud de modificación documental (`FOR-DIR-001-01`).
2. **Integración de `Gestión horaria/` dentro de `APP/`:**
   * Sustituir el antiguo reloj de prueba (`TimeClock.tsx`) por el módulo definitivo de fichajes (modo Kiosk para tablet de planta y modo consulta de registros propios en el portal del trabajador).
3. **Unificación de Identidad, Vacaciones (`POP-RRHH-002`) e Incidentes (`Libro 02`):**
   * Usar el código permanente de 5 cifras en toda la app de empresa, adaptar solicitudes de ausencia al formato `AUS-C1/C2-AÑO-NNNN` e incidentes al formato `INC-AÑO-NNNN`.

---

## 🚦 Reglas para la IA al arrancar:
1. Lee este archivo y confirma al usuario que sabes dónde nos hemos quedado.
2. No modifiques código sin preguntar antes:
   > *"Antes de empezar a hacer algo pregúntame, quiero ir paso a paso firme y seguro."*
3. Pregunta al usuario si en esta sesión quiere avanzar en **Fichajes (`Gestión horaria/`)** o en la **Aplicación de la Empresa y su Operativa (`APP/`)**.
