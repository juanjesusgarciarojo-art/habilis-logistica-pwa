# Especificación vigente: CSV único de personal y cuadrante para la aplicación de fichaje

Decisión confirmada: 2 de octubre de 2026. Esta especificación **sustituye** la propuesta anterior de importar dos CSV separados desde los libros 01 y 03. Es el contrato de datos que debe implementar la otra IA en la aplicación de fichaje. El importador de la aplicación aún no está implementado ni probado con este formato.

## Origen y propiedad de los datos

- **Libro 01:** `Plantilla general` es la única fuente editable de altas, ceses, nombre, estado, centro y puesto actuales. Su hoja `Exportación fichaje` se conserva por ahora como legado, pero **no se exporta a la aplicación**. No borrarla hasta cerrar la revisión general del Libro 01.
- **Libro 03 actual:** `03_Cuadrantes_Ausencias_HABILIS_v2_3.xlsm` recibe por Power Query la plantilla activa y la completa (también cesados) del Libro 01. `Plan semanal` prepara la semana ISO; el botón **Guardar semana** conserva la planificación diaria en `Historial turnos`, sin borrar semanas anteriores. `Cuadrante semanal` es una vista de la semana seleccionada. `Exportación app` reúne plantilla y planificación en el **único CSV** que se carga en la aplicación.
- **Aplicación:** es propietaria del PIN y de los fichajes. El PIN, DNI/NIE, teléfono, correo, motivos de cese y demás datos sensibles no aparecen en el CSV. La importación no debe borrar ni sobrescribir PIN, bloqueos, registros horarios ni auditoría previa.

El número permanente de cinco cifras es la clave compartida. Sus dos primeras cifras indican centro y puesto **de incorporación**, no los actuales. La aplicación debe utilizar `centroActual` y `puestoActual` para la situación actual y los permisos de responsable; no debe deducirlos del número.

## Un archivo, una importación

Nombre recomendado: `habilis_personal_cuadrante_YYYY_Www_NNN.csv`. Una carga corresponde a una semana de lunes a domingo y una versión del lote. Se genera en el Libro 03 después de guardar el Libro 01, actualizar las consultas y terminar la planificación. Se importa manualmente desde el área gestora de la aplicación. No hay sincronización directa ni necesidad de subir los libros Excel.

La hoja `Exportación app` tiene el encabezado de datos en la fila 5. El botón **Exportar CSV** escribe un fichero nuevo con esa cabecera en la primera fila, en UTF-8 y separado por `;`; nunca sobrescribe una exportación anterior. El importador debe localizar la fila que contiene simultáneamente `fecha` y `numeroTrabajador`, admitir UTF-8 con o sin BOM, `;` o `,` como separador y comillas dobles conforme al formato CSV.

Hay **una fila por trabajador y día**, incluidos los trabajadores cesados. Por tanto, para una semana hay siete filas por cada número de trabajador conocido en el Libro 01. Esto repite algunos datos de identidad dentro del fichero, pero evita dos importaciones y permite actualizar de forma conjunta autorización y turnos. La aplicación debe comprobar que las siete filas de una persona son coherentes.

### Columnas exactas, en orden

