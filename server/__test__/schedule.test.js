const request = require("supertest");
const app = require("../app");
const { Teacher, Lesson, Schedule, sequelize, Activity } = require("../models");
const { createToken } = require("../helpers/index");
const { queryInterface } = sequelize;

let validToken, validToken2, invalidToken;
const userTest1 = {
    "NIP": "1800011221",
    "name": "Julianto",
    "password": "qwerty",
    "imgUrl": "https://smpn2kelapadua.sch.id/media_library/employees/43099a3a74f681f1c08fa268c258f94f.JPG"
}


const userTest2 = {
    "NIP": "1800011222",
    "name": "Sumiyati",
    "password": "12345",
    "imgUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9QlB991ONcK5xybf6AGCg-JDna5VUqibyfRgngW9-PDh4vnRTGItX_0XdE1YbExBIgFc&usqp=CAU"
}

beforeAll((done) => {
    Teacher.create(userTest1)
        .then((registeredUser) => {
            validToken = createToken(
                registeredUser.NIP
            );
            invalidToken =
                "123456789eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
            return Teacher.create(userTest2);
        })
        .then((registeredUser2) => {
            validToken2 = createToken(
                registeredUser2.NIP
            );
            return queryInterface.bulkInsert('Lessons',
                [
                    {
                        id: 1,
                        "name": "Mathematic",
                        "imgUrl": "https://img.freepik.com/premium-vector/cartoon-math-chalkboard-background_23-2148154590.jpg?w=2000",
                        "KKM": 70,
                        "desc": "Mathematic is easy",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        id: 2,
                        "name": "Indonesian",
                        "imgUrl": "https://www.shutterstock.com/image-vector/online-indonesian-language-courses-flat-260nw-1825252160.jpg",
                        "KKM": 70,
                        "desc": "Indonesian is easy",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                ],
                {}
            );
        })
        .then((_) => {
            return queryInterface.bulkInsert('Classes',
                [
                    {
                        id: 1,
                        "name": "1A",
                        "TeacherId": 1,
                        "SPP": 200000,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        id: 2,
                        "name": "2B",
                        "TeacherId": 2,
                        "SPP": 250000,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    }
                ],
                {}
            );
        })
        .then((_) => {
            return queryInterface.bulkInsert('Schedules',
                [
                    {
                        "ClassId": 1,
                        "day": "senin",
                        "LessonId": 1,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "ClassId": 1,
                        "day": "senin",
                        "LessonId": 2,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "ClassId": 1,
                        "day": "rabu",
                        "LessonId": 1,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "ClassId": 1,
                        "day": "selasa",
                        "LessonId": 2,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                ],
                {}
            );
        })
        .then(() => {
            done();
        })
        .catch((err) => {
            console.log(err);
            done(err);
        });
});

afterAll(done => {
    Teacher.destroy({ truncate: true, cascade: true, restartIdentity: true })
        .then(_ => {
            return Schedule.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            return Lesson.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            done();
        })
        .catch(err => {
            done(err);
        });
});

describe("GET /schedules", () => {
    
    test("200 success get schedules", (done) => {
        request(app)
            .get("/schedules")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(Array.isArray(body)).toBeTruthy();
                expect(body.length).toBeGreaterThan(0);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
    
    test("401 failed get schedules", (done) => {
        request(app)
            .get("/schedules")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
});