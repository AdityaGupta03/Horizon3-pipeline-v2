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
    it("should create a new account successfully", async () => {
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

    it("should return 400 if missing required information", async () => {
      const response = await request(app)
        .post("/api/user/create_account")
        .send({ username: "testuser", password: "password" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required information.");
    });

    it("should return 409 if account already exists", async () => {
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

  describe("Verify Account Email", () => {});
  describe("Login to Account", () => {});
  describe("Change Username", () => {});
  describe("Change Password", () => {});
  describe("Delete Account", () => {});
});
