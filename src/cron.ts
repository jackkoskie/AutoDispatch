import { schedule } from 'node-cron'
import axios from 'axios'
import getArrivalInfo from './getArrivalInfo'

export default () => {
    // Auto Send Arrival Info
    schedule('* * * * *', async () => {
        console.log('Looking For Aircraft Approaching TOD')
        const poll = await axios.get(`http://www.hoppie.nl/acars/system/connect.html?from=${process.env.CALLSIGN}&to=${process.env.CALLSIGN}&type=poll&logon=${process.env.HOPPIE_LOGON}`)

        let pollData = poll.data.split('} {')



        pollData[0] = pollData[0].replace('ok {', '')
        pollData[pollData.length - 1] = pollData[pollData.length - 1].replace('}}', '}')
        let data = []


        for (let i = 0; i < pollData.length; i++) {
            const request = pollData[i];
            if (request.includes('progress') && request.includes('ETA/')) {
                let formattedData = request.replace('{', '').replace('}', '').split(' ')

                if (formattedData[formattedData.length - 1] === '') formattedData.pop()

                data.push(formattedData)
            }
        }

        if (data.length < 1) {
            return console.log('No Aircraft Approaching TOD')
        }

        console.info(`Found ${data.length} Aircraft Approaching TOD`)

        data.forEach(async (report) => {

            const flightInfo = {
                callsign: report[0],
                dep: report[2].split('/')[0],
                arr: report[2].split('/')[1],
            }
            const eta = report[5].split('/')[1]

            let arrivalInfo = await getArrivalInfo(flightInfo, eta)

            arrivalInfo.push(process.env.FOOTER || '')

            for (let i = 0; i < arrivalInfo.length; i++) {
                arrivalInfo[i] = arrivalInfo[i].toUpperCase()
            }

            await axios.post(`http://www.hoppie.nl/acars/system/connect.html?from=${process.env.CALLSIGN}&to=${flightInfo.callsign}&type=telex&logon=${process.env.HOPPIE_LOGON}&packet=${encodeURI(arrivalInfo.join('\n'))}`)

            console.info(`Sent Arrival Info to ${flightInfo.callsign}`)
        });
    })
}