import { Message, Attachment } from 'discord.js';
import { generateAIDescription } from '../misc/misc';

/**
 * Check if any of the attachments on the message are missing alt text 
 * @param message Incoming message to check
 */
export function isMissingAltText(message: Message<boolean>): boolean {
    return Array.from(message.attachments.values()).some(attachment =>
        attachment.contentType?.startsWith('image') &&
        !attachment.description?.trim()
    )
}

/**
 * Checks if any of the attachments are images
 * @param message Incoming message to check
 */
export function hasImages(message: Message<boolean>): boolean {
    return Array.from(message.attachments.values()).some(attachment =>
        attachment.contentType?.startsWith('image')
    )
}

/**
 * Check if this message contains a trigger word
 * @param message Incoming message to check
 * @returns Position of the end of the trigger, or [-1]
 */
export function getAltPosition(message: Message<boolean>): [number, number] {
    const lowerCase = message.content.toLowerCase();
    let comIndex = lowerCase.search(/\br!/);    // r!
    let altIndex = lowerCase.search(/\balt:/);  // alt:
    let idIndex = lowerCase.search(/\bid:/);    // id:

    if (comIndex !== -1) return [comIndex, comIndex + 2]
    else if (altIndex !== -1) return [altIndex, altIndex + 4]
    else if (idIndex !== -1) return [idIndex, idIndex + 3]
    return [-1, -1];
}

/**
 * Fix attachments by adding alt text
 * @param message Message to fix the attachments for
 * @param altTexts Alt texts to apply
 * @returns Fixed attachments
 */
export async function applyAltText(message: Message<boolean>, altTexts: Array<string>) {
    let fixedFiles: Array<Attachment> = [];
    let index = 0;
    for (const attachment of Array.from(message.attachments.values())) {
        if (altTexts[index].trim() == "$$") {
            const imageUrl = attachment.url;
            const desc = await generateAIDescription(imageUrl, true, false);
            altTexts[index] = desc.substring(0, 1000);
        }
        else if (altTexts[index].trim() == "$$ocr") {
            const imageUrl = attachment.url;
            const desc = await generateAIDescription(imageUrl, true, true);
            altTexts[index] = desc.substring(0, 1000);
        }
        else if (altTexts[index].trim().endsWith("$$ocr")) {
            const imageUrl = attachment.url;
            const desc = await generateAIDescription(imageUrl, false, true);
            altTexts[index] = (altTexts[index].replace(/\s\$\$ocr|\$\$ocr/, `: ${desc}`)).substring(0, 1000); // regex matches " $$ocr" and "$$ocr"
        }
        attachment.description = altTexts[index++];
        fixedFiles.push(attachment);
    }
    return fixedFiles;
}

/**
 * Retrieve the alt text from the message
 * @param message Message to parse
 * @param startIndex Index the alt text starts at
 * @returns Array of alt texts
 */
export function parseAltText(message: Message<boolean>, startIndex: number): Array<string> {
    return message.content.substring(startIndex).trim().split("|");
}

