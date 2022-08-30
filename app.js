const express = require('express');
const mongoose = require('mongoose')
const users = require('./model/users');
const app = express()
const PORT = 8000

app.use(express.urlencoded({ extended: false }));//form data to JSON
app.use(express.json())// req body to JOSN

async function main() {
  await mongoose.connect('mongodb://localhost:27017/pagination')
  console.log('successfully connected to server ')
}
main()

app.post('/create', async (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Content can not be emtpy!" });
    return;
  }
  const params = req.body;
  const user = new users(params)
  await user.save()
    .then(data => {
      res.send(data)
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating a create operation"
      });
    })
})

app.get('/users', paginatedResults(users), (req, res) => {
  res.json(res.paginatedResults)
})
function paginatedResults(model) {
  return async (req, res, next) => {
    
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const startIndex = (page - 1) * limit// index is start at 0
    const endIndex = page * limit

    const results = {}

    if (endIndex < await model.countDocuments().exec()) {
      results.next = {
        page: page + 1,
        limit: limit
      }
    }

    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      }
    }
    try {
      results.results = await model.find().limit(limit).skip(startIndex).exec()
      res.paginatedResults = results
      next()
    } catch (e) {
      res.status(500).json({ message: e.message })
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} `);
})