import gates from './data/gates'
import axios from 'axios'

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

export default async (flightInfo: { arr: String; dep: string; callsign: any }, eta: string | number = 'Unknown') => {
    let date = new Date(Date.now())
    let text = []

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
        `ETA ${eta}`,
        `Weather ${flightInfo.arr}`,
        `${arrivalWeather.data.raw}`,
        `Gate ${flightInfo.arr}/${gate}`,
        `ACARS End`
    )

    return text
}