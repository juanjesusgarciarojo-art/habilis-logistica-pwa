# 📊 PR-KPI-001: Definición y Cálculo de Indicadores Clave de Rendimiento (KPIs)
> **Habilis - Operativa de Carga y Optimización en Saica Pack**

---

## 1. Objetivo y Alcance
Establecer la metodología matemática y operativa para medir, analizar y reportar el rendimiento del servicio logístico de Habilis. La medición se realiza en dos niveles:
*   **Gestión Interna (Habilis):** Para optimizar recursos, evaluar la productividad individual del personal y detectar necesidades de formación.
*   **Gestión Externa (Saica Pack):** Para justificar el cumplimiento del nivel de servicio (SLA), demostrar mejoras con datos y alinear la operativa con la filosofía del cliente.

---

## 2. Estructura de Medición (Tablas y Gráficos)

Para detectar desviaciones de forma visual rápida, la recogida de datos y su representación se estructura en tres pasos:

```
[1. Recogida de Campo] ──> [2. Tabla Consolidada (Excel/PWA)] ──> [3. Gráficos de Desviación]
(Operario / Registro)       (Cálculos individuales y grupales)     (Tendencias y Pareto)
```

### Propuesta de Visualización:
1.  **Tablas de Datos:** Matrices donde las filas representan los días/turnos y las columnas contienen los valores reales frente a los objetivos (*targets*).
2.  **Gráficos Clave para Dirección y Cliente:**
    *   **Gráfico de Control (Línea de Tendencia con límites):** Para ver el tiempo de carga y de permanencia diario, marcando una línea roja con el límite acordado. Cualquier punto por encima destaca una desviación.
    *   **Gráfico de Barras Comparativo (Antes vs. Después):** Para demostrar el impacto de nuevos procedimientos operativos en periodos equivalentes.
    *   **Diagrama de Pareto (Barras + Línea %):** Para analizar las causas de los retrasos en las salidas o los motivos de las roturas de cartón (regla del 80/20: solucionar el 20% de las causas resuelve el 80% de los problemas).
    *   **Gráfico de Radar (Productividad):** Para comparar el desempeño de equipos o turnos en diferentes competencias.

---

## 3. Fórmulas y Definición de KPIs

### KPI 1: Tiempo Medio de Carga (TMC)
Mide la eficiencia del proceso físico de estiba y carga del camión en el muelle.
*   **Fórmula General:** 
    $$\text{TMC} = \text{Hora Fin Carga} - \text{Hora Inicio Carga}$$
*   **Métricas Derivadas (Eficiencia):**
    *   *TMC por Palé:* $\frac{\text{TMC (minutos)}}{\text{Palés Cargados}}$
    *   *TMC por Tonelada:* $\frac{\text{TMC (minutos)}}{\text{Toneladas Cargadas}}$
    *   *TMC por $m^3$:* $\frac{\text{TMC (minutos)}}{\text{Volumen Cargado } (m^3)}$
*   **Frecuencia:** Diario (por camión), semanal (por turno/operario) y mensual (media general).
*   **Objetivo (Target):** < 45 minutos por camión estándar (33 palés).

---

### KPI 2: Tiempo de Permanencia del Camión (TPC)
Mide el tiempo total que un transportista pasa en la planta. Es vital para reducir penalizaciones por demoras.
Se divide en 5 fases críticas:

| Fase | Hito Inicial | Hito Final | Responsable | Fórmula |
| :--- | :--- | :--- | :--- | :--- |
| **Fase 1: Registro** | Entrada a Planta | Registro en Oficina | Seguridad / Transportista | $T_1 = \text{Hora Registro} - \text{Hora Entrada}$ |
| **Fase 2: Asignación**| Registro en Oficina | Asignación de Muelle | Habilis (Coordinador) | $T_2 = \text{Hora Asignación} - \text{Hora Registro}$ |
| **Fase 3: Espera** | Asignación de Muelle | Inicio Físico Carga | Transportista / Habilis | $T_3 = \text{Hora Inicio Carga} - \text{Hora Asignación}$ |
| **Fase 4: Carga** | Inicio Físico Carga | Fin Físico Carga | Habilis (Carretillero) | $T_4 = \text{Hora Fin Carga} - \text{Hora Inicio Carga}$ |
| **Fase 5: Salida** | Fin Físico Carga | Salida de Planta | Transportista / Oficina | $T_5 = \text{Hora Salida} - \text{Hora Fin Carga}$ |

