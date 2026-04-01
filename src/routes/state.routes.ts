import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';

export const stateRoutes = Router();

stateRoutes.post('/state/generate', stateController.generateState);
stateRoutes.post('/states/generate', stateController.generateStates);
stateRoutes.post('/states/search', stateController.searchStates);
stateRoutes.get('/states/:id', stateController.getStateById);
