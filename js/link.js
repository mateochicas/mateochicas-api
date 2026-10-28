/**
 * Herramienta para cifrar enlaces de evaluaciones (CECSA)
 * 
 * Uso desde la terminal:
 *   node tools/encrypt_links.js
 * o pasando argumentos:
 *   node tools/encrypt_links.js <URL> <GRADO_6_O_7>
 * 
 * Ejemplo:
 *   node tools/encrypt_links.js "https://forms.gle/ejemplo123" 6
 */

const CIPHER_SALT = 0xA5C9F1;

function deriveKey(p1, p2, seedNumber) {
    const combined = p1 + '-' + seedNumber + '-' + p2;
    let hash = 0x811c9dc5;
    for (let i = 0; i < combined.length; i++) {
        hash ^= combined.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return Math.abs(hash);
}

function encryptUrl(text, seed, salt) {
    let s = (seed ^ salt) >>> 0;
    if (s === 0) s = 0x6D2B79F5;
    function nextByte() {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return (s & 0xFF);
    }

    let hex = '';
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        let mask = nextByte();
        let enc = code ^ mask;
        hex += enc.toString(16).padStart(2, '0');
    }
    return hex;
}

function decryptUrl(encodedHex, seed, salt) {
    let s = (seed ^ salt) >>> 0;
    if (s === 0) s = 0x6D2B79F5;
    function nextByte() {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return (s & 0xFF);
    }

    let result = '';
    for (let i = 0; i < encodedHex.length; i += 2) {
        let byteVal = parseInt(encodedHex.substr(i, 2), 16);
        let mask = nextByte();
        result += String.fromCharCode(byteVal ^ mask);
    }
    return result;
}

// Configuración de semillas por grado
const SEED_CONFIGS = {
    '6': {
        seed: deriveKey('CECSA_EVAL', 'G6_SOC', 20261028),
        name: 'Sexto Grado (Sociales)',
        varName: 'ENC_LINK_6'
    },
    '7': {
        seed: deriveKey('CECSA_EVAL', 'G7_LEN', 20261029),
        name: 'Séptimo Grado (Lenguaje)',
        varName: 'ENC_LINK_7'
    }
};

// Si se pasan argumentos por línea de comandos
const args = process.argv.slice(2);
if (args.length >= 2) {
    const inputUrl = args[0];
    const grade = args[1];
    const config = SEED_CONFIGS[grade];
    if (!config) {
        console.error('Error: Grado no reconocido. Usa "6" o "7".');
        process.exit(1);
    }
    const encrypted = encryptUrl(inputUrl, config.seed, CIPHER_SALT);
    const decrypted = decryptUrl(encrypted, config.seed, CIPHER_SALT);
    console.log(`\n=== Cifrado para ${config.name} ===`);
    console.log(`URL original: ${inputUrl}`);
    console.log(`Token cifrado (${config.varName}):`);
    console.log(`'${encrypted}'`);
    console.log(`Verificación de descifrado: ${decrypted === inputUrl ? 'OK' : 'ERROR'}\n`);
} else {
    console.log('\n--- Cifrador de Enlaces CECSA ---');
    console.log('Enlaces actuales configurados:\n');

    const urls = {
        '6': 'https://forms.gle/iobk1oCbbx3KTPP67',
        '7': 'https://forms.gle/V7FC2cwDRCYG8kY89'
    };

    for (const [grade, url] of Object.entries(urls)) {
        const config = SEED_CONFIGS[grade];
        const encrypted = encryptUrl(url, config.seed, CIPHER_SALT);
        const decrypted = decryptUrl(encrypted, config.seed, CIPHER_SALT);
        console.log(`[Grado ${grade}] ${config.name}`);
        console.log(`Variable: ${config.varName} = '${encrypted}'`);
        console.log(`Descifrado correcto: ${decrypted === url ? 'SÍ (' + decrypted + ')' : 'NO'}\n`);
    }

    console.log('Para cifrar un nuevo enlace ejecuta:');
    console.log('  node tools/encrypt_links.js "<NUEVA_URL>" <6_o_7>\n');
}
