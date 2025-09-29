# Email Setup for Welcome Emails

## Required Environment Variables

Add these variables to your `.env.local` file:

```env
# Email Configuration (for welcome emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Gmail Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

## Other Email Providers

### Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
```

### Yahoo

```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
```

### Custom SMTP

```env
SMTP_HOST="your-smtp-server.com"
SMTP_PORT="587"
SMTP_USER="your-username"
SMTP_PASS="your-password"
```

## Testing

The welcome email will be sent automatically when a user registers. You can also test it manually by calling:

```bash
curl -X POST http://localhost:3000/api/email/welcome \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'
```
