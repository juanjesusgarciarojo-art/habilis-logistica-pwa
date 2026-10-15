# Retorno de fichajes reales de la aplicación al Libro 03

Estado: contrato propuesto para implementar y probar con la otra IA. Fecha: 3 de octubre de 2026. No implica que el exportador de la aplicación ya exista.

## Propiedad y separación

- El Libro 01 es dueño de la identidad y del estado laboral. El Libro 03 es dueño de la planificación, ausencias aprobadas y mínimos de cobertura. Firebase es dueño de los eventos reales de entrada/salida, correcciones y auditoría.
- La aplicación recibe manualmente **un único CSV semanal** de personal y planificación desde `Exportación app` del Libro 03, conforme a `ESPECIFICACION_CSV_UNICO_LIBRO03.md`.
- En sentido inverso, un gestor descarga de la aplicación los fichajes reales de la semana. El archivo descargado se guarda **sin modificar** en `Habilis/Registros fichaje originales/`. La consulta `qryFichajesRealesApp` del Libro 03 lee los archivos `fichajes_reales_*.csv` de esa carpeta. No se introducen las horas reales de nuevo a mano en Excel.
- Este retorno analítico no sustituye la base original de Firebase, el expediente de correcciones ni los formularios físicos. Nunca se reimporta al sistema como si fuera un fichaje nuevo.

## CSV semanal analítico que debe crear la aplicación

Nombre recomendado: `fichajes_reales_YYYY_Www_NNN.csv`, donde `NNN` es una entrega única y creciente. UTF-8, separador `;`, primera fila de cabeceras. Horas en la zona `Europe/Madrid`, formato ISO `YYYY-MM-DD` y `HH:mm`. Una fila por jornada con algún fichaje o corrección, no por cada trabajador que simplemente aparece en la plantilla. Para un turno que cruza medianoche, `fecha` es el día de inicio de la jornada.

Cabeceras **exactas y en este orden**:

| Campo | Regla |
|---|---|
| `idJornada` | Identificador permanente de la jornada; permanece igual en sus revisiones. |
| `revision` | Entero creciente desde 1. Una corrección genera otra fila con revisión superior, sin modificar la anterior. |
| `numeroTrabajador` | Código de cinco cifras recibido del Libro 01. |
| `fecha` | Día local de inicio de jornada, `YYYY-MM-DD`. |
| `horaEntrada` | Hora local visible de entrada, o vacío si no existe. |
| `horaSalida` | Hora local visible de salida, o vacío si no existe. |
| `minutosEfectivos` | Minutos calculados por el servidor con los instantes reales y la zona horaria; vacío para jornada incompleta. No recalcular por simple resta de `HH:mm` en Excel, especialmente en turnos nocturnos o cambios de hora. |
| `estado` | `COMPLETO`, `INCOMPLETO` o `ANULADO`. |
| `origen` | `APP`, `PAPEL` o `CORRECCION`. |
| `referenciaCorreccion` | Nº de parte del formulario manual o referencia de corrección/auditoría, cuando proceda; en otro caso vacío. |
| `fechaExportacion` | Momento de generación del archivo en ISO 8601, con zona o UTC. |

Reglas de integridad para la otra IA:

1. La primera entrega contiene todas las jornadas y revisiones existentes de la semana. Las entregas posteriores de correcciones contienen **solo revisiones nuevas**: no reutilizar `idJornada + revision` en ficheros sucesivos. Si se necesita reenviar un fichero idéntico, se conserva el original y no se coloca una segunda copia en la carpeta leída por Excel.
2. Una corrección o incorporación desde papel queda enlazada al evento original y al número del formulario, con usuario gestor, fecha y motivo en la auditoría de Firebase. El CSV analítico puede mostrar solo la referencia, pero el expediente original debe seguir disponible.
3. El Libro 03 marca `vigente = 1` únicamente en la revisión máxima de cada `idJornada`. Los cálculos de horas usan solo filas vigentes con `estado = COMPLETO`; los `INCOMPLETO` se señalan para revisión. La consulta rechaza claves/revisiones duplicadas y algunas columnas críticas inválidas. El exportador de la aplicación debe validar **todo** el esquema antes de entregar el fichero.
4. Ni este CSV ni los informes de empresa incluyen PIN, hash, DNI/NIE, diagnóstico o motivos clínicos.
5. La ausencia de una fila no prueba ausencia laboral: se compara con el turno planificado y se investiga. Las diferencias entre horas planificadas y fichadas son **provisionales** hasta verificar correcciones, calendario, jornada contratada y convenio aplicable. No clasificar ni pagar horas extras automáticamente.

## Consulta de empresa, trabajador e Inspección

El CSV anterior alimenta los análisis internos del Libro 03. Para exhibición a una persona trabajadora o a la Inspección debe existir además en la aplicación una **exportación documental** de registros diarios originales y sus correcciones, filtrable por trabajador, centro y periodo, con inicio y fin reales y trazabilidad. La empresa debe poder obtenerla de inmediato cuando proceda, incluso si un Excel analítico aún no ha sido actualizado. Conservar los registros de jornada durante cuatro años, accesibles para las personas trabajadoras, sus representantes y la Inspección conforme al [artículo 34.9 del Estatuto de los Trabajadores](https://boe.es/eli/es/rdlg/2015/10/23/2/con). Las descargas semanales inalteradas y los formularios de papel son respaldo y evidencia auxiliar, no sustitutos de esa conservación en origen.

## Proceso operativo inicial

1. El gestor exporta cada semana cerrada desde la aplicación; comprueba semana, número de filas, jornadas incompletas, revisiones y huella/hash si la aplicación la ofrece.
2. Guarda el CSV original sin editar en `Registros fichaje originales`. Conserva también el informe documental apto para trabajador/Inspección cuando corresponda, separado del CSV analítico.
3. Abre el Libro 03 en Excel de escritorio, verifica `Configuración!B30` para el equipo actual y ejecuta `Datos > Actualizar todo`. Comprueba que `Fichajes importados` cargó la entrega y que no hubo errores.
4. Revisa `Control mensual`, `Cómputo anual y Bolsa` y `Horas extras y Compensación`; clasifica únicamente las diferencias confirmadas en `Decisiones horas`, con autorización y referencia.
5. Ante una corrección posterior, la aplicación emite una nueva revisión. Se descarga un archivo nuevo, se conserva el anterior y se actualiza el Libro 03. No se edita el CSV original para cambiar horas.

Pendiente de probar: exportador real de la aplicación, un ciclo completo con corrección, acceso documental de Inspección/trabajador, y validación de convenio y calendario. No usar datos ficticios como registros laborales.
