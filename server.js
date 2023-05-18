// server initialization
const port = 9000;
const host = 'localhost';

let fs = require('fs');
let express = require('express');
let bodyParser = require('body-parser');
let jwt = require('jsonwebtoken');
let urlEncodeParser = bodyParser.urlencoded({ extended: false });
let app = express();


// database initialization
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

const tokenKey = '1a2b-3c4d-5e6f-7g8h';

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

app.listen(port, host, function (){
    console.log('Server - http://' + host + ':' + port);
})

// user stuff
let user_id;
let user_name;
let authoriseFlag = false;

// user registration
app.post('/registration', urlEncodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400);
    console.log(req.body);

    user_name = req.body.name;
    let user_email = req.body.email;
    let user_password = req.body.password;
    authoriseFlag = true;

    runQuery(`INSERT INTO user (name, email, password) VALUES ('${user_name}', '${user_email}', '${user_password}')`).then(r => {
        setTimeout(() => {}, 1000)
    })

    runQuery(`SELECT id FROM user WHERE email = '${user_email}'`).then(r => {
        user_id = r[0]["id"]
        setTimeout(() => {}, 1000)
    })

    console.log(`User ${user_name} with id ${user_id} registered`)

    res.render('main');
});


// user login
app.post('/login', urlEncodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400);

    console.log(req.body);

    const user_email = req.body.user_email;
    const user_password = req.body.user_password;

    runQuery(`SELECT password FROM user WHERE email = '${user_email}'`).then(r => {
        if (user_password === r[0]["password"]) {
            console.log("Успешная авторизация")
            authoriseFlag = true

        } else {
            console.log("Неверный пароль")
        }
    })

    runQuery(`SELECT id FROM user WHERE email = '${user_email}'`).then(r => {
        user_id = r[0]["id"]
        setTimeout(() => {}, 1000)
    })

    runQuery(`SELECT name FROM user WHERE email = '${user_email}'`).then(r => {
        user_name = r[0]["name"]
        setTimeout(() => {}, 1000)
    })

    res.render('main')
});


// professions ids
let frontend_id = 0
let sysAdmin_id = 0
let dataScientist_id = 0

runQuery(`SELECT id FROM profession WHERE name = 'frontend developer'`).then(r => {
    frontend_id = r[0]["id"]
})
runQuery(`SELECT id FROM profession WHERE name = 'system administrator'`).then(r => {
    sysAdmin_id = r[0]["id"]
})
runQuery(`SELECT id FROM profession WHERE name = 'data scientist'`).then(r => {
    dataScientist_id = r[0]["id"]
})

// saving user choice
app.post('/add', urlEncodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400)

    if (i.startsWith('f')) {
        runQuery(`INSERT INTO important_qualities_result (user_id, profession_id, quality_id, value) 
                    VALUES (${user_id}, ${frontend_id}, ${i.slice(1 )}, 0)`).then(r => r)

    } else if (i.startsWith('a')) {
        runQuery(`INSERT INTO important_qualities_result (user_id, profession_id, quality_id, value)
                  VALUES (${user_id}, ${sysAdmin_id}, ${i.slice(1 )}, 0)`).then(r => r)
    } else if (i.startsWith('d')){
        runQuery(`INSERT INTO important_qualities_result (user_id, profession_id, quality_id, value)
                  VALUES (${user_id}, ${dataScientist_id}, ${i.slice(1 )}, 0)`).then(r => r)
    }

    res.render('lab1/mark', {DS: personDS, FE: personFE, SA:personSA})
})

app.post('/mark', urlEncodeParser, function(req, res) {
    if (!req.body) return res.sendStatus(400)

    for (i in req.body) {
        if (i.startsWith('f')) {
            runQuery(`UPDATE important_qualities_result SET value = ${req.body[i]} WHERE user_id = ${user_id} AND profession_id = ${frontend_id} AND quality_id = ${i.slice(1)}`).then(r => r)
        } else if (i.startsWith('a')) {
            runQuery(`UPDATE important_qualities_result SET value = ${req.body[i]} WHERE user_id = ${user_id} AND profession_id = ${sysAdmin_id} AND quality_id = ${i.slice(1)}`).then(r => r)
        } else if (i.startsWith('d')){
            runQuery(`UPDATE important_qualities_result SET value = ${req.body[i]} WHERE user_id = ${user_id} AND profession_id = ${dataScientist_id} AND quality_id = ${i.slice(1)}`).then(r => r)
        }
    }

    res.render('main')
})
let personDS = []
let personFE = []
let personSA = []
let dataScience = []
let frontEnd = []
let sysAdmin = []

runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE profession_id = ${dataScientist_id}`).then((rows) => {
    rows.forEach((row) => {
        dataScience.push([row.name, row.value])
    })
})
runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE profession_id = ${frontend_id}`).then((rows) => {
    rows.forEach((row) => {
        frontEnd.push([row.name, row.value])
    })
})
runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE profession_id = ${sysAdmin_id}`).then((rows) => {
    rows.forEach((row) => {
        sysAdmin.push([row.name, row.value])
    })
})

setTimeout(() => {}, 1000)

// sorting lists by values
dataScience.sort((a, b) => a[1] - b[1]).reverse()
frontEnd.sort((a, b) => a[1] - b[1]).reverse()
sysAdmin.sort((a, b) => a[1] - b[1]).reverse()


// load main page
app.get('/', function (req, res) {
    res.render('main');
});


// register of all pages
let pagesMap = new Map();
pagesMap.set('main', 'main')

pagesMap.set('reg', 'authorization/reg')
pagesMap.set('login', 'authorization/login')
pagesMap.set('account', 'account')

pagesMap.set('lab1', 'lab1/lab_1')

pagesMap.set('frontend', 'lab1/frontend/frontend')
pagesMap.set('desc_frontend', 'lab1/frontend/desc_frontend' )

pagesMap.set('datascience', 'lab1/datascience/datascience')
pagesMap.set('desc_datascience', 'lab1/datascience/desc_datascience' )

pagesMap.set('sysadmin', 'lab1/sysadmin/sysadmin')
pagesMap.set('desc_sysadmin', 'lab1/sysadmin/desc_sysadmin' )

pagesMap.set('testError', 'lab1/testError')
pagesMap.set('stat', 'lab1/stat')

pagesMap.set('tests', 'tests')

pagesMap.set('tests_lab2', 'tests_lab2')
pagesMap.set('tests_lab3', 'tests_lab3')
pagesMap.set('tests_lab4', 'tests_lab4')
pagesMap.set('tests_lab5', 'tests_lab5')
pagesMap.set('easy_aud_test', 'tests_lab2/easy_aud_test')
pagesMap.set('easy_aud_stat', 'tests_lab2/stat')
pagesMap.set('easy_eye_test', 'tests_lab2/easy_eye_test')
pagesMap.set('med_eye_test', 'tests_lab2/med_eye_test')
pagesMap.set('hard_eye_test', 'tests_lab2/hard_eye_test')
pagesMap.set('sum_aud_test', 'tests_lab21/sum_aud_test')
pagesMap.set('sum_eye_test', 'tests_lab2/sum_eye_test')
pagesMap.set('easy_moving_test', 'tests_lab3/easy_moving_test')
pagesMap.set('hard_moving_test', 'tests_lab3/hard_moving_test')
pagesMap.set('analog_tracking', 'tests_lab4/analog_tracking')
pagesMap.set('tracking_with_persecution', 'tests_lab4/tracking_with_persecution')
pagesMap.set('red_black_table', 'tests_lab5/red_black_table')
pagesMap.set('landolt_ring', 'tests_lab5/landolt_ring')
pagesMap.set('verbal_memory', 'tests_lab5/verbal_memory')
pagesMap.set('visual_memory', 'tests_lab5/visual_memory')
pagesMap.set('raven_test', 'tests_lab5/raven_test')
pagesMap.set('voinarovsky_test', 'tests_lab5/voinarovsky_test')
pagesMap.set('compasses_test', 'tests_lab5/compasses_test')


// switching pages
app.get('/:name', function(req, res) {
    let page = pagesMap.get(req.params.name)
    if (page === undefined){
        res.sendFile(__dirname + '/404.html');
    } else if (req.params.name === 'stat') {
        res.render(page, {dataScience: dataScience, frontEnd: frontEnd, sysAdmin: sysAdmin});

    } else if (req.params.name === 'desc_frontend') {
        res.render(page, {frontEnd: frontEnd});

    } else if (req.params.name === 'mark') {
        personDS = runQuery("SELECT * FROM important_qualities_result WHERE user_id = (?)", [user_id])
        personFE = runQuery("SELECT * FROM important_qualities_result WHERE user_id = (?)", [user_id])
        personSA = runQuery("SELECT * FROM important_qualities_result WHERE user_id = (?)", [user_id])
        setTimeout(() => {}, 1000)

        res.render(page, {FE: personFE});

    } else if (req.params.name === "frontend") {
        if (authoriseFlag) {
            res.render(page)
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'desc_datascience') {
        res.render(page, {dataScience: dataScience});

    } else if (req.params.name === 'datascience') {
        if (authoriseFlag) {
            res.render(page)
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'desc_sysadmin') {
        res.render(page, {sysAdmin: sysAdmin});

    } else if (req.params.name === 'sysadmin') {
        if (authoriseFlag) {
            res.render(page)
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'login') {
        if (authoriseFlag) {
            personDS = runQuery("SELECT * FROM important_qualities_result WHERE user_id = (?)", [user_id])
            personFE = runQuery("SELECT * FROM important_qualities_result WHERE user_id = (?)", [user_id])
            personSA = runQuery("SELECT * FROM important_qualities_result WHERE user_id = (?)", [user_id])
            setTimeout(() => {}, 1000)

            res.render('account', {user_name: user_name, DS: personDS, FE: personFE, SA:personSA})
        } else {
            res.render(page)
        }

    } else {
        res.render(page)
    }
});


//Receives results form tests
app.post('/result', urlEncodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400);

    let data = "";

    req.on("data", chunk => {
        data += chunk;
    });

    req.on("end", () => {
        console.log(data);
        let obj = JSON.parse(data); // contains username, test name, result variables
        res.end("Данные успешно получены");
        let user_name = obj.user_name;
        let test_name = obj.test_name;

        let table_name = test_name + '_result';

        if (test_name in ['easy_audio', 'easy_vision', 'medium_vision', 'hard_vision', 'audio_sum', 'vision_sum']) {
            // time, percentage
            runQuery(`INSERT INTO ${table_name} (user_name, time, percentage) VALUES ('${user_name}', ${obj.time}, ${obj.percentage})`)
        } else if (test_name === 'easy_moving') {
            // dispersion, neg, pos
            runQuery(`INSERT INTO ${table_name} (user_name, dispersion, negative_dispersion, positive_dispersion) VALUES ('${user_name}', ${obj.dispersion}, ${obj.neg}, ${obj.pos})`)
        } else if (test_name === 'hard_moving') {
            // dispersion, neg, pos for 3 circles and average
            runQuery(`INSERT INTO ${table_name} (
                            user_name, 
                            slow_dispersion,
                            middle_dispersion,
                            fast_dispersion,
                            slow_negative_dispersion,
                            middle_negative_dispersion,
                            fast_negative_dispersion,
                            slow_positive_dispersion,
                            middle_positive_dispersion,
                            fast_positive_dispersion, 
                            average_dispersion) VALUES (
                            '${user_name}', 
                            ${obj.slow_dispersion}, 
                            ${obj.middle_dispersion}, 
                            ${obj.fast_dispersion}, 
                            ${obj.slow_negative_dispersion}, 
                            ${obj.middle_negative_dispersion},
                            ${obj.fast_negative_dispersion}, 
                            ${obj.slow_positive_dispersion}, 
                            ${obj.middle_positive_dispersion}, 
                            ${obj.fast_positive_dispersion}, 
                            ${obj.average_dispersion}`)

        } else if (test_name in ['analog_tracking', 'persecution_tracking', 'visual_memory']) {
            // score
            runQuery(`INSERT INTO ${table_name} (user_name, score) VALUES ('${user_name}', ${obj.score})`)
        } else if (test_name in ['compass', 'landolt_ring']) {
            // correct, incorrect
            runQuery(`INSERT INTO ${table_name} (user_name, correct, incorrect) VALUES ('${user_name}', ${obj.correct}, ${obj.incorrect})`)
        } else if (test_name in ['raven', 'voinarovsky']) {
            // correct
            runQuery(`INSERT INTO ${table_name} (user_name, correct) VALUES ('${user_name}', ${obj.correct})`)
        } else if (test_name === 'red_n_black') {
            // score, time
            runQuery(`INSERT INTO ${table_name} (user_name, score, time) VALUES ('${user_name}', ${obj.score}, ${obj.time})`)
        } else if (test_name in ['verbal_memory']) {
            // percentage
            runQuery(`INSERT INTO ${table_name} (user_name, percentage) VALUES ('${user_name}', ${obj.percentage})`)
        }
    });
});