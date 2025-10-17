# 🚀 Guía de Despliegue a Producción - Cursia

Esta guía te ayudará a configurar Cursia para producción con pagos reales de Wompi.

## 📋 Requisitos Previos

1. **Cuenta de Wompi Verificada**
   - Tener una cuenta verificada en Wompi Colombia
   - Haber completado el proceso de KYC (Know Your Customer)
   - Tener acceso a las claves de producción

2. **Base de Datos**
   - Ejecutar las migraciones de Prisma en producción
   - Asegurar que el campo `paymentMethodToken` existe en la tabla `subscriptions`

3. **Variables de Entorno**
   - Tener acceso al archivo `.env` de producción

---

## 🔐 Paso 1: Obtener Credenciales de Wompi

### 1.1 Acceder al Dashboard de Wompi

1. Ve a https://dashboard.wompi.co/
2. Inicia sesión con tu cuenta verificada
3. Ve a **Configuración > API Keys**

### 1.2 Obtener Claves de Producción

Necesitarás las siguientes claves:

- **WOMPI_PUBLIC_KEY**: Clave pública (comienza con `pub_prod_`)
- **WOMPI_PRIVATE_KEY**: Clave privada (comienza con `prv_prod_`)
- **WOMPI_EVENTS_SECRET**: Secreto para webhooks
- **WOMPI_ACCEPTANCE_TOKEN**: Token de aceptación de términos

⚠️ **IMPORTANTE**: 
- Nunca compartas estas claves
- No las subas al repositorio
- Guárdalas en un gestor de secretos seguro

### 1.3 Configurar Webhooks

1. En el Dashboard de Wompi, ve a **Webhooks**
2. Agrega un nuevo webhook con la URL: `https://tu-dominio.com/api/webhooks/wompi`
3. Selecciona los siguientes eventos:
   - ✅ `transaction.created`
   - ✅ `transaction.updated`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.cancelled`

4. Genera un secreto seguro para el webhook (esto será tu `WOMPI_EVENTS_SECRET`)

---

## 🔧 Paso 2: Configurar Variables de Entorno

### 2.1 Archivo `.env` de Producción

Crea o actualiza tu archivo `.env` en producción con las siguientes variables:

```bash
# ============================================
# WOMPI PRODUCTION CONFIGURATION
# ============================================

# Modo de Wompi (sandbox o production)
WOMPI_ENV=production

# Claves de API de Wompi (PRODUCCIÓN)
WOMPI_PUBLIC_KEY=pub_prod_TU_CLAVE_PUBLICA_AQUI
WOMPI_PRIVATE_KEY=prv_prod_TU_CLAVE_PRIVADA_AQUI
WOMPI_EVENTS_SECRET=tu_secreto_de_webhooks_aqui
WOMPI_ACCEPTANCE_TOKEN=tu_token_de_aceptacion_aqui

# ============================================
# OTRAS CONFIGURACIONES
# ============================================

NODE_ENV=production
DATABASE_URL="file:./prod.db"
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=un-secreto-aleatorio-muy-seguro

# Anthropic (para generación de cursos)
ANTHROPIC_API_KEY=tu_clave_de_anthropic_aqui

# Email (opcional)
RESEND_API_KEY=tu_clave_de_resend_aqui
```

### 2.2 Verificar Variables

Ejecuta el script de verificación:

```bash
npm run verify:config
```

Este script verificará que todas las variables necesarias estén configuradas correctamente.

---

## 🗄️ Paso 3: Migrar la Base de Datos

### 3.1 Ejecutar Migraciones

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear la migración para el campo paymentMethodToken
npx prisma migrate deploy
```

### 3.2 Verificar el Schema

Asegúrate de que la tabla `subscriptions` tenga el campo `paymentMethodToken`:

```sql
SELECT * FROM sqlite_master WHERE type='table' AND name='subscriptions';
```

---

## 🚦 Paso 4: Probar en Staging (Recomendado)

Antes de activar producción, prueba en un ambiente de staging:

