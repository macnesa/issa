const request = require("supertest");
const app = require("../app");
const { Teacher, Student, Class, sequelize } = require("../models");
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
                        "id": 1,
                        "name": "1A",
                        "TeacherId": 1,
                        "SPP": 200000,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "id": 2,
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
            return queryInterface.bulkInsert('Students',
                [
                    {
                        "NIM": "0203202301",
                        "name": "Abdi Azhari",
                        "age": 9,
                        "gender": "Male",
                        "birthDate": "2002-10-03",
                        "feedback": "Sering terlambat dan tidak menyelesaikan pekerjaan rumah, diharapkan untuk berangkat lebih awal dari biasanya",
                        "imgUrl": "http://s.sim.siap-online.com//upload/siswa/203270392571CDD3961D.190204115415.jpg",
                        "ClassId": 1,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "NIM": "0203202302",
                        "name": "Amirah Zahra",
                        "age": 8,
                        "gender": "Female",
                        "birthDate": "2002-07-13",
                        "feedback": "Sering terlambat dan tidak menyelesaikan pekerjaan rumah, diharapkan untuk berangkat lebih awal dari biasanya",
                        "imgUrl": "http://s.sim.siap-online.com//upload/siswa/2032703927C644342614.190204115307.jpg",
                        "ClassId": 1,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "NIM": "0203202303",
                        "name": "Beni Habibie",
                        "age": 9,
                        "gender": "Male",
                        "birthDate": "2002-7-13",
                        "feedback": "Sering terlambat dan tidak menyelesaikan pekerjaan rumah, diharapkan untuk berangkat lebih awal dari biasanya",
                        "imgUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKsd4MuCmtvUgVWfpakuSsassRMc4e7xqLQRB3IZzMWrRUQOvRv8gVVtsQdgMLXmu_pJw&usqp=CAU",
                        "ClassId": 1,
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
            return Student.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            done();
        })
        .catch(err => {
            done(err);
        });
});

describe("GET /students", () => {
    test("200 success get student", (done) => {
        request(app)
            .get("/students")
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

    test("401 get heroes with invalid token", (done) => {
        request(app)
            .get("/students")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token");
                done();
            })
            .catch((err) => {
                console.log(err);
                done(err);
            });
    });

    test("401 get heroes without token", (done) => {
        request(app)
            .get("/students")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });
});

describe("GET /Student/:id", () => {
    test("200 success get student", (done) => {
        request(app)
            .get("/students/1")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("id", expect.any(Number));
                expect(body).toHaveProperty("NIM", expect.any(String));
                expect(body).toHaveProperty("age", expect.any(Number));
                expect(body).toHaveProperty("gender", expect.any(String));
                expect(body).toHaveProperty("birthDate", expect.any(String));
                expect(body).toHaveProperty("feedback", expect.any(String));
                expect(body).toHaveProperty("ClassId", expect.any(Number));
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    test("401 get student with invalid token", (done) => {
        request(app)
            .get("/students/1")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    test("404 get student with no valid id", (done) => {
        request(app)
            .get("/students/100")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(404);
                expect(body).toHaveProperty("msg", "Data Not Found");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    test("401 get student without token", (done) => {
        request(app)
            .get("/students/1")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });
});

describe("POST /student", () => {
    test("201 success POST student", (done) => {
        let bodyData = {
            "NIM": "0203202303",
            "name": "Beni Habibie",
            "age": 9,
            "gender": "Male",
            "birthDate": "2002-7-13",
            "feedback": "Sering terlambat dan tidak menyelesaikan pekerjaan rumah, diharapkan untuk berangkat lebih awal dari biasanya",
            "imgUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKsd4MuCmtvUgVWfpakuSsassRMc4e7xqLQRB3IZzMWrRUQOvRv8gVVtsQdgMLXmu_pJw&usqp=CAU",
            "ClassId": 1,
            "createdAt": new Date(),
            "updatedAt": new Date()
        }
        request(app)
            .post(`/students`)
            .set("access_token", validToken)
            .send(bodyData)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(201);
                expect(body.data).toHaveProperty("id", expect.any(Number));
                expect(body.data).toHaveProperty("NIM", expect.any(String));
                expect(body.data).toHaveProperty("name", expect.any(String));
                expect(body.data).toHaveProperty("imgUrl", expect.any(String));
                expect(body.data).toHaveProperty("age", expect.any(Number));
                expect(body.data).toHaveProperty("gender", expect.any(String));
                expect(body.data).toHaveProperty("birthDate", expect.any(String));
                expect(body.data).toHaveProperty("feedback", expect.any(String));
                expect(body.data).toHaveProperty("ClassId", expect.any(Number));
                done();
            })
            .catch((err) => {
                console.log(err, '<><><><><><><><><><><><><><><><><>');
                done(err);
            });
    });

    test("401 POST student invalid token", (done) => {
        request(app)
            .post(`/students`)
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    test("401 POST student without Token", (done) => {
        request(app)
            .post(`/students`)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token");
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

})

describe("Delete /student", () => {

    test("200 success delete student", (done) => {
        request(app)
            .delete(`/students/2`)
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

    test("404 failed delete student", (done) => {
        request(app)
            .delete(`/students/200`)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(404);
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

});

describe("update /student", () => {
    let bodyData = {
        "NIM": "0203202303",
        "name": "Beni Habibie",
        "age": 9,
        "gender": "female",
        "birthDate": "2002-7-13",
        "feedback": "Sering terlambat dan tidak menyelesaikan pekerjaan rumah, diharapkan untuk berangkat lebih awal dari biasanya",
        "imgUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKsd4MuCmtvUgVWfpakuSsassRMc4e7xqLQRB3IZzMWrRUQOvRv8gVVtsQdgMLXmu_pJw&usqp=CAU",
        "ClassId": 1,
        "createdAt": new Date(),
        "updatedAt": new Date()
    }
    test("200 success update student", (done) => {
        request(app)
            .put(`/students/1`)
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