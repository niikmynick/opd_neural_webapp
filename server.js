// server initialization
const port = 9000;
const host = 'localhost';

let fs = require('fs');
let express = require('express');
let bodyParser = require('body-parser');

let urlencodeParser = bodyParser.urlencoded({ extended: false });
let app = express();

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

app.listen(port, host, function (){
    console.log('Server - http://' + host + ':' + port);
})



// user registration
app.post('/registration', urlencodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400);
    console.log(req.body);
    let id = Date.now().toString()
    let user = {"id": id}
    let jsonData = fs.readFileSync('usersData/usersData.json' , 'utf8');
    let all = jsonData.substring(0, jsonData.length-2) + ', ' + JSON.stringify(user) + "]";
    fs.writeFileSync('usersData/usersData.json', all, function(error) {
        if(error) throw error;
        console.log(`User ${name} with id = ${id} registered successfully`);
    });
    let userData = fs.readFileSync('usersData/usersData.json' , 'utf8');
    let gift = userData.substring(0, userData.length-2) + ', ' + JSON.stringify(req.body).replace("{","") + "]}";
    fs.writeFileSync('usersData/usersData.json', gift, function(error) {
        if(error) throw error;
        console.log(`User ${name} with id = ${id} registered successfully`);
    });
    let blankUser = fs.readFileSync(`users/blankUser.json`, 'utf8').toString();
    fs.writeFileSync(`users/u${id}.json`, blankUser, function(error) {
        if(error) throw error;
        console.log(`User ${name} with id = ${id} registered successfully`);
    });
    res.render('main');
});
let usersData = JSON.parse(fs.readFileSync(`usersData/usersData.json`, 'utf8'))
let user_id;
let user_name;
let k;
let authoriseFlag = false;

let userSkillsList;
let alreadyDoneTest;

// user login
app.post('/login', urlencodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400);
    const { user_email } = req.body;
    const { user_password } = req.body;

    for (let i=0 ; i < usersData.user.length ; i++)
    {
        if (usersData.user[i]["email"] === user_email) {
            k = i;
            if (user_password === usersData.user[k]["password"]){
                user_id = usersData.user[i]["id"];
                user_name = usersData.user[i]["name"]
                console.log("Успешная авторизация")
                authoriseFlag = true
                console.log(user_id)
                userSkillsList = JSON.parse(fs.readFileSync(`users/u${user_id}.json`, 'utf8').toString())
            } else {
                console.log("Неверный пароль")
            }
        }
    }

    res.render('main')
});

// files initialization
let jsObjectSkills = JSON.parse(fs.readFileSync('views/lab1/statistic/skills.json', 'utf8').toString())
let jsObjectStat = JSON.parse(fs.readFileSync('views/lab1/statistic/stat.json', 'utf8').toString())

let personDS = []
let personFE = []
let personSA = []

// saving user choice
app.post('/add', urlencodeParser, function(req, res) {
    if(!req.body) return res.sendStatus(400)

    console.log(userSkillsList)

    let count = 0;

    for (i in req.body) {
        if (i === 'specialist_f') {
            count = 2
        } else if (i === 'specialist_d') {
            count = 2
        } else if (i === 'specialist_a') {
            count = 2
        } else {
            count = 1
        }

        if (i.startsWith('f')) {
            personFE.push(jsObjectSkills[i.slice(1) - 1])
            jsObjectStat['frontend'][jsObjectSkills[i.slice(1) - 1]] += count
            userSkillsList['frontend'][jsObjectSkills[i.slice(1) - 1]] += 1
        } else if (i.startsWith('a')) {
            personSA.push(jsObjectSkills[i.slice(1) - 1])
            jsObjectStat['sysadmin'][jsObjectSkills[i.slice(1) - 1]] += count
            userSkillsList['sysadmin'][jsObjectSkills[i.slice(1) - 1]] += 1
        } else if (i.startsWith('d')){
            personDS.push(jsObjectSkills[i.slice(1) - 1])
            jsObjectStat['data_scientist'][jsObjectSkills[i.slice(1) - 1]] += count
            userSkillsList['data_scientist'][jsObjectSkills[i.slice(1) - 1]] += 1
        }

    }

    // writing statistics to the file
    fs.writeFileSync('views/lab1/statistic/stat.json', JSON.stringify(jsObjectStat), function(error) {
        if(error) throw error
        console.log("Асинхронная запись файла завершена.")
    })

    fs.writeFileSync(`users/u${user_id}.json`, JSON.stringify(userSkillsList), function(error) {
        if(error) throw error
        console.log("Асинхронная запись файла завершена.")
    })
    res.render('lab1/mark', {DS: personDS, FE: personFE, SA:personSA})
})

