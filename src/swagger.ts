import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API with Swagger',
    version: '1.0.0',
    description: 'This is a simple CRUD API application made with Express and documented with Swagger',
    license: {
      name: 'MIT',
      url: 'https://spdx.org/licenses/MIT.html'
    },
    contact: {
      name: 'Trung Nguyen dz',
      url: 'https://yourwebsite.com',
      email: 'your.email@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:8888',
      description: 'Development server'
    },
    {
      url: 'https://shortlink-backend-s5tw.onrender.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
}

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts', // Các file route
    './src/swagger/*.swagger.yaml' // Các file swagger documentation
  ]
}
const swaggerSpec = swaggerJsdoc(options)

// Function to setup our swagger docs
export const setupSwagger = (app: Express, port: number): void => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  console.log(`Swagger docs available at http://localhost:${port}/api-docs`)
}
