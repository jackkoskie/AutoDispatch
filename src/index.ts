import express from 'express'
import fs from 'fs'
import path from 'path'
import routes from './data/routes'
import gates from './data/gates'
import axios from 'axios'

import dotenv from 'dotenv'
dotenv.config()
const port = process.env.PORT || 3000

const app = express();

/**
 * Retreives a valid gate for the given airport and international status
 * @param airport 4 Letter ICAO airport code
 * @param international If the flight is international or not
 * @returns Gate object or null if not found
 */
const getGate = (airport: String, international: Boolean) => {
    if (airport.length != 4) {
        throw new Error('Invalid airport code')
    }

    let posibleGates = gates.filter(gate => gate.icao === airport && gate.international === international)

    if (posibleGates.length == 0) {
        posibleGates = gates.filter(gate => gate.icao === airport)

        if (posibleGates.length == 0) {
            return null
        }
    }

    let gate = posibleGates[Math.floor(Math.random() * posibleGates.length)]

    return gate || null
}

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
    let date = new Date(Date.now())
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
                const gate = getGate(flightInfo.arr, flightInfo.dep.toUpperCase().startsWith('K') ? true : false)
                const arrivalWeather = await axios.get(`https://avwx.rest/api/metar/${flightInfo.arr}?`, {
                    headers: {
                        Authorization: `Bearer ${process.env.AVWX_KEY}`
                    }
                })

                text.push(
                    `ACARS Begin ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                    `Flight ${flightInfo.callsign} ${flightInfo.dep} ${flightInfo.arr}`,
                    `Arrival Information`,
                    `Weather ${flightInfo.arr}`,
                    `${arrivalWeather.data.raw}`,
                    `Gate ${flightInfo.arr}/${gate}`,
                    `ACARS End`
                )
            }

            default: {
                text.push('Unknown Request Type')
                break;
            }
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