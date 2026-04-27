# Configuración de la API de IA para Frontend Serverless

## Resumen de la Implementación

Esta aplicación utiliza una arquitectura **100% frontend/serverless** que se conecta directamente a las APIs de los proveedores de IA desde el navegador, sin necesidad de un backend intermedio.

## Modelos de IA Soportados

### Google Gemini
- **gemini-1.5-pro**: Modelo multimodal más capaz de Google
- **gemini-2.0-pro**: Última versión con razonamiento mejorado

### Alibaba Qwen (DashScope)
- **qwen-max**: Modelo de propósito general más potente
- **qwen-coder-plus**: Especializado en generación y comprensión de código
- **qwen-3.6-plus**: Versión avanzada con ventana de contexto extendida

### Ollama (Auto-alojado)
- **ollama:llama3**: Llama 3 de Meta ejecutado localmente
- **ollama:codellama**: Versión especializada en código

## Configuración del Archivo .env

Copia el archivo `.env.example` a `.env` y configura tus claves:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# Qwen (Alibaba DashScope)
VITE_QWEN_API_KEY=tu_qwen_api_key
VITE_QWEN_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

# Google Gemini
VITE_GEMINI_API_KEY=tu_gemini_api_key
VITE_GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models

# Ollama (opcional, para instancias locales)
VITE_OLLAMA_ENDPOINT=http://localhost:11434/api/generate

# Modelo por defecto
VITE_DEFAULT_MODEL=gemini-1.5-pro
```

## Cómo Obtener las API Keys

### 1. Google Gemini
1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la clave generada
5. **Nota**: Gratis para uso moderado, no requiere tarjeta de crédito

### 2. Alibaba Qwen (DashScope)
1. Ve a [Alibaba Cloud DashScope](https://bailian.console.aliyun.com/)
2. Inicia sesión con tu cuenta de Alibaba o GitHub
3. Navega a "API-KEY Management"
4. Haz clic en "Create API Key"
5. Copia la clave generada

### 3. Ollama (Local)
1. Instala Ollama desde [ollama.ai](https://ollama.ai)
2. Ejecuta `ollama run llama3` o `ollama run codellama`
3. La API estará disponible en `http://localhost:11434`

## Base de Datos SQLite (IndexedDB)

La aplicación incluye una base de datos local usando **IndexedDB** a través de la librería `idb` para:

### Almacenamiento de Datos de Entrenamiento
- **training_data**: Pares prompt-respuesta para mejorar el modelo
- **model_configs**: Configuraciones específicas por modelo
- **conversation_history**: Historial completo de conversaciones

### Funciones Disponibles

```typescript
// Guardar datos de entrenamiento
await addTrainingData(prompt, response, model, category, quality_score);

// Obtener datos por categoría
await getTrainingDataByCategory('chat_response');

// Obtener datos de alta calidad
await getHighQualityTrainingData(4);

// Guardar conversación completa
await saveConversation(chat_id, messages, model_used, feedback_score);

// Exportar datos para fine-tuning
const jsonData = await exportTrainingData('json');

// Importar datos externos
await importTrainingData(jsonString);
```

## Entrenamiento Automático

La aplicación implementa **auto-entrenamiento** basado en:

1. **Recolección Automática**: Cada conversación se guarda en SQLite
2. **Filtrado por Calidad**: Solo respuestas no restringidas y >50 caracteres
3. **Puntuación Automática**: Respuestas útiles reciben score 5
4. **Exportación**: Datos listos para fine-tuning de modelos

### Estándares de Calidad Implementados

```typescript
// Guidelines generales
- Ser útil e inofensivo
- Proporcionar información precisa
- Admitir cuando no se sabe algo
- Seguir pautas éticas

// Para modelos de código (qwen-coder-plus, codellama)
- Escribir código limpio y eficiente
- Explicar la lógica claramente
- Sugerir mejoras y mejores prácticas

// Para Qwen
- Soporte multilingüe (chino/inglés)
- Conocimiento del ecosistema Alibaba

// Para Gemini
- Razonamiento multimodal
- Principios de IA de Google
```

## Uso en el Código

### Hook useChat Actualizado

```typescript
import { useChat } from './hooks/useChat';

function ChatComponent() {
  const {
    sendMessage,
    selectedModel,
    setSelectedModel,
    availableModels,
    // ... otras propiedades
  } = useChat(userId, userProfile);

  // Cambiar modelo
  setSelectedModel('qwen-coder-plus');

  // Enviar mensaje
  const response = await sendMessage(
    '¿Cómo creo una función en TypeScript?',
    'chat',
    sessionToken
  );

  // Ver modelos disponibles
  console.log(availableModels);
}
```

### Llamada Directa a la API

```typescript
import { callAI, callGemini, callQwen, callOllama } from './lib/ai';

// Llamada unificada
const response = await callAI(messages, 'gemini-1.5-pro', ageVerified);

// O llamadas específicas
const geminiResponse = await callGemini(messages, 'gemini-1.5-pro', ageVerified);
const qwenResponse = await callQwen(messages, 'qwen-coder-plus', ageVerified);
const ollamaResponse = await callOllama(messages, 'llama3', ageVerified);
```

## Seguridad y Verificación de Edad

- **Safety Settings**: Configurados automáticamente según verificación de edad
- **Contenido Restringido**: Marcado y filtrado apropiadamente
- **Verificación**: Integrada con el perfil de usuario de Firebase

## Consideraciones de Producción

### Ventajas de esta Arquitectura
✅ Sin costos de servidor backend
✅ Escalabilidad automática con Firebase
✅ Latencia reducida (llamadas directas)
✅ Más simple de mantener y desplegar

### Consideraciones
⚠️ **API Keys en el Frontend**: Las claves están expuestas en el código del cliente
   - Usa restricciones de dominio en las consolas de los proveedores
   - Implementa cuotas de uso
   - Considera un proxy para producción a gran escala

⚠️ **CORS**: Asegúrate de que las APIs permitan peticiones desde tu dominio

⚠️ **Rate Limiting**: Implementa limitación del lado del cliente

## Estructura de Archivos

```
/workspace
├── .env                          # Variables de entorno (no commitear)
├── src/
│   ├── lib/
│   │   ├── ai.ts                 # Conexión a APIs de IA
│   │   ├── sqlite.ts             # Base de datos IndexedDB
│   │   └── firebase.ts           # Configuración de Firebase
│   ├── hooks/
│   │   └── useChat.ts            # Hook principal con integración IA
│   └── types/
│       └── index.ts              # Tipos TypeScript
└── SETUP.md                      # Este archivo
```

## Próximos Pasos

1. **Configurar tus API keys** en `.env`
2. **Probar cada modelo** para verificar conectividad
3. **Ajustar parámetros** (temperatura, max_tokens) según necesidades
4. **Implementar UI** para selección de modelos
5. **Agregar sistema de feedback** para mejorar entrenamiento

## Soporte

Para problemas con:
- **Firebase**: Revisa la consola de Firebase
- **Gemini**: [Documentación de Google AI](https://ai.google.dev/docs)
- **Qwen**: [Documentación de DashScope](https://help.aliyun.com/zh/dashscope/)
- **Ollama**: [Documentación de Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md)
