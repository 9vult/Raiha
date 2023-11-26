const fetch = require("node-fetch");

export const generateAIDescription = async (imageUrl: string, doCaption: boolean, doOCR: boolean) => {
  const captionEndpoint = `${process.env.CV_ENDPOINT}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=caption`;
  const ocrEndpoint = `${process.env.CV_ENDPOINT}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=read`;
  const bothEndpoint = `${process.env.CV_ENDPOINT}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=caption,read`;

  let endpoint;
  if (doCaption && doOCR) endpoint = bothEndpoint;
  else if (doCaption) endpoint = captionEndpoint;
  else endpoint = ocrEndpoint;

  const payload = JSON.stringify({ url: imageUrl });
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": `${process.env.CV_API_KEY}`
    },
    body: payload
  });
  if (response.ok && doCaption && !doOCR) {
    const result: any = await response.json();
    return `${result['captionResult']['text']} (${result['captionResult']['confidence'].toFixed(3)})`;
  }
  if (response.ok && doCaption && doOCR) {
    const result: any = await response.json();
    const caption = `${result['captionResult']['text']} (${result['captionResult']['confidence'].toFixed(3)})`;
    const text = result['readResult']['content'];
    const description = text.length > 0 ? `${caption}: ${text}`.replace('\n', ' \n') : caption;
    return description;
  }
  if (response.ok && !doCaption && doOCR) {
    const result: any = await response.json();
    const text = result['readResult']['content'];
    const description = text.replace('\n', ' \n');
    return description;
  }
  try {
    const result = await response.json();
    return `Request failed. (${response.status}) - ${result['error']['code']}: ${result['error']['message']}`;
  } catch (err) {
    return `Request failed. (${response.status})`;
  }
}