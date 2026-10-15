# ⏱️ Habilis - Aplicación de Registro Horario y Fichajes (PWA)

Aplicación táctil independiente (PWA) para el registro de jornada presencial y supervisado del personal de **Habilis Logística** en los centros de **Saica Pack** (Centro 1: Velilla de San Antonio, Centro 2: Meco).

---

## 🚀 Puesta en Marcha en un Ordenador Nuevo

Si estás abriendo este proyecto por primera vez en otro ordenador, sigue estos sencillos pasos:

### 1. Requisitos Previos
* **Node.js**: Versión 18 o superior (recomendado v20+). Comprobar en terminal con `node -v`.
* **Git**: Instalado y configurado con acceso a GitHub.
* **Navegador**: Google Chrome, Edge o cualquier navegador moderno.

### 2. Instalación y Ejecución
Abre PowerShell o terminal en este directorio (`Gestión horaria`):

```powershell
# 1. Instalar dependencias (no se sincronizan en Git ni OneDrive)
npm install

# 2. Iniciar servidor de desarrollo local
npm run dev
```

La aplicación se abrirá en `http://localhost:5173/`.

### 3. Códigos y Credenciales de Prueba (Modo Demo)
* **Código de Trabajador (5 cifras):**
  * `12001` - Carlos Gómez Martín (Carretillero - Centro 1 Velilla)
  * `11001` - Responsable Ejemplo C1 (Responsable - Centro 1 Velilla)
  * `21001` - Responsable Ejemplo C2 (Responsable - Centro 2 Meco)
* **PIN de Prueba:** `1234` (funciona como comodín en desarrollo; también valida el hash SHA-256 con Salt individual).
* **Acceso a Zona de Control (`🔒 Zona Control`):** Requiere código de Responsable (`11001` o `21001`) + PIN `1234`. Deniega el acceso a operarios o carretilleros.
* **Cambio de Centro en Terminal:** Pulsa sobre la chapa del centro en la cabecera e introduce el código de un Responsable (`11001` o `21001`, sin PIN). El centro se almacena localmente en el dispositivo (`localStorage`).
* **Simulación Kiosk:** Pulsa `[👁️ Simular Pantalla Definitiva]` para ocultar la barra de desarrollo. Pulsa el botón flotante inferior `[🛠️ Mostrar barra de desarrollo]` para volver.

---

## 📚 Documentación y Archivos de Contexto

Toda la arquitectura, decisiones confirmadas y contratos de datos están documentados en este mismo directorio:

1. **[`CONTEXTO_REGISTRO_HORARIO.md`](./CONTEXTO_REGISTRO_HORARIO.md):** Síntesis técnica completa (código de 5 cifras, PIN criptográfico con Salt de 16 caracteres, bloqueo por 3 intentos, modelos de datos, arquitectura Kiosk y procedimientos en papel `FOR-RRHH-001-01` / `02` / `03`).
2. **[`ESPECIFICACION_CSV_UNICO_LIBRO03.md`](./ESPECIFICACION_CSV_UNICO_LIBRO03.md):** **Especificación vigente de importación**. El Libro 03 (`03_Cuadrantes_Ausencias_HABILIS_v2_3.xlsm`) genera con un botón un único archivo CSV semanal de 15 columnas con toda la plantilla y las asignaciones diarias (L-D).
3. **[`ESPECIFICACION_RETORNO_FICHAJES_APP_LIBRO03.md`](./ESPECIFICACION_RETORNO_FICHAJES_APP_LIBRO03.md):** Contrato para la exportación de fichajes reales desde la aplicación de vuelta al Libro 03 de Excel (`fichajes_reales_YYYY_Www_NNN.csv`).

---

## 🛠️ Estructura del Código

```text
Gestión horaria/
├── src/
│   ├── components/
│   │   ├── KioskView.tsx          # Terminal táctil principal de fichajes (Paso 1: Código, Paso 2: PIN, Paso 3: Entrada/Salida)
│   │   ├── SupervisorMonitor.tsx  # Semáforo de presencia en planta (☀️ Mañana / 🌇 Tarde / 🌙 Noche) con refresco
│   │   └── AdminConfig.tsx        # Zona de gestión, PINs y carga de CSV
│   ├── services/
│   │   ├── authPin.ts             # Criptografía: Salt aleatorio (CSPRNG) + Hash SHA-256 y bloqueo a 3 intentos
│   │   ├── fichajeStorage.ts      # Persistencia local / mock y control de estado coherente
│   │   ├── mockData.ts            # Datos de prueba de trabajadores y cuadrantes
│   │   └── firebase.ts            # Configuración de base de datos dedicada
│   ├── types/
│   │   └── index.ts               # Modelos TypeScript (Trabajador, Fichaje, PlanTurno, Centros)
│   ├── App.tsx                    # Enrutador principal y barra de navegación de desarrollo
│   └── main.tsx                   # Punto de entrada React 19
├── package.json
└── vite.config.ts
```

---

## 🎯 Próximos Pasos de Desarrollo

1. **Importador de CSV único en la app (`AdminConfig.tsx`):** Implementar la carga y validación del archivo generado desde el botón *Exportar CSV* del Libro 03 conforme a `ESPECIFICACION_CSV_UNICO_LIBRO03.md`.
2. **Conexión a Base de Datos Dedicada:** Configurar la instancia aislada en el servidor seguro.
3. **Módulo de Reportes Oficiales y Retorno de Fichajes:** Generar los informes de jornada (RD-ley 8/2019) y el CSV de retorno para el Libro 03.
