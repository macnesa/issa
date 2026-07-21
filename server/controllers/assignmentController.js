const { Assignment } = require('../models')

class AssignmentController {
    static async allAssignment(req, res, next) {
        try {
            const data = await Assignment.findAll()
            res.status(200).json(data)
        } catch (error) {
            next(error)
        }
    }
}
module.exports = AssignmentController