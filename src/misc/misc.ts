const shortHelpBase = "- **REPLY to your message with `r! (image description)` to add alt text.**\n- Use the pipe character `|` for multiple images.\n- Use `$$` for AI image recognition, and `$$ocr` for optical character recognition.\n- `$$ocr` can be combined with a custom description.";

// STRINGS
export const longHelp = `**Adding Alt Text Natively**\n1. Upload and attach an image\n2. Click on the pencil next to the trash can to modify the attachment\n3. Add a description (alt text) where indicated\n\n**Adding Alt Text With Raiha**\nWhen posting a new message:\n1. Upload and attach an image\n2. Add a Raiha trigger to the end of the message\n\nAdding to an existing message:\n1. **Reply** to the original message with a Raiha trigger\n2. Raiha will repost the original message with alt text\n\n**Raiha Trigger Commands**\nRaiha recognizes the following triggers as the start of an alt text command:\n\`r!\`, \`alt:\`, and \`id:\`\n\n ・ The simplest command is for one image: \`r! A black cat sleeping\`.\n ・ If there are multiple images, split each description with a pipe (\`|\`):\n\`r! image 1 | image 2 | ...\`\n\n**Raiha AI Assistance**\nRaiha also supports some AI-helped functionality:\n ・ Use \`r! $$\` ro request an AI-generated image description.\n ・ Use \`r! $$ocr\` to request an image description _and_ text recognition. Use this for text-heavy images like social media posts.\n ・ \`$$ocr\` can be used in conjunction with a user-specified description for more clarity: \`r! Email from my professor $$ocr\`\n ・ These features are per-image, so if there are multiple images you will need to specify for all of them, or mix and match:\n\`r! $$ | $$ocr | Johnny | text with Johnny $$ocr\`\n\n**Viewing Alt Text**\nTo view, enable "with image descriptions" in Settings->Text and Media.\n\n**Usage Reminders**\nIf you would like to be reminded on Raiha usage in the future, \`/usersetting Reminder YES\`.`;

export const whyText = `Alternative Text (alt text) is a text description of an image that is generally read by a screen reader to allow the visually impared to understand the context of an image. It may also benefit people with processing disorders or impaired mental processing capabilities.\nAdditionally, alt text is beneficial even outside the realm of accessibility—on Discord, alt text is indexed and searchable, allowing you to search for images quickly and easily!`;

export const hintText = "Hi, it looks like you might be new to adding alt text with Raiha.\n" + shortHelpBase + "\nFor more details, `/help` and `/edithelp`. For why, `/why`.\n**To see this server's alt text rules, `/altrules`.**\nIf you would like to be reminded on Raiha usage in the future, `/usersetting Reminder YES`.";

export const reminderText = "Hi, you asked me to remind you on Raiha usage—Here's a TL;DR:\n" + shortHelpBase;

export const shortHelp = "Here are the basics of using Raiha:\n" + shortHelpBase + "\nAlso see `/edithelp`. For more in-depth help, `/longhelp`. For why, `/why`.\n**To see this server's alt text rules, `/altrules`.**\nIf you would like to be reminded on Raiha usage in the future, `/usersetting Reminder YES`.";

export const editHelp = "Editing a reposted message is easy! Just reply to the message.\nTo edit a word or phrase, use the `sed`-like syntax: `r/original phrase/new phrase`.\nTo replace the message outright, use `edit! New message body here`.\nTo delete, reply with `delete!`.\n\nPlease note that the editing commands only work if the message already had a body.";

export const expiry = (dialogue: string, seconds: number) => {
  let currentTime = Math.round(Date.now() / 1000);
  let goal = currentTime + seconds;

  return dialogue + `\n\n_This message will self-destruct <t:${goal}:R>._`;
};

export enum AutoMode {
  ON,
  OFF,
  IMPLICIT
}
