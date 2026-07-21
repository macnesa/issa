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
            done();
        })
        .catch(err => {
            done(err);
        });
});

describe("post /teachers", () => {
    let bodyData = {
        "NIP": "1800011221",
        "password": "qwerty",
    }
    test("200 login", (done) => {
        request(app)
            .post("/teachers/login")
            .send(bodyData)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(200);
                expect(body).toHaveProperty("access_token", expect.any(String));
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });

    test("201 login", (done) => {
        request(app)
            .post("/teachers/register")
            .send(userTest3)
            .set("access_token", validToken)
            .then((response) => {
                const { body, status } = response;

                expect(status).toBe(201);
                expect(body).toHaveProperty("msg", `succesfuly registered`);
                done();
            })
            .catch((err) => {
                done(err);
                console.log(err);
            });
    });
});