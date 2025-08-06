import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import quizRoutes from './routes/quizRoutes.js';
import { setupSwagger } from './docs/swagger.js'; // ✅ NEW

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

setupSwagger(app); // ✅ NEW

app.use('/api', quizRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
});
