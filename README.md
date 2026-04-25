# CodeSec AI - Plataforma de IA para Programación y Ciberseguridad

Una aplicación web moderna que combina chat de IA con un IDE en línea, especializada en programación y ciberseguridad.

## Características

- **Chat AI**: Conversaciones con IA especializadas en código y ciberseguridad
- **IDE Online**: Editor de código integrado con autocompletado por IA
- **Autenticación Google**: Login seguro con Firebase Auth
- **Base de datos Firestore**: Almacenamiento en tiempo real con Firebase
- **Verificación de edad**: Sistema 18+ para contenido avanzado

## Tecnologías

- React 18 + TypeScript
- Vite
- Firebase (Auth + Firestore)
- TailwindCSS
- Lucide Icons

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Authentication con Google
4. Habilita Firestore Database
5. Copia las credenciales de configuración

### 3. Crear archivo .env

Copia `.env.example` a `.env` y completa con tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus valores de Firebase.

### 4. Configurar Firestore

En Firebase Console > Firestore Database > Reglas, usa:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth != null && resource.data.user_id == request.auth.uid;
    }
    
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/chats/$(resource.data.chat_id)) &&
        get(/databases/$(database)/documents/chats/$(resource.data.chat_id)).data.user_id == request.auth.uid;
    }
  }
}
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── auth/       # Componentes de autenticación
│   ├── chat/       # Componentes del chat
│   ├── ide/        # Componentes del IDE
│   └── layout/     # Componentes de diseño
├── hooks/          # Hooks personalizados (useAuth, useChat)
├── lib/            # Configuración de Firebase
├── types/          # Tipos TypeScript
└── App.tsx         # Componente principal
```

## Notas Importantes

- El endpoint de IA (`VITE_AI_ENDPOINT`) debe ser configurado con tu propio backend
- La verificación de edad es automática basada en la cuenta de Google
- Los datos se almacenan en Firestore en tiempo real

## Licencia

MIT
