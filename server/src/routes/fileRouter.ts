import { Router } from "express";
import multer, { Multer } from "multer";

const upload: Multer = multer({ dest: "../uploads/" });

import {
  uploadFile,
  createFolder,
  downloadFile,
  delete_file,
} from "../controllers/fileController.js";

const fileRouter: Router = Router();

fileRouter.post("/upload", upload.single("binary"), uploadFile);
fileRouter.post("/create_folder", createFolder);
fileRouter.get("/download_file", downloadFile);
fileRouter.post("/delete_file", delete_file);

export default fileRouter;
