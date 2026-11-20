SOLUCIÓN · Reto 03
1. Problema
La digitación manual de órdenes de compra genera errores y dificulta controlar aprobaciones y medir órdenes retroactivas.
2. Arquitectura
`web/index.html → src/server.ts → src/tools/oc.ts → fixtures/ (lectura) / out/ (escritura) → src/sap/mock.ts`. `agent/prompt.md` define conducta, `src/knowledge/ordenes-compra.md` conocimiento, herramientas implementan controles. `src/llm/adapter.ts` define contrato de proveedor, `src/llm/gemini.ts` implementa Google Gemini. El servicio se publica en Render y el código se versiona en GitHub; SAP es simulado, no existe conexión a un SAP real.
3. Ciclo del agente
El backend interpreta el caso solicitado, ejecuta el flujo determinista de herramientas y envía el resultado verificado al LLM para explicarlo. El máximo recomendado es 20 operaciones; la implementación usa un flujo fijo menor al límite. Las confirmaciones se mantienen en memoria por sesión; el mensaje «confirmo» en el turno siguiente autoriza la creación. Se registran llamadas visibles en UI y `out/log.jsonl`. Limitación: el LLM no decide autónomamente las llamadas; la orquestación está restringida a los casos del fixture.
4. Modelo y costos
Adaptador Google Gemini en `src/llm/gemini.ts`, con modelo configurable mediante `GEMINI_MODEL`; la instancia publicada reportó `gemini-3.8-flash` en `/api/health`. La credencial se configura mediante `GEMINI_API_KEY` en las variables de entorno del servidor y no debe almacenarse en GitHub. El consumo y los límites dependen de la modalidad y las tarifas vigentes de la API de Gemini. El script determinista `demo.ts` permite verificar escenarios sin depender de llamadas al modelo.
5. Matriz de controles
Control	Implementación
RC1	NIT o nombre normalizado y proveedor activo: bloqueo
RC2	Aprobación textual y email autorizado: bloqueo
RC3	Monto dentro del tope del aprobador: bloqueo
RC4	Subárea válida del centro de costo: bloqueo
RC5	Diferencia cotización >2% o cotización ausente: confirmación
RC6	IVA ausente: derivado del proveedor y confirmación
RC7	Pago ausente: derivado del proveedor
RC8	Factura anterior: marca retroactiva y confirmación
RC9	Aprobación anterior: confirmación
RC10	Cantidad × precio unitario ±1: bloqueo
RC2/RC3 son los más sensibles por depender del centro, correo y monto simultáneamente.
6. Adaptador SAP real
Elegiría OData `API_PURCHASEORDER_PROCESS_SRV` si el landscape y permisos lo permiten; requiere validar versión y operaciones disponibles. Mapear referencia a campo de referencia externa, proveedor a Business Partner, posiciones a ítems, centro de costo a imputación y condiciones de pago al encabezado según API. Autenticación mediante destino técnico y secreto en bóveda del backend, nunca prompt/frontend. Usar solicitud_id como clave idempotente, consultar antes de reintentos y reconciliar respuestas parciales mediante consulta por referencia. Si no hay integración, exportar JSON/CSV validado para carga controlada y revisión humana.
7. Órdenes retroactivas
La compra posterior a la factura debilita la aprobación preventiva y la trazabilidad presupuestal. Recomendaría bloquear compras retroactivas por defecto en producción salvo excepción documentada, medir porcentaje mensual por centro de costo, identificar causas y reportarlas a dirección. En este reto se permiten con confirmación y marca explícita.
8. Decisiones y trade-offs
Archivos JSONL en lugar de base de datos: simplicidad para demo; menos robustez concurrente.
Herramientas deterministas en lugar de decisiones del LLM: evita alteración de montos; menor flexibilidad conversacional.
Evidencia TXT SHA256 en vez de PDF: satisface P0, PDF queda pendiente como P1.
Front HTML plano en lugar de React: menos dependencias y menor tiempo de despliegue.
9. Supuestos
Los maestros son completos, el correo de aprobación es evidencia aceptable para demo, no hay usuarios concurrentes y la fecha de la factura en fixture es válida.
10. Cobertura
Historia	Estado	Pendiente para producción
HU1 lectura	Hecho para fixtures	OCR y binarios
HU2 validación	Hecho	Catálogos reales
HU3 payload	Hecho	Mapeo real SAP
HU4 evidencia	Parcial (TXT P0)	PDF P1
HU5 creación	Hecho en mock	SAP real, concurrencia
HU6 errores	Parcial	Pruebas de carga y seguridad
Chat + LLM	Operativo en despliegue Render con Gemini	Orquestación autónoma de herramientas, autenticación y endurecimiento productivo
11. Uso de IA
Se utilizó ChatGPT para análisis del PRD, diseño de arquitectura, generación inicial de código y documentación. La validación real de ejecución y ajustes debe ser realizada por el candidato. Se descartó que el modelo decida o modifique importes por riesgo de alteración silenciosa.
12. Riesgos de producción
Exposición de claves (bóveda y variables de entorno), manipulación de entradas (validación y autorización), órdenes duplicadas por concurrencia (bloqueos transaccionales), suplantación de aprobadores (verificación de identidad y firma), almacenamiento efímero (base de datos y auditoría inmutable), errores de integración SAP (reconciliación e idempotencia), abuso de consumo de IA (cuotas y autenticación). No desplegar en producción sin controles adicionales.

13. Pruebas funcionales y entrega
Los seis escenarios de `demo.ts` fueron ejecutados y el candidato reportó que la aplicación publicada se comportó conforme a lo esperado:
Caso	Regla principal	Resultado observado/reportado
SOL-001	Flujo sin excepción	Creación de OC `4500000001`
SOL-002	RC1 proveedor inexistente/inactivo	Solicitud no apta; bloqueo
SOL-003	RC2 aprobador sin autoridad	Solicitud no apta; bloqueo
SOL-004	RC5 diferencia de cotización	Solicitud pendiente hasta confirmación humana; creación tras «confirmo»
SOL-005	RC8 retroactividad	Comportamiento conforme reportado por el candidato
SOL-006	RC6 indicador IVA	Comportamiento conforme reportado por el candidato
Al repetir SOL-001, la aplicación devolvió el mismo número de OC. Esta observación es compatible con idempotencia, pero no sustituye la revisión del indicador `idempotente: true` ni del registro persistido. Los seis escenarios no prueban individualmente todas las reglas RC1–RC10.
Enlaces de entrega:
Código fuente: https://github.com/johancoy5/periferia-reto-03 (repositorio privado; requiere conceder acceso al evaluador).
Aplicación publicada: https://periferia-reto-03-9zil.onrender.com
Comprobación de salud: https://periferia-reto-03-9zil.onrender.com/api/health
Limitaciones del despliegue: la aplicación utiliza datos de prueba y SAP simulado. Las sesiones y confirmaciones se conservan en memoria del proceso; los archivos de salida locales de un servicio alojado pueden ser efímeros. No se afirma integración productiva con SAP, persistencia transaccional ni autenticación fuerte de aprobadores.
