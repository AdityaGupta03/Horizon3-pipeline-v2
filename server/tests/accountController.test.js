import request from "supertest";
import app from "../server";

import * as accountQueries from "../database/queries/accountQueries.js";
import * as verificationQueries from "../database/queries/verificationQueries.js";
import * as emailFuncs from "../helpers/emailFuncs.js";
import * as encryptionFuncs from "../helpers/encryptionFuncs.js";

// Mock the helpers/dependencies
jest.mock("../helpers/encryptionFuncs.js");
jest.mock("../helpers/emailFuncs.js");
jest.mock("../database/queries/verificationQueries.js");
jest.mock("../database/queries/accountQueries.js");

describe("Account Controller", () => {
  describe("POST /api/user/create_account", () => {
    it("should return 400 if missing required information", async () => {
      const response = await request(app)
        .post("/api/user/create_account")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required information.");
    });

    it("should return 409 if account email already exists", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(
        mockUser,
      );

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "test@example.com",
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Email already in use!");
    });

    it("should return 409 if account username already exists", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(
        mockUser,
      );

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "test12@example.com",
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Username already in use!");
    });

    it("should return 409 if account already exists", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser123",
        email: "test@e12312xample.com",
      };

      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(
        mockUser,
      );

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "test12@example.com",
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Account already exists!");
    });

    it("should return 500 for a get acc query error", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "asdf@gmail.com",
        });

      expect(response.status).toBe(500);
    });

    it("should return 500 for a create account query error", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);
      encryptionFuncs.encryptPassword.mockResolvedValue("hashedpassword");
      accountQueries.createAccountQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "asdf@gmail.com",
        });

      expect(response.status).toBe(500);
    });

    it("should return 500 for inserting verification code query error", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);
      encryptionFuncs.encryptPassword.mockResolvedValue("hashedpassword");
      accountQueries.createAccountQuery.mockResolvedValue(mockUser);
      verificationQueries.insertVerificationCodeQuery.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "asdf@gmail.com",
        });

      expect(response.status).toBe(500);
    });

    it("should return 500 for emailing user error", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);
      encryptionFuncs.encryptPassword.mockResolvedValue("hashedpassword");
      accountQueries.createAccountQuery.mockResolvedValue(mockUser);
      verificationQueries.insertVerificationCodeQuery.mockResolvedValue(true);
      emailFuncs.emailUser.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "test@example.com",
        });

      expect(response.status).toBe(500);
    });

    it("should return 500 for rolling back the db error", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);
      encryptionFuncs.encryptPassword.mockResolvedValue("hashedpassword");
      accountQueries.createAccountQuery.mockResolvedValue(mockUser);
      verificationQueries.insertVerificationCodeQuery.mockResolvedValue(true);
      emailFuncs.emailUser.mockResolvedValue(false);
      accountQueries.deleteAccountQuery.mockRejectedValue(
        new Error("Database error"),
      );
      verificationQueries.deleteVerificationCodeQuery.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "test@example.com",
        });

      expect(response.status).toBe(500);
    });

    it("should return 200 on successful creation", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);
      encryptionFuncs.encryptPassword.mockResolvedValue("hashedpassword");
      accountQueries.createAccountQuery.mockResolvedValue(mockUser);
      verificationQueries.insertVerificationCodeQuery.mockResolvedValue(true);
      emailFuncs.emailUser.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/create_account")
        .send({
          username: "testuser",
          password: "password",
          email: "test@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Account created successfully");
      expect(response.body.user).toEqual(mockUser);
    });
  });

  describe("Verify Account Email", () => {
    it("should return 400 if missing required information", async () => {
      const response = await request(app)
        .post("/api/user/verify_email")
        .send({ verification_code: "1234" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required information.");
    });

    it("should return 404 if account is not found", async () => {
      verificationQueries.getVerificationCodeQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/verify_email")
        .send({ verification_code: "1234", email: "-1" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return 401 if code is not correct", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
      });
      verificationQueries.getVerificationCodeQuery.mockResolvedValue({
        code: "1234",
      });

      const response = await request(app)
        .post("/api/user/verify_email")
        .send({ verification_code: "4321", email: "1" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid verification code");
    });

    it("should return 500 for get acc query error", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/user/verify_email")
        .send({ verification_code: "1234", email: "1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error verifying account");
    });

    it("should return 500 for verify user acc query error", async () => {
      accountQueries.verifyUserAccountQuery.mockRejectedValue(false);
      verificationQueries.deleteVerificationCodeQuery.mockResolvedValue(true);
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
      });
      verificationQueries.getVerificationCodeQuery.mockResolvedValue({
        code: "1234",
      });

      const response = await request(app)
        .post("/api/user/verify_email")
        .send({ verification_code: "1234", email: "1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error verifying account");
    });

    it("should return 500 for delete verify query error", async () => {
      accountQueries.verifyUserAccountQuery.mockRejectedValue(false);
      verificationQueries.deleteVerificationCodeQuery.mockRejectedValue(false);
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
      });
      verificationQueries.getVerificationCodeQuery.mockResolvedValue({
        code: "1234",
      });

      const response = await request(app)
        .post("/api/user/verify_email")
        .send({ verification_code: "1234", email: "1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error verifying account");
    });

    it("should return 200 if verification successful", async () => {
      accountQueries.verifyUserAccountQuery.mockResolvedValue(true);
      verificationQueries.deleteVerificationCodeQuery.mockResolvedValue(true);
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
      });
      verificationQueries.getVerificationCodeQuery.mockResolvedValue({
        code: "1234",
      });

      const response = await request(app)
        .post("/api/user/verify_email")
        .send({ verification_code: "1234", email: "1" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Account verified successfully");
    });
  });

  describe("Login to Account", () => {
    it("should return 400 if missing required information", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({ username: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required information.");
    });

    it("should return 404 if account does not exist", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/login")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Account not found");
    });

    it("should return 401 if password does not match", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
      });
      encryptionFuncs.comparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/user/login")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid password");
    });

    it("should return 403 if account is not verified", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
        verified: 0,
      });
      encryptionFuncs.comparePassword.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/login")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Account not verified");
      expect(response.body.message).toBe(
        "Please verify your email address to log in",
      );
    });

    it("should return 500 if get acc query error", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/user/login")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error logging in");
    });

    it("should return 500 if compare password helper error", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
        verified: 1,
      });
      encryptionFuncs.comparePassword.mockRejectedValue(false);

      const response = await request(app)
        .post("/api/user/login")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error logging in");
    });

    it("should return 200 if login is successful", async () => {
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 1,
        verified: 1,
      });
      encryptionFuncs.comparePassword.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/user/login")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(200);
      expect(response.body.user_id).toBe(1);
      expect(response.body.message).toBe("Login successful");
    });
  });

  describe("Change Username", () => {
    it("should return 400 if missing required information", async () => {
      const response = await request(app)
        .post("/api/user/change_username")
        .send({ username: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required information.");
    });

    it("should return 404 if user account does not exist", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/change_username")
        .send({ user_id: 1, new_username: "newusername" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User account not found");
    });

    it("should return 409 if the username already exists", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue({
        user_id: 2,
      });

      const response = await request(app)
        .post("/api/user/change_username")
        .send({ user_id: 1, new_username: "newusername" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Username already exists");
    });

    it("should return 500 if get acc from user_id fails", async () => {
      accountQueries.getAccountFromUserIDQuery.mockRejectedValue(null);

      const response = await request(app)
        .post("/api/user/change_username")
        .send({ user_id: 1, new_username: "newusername" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error changing username");
    });

    it("should return 500 if get acc from username fails", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      accountQueries.getAccountFromUsernameOrEmailQuery.mockRejectedValue(null);

      const response = await request(app)
        .post("/api/user/change_username")
        .send({ user_id: 1, new_username: "newusername" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error changing username");
    });

    it("should return 500 if update username query returns null", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);
      accountQueries.updateUsernameQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/change_username")
        .send({ user_id: 1, new_username: "newusername" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error changing username");
    });

    it("should return 200 if change username is successful", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      accountQueries.getAccountFromUsernameOrEmailQuery.mockResolvedValue(null);
      accountQueries.updateUsernameQuery.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/change_username")
        .send({ user_id: 1, new_username: "newusername" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Updated username successfully");
    });
  });

  describe("Change Password", () => {
    it("should return 400 if missing required information", async () => {
      const response = await request(app)
        .post("/api/user/change_password")
        .send({ username: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required information.");
    });

    it("should return 404 if user account does not exist", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/change_password")
        .send({ user_id: 1, old_password: "pass", new_password: "pass1" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User account not found");
    });

    it("should return 400 if the passwords to not match", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      encryptionFuncs.comparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/user/change_password")
        .send({ user_id: 1, old_password: "pass", new_password: "pass1" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Old password does not match");
    });

    it("should return 500 if update password query returns null", async () => {
      accountQueries.getAccountFromUserIDQuery.mockRejectedValue(null);
      encryptionFuncs.comparePassword.mockResolvedValue(true);
      encryptionFuncs.encryptPassword.mockResolvedValue("pass1");
      accountQueries.updatePasswordQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/change_password")
        .send({ user_id: 1, old_password: "pass", new_password: "pass1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error changing password");
    });

    it("should return 500 if get acc from user_id fails", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue(
        new Error("DB error"),
      );

      const response = await request(app)
        .post("/api/user/change_password")
        .send({ user_id: 1, old_password: "pass", new_password: "pass1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error changing password");
    });

    it("should return 500 if compare passwords fails", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      encryptionFuncs.comparePassword.mockRejectedValue(
        new Error("bcrypt err"),
      );

      const response = await request(app)
        .post("/api/user/change_password")
        .send({ user_id: 1, old_password: "pass", new_password: "pass1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error changing password");
    });

    it("should return 500 if update password query fails", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      encryptionFuncs.comparePassword.mockResolvedValue(true);
      encryptionFuncs.encryptPassword.mockResolvedValue("password");
      accountQueries.updatePasswordQuery.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/user/change_password")
        .send({ user_id: 1, old_password: "pass", new_password: "pass1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error changing password");
    });

    it("should return 200 if change password is successful", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({
        user_id: 1,
      });
      encryptionFuncs.comparePassword.mockResolvedValue(true);
      encryptionFuncs.encryptPassword.mockResolvedValue("password");
      accountQueries.updatePasswordQuery.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/change_password")
        .send({ user_id: 1, old_password: "pass", new_password: "pass1" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Updated password successfully");
    });
  });

  describe("Delete Account", () => {
    it("should return 400 if missing required information", async () => {
      const response = await request(app)
        .post("/api/user/delete_account")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required information.");
    });

    it("should return 404 if user account does not exist", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/delete_account")
        .send({ user_id: 1 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User account not found");
    });

    it("should return 500 if get acc query fails", async () => {
      accountQueries.getAccountFromUserIDQuery.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/user/delete_account")
        .send({ user_id: 1 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error deleting account");
    });

    it("should return 500 if delete acc query fails", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({});
      accountQueries.deleteAccountQuery.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/user/delete_account")
        .send({ user_id: 1 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error deleting account");
    });

    it("should return 500 if delete acc query returns null", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({});
      accountQueries.deleteAccountQuery.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/delete_account")
        .send({ user_id: 1 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error deleting account");
    });

    it("should return 200 if delete account is successful", async () => {
      accountQueries.getAccountFromUserIDQuery.mockResolvedValue({});
      accountQueries.deleteAccountQuery.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/delete_account")
        .send({ user_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Deleted account successfully");
    });
  });
});
