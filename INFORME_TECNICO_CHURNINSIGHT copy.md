# Informe Técnico de Desarrollo: ChurnInsight

> **Sistema Integral de Predicción de Abandono de Clientes con Inteligencia Artificial**

Este documento detalla la arquitectura, tecnologías y decisiones de diseño implementadas en el proyecto ChurnInsight, un sistema de predicción de abandono de clientes (Churn) diseñado para entornos empresariales reales y desplegado en la nube.

---

## 1. Stack Tecnológico

El proyecto fue construido bajo estándares industriales de robustez, escalabilidad y experiencia de usuario premium.

### Backend (Java)
| Componente | Tecnología | Descripción |
|------------|------------|-------------|
| **Lenguaje** | Java 17 (LTS) | Aprovechando mejoras en rendimiento y sintaxis moderna |
| **Framework Principal** | Spring Boot 3.4.1 | Gestión de dependencias, configuración automática y APIs REST |
| **Base de Datos** | MySQL 8.0 | Motor relacional de producción |
| **Migraciones** | Flyway | Control de versiones evolutivo del esquema de BD |
| **ORM** | Spring Data JPA + Hibernate | Mapeo objeto-relacional eficiente |
| **Seguridad** | Spring Security + JWT (Auth0) | Autenticación stateless |
| **Documentación** | Springdoc OpenAPI (Swagger UI) | Endpoints auto-documentados |
| **Productividad** | Lombok | Reducción de código boilerplate |
| **Motor de IA** | ONNX Runtime | Ejecución de modelos de Machine Learning |

### Frontend (Web)
| Componente | Tecnología | Descripción |
|------------|------------|-------------|
| **Estructura** | HTML5 Semántico | Accesibilidad y SEO optimizado |
| **Estilos** | CSS3 + Bootstrap 5.3 | Diseño responsive y Glassmorphism |
| **Lógica** | JavaScript ES6+ | Interactividad y consumo de APIs |
| **Alertas** | SweetAlert2 | Notificaciones premium |
| **Gráficos** | Chart.js | Visualización de datos interactiva |
| **Iconografía** | Font Awesome 6.4 | Iconos vectoriales profesionales |

### Infraestructura (Cloud)
| Componente | Servicio | Descripción |
|------------|----------|-------------|
| **Backend Hosting** | Railway | Deploy automático desde GitHub, 24/7 |
| **Base de Datos** | Railway MySQL | Instancia gestionada en la nube |
| **Frontend Hosting** | Railway Static | Servidor de archivos estáticos |
| **Repositorios** | GitHub | Control de versiones distribuido |

---

## 2. Arquitectura del Sistema

### 2.1 Patrón de Diseño
Se implementó un patrón **MVC (Modelo-Vista-Controlador)** desacoplado, organizado en capas claras:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                   (HTML/CSS/JavaScript)                          │
│         churninsight-frontend-production.up.railway.app          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST (JSON)
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    (Spring Boot 3.4.1)                           │
│         churninsight-backend-production.up.railway.app           │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Controllers │─▶│  Services   │─▶│ Repositories│              │
│  └─────────────┘  └──────┬──────┘  └─────────────┘              │
│                          │                                       │
│                          ▼                                       │
│                  ┌───────────────┐                               │
│                  │ ONNX Runtime  │ (Modelo de IA Integrado)      │
│                  └───────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│                    (MySQL 8.0 - Railway)                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Capas

| Capa | Responsabilidad | Ejemplos |
|------|-----------------|----------|
| **Controllers** | Reciben peticiones HTTP, validan entradas, devuelven JSON | `PrediccionController`, `ClienteController`, `AutenticacionController` |
| **Services** | Lógica de negocio, orquestación con IA, cálculos estadísticos | `PrediccionService`, `ModeloChurnService`, `OnnxPredictorService` |
| **Repositories** | Interacción con BD mediante JPA y consultas personalizadas | `ClienteRepository`, `PrediccionRepository` |
| **Domain/Models** | Entidades JPA, DTOs, Records y Enums | `Cliente`, `Prediccion`, `ResultadoPrediccion`, `PlanStatus` |
| **Security/Infra** | Filtros de seguridad, manejo global de excepciones, tokens JWT | `SecurityFilter`, `GlobalExceptionHandler`, `TokenService` |

