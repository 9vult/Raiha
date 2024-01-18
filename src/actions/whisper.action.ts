import OpenAI from "openai";

export async function Whisper(audioUrl: string, audioFileName: string, type: "text" | "srt") {
  const openai = new OpenAI();
  try {
    const discordResponse = await fetch(audioUrl);
    const audioFile = new File([await discordResponse.blob()], audioFileName);

    const whisperResponse = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
      response_format: type
    });
    return whisperResponse;
  } catch (error) {
    return `[An error occured while generating a transcription for this audio: ${error instanceof Error ? error.message : ""}]`
  }
}