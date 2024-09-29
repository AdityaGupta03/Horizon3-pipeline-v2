import { db_pool } from "../database/db";
import * as verificationQueries from "../database/queries/verificationQueries.js";

// Mock the database pool
jest.mock("../database/db.js", () => ({
  db_pool: {
    query: jest.fn(),
  },
}));

describe("Verification Queries", () => {
  describe("insertVerificationCodeQuery", () => {
    it("should insert a code successfully", async () => {
      const mockUserCode = {
        user_id: 1,
        code: 123456,
      };
      db_pool.query.mockResolvedValue({ rows: [mockUserCode] });

      const result = await verificationQueries.insertVerificationCodeQuery(
        mockUserCode.user_id,
        mockUserCode.code,
      );

      expect(result).toEqual(mockUserCode);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [
        mockUserCode.user_id,
        mockUserCode.code,
      ]);
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(
        verificationQueries.insertVerificationCodeQuery(1, 123456),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getVerificationCodeQuery", () => {
    it("should get a code successfully", async () => {
      const mockUserCode = {
        id: 1,
        user_id: 1,
        code: 123456,
      };
      db_pool.query.mockResolvedValue({ rows: [mockUserCode] });

      const result = await verificationQueries.getVerificationCodeQuery(
        mockUserCode.user_id,
      );

      expect(result).toEqual(mockUserCode);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [
        mockUserCode.user_id,
      ]);
    });

    it("should return null if no code pair is found", async () => {
      db_pool.query.mockResolvedValue({ rows: [] });

      const result = await verificationQueries.getVerificationCodeQuery(1);

      expect(result).toBeUndefined();
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(
        verificationQueries.getVerificationCodeQuery(1),
      ).rejects.toThrow("Database error");
    });
  });

  describe("deleteVerificationCodeQuery", () => {
    it("should delete user_code pair successfully", async () => {
      db_pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await verificationQueries.deleteVerificationCodeQuery(1);

      expect(result.rowCount).toBe(1);
      expect(db_pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it("should throw an error if the query fails", async () => {
      db_pool.query.mockRejectedValue(new Error("Database error"));

      await expect(
        verificationQueries.deleteVerificationCodeQuery(1),
      ).rejects.toThrow("Database error");
    });
  });
});
