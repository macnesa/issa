const { Class, History, Teacher } = require("../models");

class Controller {
    static async fetchAllClass(req, res, next) {
        try {
            const data = await Class.findAll();

            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }
    static async fetchClassById(req, res, next) {
        const { classId } = req.params;
        try {
            const data = await Class.findOne({ where: { id: classId } });
            if (!data) throw { name: `notFound` };
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }
    static async addClass(req, res, next) {
        try {
            const teacherClass = await Class.findOne({ where: { TeacherId: req.user.idTeacher }, include: Teacher });

            const { name, TeacherId, SPP } = req.body;
            const data = await Class.create({ name, TeacherId, SPP });
            const history = await History.create({ description: `Class ${data.name} has been created`, createdBy: teacherClass.Teacher.name });

            res.status(201).json({ data, history });
        } catch (error) {
            next(error);
        }
    }
    static async deleteClass(req, res, next) {
        try {
            const teacherClass = await Class.findOne({ where: { TeacherId: req.user.idTeacher }, include: Teacher });

            const id = req.params.id;
            const check = await Class.findByPk(id);
            if (!check) throw { name: `notFound` };
            const data = await Class.destroy({ where: { id } });

            const history = await History.create({ description: `Class ${check.name} has been deleted`, createdBy: teacherClass.Teacher.name });

            res.status(200).json({ message: "Success delete", history });
        } catch (error) {
            next(error);
        }
    }
    static async editClass(req, res, next) {
        try {
            const teacherClass = await Class.findOne({ where: { TeacherId: req.user.idTeacher }, include: Teacher });

            const { name, TeacherId, SPP } = req.body;
            const id = req.params.id;
            const check = await Class.findByPk(id);
            if (!check) throw { name: `notFound` };

            const data = await Class.update({ name, TeacherId, SPP }, { where: { id } });

            const history = await History.create({ description: `Class ${check.name} has been edited`, createdBy: teacherClass.Teacher.name });

            res.status(200).json({ data, history });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = Controller;