### 4.1 Configurar Staging con Sandbox

```bash
WOMPI_ENV=sandbox
WOMPI_PUBLIC_KEY=pub_test_010Z5gjB3W6UrIrQWy4HLD1IvKPtMzlC
WOMPI_PRIVATE_KEY=prv_test_pf6bNPHiJqfK39NEjkYj4GTZ32z1Nxav
```

### 4.2 Tarjetas de Prueba (Sandbox)

Usa estas tarjetas para probar:

- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005
- **CVC**: Cualquier 3 dígitos
- **Fecha**: Cualquier fecha futura (MM/AA)

### 4.3 Flujo de Prueba

1. Crea una cuenta de prueba
2. Intenta suscribirte a un plan (ej. APRENDIZ)
3. Usa una tarjeta de prueba
4. Verifica que:
   - La suscripción se crea en Wompi
   - El plan del usuario se actualiza en la base de datos
   - Se puede crear más cursos según el plan
   - Los webhooks funcionan correctamente

---

## 🌍 Paso 5: Activar Producción

### 5.1 Cambiar a Modo Producción

En tu archivo `.env` de producción:

```bash
WOMPI_ENV=production
NODE_ENV=production
```

### 5.2 Desplegar la Aplicación

```bash
# Compilar para producción
npm run build

# Iniciar en producción
npm start
```

### 5.3 Verificar el Despliegue

1. **Verificar Logs**:
   ```bash
   # Ver logs de la aplicación
   pm2 logs cursia
   ```

2. **Probar Endpoint de Salud**:
   ```bash
   curl https://tu-dominio.com/api/health
   ```

3. **Verificar Webhooks**:
   - Ve al Dashboard de Wompi
   - Revisa que los webhooks estén llegando correctamente

---

## 🔒 Paso 6: Seguridad en Producción

### 6.1 Lista de Verificación de Seguridad

- [ ] Las claves de API están en variables de entorno, no en el código
- [ ] El webhook de Wompi verifica la firma (ya implementado)
- [ ] HTTPS está habilitado en todo el dominio
- [ ] Las variables de entorno están en un lugar seguro
- [ ] Los tokens de pago se guardan encriptados (Wompi los maneja)
- [ ] Los logs no exponen información sensible

### 6.2 Monitoreo de Seguridad

1. **Revisar logs regularmente**:
   ```bash
   # Ver intentos de pago fallidos
   grep "Wompi subscription creation failed" logs/*.log
   
   # Ver webhooks inválidos
   grep "Invalid webhook signature" logs/*.log
   ```

2. **Configurar alertas** para:
   - Pagos fallidos repetidos
   - Intentos de webhook con firma inválida
   - Errores 500 en endpoints de pago

---

## 💳 Paso 7: Gestión de Suscripciones

### 7.1 Cómo Funciona el Sistema

1. **Usuario se suscribe**:
   - Ingresa datos de tarjeta
   - Se crea un token en Wompi
   - Se crea la suscripción mensual
   - Se actualiza el plan del usuario

2. **Pagos Mensuales**:
   - Wompi cobra automáticamente cada mes
   - Envía un webhook con el resultado
   - El sistema actualiza el estado de la suscripción

3. **Cancelación**:
   - Usuario puede cancelar desde su dashboard
   - Se cancela la suscripción en Wompi
   - Se degrada al plan FREE al final del período pagado

### 7.2 Límites por Plan

Los límites están definidos en `lib/plans.ts`:

- **FREE**: 1 curso por mes
- **APRENDIZ**: 5 cursos por mes (COP $29,900/mes)
- **EXPERTO**: 10 cursos por mes (COP $49,900/mes)
- **MAESTRO**: 20 cursos por mes (COP $69,900/mes)

### 7.3 Verificación de Límites

El sistema verifica automáticamente:

1. Al crear un curso (`/api/courses POST`)
2. Cuenta los cursos iniciados en el mes actual
3. Compara con el límite del plan
4. Retorna error 403 si se excede el límite

