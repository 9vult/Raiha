# Raiha Accessibility Bot

Raiha is an alt text helper bot that enables adding alt text to new or existing messages.

 - To create a new message with Raiha, write a message as normal, then add the Raiha trigger command to the end of the message. For example, `This is a picture of my cat! r! Tabby kitten sitting in a sink`
 - To add alt text to an existing message, reply to the original message with a Raiha trigger command: `r! Alt text for the image`.
 - If there is more than one image in the message, split the alt text with `|`: `r! Image 1 | Image 2 | Image 3`.
 - Raiha supports the following triggers: `r!`, `alt:`, `id:`


### For moderation

Raiha will post a message to a channel of your choosing to alert moderators when a user's Loserboard score surpasses a multiple of 25 (25, 50, 75, 100, etc), as well as 20 and 45.


### Setup

Raiha requires a [Firebase Real-Time Database](https://firebase.google.com/docs/database) for logging and leaderboards. The base tier is free, and it is highly unlikely Raiha will ever generate enough data to exceed the base tier.

Create a `.env` file in the project root and add the following to it: 

 - `TOKEN=[yourtoken]`
 - `DATABASE_URL=[databaseurl]`
 - `MOD_CHANNEL=[channelid]`

Then, place your `firebase.json` in the `/src/` folder.

### Development

Pull requests are always welcome.

### License

Raiha is licensed under LGPL v3.0.


© 2022 9volt.
