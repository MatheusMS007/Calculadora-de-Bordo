const crypto = require('crypto')
const { promisify } = require('util')

const scrypt = promisify(crypto.scrypt)
const KEY_LENGTH = 64

async function hashPassword(password) {
    const salt = crypto.randomBytes(16)
    const derivedKey = await scrypt(password, salt, KEY_LENGTH)
    return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`
}

async function verifyPassword(password, storedPassword) {
    if (typeof storedPassword !== 'string') return false

    if (!storedPassword.startsWith('scrypt$')) {
        return password === storedPassword
    }

    const [, saltHex, keyHex] = storedPassword.split('$')
    if (!saltHex || !keyHex || !/^[a-f\d]+$/i.test(saltHex) || !/^[a-f\d]+$/i.test(keyHex)) return false

    const salt = Buffer.from(saltHex, 'hex')
    const expectedKey = Buffer.from(keyHex, 'hex')
    if (expectedKey.length !== KEY_LENGTH) return false

    const actualKey = await scrypt(password, salt, KEY_LENGTH)
    return crypto.timingSafeEqual(expectedKey, actualKey)
}

function isLegacyPassword(storedPassword) {
    return typeof storedPassword === 'string' && !storedPassword.startsWith('scrypt$')
}

module.exports = { hashPassword, verifyPassword, isLegacyPassword }
