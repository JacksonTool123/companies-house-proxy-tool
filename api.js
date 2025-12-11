// api.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

const CH_API_KEY = process.env.CH_API_KEY;
const baseURL = 'https://api.company-information.service.gov.uk';

const getAuthHeader = () => {
  const token = Buffer.from(`${CH_API_KEY}:`).toString('base64');
  return `Basic ${token}`;
};

const handleProxy = async (req, res, endpointPath) => {
  const { companyNumber } = req.body;

  if (!companyNumber) {
    return res.status(400).json({ error: 'companyNumber is required' });
  }

  try {
    const url = `${baseURL}${endpointPath.replace('{companyNumber}', companyNumber)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Route definitions for each tool function
app.post('/GetCompanyByNumber', (req, res) =>
  handleProxy(req, res, '/company/{companyNumber}')
);

app.post('/GetRegisteredOfficeAddress', (req, res) =>
  handleProxy(req, res, '/company/{companyNumber}/registered-office-address')
);

app.post('/GetCompanyOfficers', (req, res) =>
  handleProxy(req, res, '/company/{companyNumber}/officers')
);

app.post('/GetCompanyFilingList', (req, res) =>
  handleProxy(req, res, '/company/{companyNumber}/filing-history')
);

app.post('/GetCompanyChargeList', (req, res) =>
  handleProxy(req, res, '/company/{companyNumber}/charges')
);

app.get('/', (req, res) => {
  res.send('Companies House Plugin API is live.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
