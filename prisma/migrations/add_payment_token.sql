-- Migración para agregar el campo paymentMethodToken a la tabla subscriptions
-- Esta migración es segura y no perderá datos

-- Agregar el campo paymentMethodToken a la tabla subscriptions
-- Este campo almacena el token de Wompi para el método de pago
ALTER TABLE subscriptions ADD COLUMN paymentMethodToken TEXT;

-- Nota: Este campo es opcional (nullable) para mantener compatibilidad con suscripciones existentes
-- Las nuevas suscripciones siempre deberían tener este campo poblado