---

## 🔍 Paso 8: Monitoreo y Debugging

### 8.1 Endpoints de Monitoreo

```bash
# Verificar estado de la aplicación
curl https://tu-dominio.com/api/health

# Ver configuración de Wompi (solo muestra el ambiente)
curl https://tu-dominio.com/api/payment/config
```

### 8.2 Logs Importantes

Busca estos logs en producción:

```bash
# Suscripciones creadas exitosamente
✅ Wompi subscription created: sub_prod_xxxxx

# Errores de creación de suscripciones
❌ Wompi subscription creation failed: [error]

# Webhooks recibidos
Wompi webhook received: transaction.updated

# Validación de planes
📊 Plan check for user [id]: X courses started this month
```

### 8.3 Dashboard de Wompi

Monitorea en el Dashboard de Wompi:

1. **Transacciones**: Ver pagos exitosos y fallidos
2. **Suscripciones**: Ver suscripciones activas
3. **Webhooks**: Ver webhooks entregados y fallidos
4. **Clientes**: Ver información de clientes

---

## 🚨 Troubleshooting

### Problema: "Invalid webhook signature"

**Causa**: El secreto del webhook no coincide.

**Solución**:
1. Verifica `WOMPI_EVENTS_SECRET` en tu `.env`
2. Compara con el secreto configurado en el Dashboard de Wompi
3. Regenera el secreto si es necesario

### Problema: "Wompi subscription creation failed"

**Causa**: Error al crear la suscripción en Wompi.

**Solución**:
1. Verifica que las claves de API sean correctas
2. Revisa que la tarjeta sea válida
3. Verifica que tengas fondos suficientes (en sandbox no aplica)
4. Revisa los logs de Wompi para más detalles

### Problema: "Límite de cursos alcanzado"

**Causa**: El usuario alcanzó el límite de su plan.

**Solución**:
1. Verifica el plan del usuario en la base de datos
2. Verifica la suscripción en Wompi
3. Si el pago falló, el usuario se degrada a FREE automáticamente
4. El usuario debe actualizar su método de pago

### Problema: Los webhooks no llegan

**Causa**: La URL del webhook no está configurada correctamente.

**Solución**:
1. Verifica la URL en el Dashboard de Wompi: `https://tu-dominio.com/api/webhooks/wompi`
2. Verifica que el endpoint esté accesible: `curl https://tu-dominio.com/api/webhooks/wompi`
3. Revisa los logs del servidor para ver si llegan requests
4. Verifica que HTTPS esté funcionando correctamente

---

## 📊 Métricas Importantes

Monitorea estas métricas:

1. **Tasa de conversión**: % de usuarios que se suscriben
2. **Churn rate**: % de usuarios que cancelan mensualmente
3. **Pagos exitosos**: % de pagos que se procesan correctamente
4. **Tiempo de respuesta**: De los endpoints de pago
5. **Errores de webhook**: Cantidad de webhooks que fallan

---

## 📞 Soporte

### Soporte de Wompi

- **Email**: soporte@wompi.co
- **Dashboard**: https://dashboard.wompi.co/
- **Documentación**: https://docs.wompi.co/

### Checklist Final

Antes de ir a producción, verifica:

- [ ] Variables de entorno configuradas correctamente
- [ ] Base de datos migrada y funcionando
- [ ] Webhooks configurados en Wompi
- [ ] Probado en staging con tarjetas de prueba
- [ ] Logs monitoreándose correctamente
- [ ] HTTPS habilitado
- [ ] Alertas configuradas para errores críticos
- [ ] Respaldo de la base de datos configurado
- [ ] Documentación del equipo actualizada

---

## 🎉 ¡Listo!

Tu aplicación ahora está lista para aceptar pagos reales. 

**Recuerda**:
- Monitorear los logs regularmente
- Revisar el Dashboard de Wompi diariamente
- Responder rápidamente a pagos fallidos
- Mantener las claves de API seguras

¡Buena suerte con el lanzamiento! 🚀

