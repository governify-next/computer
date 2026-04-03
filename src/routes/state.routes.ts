import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';
import {
    validateStateId,
    validateSignatureId,
    validateSearchStates,
    validateStateGeneration,
    validateStatesGeneration,
} from '../middlewares/state.validator.js';

export const stateRoutes = Router();

stateRoutes.post('/state/generate', validateStateGeneration, stateController.generateState);
stateRoutes.post('/states/generate', validateStatesGeneration, stateController.generateStates);

stateRoutes.post('/states/search', validateSearchStates, stateController.searchStates);
stateRoutes.get('/states/:id', validateStateId, stateController.getStateById);
stateRoutes.put('/states/:id', validateStateId, stateController.updateState);
stateRoutes.delete('/states/:id', validateStateId, stateController.deleteStateById);

stateRoutes.get(
    '/states/signatures/:signatureId',
    validateSignatureId,
    stateController.getStatesBySignatureId,
);
stateRoutes.delete(
    '/states/signatures/:signatureId',
    validateSignatureId,
    stateController.deleteStatesBySignatureId,
);
