const request = require("supertest");
const app = require("../app");
const { Teacher, Lesson, Student, Class, sequelize, Score } = require("../models");
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

const userTest3 = {
    "NIP": "1800011225",
    "name": "sambo",
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
                        "id": 1,
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
                        "id": 2,
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
                        "id": 3,
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
        .then((_) => {
            return queryInterface.bulkInsert('Assignments',
                [
                    {
                        "name": "UTS",
                        "type": "Exam",
                        "desc": "ujian tengah semester Mathematic",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "name": "Mathematic FPB & KPK",
                        "type": "Task",
                        "desc": "menyelesaikan soal FPB dan KPK",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "name": "UAS",
                        "type": "Exam",
                        "desc": "ujian akhir semester Science",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "name": "Science rantai makanan",
                        "type": "Task",
                        "desc": "menyelesaikan siklus rantai makanan",
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    }
                ],
                {}
            );
        })
        .then((_) => {
            return queryInterface.bulkInsert('Scores',
                [
                    {
                        "id": 10,
                        "StudentId": 1,
                        "LessonId": 2,
                        "AssignmentId": 1,
                        "value": 100,
                        "category": "A+",
                        "desc": "excelent",
                        "status": true,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    },
                    {
                        "id": 11,
                        "StudentId": 2,
                        "AssignmentId": 2,
                        "LessonId": 2,
                        "value": 100,
                        "category": "A+",
                        "desc": "excelent",
                        "status": true,
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
            return Lesson.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            return Student.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            return Score.destroy({ truncate: true, cascade: true, restartIdentity: true })
        })
        .then(_ => {
            done();
        })
        .catch(err => {
            done(err);
        });
});


describe("post /scores", () => {
    let bodyData = {
        "StudentId": 1,
        "LessonId": 2,
        "AssignmentId": 1,
        "value": 80,
        "category": "A+",
        "desc": "excelent",
        "status": true
    }
    test("201 add", (done) => {
        request(app)
            .post("/scores")
            .send(bodyData)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(201);
                expect(body).toHaveProperty("data.AssignmentId", expect.any(Number));
                expect(body).toHaveProperty("data.LessonId", expect.any(Number));
                expect(body).toHaveProperty("data.StudentId", expect.any(Number));
                expect(body).toHaveProperty("data.desc", expect.any(String));
                expect(body).toHaveProperty("data.status", expect.any(Boolean));
                expect(body).toHaveProperty("data.value", expect.any(Number));
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
    let salah = {
        "StudentId": 100,
        "LessonId": 2,
        "AssignmentId": 1,
        "value": 80,
        "category": "A+",
        "desc": "excelent",
        "status": true
    }
    test("404 add", (done) => {
        request(app)
            .post("/scores")
            .send(salah)
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
    test("404 add", (done) => {
        let salah = {
            "StudentId": 1,
            "LessonId": 200,
            "AssignmentId": 1,
            "value": 80,
            "desc": "excelent",
            "status": true
        }
        request(app)
            .post("/scores")
            .send(salah)
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

    test("200 edit", (done) => {
        let body = {
            "StudentId": 1,
            "LessonId": 2,
            "value": 80,
        }
        request(app)
            .put("/scores")
            .send(body)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("msg", `successfuly updated`);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
    test("404 edit", (done) => {
        let body = {
            "StudentId": 100,
            "LessonId": 2,
            "value": 80,
        }
        request(app)
            .put("/scores")
            .send(body)
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