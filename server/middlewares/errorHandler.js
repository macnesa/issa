function errorHandler(err, req, res, next) {
    let statusCode = 500,
        msg = "Internal Server Error"
    const errorName = String(err.code || '').startsWith('LIMIT_')
        ? err.code
        : err.name;
    switch (errorName) {
        case "SequelizeValidationError":
            statusCode = 400;
            msg = err.errors[0].message
            break;

        case "SequelizeUniqueConstraintError":
            if (['attendances_student_attendance_date_unique', 'scores_student_lesson_assignment_unique'].includes(err.parent?.constraint)) {
                statusCode = 409;
                msg = err.parent.constraint === 'attendances_student_attendance_date_unique'
                    ? 'Attendance already exists for the selected date'
                    : 'Score already exists for this student, lesson, and assignment';
            } else {
                statusCode = 400;
                msg = err.errors[0].message;
            }
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
        case "invalidAttendanceDate":
            statusCode = 400;
            msg = "attendanceDate must be a valid YYYY-MM-DD date";
            break;
        case "attendanceAlreadyExists":
            statusCode = 409;
            msg = "Attendance already exists for the selected date";
            break;
        case "invalidScoreValue":
            statusCode = 400;
            msg = "Score value must be an integer from 0 to 100";
            break;
        case "invalidRecordedAt":
            statusCode = 400;
            msg = "recordedAt must be a valid ISO-8601 date";
            break;
        case "invalidLessonKkm":
            statusCode = 400;
            msg = "Lesson KKM must be a valid number";
            break;
        case "invalidFeedback":
            statusCode = 400;
            msg = "Feedback must not be empty";
            break;
        case "invalidObservedAt":
            statusCode = 400;
            msg = "observedAt must be a valid ISO-8601 date";
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
        case "invalidEvidenceTitle":
            statusCode = 400;
            msg = "Evidence title is required and must not exceed 120 characters";
            break;
        case "invalidEvidenceDescription":
            statusCode = 400;
            msg = "Evidence description must not exceed 500 characters";
            break;
        case "invalidEvidenceCategory":
            statusCode = 400;
            msg = "Invalid evidence category";
            break;
        case "invalidEvidenceObservedAt":
            statusCode = 400;
            msg = "observedAt must be a valid ISO-8601 date";
            break;
        case "evidenceFileRequired":
            statusCode = 400;
            msg = "Evidence image file is required";
            break;
        case "invalidEvidenceFileType":
        case "LIMIT_UNEXPECTED_FILE":
        case "LIMIT_FILE_COUNT":
            statusCode = 400;
            msg = "Evidence file must be one JPEG, PNG, or WEBP image";
            break;
        case "invalidEvidenceFileSize":
        case "LIMIT_FILE_SIZE":
            statusCode = 413;
            msg = "Evidence file must not exceed 5 MB";
            break;
        case "cloudinaryConfigurationError":
            statusCode = 503;
            msg = "Evidence storage is not configured";
            break;
        case "evidenceUploadFailed":
            statusCode = 502;
            msg = "Evidence image upload failed";
            break;
        case "invalidEvidenceUploadResult":
            statusCode = 502;
            msg = "Evidence storage returned an invalid image";
            break;
        case "invalidJournalType":
            statusCode = 400;
            msg = "Invalid journal entry type";
            break;
        case "invalidJournalContent":
            statusCode = 400;
            msg = "Journal content must contain 3 to 1500 characters";
            break;
        case "invalidJournalObservedAt":
            statusCode = 400;
            msg = "observedAt must be a valid date no more than 24 hours in the future";
            break;
        case "invalidJournalVoiceCaptureType":
            statusCode = 400;
            msg = "Invalid voice capture type for this journal entry";
            break;
        case "invalidJournalEvidenceId":
            statusCode = 400;
            msg = "evidenceId must be a positive integer";
            break;
    }
    console.log(err);
    return res.status(statusCode).json({ msg });
};

module.exports = { errorHandler }
