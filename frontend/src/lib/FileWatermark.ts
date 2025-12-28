// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFName,
  PDFArray,
  PDFNumber,
  PDFString,
} from "pdf-lib";

export class FileWatermark {
    static async addTextWatermark(blob: Blob, verificationUrl: string): Promise<Blob> {
        const text = await blob.text();
        const watermarkedText = `${text}\n\n---\nVerification URL: ${verificationUrl}`;
        return new Blob([watermarkedText], { type: 'text/plain' });
    }

    static async addPdfWatermark(blob: Blob, verificationUrl: string): Promise<Blob> {
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();

            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            page.drawText("Certificate Verification", {
            x: 50,
            y: height - 100,
            size: 24,
            font: boldFont,
            color: rgb(0.15, 0.3, 0.6),
            });

            page.drawText("This certificate can be verified at the following URL:", {
            x: 50,
            y: height - 150,
            size: 14,
            font,
            color: rgb(0.2, 0.2, 0.2),
            });

            const linkLabel = "Verification URL";
            const linkFontSize = 14;
            const linkX = 50;
            const linkY = height - 180;

            page.drawText(linkLabel, {
            x: linkX,
            y: linkY,
            size: linkFontSize,
            font,
            color: rgb(0, 0.4, 0.8),
            });

            const textWidth = font.widthOfTextAtSize(linkLabel, linkFontSize);
            page.drawLine({
            start: { x: linkX, y: linkY - 2 },
            end: { x: linkX + textWidth, y: linkY - 2 },
            thickness: 1,
            color: rgb(0, 0.4, 0.8),
            });

            const context = pdfDoc.context;

            const textHeight = font.heightAtSize(linkFontSize);

            const rect = PDFArray.withContext(context);
            rect.push(PDFNumber.of(linkX));
            rect.push(PDFNumber.of(linkY));
            rect.push(PDFNumber.of(linkX + textWidth));
            rect.push(PDFNumber.of(linkY + textHeight));

            const border = PDFArray.withContext(context);
            border.push(PDFNumber.of(0));
            border.push(PDFNumber.of(0));
            border.push(PDFNumber.of(0));

            const action = context.obj({
            S: PDFName.of("URI"),
            URI: PDFString.of(verificationUrl),
            });

            const annotation = context.obj({
            Type: PDFName.of("Annot"),
            Subtype: PDFName.of("Link"),
            Rect: rect,
            Border: border,
            A: action,
            });

            const annotationRef = context.register(annotation);

            page.node.addAnnot(annotationRef);

            const pdfBytes = await pdfDoc.save();

            const ab = pdfBytes.buffer.slice(
            pdfBytes.byteOffset,
            pdfBytes.byteOffset + pdfBytes.byteLength
            );

            return new Blob([ab], { type: "application/pdf" });
        } catch (error) {
            console.error("Failed to add PDF watermark:", error);
            return blob;
        }
    }


    static async addImageWatermark(blob: Blob, verificationUrl: string): Promise<Blob> {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(blob);
                return;
            }

            img.onload = () => {
                const padding = 20;
                const titleFontSize = 18;
                const urlFontSize = 16;
                const lineHeight = 24;
                const maxUrlWidth = img.width - (padding * 2);
                
                ctx.font = `${urlFontSize}px monospace`;
                const urlLines = this.wrapText(ctx, verificationUrl, maxUrlWidth);
                
                const watermarkHeight = padding + titleFontSize + 10 + (urlLines.length * lineHeight) + padding;
                
                canvas.width = img.width;
                canvas.height = img.height + watermarkHeight;
                
                ctx.drawImage(img, 0, 0);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.fillRect(0, img.height, canvas.width, watermarkHeight);
                
                ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, img.height, canvas.width, watermarkHeight);
                
                ctx.fillStyle = '#333333';
                ctx.font = `bold ${titleFontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('Certificate Verification URL:', canvas.width / 2, img.height + padding + titleFontSize);
                
                ctx.font = `${urlFontSize}px monospace`;
                ctx.fillStyle = '#0066cc';
                ctx.textAlign = 'center';
                
                let yPosition = img.height + padding + titleFontSize + 20;
                urlLines.forEach((line) => {
                    ctx.fillText(line, canvas.width / 2, yPosition);
                    yPosition += lineHeight;
                });
            
                canvas.toBlob((resultBlob) => {
                    if (resultBlob) {
                        resolve(resultBlob);
                    } else {
                        resolve(blob);
                    }
                }, blob.type || 'image/png');
            };

            img.onerror = () => {
                resolve(blob);
            };

            img.src = URL.createObjectURL(blob);
        });
    }

    private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const lines: string[] = [];
        let currentLine = '';
    
        const chars = text.split('');
    
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
      
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
    
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
    
        return lines.length > 0 ? lines : [text];
    }

    private static splitTextToFit(text: string, font: any, fontSize: number, maxWidth: number): string[] {
        const lines: string[] = [];
        const words = text.split(/(?=[/?&=])/);
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);

            if (testWidth > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines;
    }

    static async addWatermark(
        blob: Blob,
        fileType: string,
        verificationUrl: string
    ): Promise<Blob> {
        switch (fileType) {
            case 'txt':
                return this.addTextWatermark(blob, verificationUrl);
            case 'pdf':
                return this.addPdfWatermark(blob, verificationUrl);
            case 'img':
                return this.addImageWatermark(blob, verificationUrl);
            default:
                return blob;
        }
    }
}