---

## 3. Innovación Principal: IA Integrada con ONNX

### 3.1 Problema Resuelto
En lugar de depender de una API externa de Python/Flask que podría fallar o tener latencia, **el modelo de Machine Learning se ejecuta directamente dentro del backend Java**.

### 3.2 Implementación Técnica
- **Conversión del Modelo**: El modelo original de Scikit-learn (`.pkl`) fue convertido a formato ONNX mediante `skl2onnx`.
- **Inferencia en Java**: Se utiliza `onnxruntime-java` para cargar y ejecutar el modelo.
- **Servicio Dedicado**: `OnnxPredictorService.java` encapsula toda la lógica de predicción.

### 3.3 Ventajas
| Aspecto | Antes (API Externa) | Ahora (ONNX Integrado) |
|---------|---------------------|------------------------|
| Latencia | ~500-2000ms por predicción | ~5-20ms por predicción |
| Disponibilidad | Dependía de Colab/LocalTunnel | 100% independiente |
| Escalabilidad | Cuello de botella en la API | Escala con el backend |
| Costo | Recursos externos | Sin costo adicional |

---

## 4. Lógica de Negocio Avanzada

### 4.1 Mecanismo de UPSERT (Update or Insert)
ChurnInsight detecta automáticamente si un `idCliente` ya existe en la base de datos:
- **Si existe**: Actualiza sus datos actuales (plan, tickets, uso, etc.).
- **Si no existe**: Crea el registro desde cero.

Esto garantiza que la identidad del cliente se mantenga única y coherente, evitando duplicados.

### 4.2 Registro Histórico de Predicciones
Cada análisis de un cliente genera una **nueva entrada histórica** en la tabla `predicciones`. Esto permite:
- Ver la evolución del riesgo a lo largo del tiempo.
- Comparar predicciones antes y después de acciones comerciales.
- Auditoría completa de las decisiones de IA.

### 4.3 Procesamiento Masivo en Paralelo
El método `predecirEnLote()` utiliza **Streams Paralelos de Java**:
```java
resultados = clientes.parallelStream()
    .map(this::procesarPrediccion)
    .collect(Collectors.toList());
```
Esto reduce el tiempo de procesamiento de un CSV de 500 clientes en hasta un **60%**.

### 4.4 Cálculos Estadísticos en Tiempo Real
El backend calcula métricas agregadas automáticamente para el dashboard:
- **Tasa de Retención vs. Riesgo de Churn**
- **Distribución por Plan** (Básico, Estándar, Premium)
- **Segmentación por Nivel de Riesgo** (Bajo, Medio, Alto)
- **Top 10 Clientes en Alto Riesgo** (con factores explicativos)

### 4.5 Acciones Recomendadas por IA
El sistema genera **recomendaciones estratégicas detalladas** basadas en el factor de riesgo predominante:

| Factor de Riesgo | Acción Recomendada |
|------------------|-------------------|
| Bajo uso mensual | Campaña de Re-interés Personalizada |
| Plan Básico | Oferta de Upgrade con Beneficios |
| Retrasos de pago | Plan de Flexibilidad y Recordatorios |
| Cliente nuevo (<15 meses) | Programa de Bienvenida y Recompensa |
| Cambio de plan reciente | Encuesta de Satisfacción Pos-Cambio |
| Muchos tickets de soporte | Atención Prioritaria V.I.P. |

---

## 5. Frontend: Experiencia de Usuario Premium

### 5.1 Filosofía de Diseño
- **Glassmorphism**: Tarjetas con efecto de cristal y desenfoque de fondo.
- **Modo Oscuro**: Paleta de colores índigo/púrpura sobre fondos oscuros.
- **Micro-interacciones**: Animaciones sutiles en hover y transiciones suaves.
- **Responsividad**: Diseño adaptativo para escritorio y móvil.

