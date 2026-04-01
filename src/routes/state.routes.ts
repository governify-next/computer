import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';

export const stateRoutes = Router();

stateRoutes.post('/state/generate', stateController.generateState);
stateRoutes.post('/states/generate', stateController.generateStates);

stateRoutes.post('/states/search', stateController.searchStates);
stateRoutes.get('/states/:id', stateController.getStateById);
stateRoutes.put('/states/:id', stateController.updateState);
stateRoutes.delete('/states/:id', stateController.deleteStateById);

stateRoutes.get('/states/signatures/:signatureId', stateController.getStatesBySignatureId);
stateRoutes.delete('/states/signatures/:signatureId', stateController.deleteStatesBySignatureId);
