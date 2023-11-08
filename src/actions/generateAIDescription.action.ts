const fetch = require("node-fetch");

interface DescriptionError {
  error: {
    code: number
    message: string
  }
}
interface DescriptionResults {
  captionResult?: {
    text: string
    confidence: number
  }
  readResult?: {
    content: string
  }
}

export async function generateAIDescription(imageUrl: string, doCaption: boolean, doOCR: boolean) {
  const captionEndpoint = `${process.env.CV_ENDPOINT}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=caption`;
  const ocrEndpoint = `${process.env.CV_ENDPOINT}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=read`;
  const bothEndpoint = `${process.env.CV_ENDPOINT}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=caption,read`;

  let endpoint;
  if (doCaption && doOCR) endpoint = bothEndpoint;
  else if (doCaption) endpoint = captionEndpoint;
  else endpoint = ocrEndpoint;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": process.env.CV_API_KEY
    },
    body: JSON.stringify({ url: imageUrl })
  });

  if (!response.ok) try {
    const result: DescriptionError = await response.json();
    return `Request failed. (${response.status}) - ${result.error.code}: ${result.error.message}`;
  } catch (err) {
    return `Request failed. (${response.status})`;
  }
  
  const result: DescriptionResults = await response.json();
  let description = "";
  if (doCaption) description += `${result.captionResult!.text} (${result.captionResult!.confidence.toFixed(3)})`;
  if (doOCR) description += doCaption ? `: ${result.readResult!.content}` : result.readResult!.content;
  return description.replace('\n', ' \n');
}