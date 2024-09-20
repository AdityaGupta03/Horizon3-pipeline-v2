import bcrypt from 'bcryptjs';
async function encryptPassword(password) {
    return bcrypt.genSalt(10, function(err, salt){
        if (err) {
            console.error("Error generating salt:", err);
            return res.status(500).json({ error: "Error generating salt" });
        }
        bcrypt.hash(password, salt, function(err, hash) {
            if(err) {
                console.error("Error hashing password:", err);
                return res.status(500).json({ error: "Error hashing password" });
            }
            //store hash in db
            console.log(hash);
        });
    });
}
async function compare(password, hash) {
    return bcrypt.compare(password, hash, function(err, res) {
        if (err) {
            console.error("Error comparing password:", err);
        }
        
        console.log(res);
    });
}   
// const hash = encryptPassword("password123");
// compare("password123", hash);
encryptPassword("password123");
// console.log(tmp);

