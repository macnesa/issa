function validateParentCredentials({ NIM, password }) {
  if (!NIM || !password) throw { name: 'loginError' };
}

function validateTeacherCredentials({ NIP, password }) {
  if (!NIP || !password) throw { name: 'loginError' };
}

function validatePublicDemoLoginRequest(requestBody) {
  if (
    requestBody == null ||
    (
      typeof requestBody === 'object' &&
      !Array.isArray(requestBody) &&
      Object.keys(requestBody).length === 0
    )
  ) {
    return;
  }

  throw { name: 'invalidPublicDemoLoginRequest' };
}

module.exports = {
  validateParentCredentials,
  validatePublicDemoLoginRequest,
  validateTeacherCredentials,
};
