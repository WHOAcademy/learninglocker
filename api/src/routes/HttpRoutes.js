import express from 'express';
import restify from 'express-restify-mongoose';
import git from 'git-rev';
import Promise from 'bluebird';
import { jsonSuccess, serverError } from 'api/utils/responses';
import passport from 'api/auth/passport';
import {
  GOOGLE_AUTH_OPTIONS,
  DEFAULT_PASSPORT_OPTIONS,
  RESTIFY_DEFAULTS,
  setNoCacheHeaders
} from 'lib/constants/auth';
import handleError from 'api/controllers/utils/handleError';

// CONTROLLERS
import AuthController from 'api/controllers/AuthController';
import UploadController from 'api/controllers/UploadController';
import DownloadController from 'api/controllers/DownloadController';
import ExportController from 'api/controllers/ExportController';
import StatementController from 'api/controllers/StatementController';
import PersonaController from 'api/controllers/PersonaController';
import generateConnectionController from 'api/controllers/ConnectionController';
import generateIndexesController from 'api/controllers/IndexesController';
import ImportPersonasController from 'api/controllers/ImportPersonasController';

// REST
import LRS from 'lib/models/lrs';
import Client from 'lib/models/client';
import User from 'lib/models/user';
import Organisation from 'lib/models/organisation';
import Stream from 'lib/models/stream';
// import Persona from 'lib/models/persona';
import Export from 'lib/models/export';
import Download from 'lib/models/download';
// import PersonaIdentifier from 'lib/models/personaidentifier';
import Query from 'lib/models/query';
import ImportCsv from 'lib/models/importcsv';
import ScoringScheme from 'lib/models/scoringscheme';
import Statement from 'lib/models/statement';
import StatementForwarding from 'lib/models/statementForwarding';
import Visualisation from 'lib/models/visualisation';
import Dashboard from 'lib/models/dashboard';
import QueryBuilderCache from 'lib/models/querybuildercache';
import QueryBuilderCacheValue from 'lib/models/querybuildercachevalue';
import Role from 'lib/models/role';
import PersonasImport from 'lib/models/personasImport';
import PersonasImportTemplate from 'lib/models/personasImportTemplate';
import * as routes from 'lib/constants/routes';

const router = new express.Router();
router.use(setNoCacheHeaders);

router.get('', (req, res) => res.status(200).send('OK'));
router.get(routes.VERSION, (req, res) => {
  Promise.all([
    new Promise(resolve => git.short(resolve)),
    new Promise(resolve => git.long(resolve)),
    new Promise(resolve => git.branch(resolve)),
    new Promise(resolve => git.tag(resolve))
  ])
    .then(([short, long, branch, tag]) => {
      jsonSuccess(res)({ short, long, branch, tag });
    })
    .catch(serverError(res));
});

/**
 * AUTHORIZATION
 */
router.post(
  routes.AUTH_RESETPASSWORD_REQUEST,
  AuthController.resetPasswordRequest
);
router.post(routes.AUTH_RESETPASSWORD_RESET, AuthController.resetPassword);
router.post(routes.AUTH_JWT_PASSWORD, AuthController.jwt);
router.post(
  routes.AUTH_JWT_ORGANISATION,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  AuthController.jwtOrganisation
);

router.get(
  routes.AUTH_CLIENT_INFO,
  passport.authenticate('clientBasic', DEFAULT_PASSPORT_OPTIONS),
  AuthController.clientInfo
);

/**
 * TWO FACTOR / GOOGLE
 */
if (process.env.GOOGLE_ENABLED) {
  router.get(
    routes.AUTH_JWT_GOOGLE,
    passport.authenticate('google', GOOGLE_AUTH_OPTIONS)
  );
  router.get(
    routes.AUTH_JWT_GOOGLE_CALLBACK,
    passport.authenticate('google', DEFAULT_PASSPORT_OPTIONS),
    AuthController.googleSuccess
  );
}

router.get(
  routes.AUTH_JWT_SUCCESS,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  AuthController.success
);

/**
* Personas
*/

router.get(
  routes.CONNECTION_PERSONA,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.connection
);
router.patch(
  routes.UPDATE_PERSONA,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.update
);
router.get(
  routes.CONNECTION_PERSONA_IDENTIFIER,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.getIdentifiers
);
router.post(
  routes.CREATE_IDENTIFIER,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.postIdentifier
);
router.get(
  routes.GET_PERSONA_COUNT,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.getPersonaCount
);
router.post(
  routes.MERGE_PERSONA,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.mergePersona
);
router.delete(
  routes.DELETE_PERSONA,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.deletePersona
);
router.post(
  routes.ADD_PERSONA,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.addPersona
);
router.get(
  routes.GET_PERSONA,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.getPersona
);
router.get(
  routes.GET_ATTRIBUTES,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.getAttributes
);
router.post(
  routes.POST_PERSONA_ATTRIBUTE,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  PersonaController.postAttribute
);

