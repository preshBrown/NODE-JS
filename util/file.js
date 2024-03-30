const fs = require('fs');

const deleteFile = (filePath, cb) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
            // console.log("AN ERROR OCCURERD");
            // return cb(err);
        }
    });
}

exports.deleteFile = deleteFile;