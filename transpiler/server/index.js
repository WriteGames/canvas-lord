import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Server } from 'socket.io';

import { readTSFile } from '../shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = 3009;

const { PORT = DEFAULT_PORT } = process.env;

const inPath = path.join(__dirname, '../in');

const publicPath = path.join(__dirname, 'public');
const dataPath = path.join(__dirname, '../data');
const dataBackupPath = path.join(dataPath, 'backup');

const availableModules = new Map();

// get all inputs
const content = fs.readdirSync(inPath);
for (let i = 0; i < content.length; ++i) {
	const fileName = content[i];
	const filePath = path.join(inPath, content[i]);

	let cool = false;
	switch (path.extname(filePath)) {
		case '.ts':
			cool = true;
			break;
	}

	if (!filePath.endsWith('test.ts')) cool = false;

	if (!cool) continue;

	console.log(filePath);
	const exports = readTSFile(filePath);
	availableModules.set(fileName, {
		filePath,
		exports,
	});
}

const server = http.createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	let contentType = 'text/html';

	const showError = () => {
		res.writeHead(404, { 'Content-Type': contentType });
		res.end(undefined, 'utf-8');
	};

	const filePath = path.join(publicPath, req.url).split('?')[0];
	if (fs.existsSync(filePath)) {
		contentType = 'text/javascript';
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) return showError();
			res.writeHead(200, { 'Content-Type': contentType });
			const content = data.replace(DEFAULT_PORT, PORT);
			res.end(content, 'utf-8');
		});
	} else {
		showError();
	}
});
const io = new Server(server, {
	cors: (req, callback) => {
		let origin = '*';
		// if (req.headers.origin === adminOrigin) origin = [adminOrigin];
		callback(null, {
			origin,
			credentials: true,
		});
	},
});

const backupFile = (fileName) => {
	const src = path.join(dataPath, fileName);
	if (!fs.existsSync(src)) return;

	const stat = fs.statSync(src);
	const ext = path.extname(fileName);
	const editTime = stat.mtime
		.toISOString()
		.split('.')[0]
		.replaceAll(':', '-');

	const newFileName = [
		path.basename(fileName, ext),
		'__',
		editTime,
		ext,
	].join('');
	const dst = path.join(dataBackupPath, newFileName);
	fs.copyFileSync(src, dst);
};

const saveFile = (fileName, data) => {
	const json = JSON.stringify(data);
	const filePath = path.join(dataPath, fileName);
	backupFile(fileName);
	fs.writeFileSync(filePath, json);
};

const loadFile = (fileName) => {
	const filePath = path.join(dataPath, fileName);
	return fs.readFileSync(filePath, 'utf-8');
};

const available = [...availableModules.entries()];

io.on('connection', (socket) => {
	console.log('we have connection');

	const _available = available.map(([_, v]) => {
		const data = { ...v };
		delete data.exports.sourceFile;
		return [_, data];
	});

	socket.emit(
		'contents',
		JSON.stringify({
			available: _available,
			input: JSON.parse(loadFile('test.json')),
		}),
	);

	socket.on('chat message', (msg) => {
		console.log(msg);
		saveFile('test.json', msg);
	});
});

server.listen(PORT, () => {
	console.log(`Transpiler server running at http://localhost:${PORT}`);
});
