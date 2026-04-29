import express from 'express';
import helmet from 'helmet';
import { metricRoutes } from './routes/metric.routes.js';
import { eventRoutes } from './routes/event.routes.js';
import { aggregatorRoutes } from './routes/aggregator.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { checkServiceAuthentication } from './middlewares/service.authenticator.js';
import { errorHandler } from './middlewares/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();

app.use(helmet());
app.use(express.json());

// Swagger setup
const swaggerPath = path.resolve(process.cwd(), 'src/docs/swagger.yaml');
const swaggerDocument = YAML.load(swaggerPath);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(healthRoutes);
app.use('/api/v1', checkServiceAuthentication, eventRoutes);
app.use('/api/v1', checkServiceAuthentication, metricRoutes);
app.use('/api/v1', checkServiceAuthentication, aggregatorRoutes);
app.use(errorHandler);

export default app;