app.post('/mark', urlencodeParser, function(req, res) {
    if (!req.body) return res.sendStatus(400)
    console.log(req.body)

    res.render('main')
})

// result keepers init
let frontEnd = []
let dataScience = []
let sysAdmin = []

// filling result lists
for (let profession in jsObjectStat) {
    for (let skill in jsObjectStat[profession]) {
        if (profession === "frontend") {
            frontEnd.push([skill, jsObjectStat[profession][skill]]);
        } else if (profession === "data_scientist") {
            dataScience.push([skill, jsObjectStat[profession][skill]]);
        } else if (profession === "sysadmin") {
            sysAdmin.push([skill, jsObjectStat[profession][skill]]);
        }
    }
}

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

pagesMap.set('lab2', 'lab2/lab_2')

pagesMap.set('test_1', 'lab2/test_1')
pagesMap.set('test_2', 'lab2/test_2')
pagesMap.set('easy_aud_test', 'lab2/test_1/easy_aud_test')
pagesMap.set('easy_aud_stat', 'lab2/test_1/stat')
pagesMap.set('easy_eye_test', 'lab2/test_1/easy_eye_test')
pagesMap.set('med_eye_test', 'lab2/test_1/med_eye_test')
pagesMap.set('hard_eye_test', 'lab2/test_1/hard_eye_test')
pagesMap.set('sum_aud_test', 'lab2/test_1/sum_aud_test')
pagesMap.set('sum_eye_test', 'lab2/test_1/sum_eye_test')
pagesMap.set('easy_moving_test', 'lab2/test_2/easy_moving_test')
pagesMap.set('hard_moving_test', 'lab2/test_2/hard_moving_test')

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
        res.render(page, {FE: personFE});

    } else if (req.params.name === 'frontend') {
        if (authoriseFlag) {
            res.render(page)
            // if (/[1-9]/.exec(userSkillsList['frontend'].toString()) !== []) {
            //     res.render('lab1/testError', {user_name: user_name, DS: personDS, FE: personFE, SA:personSA})
            // } else {
            //     res.render(page)
            // }
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'desc_datascience') {
        res.render(page, {dataScience: dataScience});

    } else if (req.params.name === 'datascience') {
        if (authoriseFlag) {
            if (/[1-9]/.exec(userSkillsList['data_scientist'].toString()) !== []) {
                res.render('lab1/testError', {user_name: user_name, DS: personDS, FE: personFE, SA:personSA})
            } else {
                res.render(page)
            }
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'desc_sysadmin') {
        res.render(page, {sysAdmin: sysAdmin});

    } else if (req.params.name === 'sysadmin') {
        if (authoriseFlag) {
            if (/[1-9]/.exec(userSkillsList['sysadmin'].toString()) !== []) {
                res.render('lab1/testError', {user_name: user_name, DS: personDS, FE: personFE, SA:personSA})
            } else {
                res.render(page)
            }
        } else {
            res.render('authorization/login')
        }

    } else if (req.params.name === 'login') {
        if (authoriseFlag) {
            res.render('account', {user_name: user_name, DS: personDS, FE: personFE, SA:personSA})
        } else {
            res.render(page)
        }

    } else {
        res.render(page)
    }
});
