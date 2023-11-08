import { Message, User } from "discord.js";
import { db } from '../raiha';

export async function checkIsOP(message: Message<boolean>, caller: User) {
  const messageID = message.id;

  let isOP = false;
  let opData = null;
  let currentMessageID = messageID;
  // loop safety
  let idx = 0;
  let prevRefVal;
  while (idx < 15) { // if there's ever more than 15... there's a bigger issue than the ability to delete lol
    idx++;
    const dbRef = db.ref();
    const ref = await dbRef.child(`/Actions/${message.guildId}/${message.channel.id}/${currentMessageID}`).get();
    if (!ref.exists()) {
      if (prevRefVal && prevRefVal['OP'] == caller.id)
        isOP = true; // experimental(?) to fix deletion not working on after-the-fact alts
      break;
    }
    const refVal = await ref.val();
    if (refVal['Parent'] == ref.key) {
      // Reached the top-level message
      if (refVal['OP'] == caller.id) {
        isOP = true;
        opData = refVal;
        break;
      } else break;
    } else {
      // Still must traverse upwards
      currentMessageID = refVal['Parent'];
      prevRefVal = refVal;
    }
  }

  return [isOP, opData];
}