# Use official lightweight Python image
FROM python:3.11-slim

# Set environment variables for isolated sandbox execution
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create a non-root user for security (Sandbox Execution Principle)
RUN useradd --create-home appuser
WORKDIR /home/appuser/app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the 3-layer architecture and UI
COPY architecture/ ./architecture/
COPY navigation/ ./navigation/
COPY tools/ ./tools/
COPY app.py .
COPY batch_webhook.py .

# Enforce strict ownership
RUN chown -R appuser:appuser /home/appuser/app
USER appuser

# Expose ports for Streamlit UI (8501) and Webhook Listener (8000)
EXPOSE 8501
EXPOSE 8000

# By default, start the Streamlit UI. 
# To run the webhook batch processor instead, override the CMD with:
# CMD ["uvicorn", "batch_webhook:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
