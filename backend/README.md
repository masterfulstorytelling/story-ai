# Story Evaluation API Backend

Backend service for the Corporate Storytelling Evaluation Tool MVP. Provides REST API endpoints for submitting content, retrieving evaluation results, and monitoring system metrics.

## Features

- **Content Submission**: Submit website URLs and/or files (PDF, PPTX, DOCX) for evaluation
- **Status Tracking**: Check evaluation status and retrieve results
- **Performance Metrics**: Monitor processing times and success rates
- **Rate Limiting**: Prevents abuse with configurable limits
- **Error Tracking**: Comprehensive error logging and monitoring

## API Documentation

Interactive API documentation is available via Swagger UI:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api-docs.json`

### Endpoints

#### POST `/v1/evaluations`
Submit content (URL and/or files) for evaluation.

**Request:**
- `multipart/form-data`
  - `email` (required): Email address for receiving the report
  - `url` (optional): Website URL to evaluate
  - `files` (optional): PDF, PPTX, or DOCX files (max 50MB each)
  - `user_provided_audience` (optional): Target audience description

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "status": "pending",
  "submitted_at": "2025-01-15T10:00:00Z",
  "estimated_completion_time": "2025-01-15T10:10:00Z",
  "message": "Your evaluation request has been received..."
}
```

#### GET `/v1/evaluations/:id`
Get evaluation status and results.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "completed",
  "submitted_at": "2025-01-15T10:00:00Z",
  "email": "user@example.com",
  "result": {
    "audiences": [...],
    "assessments": {...},
    "report": {...},
    "validated_citations": [...]
  }
}
```

#### GET `/v1/metrics`
Get performance metrics.

**Query Parameters:**
- `window` (optional): Time window in milliseconds

**Response:** `200 OK`
```json
{
  "summary": {
    "totalSubmissions": 100,
    "successRate": 0.95,
    "averageProcessingTimeMs": 300000
  },
  "metrics": {...}
}
```

#### GET `/health`
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

## Setup

### Prerequisites

- Node.js 20.x
- npm or yarn
- Google Cloud Project with:
  - Firestore
  - Cloud Storage
  - Cloud Tasks
  - Cloud Logging

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Google Cloud
GCP_PROJECT_ID=your-project-id
FIRESTORE_PROJECT_ID=your-project-id
CLOUD_STORAGE_BUCKET=your-bucket-name
CLOUD_TASKS_LOCATION=us-central1
CLOUD_TASKS_QUEUE=story-eval-queue

# SendGrid
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@example.com

# AI Processing Service
AI_PROCESSING_SERVICE_URL=http://localhost:8000
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Watch mode
npm test:watch
```

## Linting

```bash
npm run lint
```

## Architecture

- **Express.js**: Web framework
- **TypeScript**: Type safety
- **Firestore**: Database for evaluation requests and results
- **Cloud Storage**: File storage for uploaded documents
- **Cloud Tasks**: Async job processing
- **SendGrid**: Email delivery
- **Swagger/OpenAPI**: API documentation

## Rate Limiting

- **Email-based**: 3 submissions per email per 24 hours
- **IP-based**: 5 submissions per IP per hour

## Error Handling

All errors are logged with context and stack traces. Error responses follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {...}  // Development only
}
```

## Monitoring

- **Cloud Logging**: All logs are sent to Google Cloud Logging
- **Error Tracking**: Errors are tracked with context
- **Performance Metrics**: Processing times and success rates are collected
- **Alerting**: Automatic alerts for high error rates and long processing times

## License

ISC

