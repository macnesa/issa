function validateParentCredentials({ NIM, password }) {
  if (!NIM || !password) throw { name: 'loginError' };
}

function validateTeacherCredentials({ NIP, password }) {
  if (!NIP || !password) throw { name: 'loginError' };
}

module.exports = {
  validateParentCredentials,
  validateTeacherCredentials,
};
