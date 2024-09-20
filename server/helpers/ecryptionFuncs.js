import bcrypt from "bcryptjs";

async function encryptPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export { encryptPassword };
