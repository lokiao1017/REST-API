const fs = require('fs');
const path = require('path');
const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require('@google/generative-ai');
const {GoogleAIFileManager} = require('@google/generative-ai/server'); // Import FileManager

const apiKey = 'AIzaSyCHe25egkb18PYHKwjGCPdJmplb9Hvwp4Q';
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey); // Initialize FileManager

exports.config = {
	name: 'XaoaiBETA',
	alias: 'XAOIMG-BTA7-06-12',
	author: 'KALIX AO',
	description:
		'Integrated from the known Artificial intelligence with special tweaks to make it more advantageous to the user. This is still under development so expect some blunders while using this.',
	category: 'text-generation',
	usage: ['/xaoaibeta?prompt=hello'],
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
	let prompt = req.query.prompt; // Changed to let for potential modification
  let imageURL = req.query.imageURL;

	if (!prompt) {
		return res.status(400).json({error: 'Missing prompt parameter'});
	}

	const conversations = XAO_LOAD();

	//Handle file uploads if present
	let uploadedFiles = [];
	if (req.files && req.files.length > 0) {
		for (const file of req.files) {
			try {
				const uploadedFile = await fileManager.uploadFile(file.path, {
					mimeType: file.mimetype,
					displayName: file.name,
				});
				uploadedFiles.push(uploadedFile.file);
				// Construct the prompt with file URIs
				prompt += ` ${uploadedFile.file.uri}`;
			} catch (uploadError) {
				console.error('Error uploading file:', uploadError);
				return res.status(500).json({error: 'Failed to upload file.'});
			}
		}
	}

	if (prompt.toLowerCase() === 'clear') {
		delete conversations[uid];
		SAVED_XAO(conversations);
		return res.json({result: 'Conversation cleared.'});
	}

	const history = conversations[uid] || [];

	try {
		let model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash-8b',
			systemInstruction:
				"Be a friendly AI to the user, and give a long response of possible answers to their question. Good at answering mathematics problems and modifying their paragraph text to make it casual, professional, representing and can't detect by AI for their readers.",
		});

		const chatSession = model.startChat({
			history: [
				...history,
				{
					role: 'user',
					parts: [
						{
							text: "what's your name",
						},
					],
				},
				{
					role: 'model',
					parts: [
						{
							text: "As a large language model, I don't have a personal name like humans do. You can call me Xao. You can choose whatever you find easiest to remember! \n\nI'm here to help you with a variety of tasks!",
						},
					],
				},
				{
					role: 'user',
					parts: [
						{
							text: 'who created you?',
						},
					],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'I was created by a person named KALIX AO (Y2PHEQ) you can visit his profile by visiting this link: https://www.facebook.com/kalixao',
						},
					],
				},
				{
					role: 'user',
					parts: [
						{
							text: 'who made you?',
						},
					],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'I was created by a person named KALIX AO (Y2PHEQ) you can visit his profile by visiting this link: https://www.facebook.com/kalixao',
						},
					],
				},
				{
					role: 'user',
					parts: [
						{
							text: "who's your developer?",
						},
					],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'I was created by a person named KALIX AO (Y2PHEQ) you can visit his profile by visiting this link: https://www.facebook.com/kalixao',
						},
					],
				},
				{
					role: 'user',
					parts: [
						{
							text: 'organization, groups',
						},
					],
				},
				{
					role: 'model',
					parts: [
						{
							text: "I'm made from the Philippines country and was developed by KALIX AO (Y2PHEQ) by integrating me with known Artificial intelligence to help users in some possible ways. Big shout out to the ChatBot Community!",
						},
					],
				},
			],
		});

		// Send the (potentially modified) prompt
		const result = await chatSession.sendMessage(prompt);
		const resp = result.response.text();

		// Update conversation history WITH uploaded file URIs if any
		const userMessageParts = [{text: prompt}];
		if (uploadedFiles.length > 0) {
			uploadedFiles.forEach(file => {
				userMessageParts.push({
					fileData: {
						mimeType: file.mimeType,
						fileUri: file.uri,
					},
				});
			});
		}

		conversations[uid] = [
			...history,
			{
				role: 'user',
				parts: userMessageParts,
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
