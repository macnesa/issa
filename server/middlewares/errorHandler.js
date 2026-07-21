function errorHandler(err, req, res, next) {
    let statusCode = 500,
        msg = "Internal Server Error"
    switch (err.name) {
        case "SequelizeValidationError":
        case "SequelizeUniqueConstraintError":
            statusCode = 400;
            msg = err.errors[0].message
            break;

        case "loginError":
            statusCode = 400;
            msg = "Invalid Username or Password";
            break;

        case "loginFormEmpty":
            statusCode = 400;
            msg = "Username or Password is Required";
            break;

        case "notFound":
            statusCode = 404;
            msg = "Data Not Found";
            break;

        case "alreadypayment":
            statusCode = 400;
            msg = "the school fee is already pay"
            break;

        case "unAuthentication":
        case "JsonWebTokenError":
            statusCode = 401;
            msg = "Invalid Token";
            break;

        case "unauthorized":
            statusCode = 403;
            msg = "Unauthorized";
            break;

        case "lesson error":
            statusCode = 400;
            msg = "lesson name is required";
            break;
        case "absentError":
            statusCode = 400;
            msg = "student attendance is already assigned";
            break;
        case "invalidAttendanceStatus":
            statusCode = 400;
            msg = "Invalid attendance status";
            break;
        case "attendanceAlreadyExists":
            statusCode = 409;
            msg = "Attendance already exists for today";
            break;
        case "invalidScoreValue":
            statusCode = 400;
            msg = "Score value must be an integer from 0 to 100";
            break;
        case "duplicateScore":
            statusCode = 409;
            msg = "Score already exists for this student, lesson, and assignment";
            break;
        case "invalidScheduleInput":
            statusCode = 400;
            msg = "Invalid schedule day or lesson";
            break;
        case "duplicateSchedule":
            statusCode = 409;
            msg = "Schedule already exists for this class, lesson, and day";
            break;
    }
    console.log(err);
    return res.status(statusCode).json({ msg });
};

module.exports = { errorHandler }
