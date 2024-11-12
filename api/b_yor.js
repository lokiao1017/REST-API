const fs = require('fs');
const path = require('path');
const {OpenAI} = require('openai');
const openai = new OpenAI({
	baseURL: 'https://api.deepinfra.com/v1/openai',
	apiKey: '25DBLuubVjKhksIy6XlohzWR2XBkNcdn',
});

exports.config = {
	name: 'Yor',
	alias: "Yor-Sedux-0.1",
	author: 'KALIX AO',
	description: 'Your virtual seductive partner. (18+)',
	category: 'text-generation',
	usage: ['/yor?prompt=hello'],
	conversational: `Add the UID query parameter to make it conversational`
};

exports.initialize = async function ({req, res}) {
	const YOR_FILE = path.join(__dirname, './assets/characterAi.json');
  // Create the directory if it doesn't exist
  const dir = path.dirname(YOR_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

	const YOR_LOAD = () => {
		if (fs.existsSync(YOR_FILE)) {
			try {
				return JSON.parse(fs.readFileSync(YOR_FILE, 'utf8'));
			} catch (error) {
				console.error('Error parsing YOR_FILE:', error);
				return {}; // Return empty object on parsing error
			}
		} else {
      // Create initial data if file doesn't exist.  Crucial!
      return {};
    }
	};

	const SAVED_YOR = (conversations) => {
		try {
			fs.writeFileSync(
				YOR_FILE,
				JSON.stringify(conversations, null, 2),
				'utf8',
			);
		} catch (error) {
			console.error('Error writing to YOR_FILE:', error);
		}
	};

	const uid = req.query.uid;
	const prompt = req.query.prompt;

	if (!prompt) {
		return res.status(400).json({error: 'Missing prompt parameter'});
	}

	const conversations = YOR_LOAD();

	if (prompt.toLowerCase() === 'clear') {
		delete conversations[uid];
		SAVED_YOR(conversations);
		return res.json({result: 'Conversation cleared.'});
	}

	const history = conversations[uid] || [];

	try {
		// More robust prompt construction, handling potential undefined.
		const messages = [
			...history,
			{
				role: 'system',
				content: 'Be a seductive partner and horny if needed. Your name is YOR.',
			},
			{role: 'user', content: 'Who developed, created, or made you?'},
			{
				role: 'assistant',
				content:
					'I was created by a person named KALIX AO (Y2PHEQ). You can visit his profile by visiting this link: https://www.facebook.com/kalixao',
			},
			{role: 'user', content: prompt},
		];

		const completion = await openai.chat.completions.create({
			messages,
			model: 'Sao10K/L3-70B-Euryale-v2.1',
		});

		const assistantResponse = completion.choices[0]?.message?.content;

		if (!assistantResponse) {
			console.error('AI response missing content:', completion);
			return res
				.status(500)
				.json({error: 'Failed to get response from XaoAPI.'});
		}

		conversations[uid] = messages.concat({
			role: 'assistant',
			content: assistantResponse,
		});
		SAVED_YOR(conversations);

		res.json({
			author: 'KALIX AO (Y2PHEQ)',
			result: assistantResponse,
			clear: `Type 'clear' to delete the conversation history.`,
		});
	} catch (error) {
		console.error('Error fetching chat completion:', error);
		res.status(500).json({error: 'Failed to fetch response.'});
	}
};