/**
 * UPLOADS
 */
router.post(
  routes.UPLOADLOGO,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  UploadController.uploadLogo
);

router.post(
  routes.UPLOADPERSONAS,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  ImportPersonasController.uploadPersonas
);

router.post(
  routes.IMPORTPERSONAS,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  ImportPersonasController.importPersonas
);

/**
 * DOWNLOADS
 */
router.get(
  routes.DOWNLOADLOGO,
  passport.authenticate(['jwt', 'jwt-cookie'], DEFAULT_PASSPORT_OPTIONS),
  DownloadController.downloadLogo
);
router.get(
  routes.DOWNLOADEXPORT,
  passport.authenticate(['jwt', 'jwt-cookie'], DEFAULT_PASSPORT_OPTIONS),
  DownloadController.downloadExport
);

/**
 * EXPORTS
 */
router.get(
  routes.EXPORT,
  passport.authenticate('jwt', DEFAULT_PASSPORT_OPTIONS),
  ExportController.downloadExport
);

/**
 * STATEMENTS
 */
router.get(
  routes.STATEMENTS_AGGREGATE,
  passport.authenticate(['jwt', 'clientBasic'], DEFAULT_PASSPORT_OPTIONS),
  StatementController.aggregate
);
router.get(
  routes.STATEMENTS_COUNT,
  passport.authenticate(['jwt', 'clientBasic'], DEFAULT_PASSPORT_OPTIONS),
  StatementController.count
);

/**
 * V1 compatability
 */
router.get(
  routes.V1_STATEMENTS_AGGREGATE,
  passport.authenticate(['jwt', 'clientBasic'], DEFAULT_PASSPORT_OPTIONS),
  StatementController.v1aggregate
);

/**
 * REST APIS
 */
restify.defaults(RESTIFY_DEFAULTS);
restify.serve(router, Organisation);
restify.serve(router, Stream);
restify.serve(router, Export);
restify.serve(router, Download);
// restify.serve(router, Persona);
// restify.serve(router, PersonaIdentifier);
restify.serve(router, Query);
restify.serve(router, ImportCsv);
restify.serve(router, ScoringScheme);
restify.serve(router, User);
restify.serve(router, Client);
restify.serve(router, Visualisation);
restify.serve(router, Dashboard);
restify.serve(router, LRS);
restify.serve(router, Statement);
restify.serve(router, StatementForwarding);
restify.serve(router, QueryBuilderCache);
restify.serve(router, QueryBuilderCacheValue);
restify.serve(router, Role);
restify.serve(router, PersonasImport);
restify.serve(router, PersonasImportTemplate);

/**
 * CONNECTIONS and INDEXES
 */
const generatedRouteModels = [
  Organisation,
  User,
  Statement,
  StatementForwarding,
  LRS,
  QueryBuilderCache,
  QueryBuilderCacheValue,
  Client,
  Dashboard,
  Visualisation,
  Query,
  // Persona,
  // PersonaIdentifier,
  Export,
  Download,
  ImportCsv,
  Role,
  PersonasImport,
  PersonasImportTemplate
];

const generateConnectionsRoute = (model, routeSuffix, authentication) => {
  const route = `${routes.CONNECTION}/${routeSuffix}`;
  const controller = generateConnectionController(model);
  router.get(route, authentication, controller);
};

const generateIndexesRoute = (model, routeSuffix, authentication) => {
  const route = `${routes.INDEXES}/${routeSuffix}`;
  const controller = generateIndexesController(model);
  router.get(route, authentication, controller);
};

const generateModelRoutes = (model) => {
  const routeSuffix = model.modelName.toLowerCase();
  const authentication = (req, res, next) =>
    passport.authenticate(
      ['jwt', 'clientBasic'],
      DEFAULT_PASSPORT_OPTIONS,
      (err, user) => {
        if (err) {
          return handleError(res, err);
        }
        req.user = user;
        return next();
      }
    )(req, res, next);
  generateConnectionsRoute(model, routeSuffix, authentication);
  generateIndexesRoute(model, routeSuffix, authentication);
};

generatedRouteModels.map(generateModelRoutes);

export default router;
