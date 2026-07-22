class TransactionController {
  static async midtransToken(req, res) {
    res.status(404).json({ msg: 'Payment is disabled in the public demo' });
  }

  static async allTransactions(req, res) {
    res.status(404).json({ msg: 'Transactions are disabled in the public demo' });
  }
}

module.exports = TransactionController;
