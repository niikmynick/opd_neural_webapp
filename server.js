const {
    runQuery,
    registerUser,
    insertPVK,
    saveMarks
} = require("./dbProperties.js");

const {
    frontend_id,
    sysAdmin_id,
    dataScientist_id
} = require("./dataHolder.js");

let {
    user_id,
    user_name,
    authoriseFlag,
    personDS,
    personFE,
    personSA,
    dataScience,
    frontEnd,
    sysAdmin
} = require("./dataHolder.js");


const {
    pagesMap
} = require("./pagesMap.js");

// server initialization
const port = 9000;
const host = 'localhost';

// server properties
let fs = require('fs');
let express = require('express');
let bodyParser = require('body-parser');
let urlEncodeParser = bodyParser.urlencoded({ extended: false });
let app = express();
const cookieManager = require('./public/libs/CookieManager.js');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

app.listen(port, host, function (){
    console.log('Server - http://' + host + ':' + port);
})


async function reloadPersonStat(user_id) {
    personDS = []
    personFE = []
    personSA = []

    await runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE user_id = ${user_id} AND profession_id = ${dataScientist_id}`).then((rows) => {
        rows.forEach((row) => {
            personDS.push([row["quality_name"], row.value])
        })
    })

    await runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE user_id = ${user_id} AND profession_id = ${frontend_id}`).then((rows) => {
        rows.forEach((row) => {
            personFE.push([row["quality_name"], row.value])
        })
    })

    await runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE user_id = ${user_id} AND profession_id = ${sysAdmin_id}`).then((rows) => {
        rows.forEach((row) => {
            personSA.push([row["quality_name"], row.value])
        })
    })
}

async function clearPersonStat(profession) {
    if (profession === "frontend") {
        personFE = []
        await runQuery(`DELETE FROM important_qualities_result WHERE user_id = ${user_id} AND profession_id = ${frontend_id}`).then(r => r)
    } else if (profession === "sysAdmin") {
        personSA = []
        await runQuery(`DELETE FROM important_qualities_result WHERE user_id = ${user_id} AND profession_id = ${sysAdmin_id}`).then(r => r)
    } else if (profession === "dataScientist") {
        personDS = []
        await runQuery(`DELETE FROM important_qualities_result WHERE user_id = ${user_id} AND profession_id = ${dataScientist_id}`).then(r => r)
    }
}

async function reloadOverallStat() {
    dataScience = []
    frontEnd = []
    sysAdmin = []

    await runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE profession_id = ${dataScientist_id}`).then((rows) => {
        rows.forEach((row) => {
            dataScience.push([row["quality_name"], row.value])
        })
    })
    await runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE profession_id = ${frontend_id}`).then((rows) => {
        rows.forEach((row) => {
            frontEnd.push([row["quality_name"], row.value])
        })
    })
    await runQuery(`SELECT quality_name, value FROM important_qualities_result join important_quality on important_qualities_result.quality_id = important_quality.id WHERE profession_id = ${sysAdmin_id}`).then((rows) => {
        rows.forEach((row) => {
            sysAdmin.push([row["quality_name"], row.value])
        })
    })

// sorting lists by values
    dataScience.sort((a, b) => a[1] - b[1]).reverse()
    frontEnd.sort((a, b) => a[1] - b[1]).reverse()
    sysAdmin.sort((a, b) => a[1] - b[1]).reverse()
}

app.post('/registration', urlEncodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400);
    console.log(req.body);

    user_name = req.body.name;
    let user_email = req.body.email;
    let user_password = req.body.password;
    authoriseFlag = true;

    registerUser(user_name, user_email, user_password)
        .then(() => {
            runQuery(`SELECT id FROM user WHERE email = '${user_email}'`)
                .then(r => {
                    user_id = r[0]["id"]
                    res.cookie('login', user_name);
                    res.render('main');
                })
        })
})

app.post('/login', urlEncodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400);

    console.log(req.body);

    const user_email = req.body.user_email;
    const user_password = req.body.user_password;

    runQuery(`SELECT password FROM user WHERE email = '${user_email}'`)
        .then(r => {
            if (user_password === r[0]["password"]) {
                console.log("Успешная авторизация")
                authoriseFlag = true

                runQuery(`SELECT id, name FROM user WHERE email = '${user_email}'`)
                    .then(r => {
                        user_name = r[0]["name"]
                        res.cookie('login', user_name);

                        user_id = r[0]["id"]

                        reloadPersonStat(user_id)
                            .then(() => {
                                res.render("account", {
                                    user_name: user_name,
                                    DS: personDS,
                                    FE: personFE,
                                    SA: personSA
                                })
                            })
                    })

            } else {
                console.log("Неверный пароль")
                res.render('authorization/login');
            }
        })
})

app.post('/add', urlEncodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400)

    insertPVK(req.body, user_id)
        .then(() => {
            reloadPersonStat(user_id)
                .then(() => {
                    res.render('lab1/mark', {FE: personFE})
                })
        })
})

app.post('/mark', urlEncodeParser, function(req, res) {
    if (!req.body) return res.sendStatus(400)

    saveMarks(req.body, user_id).then(() => {
        reloadPersonStat(user_id)
            .then(() => {
                res.render("account", {
                    user_name: user_name,
                    DS: personDS,
                    FE: personFE,
                    SA: personSA
                })
            })
    })
})

app.get('/', function (req, res) {
    res.render('main');
});

app.get('/:name', function(req, res) {
    let page = pagesMap.get(req.params.name);

    switch (page) {

        case 'main': {
            res.render(page);
        } break;

        case 'stat': {
            reloadOverallStat()
                .finally(() => {
                    res.render(page, {dataScience: dataScience, frontEnd: frontEnd, sysAdmin: sysAdmin});
                })
        } break;

        case 'desc_frontend': {
            reloadOverallStat()
                .finally(() => {
                    res.render(page, {frontEnd: frontEnd});
                })
        } break;

        case 'mark': {
            reloadPersonStat().finally(() => {
                res.render(page, {FE: personFE});
            })
        } break;

        case "frontend": {
            if (authoriseFlag) {
                clearPersonStat("frontend").finally(() => {
                    res.render(page, {FE: frontEnd});
                })
            } else {
                res.render('login');
            }
        } break;

        case "sysadmin": {
            if (authoriseFlag) {
                clearPersonStat("sysadmin").finally(() => {
                    res.render(page, {SA: sysAdmin});
                })
            }
        } break;

        case "datascience": {
            if (authoriseFlag) {
                clearPersonStat("datascience").finally(() => {
                    res.render(page, {DS: dataScience});
                })
            }
        } break;


    }


    if (page === undefined){
        res.sendFile(__dirname + '/404.html');

    } else if (req.params.name === 'stat') {
        reloadOverallStat().finally(() => {
            res.render(page, {dataScience: dataScience, frontEnd: frontEnd, sysAdmin: sysAdmin});
        })

    } else if (req.params.name === 'desc_frontend') {
        reloadOverallStat().finally(() => {
            res.render(page, {frontEnd: frontEnd});
        })

    } else if (req.params.name === 'mark') {
        reloadPersonStat().finally(() => {
            res.render(page, {FE: personFE});
        })

    } else if (req.params.name === "frontend") {
        if (authoriseFlag) {
            clearPersonStat("frontend").finally(() => {
                res.render(page, {FE: frontEnd});
            })
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'desc_datascience') {
        reloadOverallStat().finally(() => {
            res.render(page, {dataScience: dataScience});
        })

    } else if (req.params.name === 'datascience') {
        if (authoriseFlag) {
            res.render(page)
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'desc_sysadmin') {
        reloadOverallStat(dataScience, frontEnd, sysAdmin).finally(() => {
            res.render(page, {sysAdmin: sysAdmin});
        })

    } else if (req.params.name === 'sysadmin') {
        if (authoriseFlag) {
            res.render(page)
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'login') {
        if (authoriseFlag) {
            reloadPersonStat(user_id).finally(() => {
                res.render("account", {user_name: user_name, DS: personDS, FE: personFE, SA: personSA});
            })

        } else {
            res.render(page)
        }

    } else {
        res.render(page)
    }
});

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
        let user_name = obj["user_name"];
        let test_name = obj["test_name"];

        let table_name = test_name + '_result';

        if (['easy_audio', 'easy_vision', 'medium_vision', 'hard_vision', 'audio_sum', 'vision_sum'].includes(test_name)) {
            console.log("sending to db");
            // time, percentage
            runQuery(`INSERT INTO ${table_name} (user_id, time, percentage)
                      VALUES ('${user_id}', ${obj.time}, ${obj.percentage})`).then(r => r)
        } else if (test_name === 'easy_moving') {
            // dispersion, neg, pos
            runQuery(`INSERT INTO ${table_name} (user_id, dispersion, negative_dispersion, positive_dispersion)
                      VALUES ('${user_id}', ${obj.dispersion}, ${obj.neg}, ${obj.pos})`).then(r => r)
        } else if (test_name === 'hard_moving') {
            // dispersion, neg, pos for 3 circles and average
            runQuery(`INSERT INTO ${table_name} (user_id,
                                                 slow_dispersion,
                                                 middle_dispersion,
                                                 fast_dispersion,
                                                 slow_negative_dispersion,
                                                 middle_negative_dispersion,
                                                 fast_negative_dispersion,
                                                 slow_positive_dispersion,
                                                 middle_positive_dispersion,
                                                 fast_positive_dispersion,
                                                 average_dispersion)
                      VALUES ('${user_id}',
                              ${obj.slow_dispersion},
                              ${obj.middle_dispersion},
                              ${obj.fast_dispersion},
                              ${obj.slow_negative_dispersion},
                              ${obj.middle_negative_dispersion},
                              ${obj.fast_negative_dispersion},
                              ${obj.slow_positive_dispersion},
                               ${obj.middle_positive_dispersion},
                              ${obj.fast_positive_dispersion},
                              ${obj.average_dispersion}`).then(r => r)

        } else if (['analog_tracking', 'persecution_tracking', 'visual_memory'].includes(test_name)) {
            // score
            runQuery(`INSERT INTO ${table_name} (user_id, score) VALUES ('${user_id}', ${obj.score})`).then(r => r)
        } else if (['compass', 'landolt_ring'].includes(test_name)) {
            // correct, incorrect
            runQuery(`INSERT INTO ${table_name} (user_id, correct, incorrect) VALUES ('${user_id}', ${obj.correct}, ${obj.incorrect})`).then(r => r)
        } else if (['raven', 'voinarovsky'].includes(test_name)) {
            // correct
            runQuery(`INSERT INTO ${table_name} (user_id, correct) VALUES ('${user_id}', ${obj.correct})`).then(r => r)
        } else if (test_name === 'red_n_black') {
            // score, time
            runQuery(`INSERT INTO ${table_name} (user_id, score, time) VALUES ('${user_id}', ${obj.score}, ${obj.time})`).then(r => r)
        } else if (test_name === 'verbal_memory') {
            // percentage
            runQuery(`INSERT INTO ${table_name} (user_id, percentage) VALUES ('${user_id}', ${obj.percentage})`).then(r => r)
        }
    });
});