| Campo | Origen | Regla |
|---|---|---|
| `fecha` | Semana seleccionada | ISO `YYYY-MM-DD`; siete fechas consecutivas, de lunes a domingo. |
| `numeroTrabajador` | Libro 01 | Texto de cinco cifras. Clave del trabajador. |
| `nombreCompleto` | Libro 01 | Nombre y apellidos para identificación visual. |
| `estadoLaboral` | Libro 01 | `Activo` o `Cese`. `Cese` bloquea cualquier fichaje nuevo. |
| `fechaInicioAutorizacion` | Inicio del contrato actual en Libro 01 | ISO o vacío; la app no permitirá fichar antes de una fecha futura de inicio. |
| `fechaCese` | Libro 01 | ISO para cesados; vacío para activos. |
| `centroActual` | Libro 01 | Centro de adscripción actual. |
| `puestoActual` | Libro 01 | Puesto actual; determina permisos, incluido el de responsable. |
| `centroPlanificado` | Historial turnos del Libro 03 | Centro de trabajo previsto ese día; vacío si no hay asignación. |
| `puestoPlanificado` | Historial turnos del Libro 03 | Puesto operativo previsto ese día; vacío si no hay asignación. |
| `turnoAsignado` | Historial turnos del Libro 03 | Valor normalizado del catálogo inferior; vacío si no hay asignación. |
| `horaInicioPlanificada` | Turno estándar o excepción del Libro 03 | `HH:mm`; para M/T/N se obtiene del catálogo salvo horario específico. |
| `horaFinPlanificada` | Turno estándar o excepción del Libro 03 | `HH:mm`; la noche puede finalizar al día siguiente. |
| `versionExportacion` | Numeración automática al pulsar **Exportar CSV**, reflejada en `Exportación app!D3` | Ejemplo `2026-W40-001`; debe aumentar en cada nueva carga o corrección. |
| `fechaPreparacion` | Libro 03 | ISO `YYYY-MM-DD`. |

El CSV no incluye el PIN ni su hash. La aplicación asigna o restablece el PIN de cuatro cifras por su propio procedimiento de gestión.

El Libro 03, el CSV y el importador quedan bajo acceso gestor. El responsable de turno no recibe el fichero completo ni una lista de cesados: solo ve, en su zona autenticada, el aviso necesario cuando intenta comprobar un código concreto. El bloqueo por cese debe aplicarse en el servidor, no depender únicamente de ocultar botones en la tablet.

### Catálogo de turnos

| Código en el historial | Valor del CSV | Interpretación |
|---|---|---|
| `M` | `MAÑANA` | 06:00–14:00 por defecto. |
| `T` | `TARDE` | 14:00–22:00 por defecto. |
| `N` | `NOCHE` | 22:00–06:00 por defecto. |
| `D` | `DESCANSO` | No se espera fichaje ordinario. |
| `V` | `VACACIONES` | No se espera fichaje ordinario. |
| `B` | `BAJA` | No se espera fichaje ordinario. No incluye diagnóstico. |
| `P` | `PERMISO` | No se espera fichaje ordinario. |
| `R` | `REFUERZO` | Turno de refuerzo. Se exige hora prevista de inicio y fin en el historial. |
| `DC` | `DESCANSO_COMPENSATORIO` | No se espera fichaje ordinario. |
| Sin registro | Vacío | No hay planificación para ese día. No equivale a descanso. |

La aplicación debe distinguir `centroActual` de `centroPlanificado` y `puestoActual` de `puestoPlanificado`. El responsable ve la planificación del centro y turno que está controlando. Una entrada válida sin asignación correspondiente puede mostrarse como extra/refuerzo para revisión; **no debe inventarse un turno ni una hora prevista**.

## Reglas de importación obligatorias para la otra IA

