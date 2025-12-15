import type { Context } from "hono";
import { writeFile, readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const STORAGE_DIR = join(import.meta.dir, "../../storage/certificates");

if (!existsSync(STORAGE_DIR)) {
  await Bun.write(Bun.file(STORAGE_DIR), "");
}

export const certificateHandler = {
  upload: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = join(STORAGE_DIR, fileName);
      const fileBuffer = await file.arrayBuffer();

      await writeFile(filePath, Buffer.from(fileBuffer));

      return c.json(
        {
          success: true,
          message: "File uploaded successfully",
          file: {
            name: file.name,
            fileName: fileName,
            size: file.size,
            type: file.type,
            path: `/download/${fileName}`,
          },
        },
        201
      );
    } catch (error) {
      console.error("Upload error:", error);
      return c.json({ error: "Upload failed" }, 500);
    }
  },

  download: async (c: Context) => {
    try {
      const fileName = c.req.param("fileName");

      if (!fileName) {
        return c.json({ error: "No file name provided" }, 400);
      }

      const filePath = join(STORAGE_DIR, fileName);

      if (!filePath.startsWith(STORAGE_DIR)) {
        return c.json({ error: "Invalid file path" }, 403);
      }

      const fileStats = await stat(filePath).catch(() => null);
      if (!fileStats) {
        return c.json({ error: "File not found" }, 404);
      }

      const fileBuffer = await readFile(filePath);
      c.header("Content-Type", "application/octet-stream");
      c.header("Content-Disposition", `attachment; filename="${fileName}"`);

      return c.body(fileBuffer);
    } catch (error) {
      console.error("Download error:", error);
      return c.json({ error: "Download failed" }, 500);
    }
  },
};
