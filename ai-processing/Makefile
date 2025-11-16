.PHONY: help install format lint test clean

help:
	@echo "Available commands:"
	@echo "  make install    - Install development dependencies"
	@echo "  make format     - Format code with Black"
	@echo "  make lint       - Run linters (Black check + Flake8)"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Remove cache files"

install:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

format:
	black src/ tests/

lint:
	black --check src/ tests/
	flake8 src/ tests/  # Uses setup.cfg configuration (E501 ignored)

test:
	pytest tests/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +

