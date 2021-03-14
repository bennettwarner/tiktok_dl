FROM nikolaik/python-nodejs:python3.9-nodejs15
COPY . /app
WORKDIR /app
RUN pip install --upgrade youtube_dl
RUN npm i
CMD node app.js
