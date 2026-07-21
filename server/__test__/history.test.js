const request = require("supertest");
const app = require("../app");
const { Teacher, Student, Class, sequelize, History } = require("../models");
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
            return queryInterface.bulkInsert('Histories',
                [

                    {
                        "description": "student with name Beni Habibie has been created",
                        "createdBy": 'Julianto',
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "description": "student with name Beni Habibie has been created",
                        "createdBy": 'Julianto',
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },

                    {
                        "description": "student with name Beni Habibie has been created",
                        "createdBy": 'Julianto',
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "description": "student with name Beni Habibie has been created",
                        "createdBy": 'sambo',
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },

                    {
                        "description": "student with name Beni Habibie has been created",
                        "createdBy": 'sambo',
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "description": "student with name Beni Habibie has been created",
                        "createdBy": 'sambo',
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
            return Class.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            return History.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            done();
        })
        .catch(err => {
            done(err);
        });
});

describe("GET /history", () => {

    test("200 success get history filtered by created by", (done) => {
        request(app)
            .get("/histories?pageIndex=1&createdBy=sambo")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(Array.isArray(body.rows)).toBeTruthy();
                expect(body.rows.length).toBeGreaterThan(0);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
    test("200 success get history", (done) => {
        request(app)
            .get("/histories")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(Array.isArray(body.rows)).toBeTruthy();
                expect(body.rows.length).toBeGreaterThan(0);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
    test("500 failed get history", (done) => {
        jest.spyOn(History, "findAndCountAll").mockRejectedValue("Error")
        request(app)
            .get("/histories")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(500);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

});