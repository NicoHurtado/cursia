import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export async function sendWelcomeEmail({ name, email }: WelcomeEmailData) {
  try {
    const mailOptions = {
      from: `"Cursia" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '¡Bienvenido a Cursia! 🎉',
      html: generateWelcomeEmailHTML(name),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function generateWelcomeEmailHTML(name: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Cursia</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
        }
        .welcome-message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            text-align: center;
        }
        .features {
            background: #f8fafc;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            font-size: 14px;
            color: #374151;
        }
        .feature-item.centered {
            justify-content: center;
        }
        .feature-icon {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            color: #667eea;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎓 Cursia</div>
            <p style="margin: 0; opacity: 0.9;">Tu plataforma de aprendizaje personalizado</p>
        </div>
        
        <div class="content">
            <h1 class="welcome-title">¡Bienvenido a Cursia, ${name}! 🎉</h1>
            
            <p class="welcome-message">
                Te has registrado exitosamente en Cursia. Estamos emocionados de tenerte como parte de nuestra comunidad de aprendizaje.
            </p>
            
            <div class="features">
                <h3 style="margin-top: 0; color: #1f2937; text-align: center;">¿Qué puedes hacer en Cursia?</h3>
                
                <div class="feature-item">
                    <span class="feature-icon">📚</span>
                    <span>Crea cursos personalizados con inteligencia artificial</span>
                </div>
                
                <div class="feature-item centered">
                    <span class="feature-icon">🎯</span>
                    <span>Aprende a tu propio ritmo con contenido adaptado</span>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🏆</span>
                    <span>Obtén certificados al completar tus cursos</span>
                </div>
                
                <div class="feature-item centered">
                    <span class="feature-icon">👥</span>
                    <span>Comparte conocimiento con la comunidad</span>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">📊</span>
                    <span>Rastrea tu progreso y logros</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'https://cursia.com'}/dashboard" class="cta-button">
                    Comenzar a Aprender
                </a>
            </div>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte en tu viaje de aprendizaje!
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Cursia</strong> - Aprendizaje Personalizado con IA</p>
            <div class="social-links">
                <a href="#">Sitio Web</a>
                <a href="#">Soporte</a>
                <a href="#">Comunidad</a>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Este es un correo automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}
