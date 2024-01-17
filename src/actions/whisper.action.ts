import OpenAI from "openai";
const fetch = require("node-fetch");

export async function Whisper(audioUrl: string, audioFileName: string) {
  const openai = new OpenAI();
  try {
    const discordResponse = await fetch(audioUrl);
    const audioFile = new File([await discordResponse.blob()], audioFileName);

    const whisperResponse = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
      response_format: "text"
    });
    return whisperResponse;
  } catch (error) {
    return "[An error occured while generating a transcription for this audio.]"
  }
}