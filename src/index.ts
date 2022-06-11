import express from 'express'
import fs from 'fs'
import path from 'path'
import routes from './data/routes'
import getArrivalInfo from './getArrivalInfo'

import dotenv from 'dotenv'
dotenv.config()

import cron from './cron'
cron()

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

app.get('/dispatch/:file', async (req, res) => {
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
    const flightInfo = routes.find(route => route.callsign === flight)
    let text = []

    if (!flightInfo) {
        text.push(`Flight ${flight} not found`)
    } else {

        switch (requestType) {
            case 'TST': {
                text.push('Test Successful')
                break;
            }

            case 'ARV': {
                const arrivalText = await getArrivalInfo(flightInfo)
                arrivalText.forEach(line => {
                    text.push(line)
                });
            }

            default: {
                text.push('Unknown Request Type')
                break;
            }
        }

    }

    text.push(process.env.FOOTER || '')

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