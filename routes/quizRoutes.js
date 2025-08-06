import express from 'express';
import { supabase } from '../supabase/client.js';
import { generateQuestionWithOpenRouter } from '../services/openrouterService.js';

const router = express.Router();

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Get all quiz questions
 *     responses:
 *       200:
 *         description: A list of all questions
 */
router.get('/questions', async (req, res) => {
  const { data, error } = await supabase.from('questions').select('*');
  res.json(data);
});

/**
 * @swagger
 * /question/add:
 *   post:
 *     summary: Add a new quiz question
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correct_index:
 *                 type: integer
 *     responses:
 *       200:
 *         description: The inserted question
 */
router.post('/question/add', async (req, res) => {
  const { text, options, correct_index } = req.body;
  const { data, error } = await supabase.from('questions').insert([{ text, options, correct_index }]);
  res.json(data);
});

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: Delete a quiz question by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Question deleted
 */
router.delete('/questions/:id', async (req, res) => {
  const id = req.params.id;
  await supabase.from('questions').delete().eq('id', id);
  res.sendStatus(204);
});

/**
 * @swagger
 * /submit:
 *   post:
 *     summary: Submit answers and get score and badge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: object
 *                 additionalProperties:
 *                   type: integer
 *               username:
 *                 type: string
 *                 example: Anonymous
 *     responses:
 *       200:
 *         description: Quiz results with score and badge
 */
router.post('/submit', async (req, res) => {
  const { answers, username = "Anonymous" } = req.body;

  const { data: questions } = await supabase.from('questions').select('*');
  const questionsMap = Object.fromEntries(questions.map(q => [q.id, q]));

  let score = 0;
  for (const [qid, selected] of Object.entries(answers)) {
    if (questionsMap[qid] && questionsMap[qid].correct_index === selected) {
      score++;
    }
  }

  let badge = "🚰 Water Learner";
  if (score >= 8) badge = "💧 Water Guru";
  else if (score >= 5) badge = "🌊 Water Saver";

  await supabase.from('user_scores').insert([{ username, score, badge }]);
  res.json({ score, badge });
});

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get top quiz scores
 *     responses:
 *       200:
 *         description: Leaderboard top 10 scores
 */
router.get('/leaderboard', async (req, res) => {
  const { data } = await supabase.from('user_scores').select('*').order('score', { ascending: false }).limit(10);
  res.json(data);
});

/**
 * @swagger
 * /badges/{username}:
 *   get:
 *     summary: Get badges for a specific user
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user badges
 */
router.get('/badges/:username', async (req, res) => {
  const username = req.params.username;
  const { data } = await supabase.from('user_scores').select('*').eq('username', username);
  const badges = [...new Set(data.map(entry => entry.badge))];
  res.json({ username, badges });
});

/**
 * @swagger
 * /ai/generate:
 *   post:
 *     summary: Generate a new quiz question using AI
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 example: water pollution
 *     responses:
 *       200:
 *         description: AI-generated question object
 *       500:
 *         description: Error generating question
 */
router.post('/ai/generate', async (req, res) => {
  try {
    const topic = req.body.topic || "water conservation";
    const content = await generateQuestionWithOpenRouter(topic);
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message || "Error generating question." });
  }
});

export default router;

