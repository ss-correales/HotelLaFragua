FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY reservas-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY reservas-service/app ./app

EXPOSE 8083

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8083"]
