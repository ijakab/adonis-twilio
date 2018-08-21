(async function() {
    const { exec } = require('child_process');
    let message = 'blabna'

    exec('git add .')
    exec(`git commit -m "${message}"`)

}())
