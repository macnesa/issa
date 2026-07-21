const { Chat, User, Student, sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { QueryTypes } = require('sequelize');

class chatController {
  static getMessageHistory = async (req, res) => {
    const { from, to } = req.params;

    try {
      let getMsg;
      getMsg = await Chat.findAll({
        where: {
          [Op.or]: [
            { fromUserId: +from, toUserId: +to },
            { fromUserId: +to, toUserId: +from },
          ],
        },
        order: [['createdAt', 'ASC']],
      });
      if (!getMsg) throw { name: 'Not found' };
      res.status(200).json(getMsg);
    } catch (error) {
      if (error.name === 'Not found') res.status(404).json({ message: error.name });
      else res.status(500).json({ message: 'Internal server error' });
    }
  };

  static async postMessage(req, res) {
    const { from, to, message } = req.body;
    console.log(message);
    try {
      let addMsg = await Chat.create({
        fromUserId: +from,
        toUserId: +to,
        message: message,
        roomId: 'room ' + from * to,
      });

      res.status(201).json(addMsg);
    } catch (err) {
      console.log(err);
      if (err.name === 'ValidationError') res.status(400).json({ message: 'Input is invalid' });
      else res.status(500).json({ message: 'Internal server error' });
    }
  }

  static getAllUserRelatedToSender = async (req, res) => {
    const toId = req.params.toId;
    try {
      let allUsers = await Chat.findAll({
        where: {
          toUserId: +toId,
        },
        attributes: [[Sequelize.fn('MAX', Sequelize.col('id')), 'id'], 'fromUserId', 'roomId'],
        group: ['fromUserId', 'roomId'],
        order: [['fromUserId', 'ASC']],
      });

      if (!allUsers || allUsers.length === 0) throw { name: 'Not found' };

      let users = await User.findAll({
        attributes: ['id'],
        include: {
          model: Student,
          attributes: ['name'],
        },
      });

      allUsers.forEach((el) => {
        el.dataValues.parentName = users.filter((x) => x.id == el.fromUserId);
      });

      res.status(200).json(allUsers);
    } catch (err) {
      console.log(err);
      if (err.name === 'Not found') res.status(404).json({ message: err.name });
      else res.status(500).json({ message: 'Internal server error' });
    }
  };
}

module.exports = chatController;
