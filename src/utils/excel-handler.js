import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import PDFImage from "pdf-image";
import axios from "axios";
import axiosRetry from "axios-retry";
// export async function downloadPdf(url, outputPath) {
//     try {
//         const response = await axios({
//             method: 'get',
//             url: url,
//             responseType: 'stream',
//         });

//         const dir = path.dirname(outputPath);
//         if (!fs.existsSync(dir)) {
//             fs.mkdirSync(dir, { recursive: true });
//         }
//         const writer = fs.createWriteStream(outputPath);

//         response.data.pipe(writer);
//         return new Promise((resolve, reject) => {
//             writer.on('finish', () => {
//                 console.log('تم تنزيل الملف بنجاح:', outputPath);
//                 resolve();
//             });

//             writer.on('error', (err) => {
//                 console.error('حدث خطأ أثناء حفظ الملف:', err);
//                 reject(err);
//             });
//         });
//     } catch (error) {
//         console.error('حدث خطأ أثناء تنزيل الملف:', error);
//         throw error;
//     }
// }
// تحويل PDF إلى صور
export async function convertPdfToImages(pdfPath, outputDir) {
  // تحميل ملف PDF
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // إنشاء مجلد الإخراج إذا لم يكن موجودًا
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // إعداد pdf-image لتحويل الصفحات إلى صور
  const pdfImage = new PDFImage.PDFImage(pdfPath, {
    outputDirectory: outputDir,
    convertOptions: {
      "-quality": "100",
      "-density": "300",
    },
  });

  const numberOfPages = pdfDoc.getPageCount();
  const conversionPromises = [];

  for (let i = 0; i < numberOfPages; i++) {
    conversionPromises.push(
      pdfImage.convertPage(i).then((imagePath) => {
        console.log(`تم تحويل الصفحة ${i + 1} إلى صورة: ${imagePath}`);
        return imagePath;
      })
    );
  }

  // تحويل الصفحات بشكل متوازي
  await Promise.all(conversionPromises);
}

// تحويل الصور إلى PDF
export async function convertImagesToPdf(imagesDir, outputPdfPath) {
  // تحميل جميع الصور من المجلد
  const imageFiles = fs
    .readdirSync(imagesDir)
    .filter((file) => file.endsWith(".png") || file.endsWith(".jpg"));

  // إنشاء مستند PDF جديد
  const pdfDoc = await PDFDocument.create();

  // إضافة كل صورة كصفحة في PDF
  for (const imageFile of imageFiles) {
    const imagePath = path.join(imagesDir, imageFile);
    const imageBytes = fs.readFileSync(imagePath);

    // إضافة الصورة إلى PDF
    const image = await pdfDoc.embedPng(imageBytes); // استخدم embedJpg إذا كانت الصور بصيغة JPG
    const page = pdfDoc.addPage([image.width, image.height]);

    // إضافة الصورة إلى الصفحة
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  // حفظ ملف PDF النهائي
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPdfPath, pdfBytes);
  // console.log(`تم تحويل الصور إلى PDF وحفظه في: ${outputPdfPath}`);
}

// Configure axios to retry failed requests up to 3 times
axiosRetry(axios, {
  retries: 3, // Maximum number of retries
  retryDelay: (retryCount) => {
    console.log(`Retry attempt: ${retryCount}`);
    return retryCount * 1000; // Wait 1 second per retry attempt
  },
  retryCondition: (error) => {
    // Retry on network errors or if the error is considered retryable
    return (
      axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error)
    );
  },
});

export const downloadPdf = async (url, filePath) => {
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 30000, // 30 seconds timeout
    headers: {
      // Set a common browser user agent to help avoid being blocked by some servers
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "application/pdf,application/octet-stream,text/html",
    },
  });

  // Pipe the response stream to a file.
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

export async function downloadPdfFromDrive(driveUrl, outputPath) {
  const fileIdMatch = driveUrl.match(/\/d\/([^/]+)/);
  if (!fileIdMatch) {
    console.error("Invalid Google Drive URL");
    return false;
  }

  const fileId = fileIdMatch[1];
  const downloadUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;

  try {
    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
    });

    // Check if response is HTML (which means the file is not a direct PDF)
    const contentType = response.headers["content-type"];
    if (contentType && contentType.includes("text/html")) {
      console.error(
        "Failed to download: Received an HTML page instead of a PDF. The file might not be publicly accessible."
      );
      return false;
    }

    fs.writeFileSync(outputPath, response.data);
    console.log("Download completed:", outputPath);
    return true;
  } catch (error) {
    console.error("Error downloading the file:", error.message);
    return false;
  }
}
