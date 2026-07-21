const request = require("supertest");
const app = require("../app");
const { User, Lesson, Schedule, sequelize, Teacher, Student, Activity } = require("../models");
const { createToken } = require("../helpers/index");
const { queryInterface } = sequelize;

let validToken, validToken2, invalidToken;
const userTest1 = {
    "NIM": "0203202301",
    "password": "qwerty"
}


const userTest2 = {
    "NIM": "0203202301",
    "password": "qwerty"
}

beforeAll((done) => {
    User.create(userTest1)
        .then((registeredUser) => {
            validToken = createToken(
                registeredUser.NIM
            );
            invalidToken =
                "123456789eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
            return User.create(userTest2);
        })
        .then((registeredUser2) => {
            validToken2 = createToken(
                registeredUser2.NIM
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
            return queryInterface.bulkInsert('Teachers',
                [
                    {
                        id: 1,
                        "NIP": "1800011221",
                        "name": "Julianto",
                        "password": "qwerty",
                        "imgUrl": "https://smpn2kelapadua.sch.id/media_library/employees/43099a3a74f681f1c08fa268c258f94f.JPG",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        id: 2,
                        "NIP": "1800011222",
                        "name": "Sumiyati",
                        "password": "12345",
                        "imgUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9QlB991ONcK5xybf6AGCg-JDna5VUqibyfRgngW9-PDh4vnRTGItX_0XdE1YbExBIgFc&usqp=CAU",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    }
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
            jest.restoreAllMocks();
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
            return User.destroy({ truncate: true, cascade: true, restartIdentity: true })
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

describe("GET /schedule", () => {


    test("200 success get lesson", (done) => {
        request(app)
            .get("/public/lesson?day=senin")
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


    test("200 success get schedule", (done) => {
        request(app)
            .get("/public/schedule")
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

    test("401 failed get schedules unauthenticate", (done) => {
        request(app)
            .get("/public/schedule")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get schedules unauthenticate", (done) => {
        request(app)
            .get("/public/schedule")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("500 failed get schedules internal error", (done) => {
        jest.spyOn(Schedule, "findAll").mockRejectedValue("Error")
        request(app)
            .get("/public/schedule")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(500);
                expect(body).toHaveProperty("msg", "Internal Server Error");
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

});



describe("GET /transaction", () => {

    test("200 success get transaction", (done) => {
        request(app)
            .get("/public/transaction")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get transactions unauthenticate", (done) => {
        request(app)
            .get("/public/transaction")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get transactions unauthenticate", (done) => {
        request(app)
            .get("/public/transaction")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
});

describe("GET /lesson", () => {


    test("401 failed get lesson unauthenticate", (done) => {
        request(app)
            .get("/public/lesson?day=senin")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get lesson unauthenticate", (done) => {
        request(app)
            .get("/public/lesson?day=senin")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("500 failed get lesson internal error", (done) => {
        jest.spyOn(Schedule, "findAll").mockRejectedValue("Error")
        request(app)
            .get("/public/lesson?day=senin")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(500);
                expect(body).toHaveProperty("msg", "Internal Server Error");
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });


    test("400 failed get lesson ", (done) => {
        request(app)
            .get("/public/lesson")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(404);
                expect(body).toHaveProperty("msg", "Data Not Found");
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
});

describe("GET /student detail", () => {


    test("401 failed get student unauthenticate", (done) => {
        request(app)
            .get("/public/detail")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get student unauthenticate", (done) => {
        request(app)
            .get("/public/detail")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
    test("200 success get student detail", (done) => {
        request(app)
            .get("/public/detail")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("Class.SPP", expect.any(Number));
                expect(body).toHaveProperty("Class.Teacher.NIP", expect.any(String));
                expect(body).toHaveProperty("Class.Teacher.id", expect.any(Number));
                expect(body).toHaveProperty("Class.Teacher.name", expect.any(String));
                expect(body).toHaveProperty("ClassId", expect.any(Number));
                expect(body).toHaveProperty("NIM", expect.any(String));
                expect(body).toHaveProperty("age", expect.any(Number));
                expect(body).toHaveProperty("birthDate", expect.any(String));
                expect(body).toHaveProperty("feedback", expect.any(String));
                expect(body).toHaveProperty("gender", expect.any(String));
                expect(body).toHaveProperty("id", expect.any(Number));
                expect(body).toHaveProperty("imgUrl", expect.any(String));
                expect(body).toHaveProperty("name", expect.any(String));
                done();
            })
            .catch((err) => {
                done(err);
            });
    });



});
describe("GET /activity", () => {

    test("401 failed get activitys unauthenticate", (done) => {
        request(app)
            .get("/public/activity")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("200 success get activity", (done) => {
        request(app)
            .get("/public/activity")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(Array.isArray(body)).toBeTruthy();
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get activitys unauthenticate", (done) => {
        request(app)
            .get("/public/activity")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("500 failed get activitys internal error", (done) => {
        jest.spyOn(Activity, "findAll").mockRejectedValue("Error")
        request(app)
            .get("/public/activity")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(500);
                expect(body).toHaveProperty("msg", "Internal Server Error");
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

});

describe("GET /statistic", () => {

    test("401 failed get statistics unauthenticate", (done) => {
        request(app)
            .get("/public/statistic")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get statistics unauthenticate", (done) => {
        request(app)
            .get("/public/statistic")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("200 success get statistic", (done) => {
        request(app)
            .get("/public/statistic")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(Array.isArray(body)).toBeTruthy();
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
});






describe("GET /classmate", () => {

    test("200 success get classmate", (done) => {
        request(app)
            .get("/public/classmate")
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

    test("401 failed get schedules unauthenticate", (done) => {
        request(app)
            .get("/public/classmate")
            .set("access_token", invalidToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("401 failed get schedules unauthenticate", (done) => {
        request(app)
            .get("/public/classmate")
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(401);
                expect(body).toHaveProperty("msg", "Invalid Token")
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("500 failed get schedules internal error", (done) => {
        jest.spyOn(Student, "findAll").mockRejectedValue("Error")
        request(app)
            .get("/public/classmate")
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(500);
                expect(body).toHaveProperty("msg", "Internal Server Error");
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

});


