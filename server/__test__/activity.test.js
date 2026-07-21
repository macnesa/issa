const request = require("supertest");
const app = require("../app");
const { Teacher, Lesson, Class, sequelize, Activity } = require("../models");
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
            return queryInterface.bulkInsert('Classes',
                [

                    {
                        "id": 5,
                        "name": "1A",
                        "TeacherId": 1,
                        "SPP": 200000,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "id": 10,
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
            return queryInterface.bulkInsert('Activities',
                [
                    {
                        "name": "Flag Ceremony",
                        "date": "2023-06-22",
                        "desc": null,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "name": "Math Test",
                        "date": "2023-01-18",
                        "desc": null,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "name": "English Test",
                        "date": "2023-03-25",
                        "desc": null,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    }
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
            return Activity.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            done();
        })
        .catch(err => {
            done(err);
        });
});

describe("GET /activities", () => {
    test("200 success get activities", (done) => {
        request(app)
            .get("/activities")
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

    test("200 success get activities by id", (done) => {
        request(app)
            .get("/activities/3")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("id", expect.any(Number));
                expect(body).toHaveProperty("date", expect.any(String));
                expect(body).toHaveProperty("name", expect.any(String));
                done();
            })
            .catch((err) => {
                console.log(err);
                done(err);
            });
    });
});

describe("POST /activities", () => {
    let bodyData = {
        "name": "English Test",
        "date": "2023-03-25",
        "desc": null,
    }

    test("201 success POST activities", (done) => {
        request(app)
            .post(`/activities`)
            .set("access_token", validToken)
            .send(bodyData)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(201);
                expect(body.data).toHaveProperty("name", expect.any(String));
                done();
            })
            .catch((err) => {
                console.log(err, '<><><><><><><><><><><><><><><><><>');
                done(err);
            });
    });
    test("401 failed POST activities", (done) => {
        request(app)
            .post(`/activities`)
            .set("access_token", invalidToken)
            .send(bodyData)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    test("401 failed POST activities", (done) => {
        request(app)
            .post(`/activities`)
            .send(bodyData)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                done();
            })
            .catch((err) => {
                done(err);
            });
    });
    test("400 failed POST activities", (done) => {
        request(app)
            .post(`/activities`)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(400);
                done();
            })
            .catch((err) => {
                done(err);
            });
    });
});

describe("Delete /activities", () => {

    test("200 success delete activities", (done) => {
        request(app)
            .delete(`/activities/2`)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("message", expect.any(String));
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

});

describe("update /activities", () => {
    let bodyData = {
        "name": "English Test",
        "date": "2023-03-25",
        "desc": null,
    }
    test("200 success update activities", (done) => {
        request(app)
            .put(`/activities/1`)
            .send(bodyData)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("history.description", expect.any(String));
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

});