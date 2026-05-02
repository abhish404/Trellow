import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 3000;
// your current code (broken)
app.listen(PORT, '0.0.0.0', () => {

    // fix — add this line above it
    const PORT = process.env.PORT || 8080
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`trellow api on :${PORT}`)
    })