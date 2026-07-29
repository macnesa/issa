const authenticationService = require('../authentication/authentication.service');
const {
  validatePublicDemoLoginRequest,
} = require('../authentication/authentication.validator');

async function authenticateParent(req, res, next) {
  try {
    const authenticationResponse = await authenticationService.authenticateParent({
      NIM: req.body.NIM,
      password: req.body.password,
    });

    res.status(200).json(authenticationResponse);
  } catch (error) {
    next(error);
  }
}

async function authenticatePublicDemoParent(req, res, next) {
  try {
    validatePublicDemoLoginRequest(req.body);
    const authenticationResponse =
      await authenticationService.authenticatePublicDemoParent();
    res.set('Cache-Control', 'no-store');
    res.status(200).json(authenticationResponse);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateParent,
  authenticatePublicDemoParent,
};
