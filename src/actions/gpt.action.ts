import OpenAI from "openai";

export async function Gpt(imageUrl: string) {
  const openai = new OpenAI();
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please describe the contents of this image in detail using the format of a11y alt text. " +
                    "If possible, please keep the response length to within three sentences or 50 words. " +
                    "Please try to keep the response scope limited to the primary focuses of the image. " +
                    "Please do not start the response with the phrase \"Alt text\" or similar phrases. " +
                    "Only include the actual alt text in the response."
            },
            {
              type: "image_url",
              image_url: {
                "url": imageUrl,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });
    return response.choices[0].message.content;
  } catch (error: any) {
    return `[[error]] ${error.status} ${error.type}\n${error.error.message}`;
  }
}