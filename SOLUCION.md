# SOLUCIÓN · Reto 03

## 1. Problema
La digitación manual de órdenes de compra genera errores y dificulta controlar aprobaciones y medir órdenes retroactivas.

## 2. Arquitectura
`web/index.html → src/server.ts → src/tools/oc.ts → fixtures/ (lectura) / out/ (escritura) → src/sap/mock.ts`. `agent/prompt.md` define conducta, `src/knowledge/ordenes-compra.md` conocimiento, herramientas implementan controles. `src/llm/adapter.ts` define contrato de proveedor, `src/llm/openai.ts` implementa OpenAI.

## 3. Ciclo del agente
El backend interpreta el caso solicitado, ejecuta el flujo determinista de herramientas y envía el resultado verificado al LLM para explicarlo. El máximo recomendado es 20 operaciones; la implementación usa un flujo fijo menor al límite. Las confirmaciones se mantienen en memoria por sesión; el mensaje «confirmo» en el turno siguiente autoriza la creación. Se registran llamadas visibles en UI y `out/log.jsonl`. Limitación: el LLM no decide autónomamente las llamadas; la orquestación está restringida a los casos del fixture.

## 4. Modelo y costos
Adaptador OpenAI, modelo configurable `OPENAI_MODEL` (predeterminado `gpt-4o-mini`). El costo depende del precio vigente por millón de tokens; estimar por caso como `(tokens_entrada × precio_entrada + tokens_salida × precio_salida) / 1.000.000`. Se limita a 600 tokens de salida por respuesta. Sin API key, el demo determinista funciona y el chat devuelve información verificada, sin generación LLM.

## 5. Matriz de controles
| Control | Implementación |
|---|---|
| RC1 | NIT o nombre normalizado y proveedor activo: bloqueo |
| RC2 | Aprobación textual y email autorizado: bloqueo |
| RC3 | Monto dentro del tope del aprobador: bloqueo |
| RC4 | Subárea válida del centro de costo: bloqueo |
| RC5 | Diferencia cotización >2% o cotización ausente: confirmación |
| RC6 | IVA ausente: derivado del proveedor y confirmación |
| RC7 | Pago ausente: derivado del proveedor |
| RC8 | Factura anterior: marca retroactiva y confirmación |
| RC9 | Aprobación anterior: confirmación |
| RC10 | Cantidad × precio unitario ±1: bloqueo |

RC2/RC3 son los más sensibles por depender del centro, correo y monto simultáneamente.

## 6. Adaptador SAP real
Elegiría OData `API_PURCHASEORDER_PROCESS_SRV` si el landscape y permisos lo permiten; requiere validar versión y operaciones disponibles. Mapear referencia a campo de referencia externa, proveedor a Business Partner, posiciones a ítems, centro de costo a imputación y condiciones de pago al encabezado según API. Autenticación mediante destino técnico y secreto en bóveda del backend, nunca prompt/frontend. Usar solicitud_id como clave idempotente, consultar antes de reintentos y reconciliar respuestas parciales mediante consulta por referencia. Si no hay integración, exportar JSON/CSV validado para carga controlada y revisión humana.

## 7. Órdenes retroactivas
La compra posterior a la factura debilita la aprobación preventiva y la trazabilidad presupuestal. Recomendaría bloquear compras retroactivas por defecto en producción salvo excepción documentada, medir porcentaje mensual por centro de costo, identificar causas y reportarlas a dirección. En este reto se permiten con confirmación y marca explícita.

## 8. Decisiones y trade-offs
1. Archivos JSONL en lugar de base de datos: simplicidad para demo; menos robustez concurrente.
2. Herramientas deterministas en lugar de decisiones del LLM: evita alteración de montos; menor flexibilidad conversacional.
3. Evidencia TXT SHA256 en vez de PDF: satisface P0, PDF queda pendiente como P1.
4. Front HTML plano en lugar de React: menos dependencias y menor tiempo de despliegue.

## 9. Supuestos
Los maestros son completos, el correo de aprobación es evidencia aceptable para demo, no hay usuarios concurrentes y la fecha de la factura en fixture es válida.

## 10. Cobertura
| Historia | Estado | Pendiente para producción |
|---|---|---|
| HU1 lectura | Hecho para fixtures | OCR y binarios |
| HU2 validación | Hecho | Catálogos reales |
| HU3 payload | Hecho | Mapeo real SAP |
| HU4 evidencia | Parcial (TXT P0) | PDF P1 |
| HU5 creación | Hecho en mock | SAP real, concurrencia |
| HU6 errores | Parcial | Pruebas de carga y seguridad |
| Chat + LLM | Parcial | API key, despliegue y orquestación autónoma de herramientas |

## 11. Uso de IA
Se utilizó ChatGPT para análisis del PRD, diseño de arquitectura, generación inicial de código y documentación. La validación real de ejecución y ajustes debe ser realizada por el candidato. Se descartó que el modelo decida o modifique importes por riesgo de alteración silenciosa.

## 12. Riesgos de producción
Exposición de claves (bóveda y variables de entorno), manipulación de entradas (validación y autorización), órdenes duplicadas por concurrencia (bloqueos transaccionales), suplantación de aprobadores (verificación de identidad y firma), almacenamiento efímero (base de datos y auditoría inmutable), errores de integración SAP (reconciliación e idempotencia), abuso de consumo de IA (cuotas y autenticación). No desplegar en producción sin controles adicionales.
