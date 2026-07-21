const request = require("supertest");
const app = require("../app");
const { Teacher, Lesson, Class, sequelize } = require("../models");
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
            return queryInterface.bulkInsert('Lessons',
                [
                    {
                        "id": 10,
                        "name": "Mathematic",
                        "imgUrl": "https://img.freepik.com/premium-vector/cartoon-math-chalkboard-background_23-2148154590.jpg?w=2000",
                        "KKM": 70,
                        "desc": "Mathematic is easy",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "id": 2,
                        "name": "Indonesian",
                        "imgUrl": "https://www.shutterstock.com/image-vector/online-indonesian-language-courses-flat-260nw-1825252160.jpg",
                        "KKM": 70,
                        "desc": "Indonesian is easy",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "id": 3,
                        "name": "English",
                        "imgUrl": "https://britishcentre.az/image/faydali-ve-maraqli/en/1580493379-tess-british-centre.jpg",
                        "KKM": 70,
                        "desc": "English is easy",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "id": 4,
                        "name": "Science",
                        "imgUrl": "https://img.freepik.com/free-vector/hand-drawn-science-education-background_23-2148499325.jpg",
                        "KKM": 70,
                        "desc": "Science is easy",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "id": 5,
                        "name": "Social Science",
                        "imgUrl": "https://leverageedublog.s3.ap-south-1.amazonaws.com/blog/wp-content/uploads/2020/08/06185124/Branches-of-Social-Sciences-1.png",
                        "KKM": 70,
                        "desc": "Social Science is easy",
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
            return Lesson.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            done();
        })
        .catch(err => {
            done(err);
        });
});

describe("GET /lessons", () => {
    test("200 success get lessons", (done) => {
        request(app)
            .get("/lessons")
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

    test("200 success get lessons by id", (done) => {
        request(app)
            .get("/lessons/3")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("id", expect.any(Number));
                expect(body).toHaveProperty("KKM", expect.any(Number));
                expect(body).toHaveProperty("desc", expect.any(String));
                expect(body).toHaveProperty("imgUrl", expect.any(String));
                expect(body).toHaveProperty("name", expect.any(String));
                done();
            })
            .catch((err) => {
                console.log(err);
                done(err);
            });
    });
});

describe("POST /lessons", () => {
    let bodyData = {
        "id": 7,
        "name": "Social ",
        "imgUrl": "https://leverageedublog.s3.ap-south-1.amazonaws.com/blog/wp-content/uploads/2020/08/06185124/Branches-of-Social-Sciences-1.png",
        "KKM": 70,
        "desc": "Social  is easy",
        "createdAt": new Date(),
        "updatedAt": new Date()
    }

    test("201 success POST lessons", (done) => {
        request(app)
            .post(`/lessons`)
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
    test("401 failed POST classes", (done) => {
        request(app)
            .post(`/lessons`)
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

    test("401 failed POST classes", (done) => {
        request(app)
            .post(`/lessons`)
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
    test("400 failed POST classes", (done) => {
        request(app)
            .post(`/lessons`)
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

describe("Delete /classes", () => {

    test("200 success delete classes", (done) => {
        request(app)
            .delete(`/lessons/2`)
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

describe("update /classes", () => {
    let bodyData = {
        "name": "Social ",
        "imgUrl": "https://leverageedublog.s3.ap-south-1.amazonaws.com/blog/wp-content/uploads/2020/08/06185124/Branches-of-Social-Sciences-1.png",
        "KKM": 70,
        "desc": "Social  is easy",
        "createdAt": new Date(),
        "updatedAt": new Date()
    }
    test("200 success update classes", (done) => {
        request(app)
            .put(`/lessons/5`)
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