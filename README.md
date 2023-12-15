# Raiha - A Discord Accessibility Bot

Raiha is a simple, easy-to use bot whose core focus is making alt text easier to write and use. Here are some of the things you can achieve with Raiha:

## Major Features

### Add alt text to a message you already sent

Discord currently doesn't allow you to edit or add alt text once your message has been sent. With Raiha, however, you can reply to the message you want to add alt text to, and Raiha will repost your message (including reply status and @mentions) with the alt text you wanted.

### Add alt text to someone else's message

Adding alt text to someone else's message works exactly the same as adding after-the-fact alt text to your own message. This is useful if someone doesn't add alt text, or if their alt text is inaccurate or lacking detail. Raiha will repost the message, including a blurb saying who wrote the original message, and who added the alt text. This helps with accountability and keeps everyone aware of what repost is what.

### Add alt text to a new message

You can use Raiha on a message you haven't sent yet by including a trigger at the end of the message body, triggering an automatic repost with the specified alt text. This is useful if you want to use some of Raiha's more advanced features, or if you just want to bypass Discord's native alt text input box.

### Computer Vision

Raiha comes with out-of-the-box support for Azure computer vision, namely Image Descriptions and Optical Character Recognition (OCR). These features allow you to automatically write basic image descriptions and/or include the text content of an image.

## Additional Features

### Missing Alt Text Reaction

Raiha will react to messages that are missing alt text. By default, the ❌ emoji is used, but this can be changed in the server settings. This reaction allows for easy distinction between messages with and without alt text, even when Discord's alt text display feature is disabled in your client.

### Leaderboards

Why _not_ gamify accessibility? Raiha comes with three leaderboards:

- **Native** - This leaderboard keeps track of the number of messages sent using Discord's built-in alt text feature
- **Raiha** - This leaderboard keeps track of the number of Raiha reposts triggered
- **Loserboard** - This leaderboard keeps track of the number of messages sent without alt text. Using Raiha to repost your own message will decrement this board.

A bit more on the Loserboard: The loserboard can be configured to notify moderators in a mod channel when a user's Loserboard score reaches certain thresholds. What you do with this information is up to you, one suggestion, however, is an Image Mute.

## User Settings

There are several settings that users can set on themselves. Each user setting is a boolean value, either ON or OFF.

- **Reminder** - Posts a mini-tutorial each time the user forgets to use alt text
- **Activation Failure** - A meme setting; posts a gif when the user attempts to activate Raiha but fails
- **Auto** - Automatically run Raiha on any images missing alt text when the message is sent

## Usage

All Raiha reposts begin with a trigger. Currently-accepted triggers are `r!` (alias: `!r`), `alt:`, and `id:`. Servers can disable individual triggers if they want/need to.

- **Add alt text to an existing message** - _Reply_ to the message beginning with a trigger, then the alt text you want to apply
    - ex: `r! Tabby kitten sitting in a sink`
- **Add alt text to a new message** - Write a message as normal, then add a trigger and alt text at the end
    - ex: `I had a lot of fun at the beach yesterday. id: sunset over the ocean`
- **Multiple images** - Use the vertical pipe character ` | ` to separate alt texts
    - ex: `r! cat sitting on stairs | dog sitting on stairs`
- **Computer Vision**
    - **Image Description** - Use `$$` as the alt text. ex: `r! $$`
    - **Image Description and OCR** - Use `$$ocr` as the alt text. ex: `r! $$ocr`
    - **Your Description and OCR** - Supply your own description, plus `$$ocr`. ex: `letter in the mail $$ocr`
    - **NOTE**: Computer vision commands can be mixed and matched, and are applied per-image
        - ex: `r! a bunny | $$ocr | $$ | my report card $$ocr`
- **Edit Reposted Message**
    - **Whole message** - Reply to the message with the trigger word `edit!` followed by the new message body
    - **Typo correction** - Reply to the message with the sed-like syntax `r/old/new`, where `old` will be replaced by `new`
    - **NOTE**: Edits can only be performed on messages with a message body. You cannot retroactively add a message body.
- **Delete Reposted Message** - Reply to the message with the trigger word `delete!`

Edit and Delete commands will only work if you are the original poster of the message, regardless who initiated the repost.

## Setup

 - Raiha requires a [Firebase Real-Time Database](https://firebase.google.com/docs/database) for logging and leaderboards. The base tier is free, and it is highly unlikely Raiha will ever generate enough data to exceed the base tier.
 - Raiha also requires an [Azure Cognitive Vision Service](https://learn.microsoft.com/en-us/azure/cognitive-services/custom-vision-service/limits-and-quotas) instance. The base tier is free, and allows for 20 requests per minute, 5000 per month.

Create a `.env` file in the project root and add the following to it: 

 - `TOKEN=[yourtoken]`
 - `DATABASE_URL=[databaseurl]`
 - `MOD_CHANNEL=[channelid]`
 - `CV_API_KEY=[yourkey]`
 - `CV_ENDPOINT=[endpoint, with trailing /]`

Then, place your `firebase.json` in the `/src/` folder.

Finally, in the firebase database, set the server configuration at `/Configuration/[guildID]`:

```typescript
{
  ai: boolean,
  altrules: "default" | string,
  enableWarnings: boolean,
  errorChannel: string (channelID),
  errorMismatch: "default" | string (emojiID),
  errorNoAlt: "default" | string (emojiID),
  errorNotReply: "default" | string (emojiID),
  greenThreshold: number,
  leaderboard: boolean,
  loserboard: boolean,
  modChannel: string (channelID),
  modRole: string (roleName),
  muteThreshold: number (0 to disable),
  specialWarnThresholds: number[] (ignores enableWarnings value),
  placeInMessageBodyMode: "off" | "all" | "description",
  disabledTriggers: string[] | undefined
}
```

_Some of these options are not yet implemented. Data types and names may change._

### Development

Pull requests are always welcome.

### License

Raiha is licensed under LGPL v3.0.


© 2022–2023 9volt.