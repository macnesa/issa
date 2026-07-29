const request = require("supertest");
const app = require("../app");
const { Teacher, Class } = require("../models");

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
    let registeredTeacher;

    Teacher.create(userTest1)
        .then((registeredUser) => {
            registeredTeacher = registeredUser;
            return Teacher.create(userTest2);
        })
        .then(() => Class.create({
            name: "1A",
            TeacherId: registeredTeacher.id,
            SPP: 200000,
        }))
        .then(() => {
            done();
        })
        .catch((err) => {
            console.log(err);
            done(err);
        });
});


afterAll(done => {
    Class.destroy({ truncate: true, cascade: true, restartIdentity: true })
        .then(() => {
            return Teacher.destroy({ truncate: true, cascade: true, restartIdentity: true });
        })
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

});
