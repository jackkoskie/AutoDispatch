import express from 'express'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

import routes from './data/routes'
import getArrivalInfo from './getArrivalInfo'

dotenv.config()

if (
  !process.env.AVWX_TOKEN ||
  !process.env.HOPPIE_LOGON ||
  !process.env.CALLSIGN
) {
  throw new Error('Missing environment variables')
}

import cron from './cron'

cron()

const port = process.env.PORT ?? 3000

const app = express()

app.all('/', (req, res) => {
  res.status(200).json({
    message: 'Server Online',
  })
})

app.get('/dispatch/', (req, res) => {
  res.status(400).json({
    message: 'Bad Request, no file specified',
  })
})

app.get('/dispatch/:file', (req, res) => {
  const file = String(req.params.file).toUpperCase()

  if (file.split('.').length != 2) {
    return res.status(400).json({
      message: 'Bad Request, file must be a valid file',
    })
  }

  const flight = file.split('.')[0]
  const requestType = file.split('.')[1]
  const filePath = path.join(__dirname, './files/', file)
  const flightInfo = routes.find((route) => route.callsign === flight)
  const text = []

  if (!flightInfo) {
    text.push(`Flight ${flight} not found`)
  } else {
    switch (requestType) {
      case 'TST': {
        text.push('Test Successful')
        break
      }

      case 'ARV': {
        const arrivalText = getArrivalInfo(flightInfo)
        arrivalText.forEach((line) => {
          text.push(line)
        })
      }
    }
  }

  text.push(process.env.FOOTER ?? '')

  fs.writeFileSync(filePath, text.join('\n').toUpperCase())
  res.status(200).sendFile(filePath)
})

app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Not found',
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
