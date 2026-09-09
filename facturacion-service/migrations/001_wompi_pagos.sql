-- Ejecuta este script una sola vez en la base de datos de facturacion.
ALTER TABLE pagos ADD COLUMN referencia_wompi VARCHAR(100) NULL;
ALTER TABLE pagos ADD COLUMN transaccion_wompi_id VARCHAR(100) NULL;
ALTER TABLE pagos ADD COLUMN estado_wompi VARCHAR(20) NULL;
ALTER TABLE pagos ADD COLUMN monto_centavos INT NULL;
ALTER TABLE pagos ADD COLUMN moneda VARCHAR(3) NULL;
ALTER TABLE pagos ADD COLUMN evento_wompi JSON NULL;
ALTER TABLE pagos ADD COLUMN fecha_confirmacion DATETIME NULL;
ALTER TABLE pagos ADD UNIQUE KEY uq_pagos_referencia_wompi (referencia_wompi);
ALTER TABLE pagos ADD UNIQUE KEY uq_pagos_transaccion_wompi (transaccion_wompi_id);
