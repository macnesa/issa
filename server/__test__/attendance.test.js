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

describe("post /attendances", () => {
    let bodyData = {
        "StudentId": "2",
        "status": "hadir",
        "date": "2023-03-05"
    }
    test("201 success add attendance", (done) => {
        request(app)
            .post("/attendances")
            .send(bodyData)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(201)
                expect(body).toHaveProperty("id", expect.any(Number));
                expect(body).toHaveProperty("StudentId", expect.any(Number));
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    test("200 edit attendances", (done) => {
        request(app)
            .put("/attendances")
            .send(bodyData)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("id", expect.any(Number));
                expect(body).toHaveProperty("StudentId", expect.any(Number));
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
});