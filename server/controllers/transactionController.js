const { Transaction, Student, Class, User } = require('../models');
const midtransClient = require('midtrans-client');
const sendMail = require('../helpers/nodemailer');

class TransactionController {
  static async midtransToken(req, res, next) {
    try {
      const StudentId = req.params.id;
      const student = await Student.findOne({
        where: { id: StudentId },
        include: [{ model: Class }, { model: User }],
      });

      const check = await Transaction.findOne({
        where: { StudentId: StudentId },
        order: [['createdAt', 'DESC']]
      })
      if (check.status === true) throw { name: `alreadypayment` }

      let snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: 'SB-Mid-server-hJt-nLiZ4zT2U1ugrPxzah2p',
      });
      const orderNumber = new Date().getTime();
      let parameter = {
        transaction_details: {
          order_id: orderNumber,
          gross_amount: student.Class.SPP,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: student.name,
          last_name: student.Class.name,
        },
      }

      const midtransToken = await snap.createTransaction(parameter)
      res.status(201).json(midtransToken)

      sendMail(student);
    } catch (error) {
      next(error);
    }
  }

  static async allTransactions(req, res, next) {
    try {
      const data = await Transaction.findAll();
      if (!data) throw { name: 'notFound' };

      res.status(201).json({ msg: `payment success` });
    } catch (err) {
      next(err);
    }
  }


}
module.exports = TransactionController;
