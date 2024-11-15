import { Message, User } from "discord.js";
import { db } from '../raiha';

export async function getOP(message: Message<boolean>) {
  const messageID = message.id;

  let opId: string = '';
  let currentMessageID = messageID;
  // loop safety
  let idx = 0;
  let prevRefVal;
  while (idx < 15) { // if there's ever more than 15... there's a bigger issue than the ability to delete lol
    idx++;
    const dbRef = db.ref();
    const ref = await dbRef.child(`/Actions/${message.guildId}/${message.channel.id}/${currentMessageID}`).get();
    if (!ref.exists()) {
      if (prevRefVal && prevRefVal['OP'])
        opId = prevRefVal['OP'];
      break;
    }
    const refVal = await ref.val();
    if (refVal['Parent'] == ref.key) {
      // Reached the top-level message
      opId = refVal['OP'];
    } else {
      // Still must traverse upwards
      currentMessageID = refVal['Parent'];
      prevRefVal = refVal;
    }
  }

  return opId;
}