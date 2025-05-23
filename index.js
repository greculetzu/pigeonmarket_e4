// index.js

const express = require('express');
const app = express();
const path = require("path");
const fs = require("fs");

const port = 8080;

// Erori
global.obGlobal = {
    obErori: null
};

function initErori() {
    const data = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json"));
    const obJson = JSON.parse(data);

    for (let err of obJson.info_erori) {
        err.imagine = obJson.cale_baza + err.imagine;
    }
    obJson.eroare_default.imagine = obJson.cale_baza + obJson.eroare_default.imagine;

    obGlobal.obErori = obJson;
}

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find(e => e.identificator == identificator);
    if (!eroare) eroare = obGlobal.obErori.eroare_default;

    let titluFinal = titlu || eroare.titlu;
    let textFinal = text || eroare.text;
    let imagineFinal = imagine || eroare.imagine;

    res.status(eroare.status ? identificator : 200).render("pagini/eroare", {
        titlu: titluFinal,
        text: textFinal,
        imagine: imagineFinal
    });
}

initErori();

let vect_foldere = ["temp"]; 


for (let folder of vect_foldere) {
    let caleCompleta = path.join(__dirname, folder);
    if (!fs.existsSync(caleCompleta)) {
        fs.mkdirSync(caleCompleta, { recursive: true });
        console.log(`Am creat folderul: ${folder}`);
    }
}


app.listen(port, () => {
    console.log(`Serverul rulează pe http://localhost:${port}`);
});

app.use((req, res, next) => {
    console.log(`Request la: ${req.url}`);
    next();
});

console.log("__dirname:", __dirname);
console.log("__filename:", __filename);
console.log("process.cwd():", process.cwd());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/resurse", (req, res, next) => {
    const fullPath = path.join(__dirname, req.url);
    if (!path.extname(req.url) && !fs.existsSync(fullPath)) {
        afisareEroare(res, 403);
    } else {
        next();
    }
});



app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.get(["/", "/index", "/home"], (req, res) => {
    res.render("pagini/index", {
        titlu: "PigeonMarket",
        ip: req.ip
    });
});

// Favicon
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse", "ico", "favicon.ico"));
});

// Interzis
app.get(/^\/.*\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
});

// Ruta
app.get(/^\/(?<pagina>[^\/]+)$/, (req, res) => {
    let pagina = req.params.pagina;

    res.render("pagini/" + pagina, {
        titlu: pagina,
        ip: req.ip
    }, function (err, html) {
        if (err) {
            if (err.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, 500, null, err.message);
            }
        } else {
            res.send(html);
        }
    });
});