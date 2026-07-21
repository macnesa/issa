// const request = require("supertest");
// const app = require("../app");
// const { Teacher, Student, Class, sequelize } = require("../models");
// const { createToken } = require("../helpers/index");
// const { queryInterface } = sequelize;

// let validToken, validToken2, invalidToken;
// const userTest1 = {
//     "NIP": "1800011221",
//     "name": "Julianto",
//     "password": "qwerty",
//     "imgUrl": "https://smpn2kelapadua.sch.id/media_library/employees/43099a3a74f681f1c08fa268c258f94f.JPG"
// }


// const userTest2 = {
//     "NIP": "1800011222",
//     "name": "Sumiyati",
//     "password": "12345",
//     "imgUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9QlB991ONcK5xybf6AGCg-JDna5VUqibyfRgngW9-PDh4vnRTGItX_0XdE1YbExBIgFc&usqp=CAU"
// }

// beforeAll((done) => {
//     Teacher.create(userTest1)
//         .then((registeredUser) => {
//             validToken = createToken(
//                 registeredUser.NIP
//             );
//             invalidToken =
//                 "123456789eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
//             return Teacher.create(userTest2);
//         })
//         .then((registeredUser2) => {
//             validToken2 = createToken(
//                 registeredUser2.NIP
//             );
//             return queryInterface.bulkInsert('Users',
//                 [
//                     {
//                         "NIM": "0203202301",
//                         "password": "qwerty",
//                         "createdAt": new Date(),
//                         "updatedAt": new Date()
//                     },
//                     {
//                         "NIM": "0203202305",
//                         "password": "qwerty",
//                         "createdAt": new Date(),
//                         "updatedAt": new Date()
//                     },
//                     {
//                         "NIM": "02032023010",
//                         "password": "qwerty",
//                         "createdAt": new Date(),
//                         "updatedAt": new Date()
//                     },
//                 ],
//                 {}
//             );
//         })
//         .then(() => {
//             done();
//         })
//         .catch((err) => {
//             console.log(err);
//             done(err);
//         });
// });

// afterAll(done => {
//     Teacher.destroy({ truncate: true, cascade: true, restartIdentity: true })
//         .then(_ => {
//             return Student.destroy({ truncate: true, cascade: true, restartIdentity: true })
//         })
//         .then(_ => {
//             done();
//         })
//         .catch(err => {
//             done(err);
//         });
// });

// describe("post /users", () => {
//     let bodyData = {
//         "NIM": "0203202301",
//         "password": "qwerty",
//     }
//     test("200 login", (done) => {
//         request(app)
//             .post("/users/login")
//             .send(bodyData)
//             .then((response) => {
//                 const { body, status } = response;

//                 expect(status).toBe(200);
//                 expect(body).toHaveProperty("access_token", expect.any(String));
//                 done();
//             })
//             .catch((err) => {
//                 done(err);
//                 console.log(err);
//             });
//     });
// });