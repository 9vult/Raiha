import { ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { getAllowedMentions } from '../misc/misc';
import { db } from '../raiha';

export default async function (interaction: ChatInputCommandInteraction, { user, options }: OptionalCommandArguments) {
    await interaction.deferReply({ ephemeral: true });

    const messageID = options.getString('msgid')!.valueOf();

    const message = await interaction.channel!.messages!.fetch(`${messageID}`)
        .catch(async () => {
            const embed = new EmbedBuilder()
                .setTitle(`Raiha Message Delete`)
                .setDescription(`Could not find the message with ID ${messageID}.`)
                .setColor(0xd797ff);
            await interaction.editReply({ embeds: [embed], allowedMentions: getAllowedMentions() });
        });
    if (!message) return;

    // sec -> im not touching this idk what it does
    let isOP = false;
    let currentMessageID = messageID;
    let prevRefVal;
    for (let i = 0; i < 15; i++) { // if there's ever more than 15... there's a bigger issue than the ability to delete lol
        const ref = await db.ref().child(`/Actions/${message.guild!.id}/${message.channel!.id}/${currentMessageID}`).get();
        if (!ref.exists()) {
            if (prevRefVal && prevRefVal['OP'] == user.id)
                isOP = true; // experimental(?) to fix deletion not working on after-the-fact alts
            break;
        }
        const refVal = await ref.val();
        if (refVal['Parent'] == ref.key) {
            // Reached the top-level message
            if (refVal['OP'] == user.id) {
                isOP = true;
            }
            break;
        } else {
            // Still must traverse upwards
            currentMessageID = refVal['Parent'];
            prevRefVal = refVal;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle("Raiha Message Delete")
        .setColor(0xd797ff);

    if (isOP) {
        try {
            await message.delete();
            embed.setDescription("The message was successfully deleted.");
        } catch (err) {
            embed.setDescription(`The message could not be deleted. Error: ${err}`);
        }
    } else {
        embed.setDescription("You are not the author of this message, or this message is not a Raiha message.");
    }

    await interaction.editReply({ embeds: [embed], allowedMentions: getAllowedMentions() });
}