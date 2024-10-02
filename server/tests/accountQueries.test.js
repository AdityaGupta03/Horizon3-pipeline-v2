import { db_pool } from "../database/db.js";
import * as accountQueries from "../database/queries/accountQueries.js";

// Mock the database pool
jest.mock("../database/db.js", () => ({
  db_pool: {
    query: jest.fn(),
  },
}));

describe("Account Queries", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createAccountQuery", () => {
    it("should create an account successfully", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      db_pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await accountQueries.createAccountQuery(
        "testuser",
        "password",
        "test@example.com",
      );

      expect(result).toEqual(mockUser);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [
        "testuser",
        "password",
        "test@example.com",
      ]);
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(
        accountQueries.createAccountQuery(
          "testuser",
          "password",
          "test@example.com",
        ),
      ).rejects.toThrow("Database error");
    });
  });

  describe("deleteAccountQuery", () => {
    it("should delete an account successfully", async () => {
      db_pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await accountQueries.deleteAccountQuery(1);

      expect(result.rowCount).toBe(1);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(accountQueries.deleteAccountQuery(1)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("getAccountFromUsernameOrEmailQuery", () => {
    it("should retrieve an account successfully", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      db_pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await accountQueries.getAccountFromUsernameOrEmailQuery(
        "testuser",
        "test@example.com",
      );

      expect(result).toEqual(mockUser);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [
        "testuser",
        "test@example.com",
      ]);
    });

    it("should return null if no account is found", async () => {
      db_pool.query.mockResolvedValue({ rows: [] });

      const result = await accountQueries.getAccountFromUsernameOrEmailQuery(
        "testuser",
        "test@example.com",
      );

      expect(result).toBeUndefined();
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(
        accountQueries.getAccountFromUsernameOrEmailQuery(
          "testuser",
          "test@example.com",
        ),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getAccountFromUserIDQuery", () => {
    it("should retrieve an account successfully by user ID", async () => {
      const mockUser = {
        user_id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      db_pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await accountQueries.getAccountFromUserIDQuery(1);

      expect(result).toEqual(mockUser);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it("should return undefined if no account is found", async () => {
      db_pool.query.mockResolvedValue({ rows: [] });

      const result = await accountQueries.getAccountFromUserIDQuery(999);

      expect(result).toBeUndefined();
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(accountQueries.getAccountFromUserIDQuery(1)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("updateUsernameQuery", () => {
    it("should update username successfully", async () => {
      db_pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await accountQueries.updateUsernameQuery(1, "newusername");

      expect(result.rowCount).toBe(1);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [
        1,
        "newusername",
      ]);
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(
        accountQueries.updateUsernameQuery(1, "newusername"),
      ).rejects.toThrow("Database error");
    });
  });

  describe("updatePasswordQuery", () => {
    it("should update password successfully", async () => {
      db_pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await accountQueries.updatePasswordQuery(
        1,
        "newhashpassword",
      );

      expect(result.rowCount).toBe(1);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [
        1,
        "newhashpassword",
      ]);
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(
        accountQueries.updatePasswordQuery(1, "newhashpassword"),
      ).rejects.toThrow("Database error");
    });
  });

  describe("verifyUserAccountQuery", () => {
    it("should verify user account successfully", async () => {
      db_pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await accountQueries.verifyUserAccountQuery(1);

      expect(result.rowCount).toBe(1);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(accountQueries.verifyUserAccountQuery(1)).rejects.toThrow(
        "Database error",
      );
    });
  });
});
