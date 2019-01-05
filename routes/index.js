var express = require('express');
var router = express.Router();
var fs = require('fs');
const request = require('request');

router.get('/api',(req,res)=>{
    res.send('hello world')
});

/* GET home page. */
router.get("/stockage", (req, res) => {
    const body = req.query.url
    console.log(body)
    reponse = readPV(body);
    //console.log(reponse)
    EnregistrementBureau(reponse)

    EnregistrementCandidat(reponse)

    EnregistrementScrutateur(reponse)

    EnregistrementPV(reponse)

    //res.send(reponse)
    res.send("hello world")
})
var foldersInMainFolder = (path) => {
    return fs.readdirSync(path);
}

var filesInEachFolder = (mainPath, jsonFolder, foldersName) => {
    var tmp = [];
    var i = 1;
    foldersName.forEach((folder) => {
        tmp.push(fs.readdirSync(mainPath + '/' + folder + '/' + jsonFolder))
        i++;
    })
    return tmp;
}

var convertFilesInEachFoldersToJson = (mainPath, foldersName, filesInEachFolder, jsonFolder) => {
    var arrayOfFilesInOneFolder = [];
    var allJsonFiles = [];
    var i = 0;
    filesInEachFolder.forEach((filesInEachFolder) => {
        filesInEachFolder.forEach((file) => {
            if (file !== "truePV.json") {
                var tmp = {};
                json = JSON.parse(fs.readFileSync(mainPath + '/' + foldersName[i] + '/' + jsonFolder + '/' + file))

                //console.log(file + " log " + json)
                var tmp2 = file.split('.')
                tmp[tmp2[0]] = json
                arrayOfFilesInOneFolder.push(tmp);
            }
        })
        allJsonFiles.push(arrayOfFilesInOneFolder);
        arrayOfFilesInOneFolder = [];
        i++;
    })
    return allJsonFiles;
}


var readPV = (path) => {
    var jsonFolder = 'JSON';
    var mainFolderPath = path + "/Bureaux";

    var allFolders = foldersInMainFolder(mainFolderPath);
    var allFilesInEachFolder = filesInEachFolder(mainFolderPath, jsonFolder, allFolders);
    var allJson = convertFilesInEachFoldersToJson(mainFolderPath, allFolders, allFilesInEachFolder, jsonFolder)

    return allJson;
}



var EnregistrementBureau = (allJsonFiles) => {
    nbBureaux = allJsonFiles.length
    for (i = 1; i <= nbBureaux; i++) {
        request.post({
            "headers": {"content-type": "application/json"},
            "url": "http://localhost:3000/api/Bureau",
            "body": JSON.stringify({
                "$class": "org.example.projet.Bureau",
                "bureauId": i,
                "nomBureau": "Bureau " + i
            })
        }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
            //console.log(body.url);
            //console.log(body.explanation);
            console.log(res.toJSON().body);
        });
    }
}
var EnregistrementCandidat = (allJsonFiles) => {
    if (allJsonFiles[0][0]['PV_ELECAM'] == null) {
        allJsonFiles[0][0]['PV_1_1'].candidats.forEach((candObject) => {
            request.post({
                "headers": {"content-type": "application/json"},
                "url": "http://localhost:3000/api/Candidat",
                "body": JSON.stringify({
                    "$class": "org.example.projet.Candidat",
                    "candidatId": candObject.candidat,
                })
            }, (err, res, body) => {
                if (err) {
                    return console.log(err);
                }
                //console.log(body.url);
                //console.log(body.explanation);
                console.log(res.toJSON().body);
            });
            console.log(candObject.candidat);
        })
    } else {
        allJsonFiles[0][0]['PV_ELECAM'].candidats.forEach((candObject) => {
            request.post({
                "headers": {"content-type": "application/json"},
                "url": "http://localhost:3000/api/Candidat",
                "body": JSON.stringify({
                    "$class": "org.example.projet.Candidat",
                    "candidatId": candObject.candidat,
                })
            }, (err, res, body) => {
                if (err) {
                    return console.log(err);
                }
                //console.log(body.url);
                //console.log(body.explanation);
                console.log(res.toJSON().body);
            });
            console.log(candObject.candidat);
        })
    }
}

var EnregistrementScrutateur = (allJsonFiles) => {
    console.log('enregistrer les scrutateurs')
    
    allJsonFiles.forEach((office) => {
        office.forEach((pv) => {
            console.log(pv)
            for (var n in pv) {
                console.log(name)
                var id = pv[n].signataire.indBureau + "_" + pv[n].signataire.scrutateur;
                var name = "scrutateur" + id;
                var s = {
                    "id": id,
                    "nom": name
                }
                idCandidat = pv[n].signataire.scrutateur;
                console.log(idCandidat)
                if (idCandidat > 0) {
                    idCandidat += 1
                    request.post({
                        "headers": {"content-type": "application/json"},
                        "url": "http://localhost:3000/api/Scrutateur",
                        "body": JSON.stringify({
                            "$class": "org.example.projet.Scrutateur",
                            "scrutateurId": s.id,
                            "candidat": "resource:org.example.projet.Candidat#Candidat" + idCandidat,
                            //"bureau":  pv[n].nomBureau,
                            "name": s.nom
                        })
                    }, (err, res, body) => {
                        if (err) {
                            return console.log(err);
                        }
                        //console.log(body.url);
                        //console.log(body.explanation);
                        console.log(res.toJSON().body);
                    });
                }
                //allScrutateurs.push(s);
            }

        })
    })
}


var EnregistrementPV = (allJsonFiles) => {
    console.log('enrregistrer les pv')
    allJsonFiles.forEach((office) => {
        office.forEach((pv) => {
            for (var n in pv) {
                listeVoix = []
                pv[n].candidats.forEach((candidatObject) => {
                    idCandidat = candidatObject.candidat;
                    voix = {"nbVoix": candidatObject.nbVoix, "candidat": "resource:org.example.projet.Candidat#" + idCandidat.split(" ")[0] + idCandidat.split(" ")[1]}
                    listeVoix.push(voix);
                })
                pvid = n
                if ("PV_ELECAM" == n)
                    pvid += "_" + pv[n].nomBureau;
                request.post({
                    "headers": {"content-type": "application/json"},
                    "url": "http://localhost:3000/api/PV",
                    "body": JSON.stringify({
                        "$class": "org.example.projet.PV",
                        "pvId": pvid,
                        "nbVotants": pv[n].nbVotants,
                        //"bureau": pv[n].nomBureau,
                        "candidats": listeVoix,
                        "bureau": "resource:org.example.projet.Bureau#" + pv[n].signataire.indBureau,
                        "owner": "resource:org.example.projet.Scrutateur#" + pv[n].signataire.indBureau + "_" + pv[n].signataire.scrutateur,
                    })
                }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                    //console.log(body.url);
                    //console.log(body.explanation);
                    console.log(res.toJSON().body)
                });
            }

        })
    })
}

var stockage = (path) => {
    var allJsonFiles = readPV(path);
    var test = EnregistrementBureau(allJsonFiles)
    if (test) {
        test = EnregistrementCandidat(allJsonFiles)
        if (test)
            test = EnregistrementScrutateur(allJsonFiles)
        if (test)
            EnregistrementPV(allJsonFiles)
    }
}

module.exports = router;
