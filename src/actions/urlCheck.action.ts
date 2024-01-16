import { Message } from "discord.js";

const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
const formats = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp', 'heif', 'heic'];

export function urlCheck(originalMessage: Message<boolean>) {
    let urls = originalMessage.content.match(urlRegex) ?? [];

    for (let urlString of urls) {
        let url = new URL(urlString);
        let ext = url.pathname.slice((url.pathname.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase() ?? "";
        if (formats.includes(ext)) return true;
    }
    return false;
}