1. Mostrar una previsualización con semana, versión, número de personas, filas, altas, cambios y ceses antes de confirmar.
2. Validar encabezados, UTF-8, cinco cifras, fechas ISO, lunes inicial, siete días, catálogo, duplicados de `fecha + numeroTrabajador`, centro y puesto planificados en los turnos asignados y horarios de los refuerzos.
3. Verificar que cada trabajador incluido tenga siete filas, datos de identidad/estado coherentes en ellas y una sola versión del lote. Un fichero incompleto o mal formado debe rechazarse entero; **la ausencia de una persona en el CSV no significa cese**.
4. Aplicar la actualización de trabajadores y cuadrante como una única operación lógica. Un fallo no debe dejar el personal actualizado y los turnos antiguos, ni viceversa.
5. Usar `numeroTrabajador` para actualizar sin duplicar personas y `fecha + numeroTrabajador` para reemplazar la planificación de esa semana. Reimportar la misma versión no debe duplicar datos. Rechazar versiones más antiguas; conservar los fichajes y el historial de importaciones.
6. En un alta nueva, crear al trabajador sin PIN configurado. En cualquier reimportación, conservar `pinHash`, `pinSalt`, bloqueos, fichajes y auditoría existentes.
7. **`estadoLaboral = Cese` prevalece sobre cualquier turno planificado.** El sistema debe impedir entrada y salida nuevas. En la pantalla compartida del trabajador mostrar un aviso neutro: «No es posible registrar el fichaje. Avise al responsable». En la zona autenticada del responsable mostrar: «Trabajador en situación de cese. No permitir que inicie la actividad y contactar con su superior». No mostrar el motivo del cese.
8. Para un trabajador activo, aplicar también la fecha de inicio de autorización y la comprobación normal de PIN. El puesto actual, no el puesto codificado en el número inicial, determina el permiso de responsable.
9. El monitor compara los fichajes con `fecha`, `centroPlanificado`, `puestoPlanificado`, `turnoAsignado` y las horas previstas. Las horas del fichaje siguen procediendo únicamente del servidor; las horas del CSV son planificación, nunca registros realizados.

## Secuencia de trabajo en Excel

1. Modificar altas, ceses y datos actuales solo en `Plantilla general` del Libro 01. Guardar y cerrar ese libro antes de actualizar el Libro 03.
2. En otro ordenador, comprobar `Configuración!B30` del Libro 03: debe contener la carpeta local `Habilis` de ese equipo. Las consultas buscan solo los libros 01 de la **carpeta principal**, no los respaldos ni `Temporales`.
3. En `Plan semanal!B3/D3`, elegir **año ISO** y **número de semana**, y ejecutar `Datos > Actualizar todo`. La hoja muestra automáticamente lunes y domingo; por ejemplo, la semana ISO 2 de 2027 es del **11 al 17 de enero**, no del 4 al 10.
4. Pulsar **Cargar semana**. Revisar las filas de `Plan semanal`: centro, puesto, turno y horas; para `R`, indicar también el turno de cobertura. Vacaciones, bajas y permisos aprobados en `Ausencias y permisos` se reflejan como situación diaria. No debe borrarse una asignación ya histórica: se modifica explícitamente su turno.
5. Rellenar los mínimos conocidos en `Cobertura de turnos` por fecha, centro, turno y puesto. La hoja diferencia faltas, exceso y refuerzos; si no hay mínimo definido no supone cobertura suficiente. Revisar la vista `Cuadrante semanal` y pulsar **Guardar semana**. Esto conserva todas las semanas en `Historial turnos` y anota modificaciones en `Cambios cuadrante`.
6. Pulsar **Exportar CSV**: genera automáticamente versión y fichero UTF-8 de 15 columnas, después de guardar. Importarlo desde la zona gestora de la aplicación. **No importar las seis personas ficticias de prueba en producción.**
7. Importar manualmente ese único CSV en la aplicación desde el área gestora y comprobar el resumen antes de confirmar.

El CSV no se genera solo los viernes: ante un alta, cese, reincorporación o cambio de turno durante la semana, actualizar Libro 01/03 según corresponda, aumentar la versión y volver a importar **ese mismo periodo de siete días de inmediato**. Una persona cesada no quedará bloqueada en una aplicación desconectada hasta que llegue esta nueva importación.

## Estado de implantación

El Libro 03 v2_3 conserva 42 asignaciones de ejemplo para seis trabajadores ficticios. En una copia aislada se probaron los botones Cargar/Guardar/Exportar, el CSV de 42 filas, el historial, la consulta del Libro 01, la semana ISO 2027-2 y el retorno de dos revisiones ficticias de un fichaje. La aplicación real aún debe implementar este importador único, el aviso restringido al responsable y la [exportación de fichajes reales de vuelta al Libro 03](ESPECIFICACION_RETORNO_FICHAJES_APP_LIBRO03.md). No considerar el circuito completo operativo hasta probarlo de extremo a extremo con la aplicación.
