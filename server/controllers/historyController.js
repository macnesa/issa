const { History } = require('../models')

class HistoryController {
    static async allHistories(req, res, next) {
        try {
            const { pageIndex, createdBy } = req.query
            let limit;
            let offset;
            let pageSize = 7;

            // filtering by category
            let query = {}

            if (createdBy !== '' && typeof createdBy !== 'undefined') {
                query.where = {
                    createdBy
                }
            }

            // pagination
            if (pageSize !== '' && typeof pageSize !== 'undefined') {
                if (pageSize !== '' && typeof pageSize !== 'undefined') {
                    limit = pageSize;
                    query.limit = limit;
                }

                if (pageIndex !== '' && typeof pageIndex !== 'undefined') {
                    offset = pageIndex * limit - limit;
                    query.offset = offset;
                }
            }
            const data = await History.findAndCountAll(query)
            if (pageSize || pageIndex) {
                data.page = pageIndex
                data.totalPages = Math.ceil(data.count / pageSize)
            }
            res.status(200).json(data)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = HistoryController