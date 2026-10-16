# 🏢 02 - Aplicación Corporativa de Empresa y Operativa (`APP/`)

> **Plataforma web integral (PWA) de Habilis Logística para la explicación de la operativa (Sistema Documental), gestión de muelles, checklists de maquinaria, incidencias, vacaciones y portal del empleado, donde además se integrará el módulo de Registro Horario (`Gestión horaria/`).**

Última actualización: 16 de octubre de 2026.

---

## 🚀 1. Cómo arrancar y probar esta aplicación

En cualquiera de los dos ordenadores:
```powershell
cd "OneDrive\Aplicaciones\Habilis\APP"
npm install   # (Solo si es la primera vez en ese ordenador)
npm run dev
```

---

## 🔍 2. Diagnóstico Actual de `APP/` (Qué hay hecho y qué debemos alinear)

El código actual de `APP/` es un primer prototipo funcional creado en junio de 2026. Tiene una buena base visual, pero **fue programado antes de que definieras las reglas definitivas de Habilis en septiembre y octubre de 2026**.

Por tanto, al revisar todos los archivos del proyecto, estas son las **5 adaptaciones clave** que debemos hacer en `APP/` para que encaje al 100% con tu operativa real:

### A. Unificar la Identidad del Trabajador y los Centros
* **Cómo está ahora en `APP/`:** Usa usuarios genéricos con email (`operario@habilis.com`) y sin centro asignado.
* **Cómo debe quedar:** Usar el **Código Permanente de 5 cifras** (`11001`, `12001`, `21001`...), los 4 puestos oficiales (`Responsable`, `Carretillero`, `Operario`, `Administrativo`) y los 2 centros reales (`Centro 1 · Saica Pack Velilla` y `Centro 2 · Saica Pack Meco`), alimentados desde la misma base de personal del Libro 01 (`01_Gestion_Plantilla_HABILIS_v2_3.xlsx`).

### B. Integración del Módulo de Fichajes (`Gestión horaria/` dentro de `APP/`)
* **Cómo está ahora en `APP/`:** Tiene un componente antiguo (`TimeClock.tsx`) con GPS móvil y cálculo simple que ha quedado obsoleto.
* **Cómo debe quedar:** Sustituir `TimeClock.tsx` integrando directamente el módulo nuevo de `Gestión horaria/`:
  * **Modo Terminal Kiosk en Tablet de Planta:** Acceso directo a la pantalla táctil de fichaje (Código 5 cifras + PIN 4 cifras con Salt) y al Monitor Semáforo del Responsable.
  * **Modo Consulta Individual en el Portal del Empleado:** Que el trabajador, al entrar en su portal de `APP/`, pueda **consultar sus propios fichajes** e informes mensuales (sin poder fichar desde su móvil personal, ya que el fichaje es presencial en la tablet del centro).

### C. Módulo de Explicación de la Operativa y Sistema Documental (`REG-DIR-001`)
* **Cómo está ahora en `APP/`:** Tiene una pestaña básica de `Procedimientos` con 4 documentos de ejemplo sin codificación oficial.
* **Cómo debe quedar (alineado con `CONTEXTO_SISTEMA_DOCUMENTAL_HABILIS.md`):**
  * **Estructura oficial del Listado Maestro (`REG-DIR-001`):**
    * **Código:** `TIPO-ÁREA-NÚMERO` (ej. `POP-DIR-001`, `POP-RRHH-001`, `POP-RRHH-002`, `POP-LOG-001`, `IT-LOG-001-01`, `CHK-PRL-001-01`).
    * **Tipos:** `POP` (Procedimiento Operativo), `IT` (Instrucción de Trabajo paso a paso), `FOR` (Formulario), `REG` (Registro), `CHK` (Lista de comprobación).
    * **Áreas:** `DIR` (Dirección), `RRHH` (Recursos Humanos), `LOG` (Logística y Operaciones), `PRL` (Seguridad y PRL), `CAL` (Calidad), `ADM` (Administración), `MAN` (Mantenimiento).
    * **Metadatos obligatorios:** Versión vigente (ej. `v01`), Estado (`VIGENTE`, `VALIDADO`, `EN ELABORACIÓN`), Fecha de entrada en vigor, Puestos a los que aplica (`Carretillero`, `Operario`, etc.) y Centro (`Común`, `Velilla`, `Meco`).
  * **Explicación guiada de la operativa:** Que el operario o carretillero vea los procedimientos e instrucciones de su puesto de forma visual, clara, paso a paso (con fotos/esquemas y puntos clave de seguridad y calidad).
  * **Acuse de recibo y formación:** Botón para que el trabajador confirme la lectura y comprensión de la versión vigente (guardando fecha, hora y versión leída).
  * **Solicitud de modificación documental (`FOR-DIR-001-01`):** Formulario digital integrado para que cualquier operario pueda proponer mejoras o cambios en un procedimiento vigente.

### D. Vacaciones, Permisos y Licencias (`POP-RRHH-002`)
* Adaptar el módulo de solicitudes de `APP/` al nuevo procedimiento validado `POP-RRHH-002` y formularios `FOR-RRHH-002-01` / `02`, generando el código oficial `AUS-C1-AÑO-NNNN` (Velilla) o `AUS-C2-AÑO-NNNN` (Meco) y contemplando vacaciones, asuntos propios, permisos, licencias y descansos compensatorios (`DC`).

### E. Incidentes, Daños y Checklists (`Libro 02` y `Área 2/3/4`)
* Alinear el reporte de incidentes y roturas de `APP/` con el libro `02_Incidentes_Accidentes_HABILIS_v1_1.xlsx` (identificador `INC-AÑO-NNNN`) y los checklists pre-uso de carretillas y estiba de camiones en Saica Pack.
