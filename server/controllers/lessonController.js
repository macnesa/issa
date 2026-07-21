const { Lesson, History, Teacher, Class, Schedule } = require('../models')
const Slug = require('slug')

class LessonController {
    static async allLessons(req, res, next) {
        try {
            const data = await Lesson.findAll()
            res.status(200).json(data)
        } catch (error) {
            next(error)
        }
    }
    static async lessonById(req, res, next) {
        try {
            const id = req.params.id
            const data = await Lesson.findByPk(id)
            if (!data) {
                throw { name: "notFound" }
            }
            res.status(200).json(data)
        } catch (error) {
            next(error)
        }
    }
    static async addLesson(req, res, next) {
        try {
            const teacherClass = await Class.findOne({ where: { TeacherId: req.user.idTeacher }, include: Teacher });

            const { name, imgUrl, KKM, desc } = req.body
            if (!name) throw { name: `lesson error` }
            let slug = Slug(name)
            const data = await Lesson.create({ name, imgUrl, KKM, desc, slug })
            const history = await History.create({ description: `lesson ${data.name} has been created`, createdBy: teacherClass.Teacher.name })
            res.status(201).json({ data, history })
        } catch (error) {
            next(error)
        }
    }
    static async deleteLesson(req, res, next) {
        try {
            const teacherClass = await Class.findOne({ where: { TeacherId: req.user.idTeacher }, include: Teacher });

            const id = req.params.id
            const check = await Lesson.findByPk(id)
            if (!check) throw { name: `notFound` }
            const data = await Lesson.destroy({ where: { id } })
            const history = await History.create({ description: `lesson ${check.name} has been deleted`, createdBy: teacherClass.Teacher.name })
            res.status(200).json({ message: "Success delete", history })
        } catch (error) {
            next(error)
        }
    }
    static async editLesson(req, res, next) {
        try {
            const teacherClass = await Class.findOne({ where: { TeacherId: req.user.idTeacher }, include: Teacher });

            const { name } = req.body
            if (!name) throw { name: `lesson error` }
            let slug = Slug(name)
            const id = req.params.id
            const check = await Lesson.findByPk(id)
            if (!check) throw { name: `notFound` }

            const data = await Lesson.update({ name, slug }, { where: { id } })
            const history = await History.create({ description: `lesson ${check.name} has been edited`, createdBy: teacherClass.Teacher.name })

            res.status(200).json({ status: `success`, history })
        } catch (error) {
            next(error)
        }
    }
    static async studentlessondetail(req, res, next) {
        try {
            const { ClassId } = req.params
            const { day } = req.query
            if (!day || !ClassId) throw { name: `notFound` }
            const data = await Schedule.findAll({ include: { model: Lesson }, where: { day, ClassId } })
            if (data.length == 0) throw { name: `notFound` }
            res.status(200).json(data)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = LessonController