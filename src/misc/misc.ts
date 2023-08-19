import { EmbedBuilder, Message, MessageMentionOptions, MessageMentions, TextChannel } from "discord.js";
import { CLIENT, leaderboards } from "../raiha";
// const fetch = require('node-fetch');

// FUNCTIONS

/**
 * Generate a list of allowed mentions
 * @param MentionProps
 * @return MessageMentionOptions
 */
export function getAllowedMentions(mentions?: MessageMentions): MessageMentionOptions {
  return {
    parse: [],
    users: Array.from(mentions?.users.keys() ?? []),
    roles: Array.from(mentions?.roles.keys() ?? [])
  }
}

export async function getAIDescription(imageUrl: string, doCaption = true, doOCR = true) {
  const features = doCaption && doOCR ? "caption,read" :
    doCaption ? "caption" : "read"
  const endpoint = `${process.env.CV_ENDPOINT}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=${features}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": `${process.env.CV_API_KEY}`
    },
    body: JSON.stringify({ url: imageUrl })
  });
  if (!response.ok) {
    try {
      const result = await response.json() as { error: { code: number, message: string } };
      return `Request failed. (${response.status}) - ${result.error.code}: ${result.error.message}`;
    } catch (err) {
      return `Request failed. (${response.status})`;
    }
  }
  if (doCaption) {
    if (doOCR) {
      // Caption & OCR
      const result: any = await response.json();
      const caption = `${result.captionResult.text} (${result.captionResult.confidence.toFixed(3)})`;
      const text = result.readResult.content;
      const description = `${caption}: ${text}`.replace('\n', ' \n');
      return description;
    }

    // Caption
    const result: any = await response.json();
    return `${result.captionResult.text} (${result.captionResult.confidence.toFixed(3)})`;
  }

  // OCR
  const result: any = await response.json();
  const text = result.readResult.content;
  const description = text.replace('\n', ' \n');
  return description;
}

type ReactionType = 'ERR_MISSING_ALT_TEXT' | 'ERR_MISMATCH' | 'ERR_NOT_REPLY';
export async function react(message: Message<true>, reaction: ReactionType) {
  const config = leaderboards.Configuration[message.guild.id] ?? {};
  const { errorNoAlt, errorMismatch, errorNotReply } = config;
  try {
    switch (reaction) {
      case 'ERR_MISSING_ALT_TEXT':
        if (!errorNoAlt || errorNoAlt == "default") {
          await message.react('❌');
        } else {
          await message.react(errorNoAlt);
        }
        break;
      case 'ERR_MISMATCH':
        if (!errorMismatch || errorMismatch == "default") {
          await message.react('#️⃣');
          await message.react('❌');
        } else {
          await message.react(errorMismatch);
        }
        break;
      case 'ERR_NOT_REPLY':
        if (!errorNotReply || errorNotReply == "default") {
          await message.react('↩');
          await message.react('❌');
        } else {
          await message.react(errorNotReply);
        }
        break;
    }
  } catch (err) {
    await sendError(message.guild!.id, "Could not react", (err as Error)?.message, message.author.id, message.url);
  }
}

export async function sendError(guildId: string, errorTitle: string, errorBody: string, authorId: string | number, url: string) {
  const channel = CLIENT.channels.cache.get(leaderboards.Configuration[guildId]?.errorChannel ?? "") as TextChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(`Error: ${errorTitle}`)
    .setDescription(`${errorBody}\nAuthor ${authorId}\nURL ${url}`)
    .setColor(0xf4d7ff);
  await channel.send({ embeds: [embed] });
}

// STRINGS
export const helpText = `**Adding Alt Text Natively**\n1. Upload and attach an image\n2. Click on the pencil next to the trash can to modify the attachment\n3. Add a description (alt text) where indicated\n\n**Adding Alt Text With Raiha**\nWhen posting a new message:\n1. Upload and attach an image\n2. Add a Raiha trigger to the end of the message\n\nAdding to an existing message:\n1. **Reply** to the original message with a Raiha trigger\n2. Raiha will repost the original message with alt text\n\n**Raiha Trigger Commands**\nRaiha recognizes the following triggers as the start of an alt text command:\n\`r!\`, \`alt:\`, and \`id:\`\n\n ・ The simplest command is for one image: \`r! A black cat sleeping\`.\n ・ If there are multiple images, split each description with a pipe (\`|\`):\n\`r! image 1 | image 2 | ...\`\n\n**Raiha AI Assistance**\nRaiha also supports some AI-helped functionality:\n ・ Use \`r! $$\` to request an AI-generated image description.\n ・ Use \`r! $$ocr\` to request an image description _and_ text recognition. Use this for text-heavy images like social media posts.\n ・ \`$$ocr\` can be used in conjunction with a user-specified description for more clarity: \`r! Email from my professor $$ocr\`\n ・ These features are per-image, so if there are multiple images you will need to specify for all of them, or mix and match:\n\`r! $$ | $$ocr | Johnny | text with Johnny $$ocr\`\n\n**Viewing Alt Text**\nTo view, enable "with image descriptions" in Settings->Text and Media.`;
export const whyText = `Alternative Text (alt text) is a text description of an image that is generally read by a screen reader to allow the visually impared to understand the context of an image. It may also benefit people with processing disorders or impaired mental processing capabilities.\nAdditionally, alt text is beneficial even outside the realm of accessibility—on Discord, alt text is indexed and searchable, allowing you to search for images quickly and easily!`;