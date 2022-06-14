import { schedule } from 'node-cron'
import axios from 'axios'
import qs from 'qs'

import getArrivalInfo from './getArrivalInfo'

const HOPPIE_URL = 'http://www.hoppie.nl/acars/system/connect.html?'

const hoppieString = (
  type = 'poll',
  packet: string | undefined = undefined
) => {
  const CALLSIGN = process.env.CALLSIGN
  const HOPPIE_LOGON = process.env.HOPPIE_LOGON

  if (!CALLSIGN || !HOPPIE_LOGON) {
    throw new Error('CALLSIGN or HOPPIE_LOGON environment vars not set.')
  }

  const query = qs.stringify({
    logon: HOPPIE_LOGON,
    from: CALLSIGN,
    to: CALLSIGN,
    type,
    packet,
  })

  return `${HOPPIE_URL}${query}`
}

export default () => {
  // Auto Send Arrival Info
  // TODO: replace with scheduler that supports async such as Bree
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  schedule('* * * * *', async () => {
    console.log('Looking For Aircraft Approaching TOD')

    const pendingMessages = ((await axios.get(hoppieString())).data as string)
      .replace(/^ok {/, '')
      .replace(/}}$/, '}')
      .split('} {')

    const data: string[][] = []
    for (const request of pendingMessages) {
      if (request.includes('progress') && request.includes('ETA/')) {
        const formattedData = request
          .replace('{', '')
          .replace('}', '')
          .split(' ')
          .filter((data) => data.length > 0)

        data.push(formattedData)
      }
    }

    if (data.length === 0) {
      return console.log('No Aircraft Approaching TOD')
    }

    return data.map(async (report) => {
      const flightInfo = {
        callsign: report[0],
        dep: report[2].split('/')[0],
        arr: report[2].split('/')[1],
      }
      const arrivalInfo = getArrivalInfo(flightInfo)
      arrivalInfo.push(process.env.FOOTER ?? '')

      return await axios.post(
        hoppieString(
          'telex',
          encodeURI(arrivalInfo.map((arr) => arr.toUpperCase()).join('\n'))
        )
      )
    })
  })
}
