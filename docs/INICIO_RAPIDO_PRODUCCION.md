# 🚀 Inicio Rápido - Producción con Wompi

## Pasos Para Activar Pagos Reales

### 1️⃣ Obtener Claves de Wompi (5 minutos)

1. Ve a https://dashboard.wompi.co/
2. Inicia sesión con tu cuenta verificada
3. Ve a **Configuración > API Keys**
4. Copia estas claves:
   - `WOMPI_PUBLIC_KEY` (empieza con `pub_prod_`)
   - `WOMPI_PRIVATE_KEY` (empieza con `prv_prod_`)
   - `WOMPI_EVENTS_SECRET`
   - `WOMPI_ACCEPTANCE_TOKEN`

### 2️⃣ Configurar Variables de Entorno (2 minutos)

Edita tu archivo `.env`:

```bash
# Cambiar a modo producción
WOMPI_ENV=production
NODE_ENV=production

# Pegar las claves de Wompi
WOMPI_PUBLIC_KEY=pub_prod_TU_CLAVE_AQUI
WOMPI_PRIVATE_KEY=prv_prod_TU_CLAVE_AQUI
WOMPI_EVENTS_SECRET=tu_secreto_aqui
WOMPI_ACCEPTANCE_TOKEN=tu_token_aqui

# Configurar URL de producción
NEXTAUTH_URL=https://tu-dominio.com
```

### 3️⃣ Actualizar Base de Datos (1 minuto)

```bash
# Aplicar migración para guardar tokens de pago
cd cursia
npm run db:migrate

# O si prefieres:
npx prisma db push
```

### 4️⃣ Configurar Webhook en Wompi (3 minutos)

1. En el Dashboard de Wompi, ve a **Webhooks**
2. Agrega nuevo webhook:
   - **URL**: `https://tu-dominio.com/api/webhooks/wompi`
   - **Eventos**: Selecciona todos los de `transaction.*` y `subscription.*`
3. Copia el secreto generado y úsalo como `WOMPI_EVENTS_SECRET`

### 5️⃣ Verificar Configuración (1 minuto)

```bash
npm run verify:config
```

Si todo está ✅, continúa al siguiente paso.

### 6️⃣ Desplegar (5 minutos)

```bash
# Compilar para producción
npm run build

# Iniciar en producción
npm start
```

---

## ✅ Todo Listo!

Ahora tu aplicación:

- ✅ Acepta pagos reales con Wompi
- ✅ Guarda los tokens de pago de forma segura
- ✅ Solo permite crear cursos según el plan pagado
- ✅ Procesa webhooks de Wompi automáticamente
- ✅ Degrada usuarios automáticamente si el pago falla

## 🔍 Verificar que Funciona

1. **Crear una cuenta de prueba**
2. **Ir a Dashboard > Planes**
3. **Suscribirse a un plan** (ej. APRENDIZ)
4. **Usar una tarjeta de crédito real**
5. **Verificar que**:
   - Se crea la suscripción en Wompi
   - Se actualiza el plan del usuario
   - Se puede crear más cursos

## 📊 Monitorear

- **Dashboard de Wompi**: https://dashboard.wompi.co/
- **Logs de tu app**: Ver transacciones y webhooks
- **Base de datos**: Revisar tabla `subscriptions`

## 🆘 Ayuda

Si algo no funciona:

1. Ejecuta `npm run verify:config` para verificar la configuración
2. Revisa los logs de la aplicación
3. Verifica el Dashboard de Wompi para ver si llegaron los webhooks
4. Lee la guía completa: `docs/DESPLIEGUE_PRODUCCION.md`

---

**¡Listo para generar ingresos! 💰**
