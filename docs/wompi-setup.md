# Configuración de Wompi para Suscripciones Automáticas

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```env
# Wompi Configuration
WOMPI_PUBLIC_KEY="pub_test_010Z5gjB3W6UrIrQWy4HLD1IvKPtMzlC"
WOMPI_PRIVATE_KEY="prv_test_pf6bNPHiJqfK39NEjkYj4GTZ32z1Nxav"
WOMPI_EVENTS_SECRET="tu-secreto-de-eventos-de-wompi"
WOMPI_ACCEPTANCE_TOKEN="tu-token-de-aceptacion"
WOMPI_BASE_URL="https://sandbox.wompi.co/v1"
```

## Configuración en Wompi

### 1. Obtener las Claves de API

1. **Accede al Dashboard de Wompi**:
   - Sandbox: https://dashboard.wompi.co/
   - Producción: https://dashboard.wompi.co/

2. **Obtén tus claves**:
   - `WOMPI_PUBLIC_KEY`: Clave pública para el frontend
   - `WOMPI_PRIVATE_KEY`: Clave privada para el backend
   - `WOMPI_ACCEPTANCE_TOKEN`: Token de aceptación de términos

### 2. Configurar Webhooks

1. **En el Dashboard de Wompi**:
   - Ve a "Webhooks" en el menú lateral
   - Agrega un nuevo webhook con la URL: `https://tu-dominio.com/api/webhooks/wompi`
   - Selecciona los eventos:
     - `transaction.created`
     - `transaction.updated`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.cancelled`

2. **Configura el secreto del webhook**:
   - Genera un secreto seguro para `WOMPI_WEBHOOK_SECRET`
   - Este secreto se usa para verificar que los webhooks vienen de Wompi

### 3. Configuración de Producción

Para producción, cambia:

```env
WOMPI_BASE_URL="https://production.wompi.co/v1"
```

## Funcionalidades Implementadas

### 1. Creación de Suscripciones

- Los usuarios pueden suscribirse a planes pagos
- Se crea una suscripción mensual automática en Wompi
- Se actualiza el plan del usuario automáticamente

### 2. Manejo de Webhooks

- **transaction.created**: Procesa nuevos pagos
- **transaction.updated**: Actualiza estado de transacciones
- **subscription.created**: Confirma creación de suscripción
- **subscription.updated**: Actualiza información de suscripción
- **subscription.cancelled**: Cancela suscripción y degrada usuario

### 3. Gestión de Suscripciones

- Los usuarios pueden ver su suscripción actual
- Pueden cancelar su suscripción
- Se maneja automáticamente la degradación a plan FREE

## Flujo de Suscripción

1. **Usuario selecciona plan pago**:
   - Se muestra formulario de pago con Wompi
   - Usuario ingresa datos de tarjeta

2. **Creación de token de pago**:
   - Se crea un token seguro con Wompi
   - Se valida la tarjeta sin procesar pago

3. **Creación de suscripción**:
   - Se crea suscripción mensual en Wompi
   - Se guarda información en base de datos
   - Se actualiza plan del usuario

4. **Procesamiento de pagos**:
   - Wompi procesa pagos automáticamente cada mes
   - Los webhooks notifican cambios de estado
   - Se actualiza la información en la base de datos

## Seguridad

### 1. Verificación de Webhooks

- Todos los webhooks se verifican con HMAC-SHA256
- Solo se procesan webhooks con firma válida

### 2. Manejo de Errores

- Si un pago falla, el usuario se degrada a plan FREE
- Se mantiene registro de todos los intentos de pago
- Se notifica al usuario sobre problemas de pago

### 3. Cancelación de Suscripciones

- Los usuarios pueden cancelar en cualquier momento
- Se mantiene acceso hasta el final del período pagado
- Se degrada automáticamente a plan FREE

## Testing

### 1. Tarjetas de Prueba (Sandbox)

```
Visa: 4242424242424242
Mastercard: 5555555555554444
American Express: 378282246310005
```

### 2. Estados de Transacción

- `APPROVED`: Pago exitoso
- `DECLINED`: Pago rechazado
- `VOIDED`: Pago anulado

## Monitoreo

### 1. Logs Importantes

- Creación de suscripciones
- Procesamiento de webhooks
- Cambios de estado de pagos
- Cancelaciones de suscripciones

### 2. Métricas a Monitorear

- Tasa de éxito de pagos
- Cancelaciones mensuales
- Errores de webhook
- Tiempo de respuesta de API

## Troubleshooting

### 1. Webhooks no llegan

- Verificar URL del webhook
- Verificar secreto del webhook
- Revisar logs del servidor

### 2. Pagos no se procesan

- Verificar configuración de Wompi
- Revisar logs de transacciones
- Verificar estado de la suscripción

### 3. Usuarios no se actualizan

- Verificar procesamiento de webhooks
- Revisar logs de base de datos
- Verificar configuración de API
