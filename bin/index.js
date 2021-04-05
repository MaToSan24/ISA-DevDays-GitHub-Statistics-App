#!/usr/bin/env node

const yargs = require("yargs");
const axios = require("axios");

// He registrado la aplicacion para usar un token oauth
const cabeceras = { headers: { Accept: "application/vnd.github.v3+json", Authorization: "token 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" } };

const options = yargs
    .usage("Usage: -s <search>")
    .option("s", { alias: "search", describe: "Proporciona estadisticas de una organizacion en GitHub", type: "string", demandOption: true })
    .argv;

if (!options.search || !options.search.includes("https://github.com/")) {
    console.log("Por favor, introduce una URL perteneciente a una organizacion de GitHub.");
} else {
    console.log(`Buscando repositorios para la organizacion con URL: ${options.search}...`)

    const urlEntrada = options.search;
    const org = urlEntrada.split("https://github.com/")[1];
    const urlOrg = "https://api.github.com/orgs/" + org;

    let orgRequest = [];
    let orgRepos = [];

    obtenerEstadisticas();

    async function obtenerEstadisticas() {

        try {
            let reposRequests = [];
            orgRequest = await axios.get(urlOrg, cabeceras);
            let reposRequest = await axios.get("https://api.github.com/orgs/" + org + "/repos?per_page=100&page=1", cabeceras).catch(err => {
                console.error("Ha ocurrido un error al obtener los repositorios de la organizacion '" + org + "'. Error: " + err);
            });

            reposRequests.push(reposRequest);

            if (reposRequest.headers.link) {
                let numPaginas = parseInt(reposRequest.headers.link.split(',')[1].split('>')[0].split('&page=')[1]);

                for (let i = 2; i <= numPaginas; i++) {
                    let reposRequestPagI = await axios.get("https://api.github.com/orgs/" + org + "/repos?per_page=100&page=" + i, cabeceras).catch(err => {
                        console.error("Ha ocurrido un error al obtener los repositorios '" + repo.name + "' de la organizacion '" + org + "'. Error: " + err);
                    });
                    reposRequests.push(reposRequestPagI);
                }
            }

            reposRequests.map(repoReq => {
                Promise.all(repoReq.data.map(async repo => {

                    let resultRepo = {
                        nombre: repo.name,
                        issuesAbiertas: 0,
                        issuesTotales: 0,
                        commits: 0
                    }

                    let issueRequests = [];

                    let issueRequest = await axios.get("https://api.github.com/repos/" + org + "/" + repo.name + "/issues?state=all&per_page=100&page=1", cabeceras).catch(err => {
                        console.error("Error al obtener las issues del repositorio '" + repo.name + "' de la organizacion '" + org + "'. Error: " + err);
                    });

                    issueRequests.push(issueRequest);


                    if (issueRequest.headers.link) {
                        let numPaginas = parseInt(issueRequest.headers.link.split(',')[1].split('>')[0].split('&page=')[1]);

                        for (let i = 2; i <= numPaginas; i++) {
                            let issueRequestPagI = await axios.get("https://api.github.com/repos/" + org + "/" + repo.name + "/issues?state=all&per_page=100&page=" + i, cabeceras).catch(err => {
                                console.error("Error al obtener las issues del repositorio '" + repo.name + "' de la organizacion '" + org + "'. Error: " + err);
                            });
                            issueRequests.push(issueRequestPagI);
                        }
                    }

                    let commitRequest = await axios.get("https://api.github.com/repos/" + org + "/" + repo.name + "/commits?per_page=1", cabeceras).catch(err => {
                        console.error("Error al obtener los commits del repositorio '" + repo.name + "' de la organizacion '" + org + "'. (Probablemente el repositorio"
                            + " este vacio) Error: " + err);
                    });

                    try {
                        resultRepo.commits = parseInt(commitRequest.headers.link.split(',')[1].split('>')[0].split('&page=')[1]);
                    } catch (err) {

                    }

                    if (!repo.private) {
                        issueRequests.map(issReq => {
                            issReq.data.map(issue => {
                                if (!issue.pull_request) {
                                    if (issue.state == "open") {
                                        resultRepo.issuesAbiertas++;
                                    };
                                    resultRepo.issuesTotales++;
                                }
                            });
                        });
                    }

                    orgRepos.push(resultRepo);

                })).then(mostrarEstadisticas);
            });
        } catch (err) {
            console.log("Por favor, introduce una URL perteneciente a una organizacion de GitHub.");
        }
    }

    function mostrarEstadisticas() {
        let numIssuesTotales = 0;
        let numCommitsTotales = 0;
        console.log("Buscando URL: " + urlOrg);
        console.log("Nombre: " + orgRequest.data.name);
        console.log("Descripción: " + orgRequest.data.description);
        console.log("Enlace: " + orgRequest.data.blog);
        console.log("\nRepositorios: ");
        orgRepos.map(repo => {
            console.log("\t" + repo.nombre);
            console.log("\t\tNumero de Issues abiertas: " + repo.issuesAbiertas);
            console.log("\t\tNumero de commits: " + repo.commits);
            numIssuesTotales += repo.issuesTotales;
            numCommitsTotales += repo.commits;
        });
        console.log("\n\nTotal: ");
        console.log("\tNumero de Issues en todos los repositorios: " + numIssuesTotales);
        console.log("\tNumero de Commits en todos los repositorios: " + numCommitsTotales);
    }

}