# behold, the whale


FROM python:3.11-slim
#config
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
#set working directory
WORKDIR /app
# update packages to latest
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
# install flask requirements
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .
# execute this
CMD ["gunicorn", "--workers=4", "--timeout=60", "--bind", "0.0.0.0:5000", "wsgi:app", "eventlet"]
