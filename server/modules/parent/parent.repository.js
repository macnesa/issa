const { Class, Student, User } = require('../../models');

function findParentAccountByNim(parentNim) {
  return User.findOne({
    where: { NIM: parentNim },
    include: {
      model: Student,
      include: { model: Class },
    },
  });
}

function findParentAccountById(parentId) {
  return User.findByPk(parentId, {
    attributes: { exclude: ['password'] },
    include: {
      model: Student,
      include: { model: Class },
    },
  });
}

module.exports = {
  findParentAccountById,
  findParentAccountByNim,
};
