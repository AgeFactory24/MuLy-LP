export const MAX_ATTACHMENTS = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

export interface ContactAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
  contentDisposition: "attachment";
}

/**
 * Validate untrusted JSON before passing image bytes to the mailer.
 * @param {unknown} value Attachments from the request body.
 * @return {ContactAttachment[]} Validated image attachments.
 */
export function parseAttachments(value: unknown): ContactAttachment[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS) {
    throw new Error("invalid attachments");
  }
  let total = 0;
  return value.map((item, index) => {
    if (!item || typeof item !== "object" ||
        typeof item.content !== "string" ||
        item.content.length === 0 ||
        item.content.length > 4 * Math.ceil(MAX_FILE_BYTES / 3) ||
        item.content.length % 4 !== 0 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(item.content)) {
      throw new Error("invalid attachments");
    }
    const content = Buffer.from(item.content, "base64");
    total += content.length;
    if (!content.length || content.length > MAX_FILE_BYTES ||
        total > MAX_TOTAL_BYTES ||
        content.toString("base64") !== item.content) {
      throw new Error("invalid attachments");
    }
    let contentType: string;
    let extension: string;
    if (content.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )) {
      contentType = "image/png";
      extension = "png";
    } else if (content.length >= 3 && content[0] === 255 &&
        content[1] === 216 && content[2] === 255) {
      contentType = "image/jpeg";
      extension = "jpg";
    } else if (content.length >= 12 &&
        content.toString("ascii", 0, 4) === "RIFF" &&
        content.toString("ascii", 8, 12) === "WEBP") {
      contentType = "image/webp";
      extension = "webp";
    } else {
      throw new Error("invalid attachments");
    }
    if (item.contentType !== contentType) {
      throw new Error("invalid attachments");
    }
    // Server-assigned names avoid using paths or mail headers from input.
    return {
      filename: `screenshot-${index + 1}.${extension}`,
      contentType,
      content,
      contentDisposition: "attachment",
    };
  });
}
