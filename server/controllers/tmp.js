import bcrypt from 'bcryptjs';
async function encryptPassword(password) {
    // return bcrypt.genSalt(10, function(err, salt){
    //     if (err) {
    //         console.error("Error generating salt:", err);
    //         return res.status(500).json({ error: "Error generating salt" });
    //     }
    //     bcrypt.hash(password, salt, function(err, hash) {
    //         if(err) {
    //             console.error("Error hashing password:", err);
    //             return res.status(500).json({ error: "Error hashing password" });
    //         }
    //         //store hash in db
    //         // console.log(hash);
    //         return hash;
    //     });
    // });
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}
async function compare(password, hash) {
    return bcrypt.compare(password, hash);
}   
// const hash = encryptPassword("password123");
// compare("password123", hash);

var hash = await encryptPassword("password123");
var cmp = await compare("password123", hash);
console.log(cmp);
// console.log(tmp);

