const router = require("express").Router();
const { readdirSync } = require('fs-extra');
const path = require('path');
const { green, blue, cyan } = require('kleur');

try {
  let n = 0;
  const srcPath = path.join(__dirname, "/api/");
  const srcPath_ph = path.join(__dirname, "/api/pornhub");
  const apiFiles = readdirSync(srcPath && srcPath_ph).filter(file => file.endsWith(".js"));

  for (const file of apiFiles) {
    const filePath = path.join(srcPath && srcPath, file);
    const script = require(filePath);
    if (script.config && script.initialize) {
      const routePath = '/' + script.config.name;
      router.get(routePath, (req, res) => script.initialize({ req, res }));
      global.api.set(script.config.name, script); // Register API to global.api map
      n++;
      console.log(`${green('[ XAO ]')} ${cyan('→')} ${blue(`Successfully loaded ${file}`)}`);
    }
  }

  console.log(`${green('[ XAO ]')} ${cyan('→')} ${blue(`Successfully loaded ${n} API files`)}`);
} catch (error) {
  console.log(error);
}

module.exports = router;