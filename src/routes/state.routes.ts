import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';

export const stateRoutes = Router();

stateRoutes.post('/state/generate', stateController.generateState);
