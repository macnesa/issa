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

module.exports = {
  findParentAccountByNim,
};
