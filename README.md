# Visor PNI Nuble - codigo mensual

Repositorio privado de preparacion. GitHub Pages no esta habilitado.

Contiene exclusivamente index.html (diseno y logo MINSAL embebido) y visor_mensual.js (interfaz, filtro DOSIS dependiente y calculos mensuales aprobados). No contiene datos, CSV, registros individuales, cubos, scripts de procesamiento ni auditorias.

Sin datos, la interfaz muestra un aviso y deshabilita controles; no usa cifras simuladas. El filtro DOSIS conserva las denominaciones literales y depende de la vacuna/grupo.

## Incorporacion futura

La modalidad de acceso y divulgacion debe definirse con la encargada de vacunas antes de agregar datos o activar cualquier publicacion. El JS espera un archivo local relativo datos_mensuales.js que defina window.PNI_DATA con el contrato mensual existente: classes, doses, communes, lastMonth, completeMonths, totals y rows. No agregarlo todavia.

.gitignore usa una lista permitida de archivos de codigo para evitar incorporar datos por accidente. Cualquier futura inclusion de datos requiere una decision explicita y revision de esta lista. No activar Pages ni hacer publico este repositorio por ahora.

La copia mensual y V3.1 locales permanecen independientes e intactas. Las verificaciones estadisticas existentes no se repitieron en esta preparacion.
