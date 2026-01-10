# ChurnInsight – Frontend

Este repositorio contiene el **frontend del proyecto ChurnInsight**, una aplicación orientada a la predicción de churn (abandono de clientes) mediante un modelo de machine learning, consumido desde un backend en Java Spring Boot.

##  Estructura del proyecto
```
churninsight-frontend/
│
├── index.html # Pantalla principal / login
├── registro.html # Registro de usuario
├── predictor.html # Vista de predicción de churn
│
├── css/
│ ├── mainstyle.css
│ ├── registro.css
│ └── predictorstyle.css
│
├── js/
│ ├── login.js
│ ├── registroapp.js
│ └── predictorapp.js
│
└── .gitignore
```

##  Tecnologías usadas

- HTML5
- CSS3
- JavaScript (Vanilla JS)

##  Integración

Este frontend está diseñado para comunicarse con:
- Un **backend en Spring Boot** (API REST)
- Un **modelo de predicción de churn**
