#!/usr/bin/env node

const yargs = require("yargs");
const axios = require("axios");

const cabeceras = { headers: { Accept: "application/vnd.github.v3+json" , Authorization: "Basic" } };

const options = yargs
    .usage("Usage: -n <name>")
    .option("n", { alias: "name", describe: "Tu nombre", type: "string" })
    .option("s", { alias: "search", describe: "URL de una organizacion de GitHub", type: "string", demandOption: true })
    .argv;


if (options.name) {
    const greeting = `Hola, ${options.name}!`;
    console.log(greeting);
}

if (options.search) {
    console.log(`Buscando repositorios para la organizacion con URL: ${options.search}...`)
}

const urlEntrada = options.search; // Lo de escape no se si hara falta aqui o en la url

const org = urlEntrada.split("https://github.com/")[1]
const urlOrg = "https://api.github.com/orgs/" + org;

// orgRepos.map(repo => axios.get("https://api.github.com/repos/" + org + "/" + repo));

// let usersRequest = await axios.get('https://api.github.com/orgs/governify/members')
// let users = usersRequest.data;
// let reposRequest = axios.get("https://api.github.com/orgs/" + org + "/repos", cabeceras).catch(err => console.log("Ha ocurrido un error al obtener los repositorios: " +
// "\nURL: https://api.github.com/orgs/" + org + "/repos" + "\nError: " + err));

// let orgRepos = [];
// let listaIssues = [];
// let listaCommits = [];

// reposRequest.then(res => {
//         res.data.map(repo => {
//             if (!repo.private == true) {
//                 // console.log(repo.name);
//                 orgRepos.push(repo);
//             }
//         });
//     });

obtenerEstadisticas();

async function obtenerEstadisticas() {

    // let reposRequest = axios.get("https://api.github.com/orgs/" + org + "/repos").catch(err => console.log("Ha ocurrido un error al obtener los repositorios: " + err));
    // let orgRepos = [];
    // let listaIssues = [];
    // let listaCommits = [];

    // reposRequest.then(res => {
    //     res.data.map(repo => {
    //         if (!repo.private == true) {
    //             // console.log(repo.name);
    //             orgRepos.push(repo);
    //         }
    //     });
    // });

    let reposRequest = await axios.get("https://api.github.com/orgs/" + org + "/repos", cabeceras).catch(err => console.log("Ha ocurrido un error al obtener los repositorios: " + err));
    let orgRepos = [];
    let listaIssues = [];
    let listaCommits = [];

    reposRequest.data.map(repo => {
        if (!repo.private == true) {
            // console.log(repo.name);
            orgRepos.push(repo);
        }
    });

    // await Promise.all(
    await orgRepos.map(async (repo) => {
        let issueRequest = await axios.get("https://api.github.com/repos/" + org + "/" + repo.name, cabeceras).catch(err => { // issue => issue.open_issues_count
            console.error("Error al obtener las issues del repositorio '" + repo.name + "' de la organizacion '" + org + "'");
        });

        let commitRequest = await axios.get("https://api.github.com/repos/" + org + "/" + repo.name + "/commits", cabeceras).catch(err => {
            console.error("Error al obtener los commits del repositorio '" + repo.name + "' de la organizacion '" + org + "'");
        });

        listaIssues.push(issueRequest.open_issues_count);
        listaCommits.push(commitRequest);
    });

    await axios.get(urlOrg, cabeceras)
        .then(res => {
            if (options.search) {
                console.log("Buscando URL: " + urlOrg);
                console.log(res.data);
                console.log("Nombre: " + res.data.name);
                console.log("Descripción: " + res.data.description);
                console.log("Enlace: " + res.data.blog);
                console.log("\nRepositorios: " + orgRepos.map((repo, i) => {
                    console.log("\t"+repo);
                    console.log("\t\tNumero de Issues abiertas: " + listaIssues[i]);
                    console.log("\t\tNumero de commits: "+ listaCommits[i]);
                }));
                console.log("\n\nTotal: " + res.data.name);


            } else {
                console.log("Por favor, introduce una URL perteneciente a una organizacion de GitHub.");
            }
        });

    //);
}