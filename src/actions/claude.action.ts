import Anthropic from "@anthropic-ai/sdk";

export async function Claude(imageUrl: string) {
  const anthropic = new Anthropic();

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 250,
      temperature: 1,
      system: "You are an alt text generation bot. "
        + "You describe what you see in an image in the form of a11y alt text. "
        + "You keep your responses short and to-the-point without dwelling on unimportant details. "
        + "You only include the actual alt text in your response. "
        + "You keep your responses to within 3 sentences or 50 words. "
        + "If there is important text in the image, you include it in your response, paraphrasing if needed.",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "image",
              "source": {
                "type": "url",
                "url": imageUrl
              }
            }
          ]
        }
      ],
      thinking: {
        "type": "disabled"
      },
      output_config: { "effort": "medium" }
    });
    if (response.content.length > 0) {
      if (response.content[0].type == "text") {
        return response.content[0].text;
      }
      return `[[error]] Claude responsed with content block type ${response.content[1].type}`;
    }
    return  `[[error]] Claude did not respond with any content! Stop reason: ${response.stop_reason}`;
  } catch (error: any) {
    return `[[error]] ${error.status} ${error.type}\n${error.error.message}`;
  }
}