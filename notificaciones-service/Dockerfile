FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY notificaciones-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY notificaciones-service/app ./app

EXPOSE 8088

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8088"]
