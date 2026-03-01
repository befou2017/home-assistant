import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve specific static files and directories
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Route to serve widget.css
app.get('/widget.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'widget.css'));
});

// Route for the main widget page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'widget.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
  console.log(`You can access it from your tablet on your local network using this device's IP address (e.g., http://<ip-address>:${port})`);
});
