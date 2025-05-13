import path, { dirname } from "path";
import { fileURLToPath } from "url";
import jwt from 'jsonwebtoken';
export const viewPdf = async (req, res) => {
  const { token } = req.query;
  const __filename = fileURLToPath(import.meta.url);
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const { id, reportPath } = decodedToken;
  console.log('id',id);
  const __dirname = dirname(__filename);
  const filePath = path.join(__dirname, `../../uploads${reportPath}/${id}`);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(500).send("Error loading PDF");
    }
  });
};
