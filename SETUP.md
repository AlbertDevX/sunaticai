# CodeSec AI - Configuración del Entorno

## Variables de Entorno para el Frontend (.env)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key_de_firebase
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# AI Backend Endpoint
VITE_AI_ENDPOINT=http://localhost:3000/api/ai-chat
```

## Variables de Entorno para el Backend (/server/.env)

```env
# Qwen API Configuration (Alibaba Cloud DashScope)
QWEN_API_KEY=tu_qwen_api_key_aqui
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

# Server Configuration
PORT=3000
NODE_ENV=development

# Age Restriction Settings
MIN_AGE=18
```

## Instrucciones de Configuración

### 1. Obtener API Key de Qwen

1. Regístrate en [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com/)
2. Crea una nueva API Key en la consola
3. Copia tu API Key y pégala en `/server/.env`

### 2. Instalar Dependencias

```bash
# Frontend (ya instalado)
npm install

# Backend
cd server
npm install
```

### 3. Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```

La aplicación web se abrirá en `http://localhost:5173` (o el puerto que indique Vite)

## Endpoints Disponibles

### `/api/ai-chat` (POST)
Chat principal con CodeSec AI usando Qwen 3.6-27B

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hola, ¿puedes ayudarme con código Python?" }
  ],
  "chatId": "chat_123",
  "userAgeVerified": true
}
```

**Response:**
```json
{
  "content": "¡Claro! Puedo ayudarte con Python...",
  "restricted": false,
  "model": "Qwen 3.6-27B",
  "usage": {
    "input_tokens": 50,
    "output_tokens": 200
  }
}
```

### `/api/analyze-code` (POST)
Análisis especializado de código para el IDE

**Request Body:**
```json
{
  "code": "function test() { return 'hello'; }",
  "language": "javascript",
  "analysisType": "security"
}
```

### `/health` (GET)
Verificación del estado del servidor

## Parámetros del Modelo Qwen 3.6-27B

- **Temperatura**: 0.7 (equilibrio entre creatividad y precisión)
- **Max Tokens**: 4096 (respuestas largas y detalladas)
- **Top P**: 0.9 (diversidad controlada)
- **Repetition Penalty**: 1.1 (evita repeticiones)

## Sistema de Verificación de Edad

La aplicación implementa un sistema de doble verificación:

1. **Frontend**: El usuario debe verificar su edad (>18 años) en su perfil
2. **Backend**: Filtrado adicional de contenido restringido:
   - Hacking ético
   - Exploits y vulnerabilidades
   - Malware analysis
   - Técnicas ofensivas de ciberseguridad

Si el usuario NO está verificado y solicita contenido restringido, recibirá un mensaje indicando que necesita verificación de edad.

## Seguridad

- Todas las solicitudes al backend incluyen verificación de edad
- El sistema filtra tanto el input como el output del modelo
- Las conversaciones se almacenan en Firebase Firestore
- Soporte para múltiples sesiones de chat por usuario
