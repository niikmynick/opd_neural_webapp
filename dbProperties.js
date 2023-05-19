const {
    frontend_id,
    sysAdmin_id,
    dataScientist_id, user_id
} = require("./dataHolder");

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./identifier.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

function runQuery(query) {
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

async function registerUser(user_name, user_email, user_password) {
    await runQuery(`INSERT INTO user (name, email, password) VALUES ('${user_name}', '${user_email}', '${user_password}')`)
        .then(() => {
            console.log(`User ${user_name} registered`)
        })
}

async function insertPVK(lst, user_id) {
    for (let i in lst) {
        if (i.startsWith('f')) {
            await runQuery(`INSERT INTO important_qualities_result (user_id, profession_id, quality_id, value) 
                    VALUES (${user_id}, ${frontend_id}, ${i.slice(1 )}, 0)`).then(r => r)

        } else if (i.startsWith('a')) {
            await runQuery(`INSERT INTO important_qualities_result (user_id, profession_id, quality_id, value)
                  VALUES (${user_id}, ${sysAdmin_id}, ${i.slice(1 )}, 0)`).then(r => r)

        } else if (i.startsWith('d')){
            await runQuery(`INSERT INTO important_qualities_result (user_id, profession_id, quality_id, value)
                  VALUES (${user_id}, ${dataScientist_id}, ${i.slice(1 )}, 0)`).then(r => r)
        }
    }
}

async function saveMarks(lst, user_id) {
    for (let i in lst) {
        if (i.startsWith('f')) {
            await runQuery(`UPDATE important_qualities_result SET value = ${lst[i]} WHERE user_id = ${user_id} AND profession_id = ${frontend_id} AND quality_id = ${i.slice(1)}`).then(r => r)
        } else if (i.startsWith('a')) {
            await runQuery(`UPDATE important_qualities_result SET value = ${lst[i]} WHERE user_id = ${user_id} AND profession_id = ${sysAdmin_id} AND quality_id = ${i.slice(1)}`).then(r => r)
        } else if (i.startsWith('d')){
            await runQuery(`UPDATE important_qualities_result SET value = ${lst[i]} WHERE user_id = ${user_id} AND profession_id = ${dataScientist_id} AND quality_id = ${i.slice(1)}`).then(r => r)
        }
    }
}

module.exports = {
    runQuery,
    registerUser,
    insertPVK,
    saveMarks
}