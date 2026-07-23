const authenticationService = require('../authentication/authentication.service');

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

module.exports = {
  authenticateParent,
};
