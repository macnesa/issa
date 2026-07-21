const { hashSync, compareSync, genSaltSync } = require('bcryptjs');
const { sign, verify } = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

module.exports = {
  hashPassword: (password) => hashSync(password, genSaltSync(10)),
  compareHash: (pw, pw_db) => compareSync(pw, pw_db),

  createToken: (payload) => sign(payload, jwtSecret, { expiresIn: '1h' }),
  decodeToken: (payload) => verify(payload, jwtSecret),
};
