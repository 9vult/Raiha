import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { getAIDescription } from '../misc/misc';
import { CLIENT, db, leaderboards } from '../raiha';

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
 * @returns [number of the initial index, number of the index after the prefix]
 */
const searchPatterns = {
    "r!": /\br!/,
    "alt:": /\balt:/,
    "id:": /\bid:/
}
export function getAltPosition(message: Message<boolean>): [number, number] {
    const lowerCase = message.content.toLowerCase();
    for (const [searchWord, searchRegex] of Object.entries(searchPatterns)) {
        const index = lowerCase.search(searchRegex);
        if (index == -1) continue;
        return [index, index + searchWord.length]
    }
    return [-1, -1];
}

/**
 * Fix attachments by adding alt text
 * @param message Message to fix the attachments for
 * @param altTexts Alt texts to apply
 * @returns Fixed attachments
 */
export async function applyAltText(message: Message<boolean>, altTexts: string[]) {
    const fixedFiles = Array.from(message.attachments.values())
        .map(async (attachment, index) => {
            if (altTexts[index].trim() == "$$") {
                const imageUrl = attachment.url;
                const desc = await getAIDescription(imageUrl, true, false);
                altTexts[index] = desc.substring(0, 1000);
            }
            else if (altTexts[index].trim() == "$$ocr") {
                const imageUrl = attachment.url;
                const desc = await getAIDescription(imageUrl);
                altTexts[index] = desc.substring(0, 1000);
            }
            else if (altTexts[index].trim().endsWith("$$ocr")) {
                const imageUrl = attachment.url;
                const desc = await getAIDescription(imageUrl, false);
                // regex matches " $$ocr" and "$$ocr"
                altTexts[index] = (altTexts[index].replace(/\s\$\$ocr|\$\$ocr/, `: ${desc}`)).substring(0, 1000);
            }
            attachment.description = altTexts[index];
            return attachment;
        })
    return await Promise.all(fixedFiles);
}

/**
 * Retrieve the alt text from the message
 * @param message Message to parse
 * @param startIndex Index the alt text starts at
 * @returns Array of alt texts
 */
export function parseAltText(message: Message<boolean>, startIndex: number): string[] {
    return message.content.substring(startIndex).trim().split("|");
}

/**
 * Alerts loserboard in the moderation channel
 * @param message Message to parse
 * @param startIndex Index the alt text starts at
 * @returns Array of alt texts
 */
export async function checkLoserboard(id: string) {
    const channel = CLIENT.channels.cache.get(process.env.MOD_CHANNEL ?? "") as TextChannel;
    if (!channel) return;
    const { Loserboard, Milestones } = leaderboards;

    const losses = Loserboard[id];
    if (!losses) return;
    // Check if mute threshold hit
    if (losses % 25 && (losses + 5) % 25) return;
    // Check for passing milestones
    const lossesMilestone = Milestones[id];
    if (!lossesMilestone || losses <= lossesMilestone) return;
    const warrantsMute = losses % 25 == 0;
    // Wait and see if it remains this way
    await new Promise(r => setTimeout(r, 2000))//30000));
    if (losses < Loserboard[id]) return; // The board has gone up since, or remained the same
    // Notice zone
    const embed = new EmbedBuilder()
        .setTitle(`Loserboard Alert`)
        .setDescription(`Hello! User <@${id}>'s Loserboard score is now ${losses}.\n${warrantsMute ? "An image mute may be warranted." : "They should be warned that they are approaching an image mute."}`)
        .setColor(0xf4d7ff);

    await db.ref(`/Leaderboard/Loserboard Milestones/`).child(id).set(losses);
    channel.send({ embeds: [embed] })
};