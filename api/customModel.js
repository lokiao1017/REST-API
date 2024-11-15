const ai = require('unlimited-ai');

exports.config = {
	name: 'Cat',
	alias: 'Custom-Model-1115',
	category: 'text based AI',
	author: 'KALIX AO',
	description: `A more practical approach is to use GPT-4 to generate cat-like text and responses. This involves carefully crafted prompts to guide the model to mimic different cat behaviors, like a playful kitten or a grumpy old cat.  While this can create a simulated cat persona, it's not a dedicated, persistent AI model, but rather a result of your prompts and interactions with GPT-4.`,
	usage: ['/cat?prompt=hello'],
	conversational: `Add the UID query parameter to make it conversational`,
};

exports.initialize = async function ({ req, res }) {
	const xaoPath = path.join(__dirname, './assets/customModel.json');
	// Create the directory if it doesn't exist
	const dir = path.dirname(xaoPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const xaoLoadPath = () => {
		if (fs.existsSync(xaoPath)) {
			try {
				return JSON.parse(fs.readFileSync(xaoPath, 'utf8'));
			} catch (error) {
				console.error('Error parsing xaoPath:', error);
				return {}; // Return empty object on parsing error
			}
		} else {
			// Create initial data if file doesn't exist.  Crucial!
			return {};
		}
	};

	const xaoSavePath = conversations => {
		try {
			fs.writeFileSync(
				xaoPath,
				JSON.stringify(conversations, null, 2),
				'utf8',
			);
		} catch (error) {
			console.error('Error writing to xaoPath:', error);
		}
	};

	const uid = req.query.uid;
	const prompt = req.query.prompt;

	if (!prompt) {
		return res.status(400).json({ error: 'Missing prompt parameter' });
	}

	const conversations = xaoLoadPath();

	if (prompt.toLowerCase() === 'clear') {
		delete conversations[uid];
		xaoSavePath(conversations);
		return res.json({ result: 'Conversation cleared.' });
	}

	const history = conversations[uid] || [];

	try {
		// Define the system prompt
		const systemPrompt =
			"I'm just a fluffy feline friend of KALIX AO. I'm quite good at understanding what you're asking!";

		// Generate a response using gpt-4 model
		const response = await ai.generate('gpt-4', [
			...history,
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: prompt },
		]);

		conversations[uid] = messages.concat({
			role: 'assistant',
			content: response,
		});
		xaoSavePath(conversations);

		res.json({
			author: 'KALIX AO (Y2PHEQ)',
			result: response,
			clear: `Type 'clear' to delete the conversation history.`,
		});
	} catch (error) {
		console.error('Error fetching chat completion:', error);
		res.status(500).json({ error: 'Failed to fetch response.' });
	}
};
