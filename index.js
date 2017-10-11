/*
Copyright 2016 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

const JSON_FILE = __dirname + '/server/data.json';

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/getAll', (req, res) => {
  const options = {
    root: __dirname + '/server/'
  };
  const fileName = 'data.json';

  res.sendFile(fileName, options, (err) => {
    if (err) {
      res.status(500).send(JSON.stringify(err));
      return;
    }
  });
});

app.post('/api/add', (req, res) => {
  const newEvent = req.body;
  console.log(`Adding new item: ${JSON.stringify(newEvent)}`);
  const data = fs.readFileSync(JSON_FILE);
  // fs.readFile(JSON_FILE, (err, data) => {
  //   if (err) {
  //     res.status(500).send(JSON.stringify(err));
  //     return;
  //   }
    const events = JSON.parse(data);
    events.push(newEvent);
    const eventsJson = JSON.stringify(events, null, 2);
    try {
      fs.writeFileSync(JSON_FILE, eventsJson);
      res.status(200).send(JSON.stringify({ success: true }));
    } catch(err) {
      res.status(500).send(JSON.stringify(err));
      return;
    }
  //   fs.writeFileSync(JSON_FILE, eventsJson, err => {
  //     console.log('EVENTS COUNT AFTER: ', events.length);
  //     if (err) {
  //       res.status(500).send(JSON.stringify(err));
  //       return;
  //     }
  //     res.status(200).send(JSON.stringify({ success: true }));
  //   });
  // // });
});

const server = app.listen(process.env.PORT || 5000, () => {
  const port = server.address().port;
  console.log(`App listening at port ${port}`);
});
