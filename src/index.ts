import express from 'express'

import dotenv from 'dotenv'
dotenv.config()
const port = process.env.PORT || 3000

const app = express();

app.all('/', (req, res) => {
    res
        .status(200)
        .json({
            message: 'Server Online'
        })
})

app.all('*', (req, res) => {
    res
        .status(404)
        .json({
            message: 'Not found'
        })
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})