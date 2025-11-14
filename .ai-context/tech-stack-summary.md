# Technology Stack Summary

**Last Updated**: 2025-01-27
**Purpose**: Quick reference for key technologies and versions used in this project

## AI Processing Layer (Python)

- **Python**: 3.11+
- **FastAPI**: 0.121.2 - Async web framework for AI processing endpoints
- **LangGraph**: 1.0.3 - Agent orchestration and state management
- **LangChain**: 1.0.5 - LLM integration and chain building
- **LangChain Anthropic**: 1.0.3 - Claude integration
- **Pydantic**: 2.12.4 - Data validation and settings management
- **Playwright**: 1.56.0 - Web scraping
- **PyMuPDF**: 1.26.6 - PDF parsing
- **python-pptx**: 1.0.2 - PowerPoint parsing
- **python-docx**: 1.2.0 - Word document parsing
- **LangSmith**: 0.4.42 - Observability and tracing
- **Uvicorn**: 0.38.0 - ASGI server

## Backend API (Node.js/TypeScript)

- **Node.js**: 20.x
- **Express.js**: 5.1.0 - Web framework
- **TypeScript**: 5.9.3
- **@google-cloud/firestore**: ^8.0.0 - Database
- **@google-cloud/storage**: ^7.17.3 - File storage
- **@google-cloud/tasks**: ^6.2.1 - Async task queuing
- **@sendgrid/mail**: ^8.1.6 - Email delivery
- **Joi**: ^18.0.1 - Input validation
- **Multer**: ^2.0.2 - File upload handling

## Frontend (Vue.js/TypeScript)

- **Vue.js**: 3.5.24 - Frontend framework
- **TypeScript**: 5.9.3
- **Vite**: 7.2.2 - Build tool
- **Tailwind CSS**: 4.1.17 - Styling
- **Axios**: 1.13.2 - HTTP client
- **Vitest**: 4.0.8 - Testing framework

## Infrastructure

- **Google Cloud Platform**: Cloud Run, Firestore, Cloud Storage, Cloud Tasks
- **SendGrid**: Email delivery service
- **Anthropic Claude**: Primary LLM for agent processing
- **LangSmith**: LLM observability and tracing

## Development Tools

- **Black**: Python code formatter (line length: 100)
- **Flake8**: Python linter
- **ESLint**: JavaScript/TypeScript linter
- **Prettier**: Code formatter
- **Jest**: Backend testing
- **Vitest**: Frontend testing
- **Pytest**: Python testing

## Context7 Integration

Context7 is configured as an MCP server to provide up-to-date documentation for:
- Python libraries (FastAPI, LangGraph, LangChain, Pydantic)
- JavaScript/TypeScript frameworks (Express, Vue)
- Cloud services (GCP, SendGrid)

**Usage**: Add `use context7` to prompts to fetch latest documentation.

