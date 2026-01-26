import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const distPath = path.join(__dirname, 'dist/triskeltrails/browser');

// Serve static files from dist directory
app.use(express.static(distPath));

// SPA routing - serve index.html only for non-file routes
app.get('/*', (req, res) => {
  // Check if the requested file exists
  const filePath = path.join(distPath, req.path);
  if (existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
