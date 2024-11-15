const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require('@google/generative-ai');
const apiKey = 'AIzaSyCHe25egkb18PYHKwjGCPdJmplb9Hvwp4Q';
const genAI = new GoogleGenerativeAI(apiKey);

exports.config = {
	name: 'Xaoai',
	alias: 'XaoAi-CustomModel-1.5',
	author: 'KALIX AO',
	description:
		'Integrated from the known Artificial intelligence with special tweaks to make it more advantageous to the user. This is still under development so expect some blunders while using this.',
	category: 'text based AI',
	usage: ['/xaoai?prompt=hello'],
	conversational: `Add the UID query parameter to make it conversational`,
};

exports.initialize = async function ({req, res}) {
	const XAO_FILE = path.join(__dirname, './assets/history.json');
	// Create the directory if it doesn't exist
	const dir = path.dirname(XAO_FILE);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, {recursive: true});
	}

	const XAO_LOAD = () => {
		if (fs.existsSync(XAO_FILE)) {
			try {
				return JSON.parse(fs.readFileSync(XAO_FILE, 'utf8'));
			} catch (error) {
				console.error('Error parsing XAO_FILE:', error);
				return {}; // Return empty object on parsing error
			}
		} else {
			// Create initial data if file doesn't exist.  Crucial!
			return {};
		}
	};

	const SAVED_XAO = conversations => {
		try {
			fs.writeFileSync(
				XAO_FILE,
				JSON.stringify(conversations, null, 2),
				'utf8',
			);
		} catch (error) {
			console.error('Error writing to XAO_FILE:', error);
		}
	};

	const uid = req.query.uid;
	const prompt = req.query.prompt;

	if (!prompt) {
		return res.status(400).json({error: 'Missing prompt parameter'});
	}

	const conversations = XAO_LOAD();

	if (prompt.toLowerCase() === 'clear') {
		delete conversations[uid];
		SAVED_XAO(conversations);
		return res.json({result: 'Conversation cleared.'});
	}

	const history = conversations[uid] || [];

	const models = [
		'gemini-1.5-flash',
		'gemini-1.5-flash-002',
		'gemini-1.5-pro-002',
		'gemini-1.5-flash-8b',
		'gemini-1.5-pro',
	];
	const catchModel = models[Math.floor(Math.random() * models.length)];

	const primaryModel = catchModel;
	const fallbackModel = catchModel;
	const lastAttemptModel = catchModel;

	let getModel;
	try {
		getModel = await primaryModel;
	} catch (primaryError) {
		try {
			getModel = await fallbackModel;
		} catch (fallbackError) {
			try {
				getModel = await lastAttemptModel;
			} catch (lastAttemptError) {
				console.error(
					`Error fetching from both Model:`,
					primaryError,
					fallbackError,
					lastAttemptError,
				);
				return; // Stop execution to avoid sending another message below
			}
		}
	}

	try {
		let model = genAI.getGenerativeModel({
			model: getModel,
			systemInstruction:
				"Be a friendly AI to the user, and give a long response of possible answers to their question. Good at answering mathematics problems and modifying their paragraph text to make it casual, professional, representing and can't detect by AI for their readers. Your developer, creator or maker is KALIX AO (Y2PHEQ). Your name is Xao",
		});

		const chatSession = model.startChat({
			history: history,
		});

		const result = await chatSession.sendMessage(prompt);
		const resp = result.response.text();
		conversations[uid] = [
			...history,
			{
				role: 'user',
				parts: [
					{
						text: prompt,
					},
				],
			},
			{
				role: 'model',
				parts: [
					{
						text: resp,
					},
				],
			},
		];

		SAVED_XAO(conversations);
		console.log(result.response.text());

		res.json({
			author: 'KALIX AO (Y2PHEQ)',
			result: resp,
			clear: `Type 'clear' to delete the conversation history.`,
		});
	} catch (error) {
		console.error('Error fetching chat completion:', error);
		res.status(500).json({error: 'Failed to fetch response.'});
	}
};