### 5.2 Componentes Principales
| Página | Funcionalidad |
|--------|---------------|
| **Login** | Autenticación con JWT, validación de credenciales |
| **Dashboard** | Resumen ejecutivo, gráficos interactivos, tabla de alto riesgo |
| **Predictor** | Análisis individual de clientes, velocímetro de probabilidad, factores de riesgo |
| **Registro** | Alta de nuevos clientes con validaciones en tiempo real |

### 5.3 Carga Masiva de Datos
- Soporte para archivos CSV con drag-and-drop.
- Timeout extendido de 2 minutos para archivos grandes.
- Feedback visual durante el procesamiento.
- Actualización automática del dashboard tras la carga.

---

## 6. Seguridad y Robustez

### 6.1 Autenticación JWT
- Tokens stateless con expiración configurable.
- Validación de Bearer Token en cada request protegido.
- No se almacena estado de sesión en el servidor.

### 6.2 Manejo Global de Errores
Implementación de `GlobalExceptionHandler` que captura:
- `EntityNotFoundException` → HTTP 404
- `MethodArgumentTypeMismatchException` → HTTP 400 con mensaje descriptivo
- `ValidacionDeNegocioException` → HTTP 400 con detalle del error
- Cualquier otra excepción → HTTP 500 con mensaje genérico

### 6.3 Validación de Entradas
- Validación de IDs numéricos y rangos (máximo 2,147,483,647).
- Mensajes de error claros y accionables para el usuario.
- Prevención de inyección SQL mediante JPA parameterizado.

### 6.4 CORS Configurado
Cross-Origin Resource Sharing habilitado específicamente para:
- Frontend en Railway
- Desarrollo local (localhost)

---

## 7. Despliegue en la Nube (Railway)

### 7.1 Arquitectura de Producción
```
Usuario → https://churninsight-frontend-production.up.railway.app
              │
              ▼
         [Railway Frontend Service] (Serve Static Files)
              │
              ▼ API Calls
         [Railway Backend Service] (Spring Boot)
              │
              ▼
         [Railway MySQL Database]
```

### 7.2 Variables de Entorno
El backend utiliza variables de entorno para configuración sensible:
- `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`
- `MYSQLUSER`, `MYSQLPASSWORD`
- `JWT_SECRET`
- `PORT` (asignado automáticamente por Railway)

### 7.3 Deploy Automático
Cada push a la rama `main` en GitHub dispara un re-deploy automático en Railway.

---

## 8. URLs de Acceso

| Componente | URL |
|------------|-----|
| **Frontend (Producción)** | https://churninsight-frontend-production.up.railway.app |
| **Backend API (Producción)** | https://churninsight-backend-production.up.railway.app |
| **Repositorio Frontend** | https://github.com/oFrank777/ChurnInsight-Frontend |
| **Repositorio Backend** | https://github.com/oFrank777/ChurnInsight-Backend |

---

## 9. Métricas y Resultados

### 9.1 Rendimiento del Modelo
- **Precisión del modelo ONNX**: Equivalente al modelo original de Scikit-learn.
- **Tiempo de inferencia**: < 20ms por cliente.
- **Procesamiento en lote**: ~500 clientes en < 30 segundos.

### 9.2 Disponibilidad
- Sistema desplegado 24/7 en la nube.
- No requiere que ninguna PC local esté encendida.
- Accesible desde cualquier dispositivo con internet.

---

## 10. Conclusiones

El proyecto ChurnInsight demuestra la integración de múltiples tecnologías modernas:
- **Backend robusto** con Spring Boot y seguridad JWT.
- **Inteligencia Artificial integrada** mediante ONNX Runtime.
- **Frontend premium** con experiencia de usuario de nivel SaaS.
- **Infraestructura cloud** con despliegue continuo.

El sistema está preparado para escalarse horizontalmente y manejar cargas empresariales reales, transformando un proyecto académico en una solución de nivel productivo.

---

*Documento generado el 16 de enero de 2026*
*Versión: 1.0*
