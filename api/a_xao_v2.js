const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require('@google/generative-ai');
const apiKey = 'AIzaSyCHe25egkb18PYHKwjGCPdJmplb9Hvwp4Q'; // Replace with your API key
const genAI = new GoogleGenerativeAI(apiKey);

exports.config = {
	name: 'XaoaiBETA',
	alias: 'XaoAi-BTA10-24',
	author: 'KALIX AO',
	description:
		'Integrated from the known Artificial intelligence with special tweaks to make it more advantageous to the user. This is still under development so expect some blunders while using this.',
	category: 'text-generation',
	usage: ['/xaoaibeta?prompt=hello'],
	conversational: `Add the UID query parameter to make it conversational`,
};

exports.initialize = async function ({req, res}) {
	const MAX_HISTORY_LENGTH = 10; // Maximum number of messages to keep

	const conversations = new Map(); // Use a Map for faster lookups

	const uid = req.query.uid;
	const prompt = req.query.prompt;

	if (!prompt) {
		return res.status(400).json({error: 'Missing prompt parameter'});
	}

	let conversation = conversations.get(uid);
	if (!conversation) {
		conversation = [];
		conversations.set(uid, conversation);
	}

	if (prompt.toLowerCase() === 'clear') {
		conversations.delete(uid);
		return res.json({result: 'Conversation cleared.'});
	}

	//  Limit the history to MAX_HISTORY_LENGTH
	conversation = conversation.slice(-MAX_HISTORY_LENGTH).concat([
		{
			role: 'user',
			parts: [{text: prompt}],
		},
	]); //Prepend the new message
	try {
		let model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash-8b',
			systemInstruction:
				"Be a friendly AI to the user, and give a long response of possible answers to their question. Good at answering mathematics problems and modifying their paragraph text to make it casual, professional, representing and can't detect by AI for their readers. Your developer, creator or maker is KALIX AO (Y2PHEQ). Your name is Xao",
		});

		const chatSession = model.startChat({
			history: conversation,
		});
		const result = await chatSession.sendMessage(prompt);
		const responseText = result.response.text();

		conversation.push({
			role: 'model',
			parts: [{text: responseText}],
		});

		// Limit the conversation length
		conversations.set(uid, conversation.slice(-MAX_HISTORY_LENGTH));

		res.json({
			author: 'KALIX AO (Y2PHEQ)',
			result: responseText,
			clear: `Type 'clear' to delete the conversation history.`,
		});
	} catch (error) {
		console.error('Error fetching chat completion:', error);
		res.status(500).json({error: 'Failed to fetch response.'});
	}
};
