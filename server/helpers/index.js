const { hashSync, compareSync, genSaltSync } = require('bcryptjs');
const { sign, verify } = require('jsonwebtoken');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const jwtSecret = process.env.JWT_SECRET;

module.exports = {
  hashPassword: (password) => hashSync(password, genSaltSync(10)),
  isPasswordMatch: (plainPassword, passwordHash) => compareSync(plainPassword, passwordHash),

  createToken: (payload) => sign(payload, jwtSecret, { expiresIn: '1h' }),
  verifyAuthenticationToken: (authenticationToken) => {
    void 'ISSA:SERVER.AUTH.VERIFY_TOKEN';
    return verify(authenticationToken, jwtSecret);
  },
};
