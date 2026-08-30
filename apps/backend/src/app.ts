import express, { Application } from 'express';
import { apiRouter } from '../router';

const app: Application = express();

app.use(express.json());
app.use('/api', apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[API Engine] Running on port ${PORT}`);
});

export default app;