$$\text{TPC Total} = T_1 + T_2 + T_3 + T_4 + T_5$$

*   **Frecuencia:** Semanal y Mensual.
*   **Objetivo (Target):** TPC Total < 90 minutos.

---

### KPI 3: Productividad del Personal
Evaluación de rendimiento individual y de equipo. Se desglosa en dos tareas distintas para no penalizar a operarios que realizan tareas más lentas.

#### A) Movimientos Internos de Almacén (Alimentación y Ubicación)
*   **Fórmula:**
    $$\text{Productividad Interna} = \frac{\text{Palés o Toneladas Movidas}}{\text{Horas Empleadas}}$$
*   **Objetivo:** > 25 palés/hora por carretillero.

#### B) Operaciones de Carga Directa
*   **Fórmula:**
    $$\text{Productividad de Carga} = \frac{\text{Palés o Toneladas Cargados}}{\text{Horas Empleadas de Carga}}$$
*   **Objetivo:** > 35 palés/hora en muelle.

*   **Medición Individual vs. Grupal:**
    *   *Individual:* Detecta si un operario necesita formación en estiba o tiene dificultades con la maquinaria.
    *   *Grupal:* Compara turnos (Mañana vs. Tarde vs. Noche) y equipos para balancear la carga de trabajo.

---

### KPI 4: Índice de Roturas de Mercancía (IRM)
Mide el porcentaje de material dañado (mermas de cartón ondulado) debido a la manipulación logística de Habilis.
*   **Fórmula:**
    $$\text{IRM (por mil)} = \left( \frac{\text{Unidades o Palés Dañados}}{\text{Total Unidades o Palés Manipulados}} \right) \times 1000$$
*   **Desglose Obligatorio en Registro:**
    *   Identificación de mercancía (Bobina vs. Planchas).
    *   Lugar físico del daño (Muelle, Pasillo, Zona de pulmón).
    *   Causa (Caída, golpe de uñas, apilamiento excesivo).
    *   Operario manipulador (para reciclaje formativo).
    *   Coste económico estimado del daño.
*   **Objetivo:** IRM < 0.5‰ (menos de 1 palé dañado por cada 2000 manipulados).

---

### KPI 5: Cumplimiento de Horarios de Salida (On-Time Delivery - OTD)
Mide la fiabilidad del servicio respecto a la planificación pactada con Saica Pack.
*   **Fórmula:**
    $$\text{OTD (\%)} = \left( \frac{\text{Camiones que salen en hora o adelantados}}{\text{Total Camiones Planificados}} \right) \times 100$$
*   *Nota:* Se considera retraso una desviación superior a +15 minutos respecto al horario de salida planificado.
*   **Objetivo:** OTD > 97%.

---

### KPI 6: Aprovechamiento de la Capacidad de Camiones (AC)
Mide la optimización volumétrica y de peso de la carga enviada. Afecta directamente al coste del transporte.
*   **Fórmula de Aprovechamiento de Volumen:**
    $$\text{Aprovechamiento Volumétrico (\%)} = \left( \frac{\text{Metros Cúbicos Ocupados}}{\text{Capacidad Teórica del Camión } (m^3)} \right) \times 100$$
*   **Fórmula de Aprovechamiento de Peso:**
    $$\text{Aprovechamiento de Peso (\%)} = \left( \frac{\text{Peso Real Cargado (kg)}}{\text{Capacidad Máxima Autorizada del Camión } (kg)} \right) \times 100$$
*   **Objetivo:** Ocupación de Camiones > 92% (en volumen o peso, según tipo de producto).
