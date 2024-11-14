const fs = require('fs');
const cheerio = require('cheerio');

exports.config = {
	name: 'Random',
	alias: 'Random Video',
	category: 'Pornhub',
	author: 'KALIX AO',
	description: `Get random video from pornhub.`,
	usage: ['/random'],
	conversational: `Not suitable for minor.`,
};

exports.initialize = async function ({ req, res }) {
	try {
		const response = await axios.get('https://www.pornhub.com');
		const html = response.data;
		const $ = cheerio.load(html);

		const videos = [];
		$('li.videoBox a').each((i, element) => {
			const title = $(element).attr('title');
			const link = `https://www.pornhub.com${$(element).attr('href')}`;
			videos.push({
				title,
				link,
			});
		});

		const randomVideo = videos[Math.floor(Math.random() * videos.length)];
		res.json(randomVideo);
	} catch (error) {
		console.error('Error fetching chat completion:', error);
		res.status(500).json({ error: 'Failed to fetch response.' });
	}
};
