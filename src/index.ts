import express from 'express'
import fs from 'fs'
import path from 'path'

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

app.get('/dispatch/', (req, res) => {
    res
        .status(400)
        .json({
            message: 'Bad Request, no file specified'
        })
})

app.get('/dispatch/:file', (req, res) => {
    const file = String(req.params.file)

    if (file.split('.').length != 2) {
        return res
            .status(400)
            .json({
                message: 'Bad Request, file must be a valid file'
            })
    }

    const flight = file.split('.')[0].toUpperCase()
    const requestType = file.split('.')[1].toUpperCase()
    const filePath = path.join(__dirname, './dispatch/', file)
    let text = []

    switch (requestType) {
        case 'TST': {
            text.push('Test Successful')
            break;
        }

        default: {
            text.push('Unknown Request Type')
            break;
        }
    }

    text.push('Powered by vSpirit (https://vspirit.io)')

    for (let i = 0; i < text.length; i++) {
        text[i] = text[i].toUpperCase()
    }

    fs.writeFileSync(filePath, text.join('\n'), 'utf8')
    res
        .status(200)
        .sendFile(filePath)
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