const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const openai = new OpenAI({
	baseURL: 'https://api.deepinfra.com/v1/openai',
	apiKey: '25DBLuubVjKhksIy6XlohzWR2XBkNcdn',
});

const model = 'KoboldAI/LLaMA2-13B-Tiefighter';

exports.config = {
	name: 'KoboldAI',
	alias: 'LLaMA2-13B-Tiefighter',
	category: 'text based AI',
	author: 'KALIX AO',
	description: `LLaMA2-13B-Tiefighter is a highly creative and versatile language model, fine-tuned for storytelling, adventure, and conversational dialogue. It combines the strengths of multiple models and datasets, including retro-rodeo and choose-your-own-adventure, to generate engaging and imaginative content. With its ability to improvise and adapt to different styles and formats, Tiefighter is perfect for writers, creators, and anyone looking to spark their imagination.`,
	usage: ['/koboldai?prompt=hello'],
	conversational: `Add the UID query parameter to make it conversational`,
};

exports.initialize = async function ({ req, res }) {
	const xaoPath = path.join(__dirname, './assets/history.json');
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
		// More robust prompt construction, handling potential undefined.
		const messages = [
			...history,
			{
				role: 'system',
				content:
					'Be a helpful genius assistant, always give a possible answer.',
			},
			{ role: 'user', content: prompt },
		];

		const completion = await openai.chat.completions.create({
			messages,
			model: model,
		});

		const assistantResponse = completion.choices[0]?.message?.content;

		if (!assistantResponse) {
			console.error('AI response missing content:', completion);
			return res
				.status(500)
				.json({ error: 'Failed to get response from XaoAPI.' });
		}

		conversations[uid] = messages.concat({
			role: 'assistant',
			content: assistantResponse,
		});
		xaoSavePath(conversations);

		res.json({
			author: 'KALIX AO (Y2PHEQ)',
			result: assistantResponse,
			clear: `Type 'clear' to delete the conversation history.`,
		});
	} catch (error) {
		console.error('Error fetching chat completion:', error);
		res.status(500).json({ error: 'Failed to fetch response.' });
	}
};
