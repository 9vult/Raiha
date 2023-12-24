import OpenAI from "openai";

export async function Gpt(imageUrl: string) {
  const openai = new OpenAI();
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please describe the contents of this image in detail using the format of a11y alt text. Please keep the response length to under 1000 characters or 300 tokens, whichever is fewer. Please do not start the response with the phrase \"Alt text\" or similar phrases. Only include the actual alt text in the response."
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
  } catch (error) {
    return "[An error occured while generating alt text for this image.]"
  }
}