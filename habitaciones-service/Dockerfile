FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY habitaciones-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY habitaciones-service/app ./app

EXPOSE 8082

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8082"]
