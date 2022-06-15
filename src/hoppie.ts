import qs from 'qs'

const HOPPIE_URL = 'http://www.hoppie.nl/acars/system/connect.html?'

type HoppieType = 'poll' | 'telex'

/**
 * Generates request URI string for interacting with Hoppie's ACARS.
 * https://www.hoppie.nl/acars/system/tech.html
 *
 * @param type By default 'poll', otherwise one of HoppieType.
 * @param packet Leave undefined for no packet/message, otherwise any string.
 */
export const hoppieString = (
  type: HoppieType = 'poll',
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
